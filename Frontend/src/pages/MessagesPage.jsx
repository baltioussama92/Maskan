import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { MessageSquare, Send, Search, Loader2, UserPlus, CheckCircle2, MoreVertical } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { messageService } from '../services/messageService'
import { userService } from '../services/userService'
import { connectionService } from '../services/connectionService'
import { bookingService } from '../services/bookingService'
import { useNotifications } from '../context/NotificationContext'
import { API_BASE_URL, getStoredAuthToken } from '../api/apiClient'

const formatTime = (value) => {
  if (!value) return ''
  return new Date(value).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
}

const sameId = (left, right) => String(left) === String(right)

const getInitials = (name = '') => {
  const parts = String(name).trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return '?'
  return parts.slice(0, 2).map((part) => part.charAt(0).toUpperCase()).join('')
}

const sortMessages = (items) => [...items].sort(
  (a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime(),
)

export default function MessagesPage({ user }) {
  const location = useLocation()
  const { notify } = useNotifications()
  const messagesEndRef = useRef(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [userSearch, setUserSearch] = useState('')
  const [userResults, setUserResults] = useState([])
  const [pendingRequests, setPendingRequests] = useState([])
  const [connections, setConnections] = useState([])
  const [draft, setDraft] = useState('')
  const [activeContactId, setActiveContactId] = useState(null)
  const [messages, setMessages] = useState([])
  const [conversations, setConversations] = useState([])
  const [bookingContacts, setBookingContacts] = useState([])
  const [seenByConversation, setSeenByConversation] = useState({})
  const stompClientRef = useRef(null)
  const [socketReady, setSocketReady] = useState(false)
  const activeContactRef = useRef(activeContactId)

  const currentUserId = String(user?.id || '')
  const seenStorageKey = `messages_seen_${currentUserId}`

  const markConversationSeen = (conversationId, seenAt) => {
    if (!conversationId || !seenAt) return
    const key = String(conversationId)
    setSeenByConversation((prev) => {
      const previousSeenAt = prev[key]
      if (previousSeenAt && new Date(previousSeenAt).getTime() >= new Date(seenAt).getTime()) {
        return prev
      }
      const next = { ...prev, [key]: seenAt }
      localStorage.setItem(seenStorageKey, JSON.stringify(next))
      return next
    })
  }

  useEffect(() => {
    activeContactRef.current = activeContactId
  }, [activeContactId])

  const upsertMessage = useCallback((incomingMessage) => {
    if (!incomingMessage?.id) return
    setMessages((prev) => {
      const map = new Map(prev.map((item) => [String(item.id), item]))
      map.set(String(incomingMessage.id), incomingMessage)
      return sortMessages(Array.from(map.values()))
    })
  }, [])

  // Handle navigation from bookings page
  useEffect(() => {
    if (location.state?.recipientId) {
      setActiveContactId(String(location.state.recipientId))
      if (location.state?.recipientName) {
        setBookingContacts((prev) => {
          const id = String(location.state.recipientId)
          if (prev.some((contact) => String(contact.id) === id)) {
            return prev
          }
          return [{ id, name: location.state.recipientName }, ...prev]
        })
      }
    }
  }, [location.state?.recipientId, location.state?.recipientName])

  const connectedIds = useMemo(() => {
    const currentUserId = String(user?.id)
    const ids = new Set()
    connections.forEach((request) => {
      if (String(request.requesterId) === currentUserId) {
        ids.add(String(request.receiverId))
      } else {
        ids.add(String(request.requesterId))
      }
    })
    return ids
  }, [connections, user])

  const loadConnections = async () => {
    const [allConnections, pending] = await Promise.all([
      connectionService.list(),
      connectionService.listPending(),
    ])
    setConnections(allConnections)
    setPendingRequests(pending)
  }

  const loadConversations = useCallback(async () => {
    const data = await messageService.conversations()
    setConversations(data)
    if (!activeContactId && data.length) {
      setActiveContactId(String(data[0].userId))
    }
  }, [activeContactId])

  const loadConversationsRef = useRef(loadConversations)

  useEffect(() => {
    loadConversationsRef.current = loadConversations
  }, [loadConversations])

  const refreshConversations = useCallback(() => {
    loadConversationsRef.current?.().catch(() => {})
  }, [])

  const loadBookingContacts = async () => {
    // Hosts can directly contact guests who booked their properties.
    if (user?.role !== 'PROPRIETOR' && user?.role !== 'ADMIN') {
      setBookingContacts([])
      return
    }

    const ownerBookings = await bookingService.getOwnerBookings()
    const guests = new Map()

    (ownerBookings.content || []).forEach((booking) => {
      const guestId = booking?.guestId
      if (!guestId) return
      const key = String(guestId)
      if (!guests.has(key)) {
        guests.set(key, {
          id: key,
          name: booking?.guestName || 'Locataire',
        })
      }
    })

    setBookingContacts(Array.from(guests.values()))
  }

  const loadActiveConversation = async (contactId) => {
    if (!contactId) {
      setMessages([])
      return
    }

    const key = String(contactId)
    const isBookingContact = bookingContacts.some((contact) => String(contact.id) === key)
    const hasThread = conversations.some((conversation) => String(conversation.userId) === key)

    if (isBookingContact && !hasThread) {
      setMessages([])
      return
    }

    const data = await messageService.conversation(contactId)
    setMessages(sortMessages(data))
  }

  useEffect(() => {
    if (!user) return
    let active = true

    const load = async () => {
      setLoading(true)
      try {
        await Promise.all([
          loadConnections(),
          loadConversations(),
          loadBookingContacts(),
        ])
        if (!active) return
      } catch {
        if (!active) return
        notify('Chargement des conversations impossible.', 'error')
      } finally {
        if (active) setLoading(false)
      }
    }

    load()

    return () => {
      active = false
    }
  }, [user])

  useEffect(() => {
    if (!user?.id) return undefined

    let disposed = false
    let clientInstance = null

    const startRealtime = async () => {
      const [{ Client }, sockJsModule] = await Promise.all([
        import('@stomp/stompjs'),
        import('sockjs-client'),
      ])

      const SockJS = sockJsModule.default || sockJsModule

      const token = getStoredAuthToken()
      const client = new Client({
        webSocketFactory: () => new SockJS(`${API_BASE_URL}/ws`),
        reconnectDelay: 4000,
        connectHeaders: token ? { Authorization: `Bearer ${token}` } : {},
        debug: () => {},
        onConnect: () => {
          if (disposed) return
          setSocketReady(true)
          client.subscribe('/user/queue/chat', (frame) => {
            try {
              const incoming = JSON.parse(frame.body)
              upsertMessage(incoming)

              const peerId = sameId(incoming.senderId, currentUserId)
                ? String(incoming.receiverId)
                : String(incoming.senderId)

              if (String(peerId) === String(activeContactRef.current)) {
                refreshConversations()
              } else {
                refreshConversations()
              }
            } catch {
              // ignore malformed frame
            }
          })
        },
        onWebSocketClose: () => !disposed && setSocketReady(false),
        onStompError: () => !disposed && setSocketReady(false),
      })

      if (disposed) {
        client.deactivate()
        return
      }

      clientInstance = client
      stompClientRef.current = client
      client.activate()
    }

    startRealtime().catch(() => {
      if (!disposed) setSocketReady(false)
    })

    return () => {
      disposed = true
      setSocketReady(false)
      stompClientRef.current = null
      clientInstance?.deactivate()
    }
  }, [user?.id, currentUserId, refreshConversations, upsertMessage])

  useEffect(() => {
    if (!user || !activeContactId) return
    loadActiveConversation(activeContactId).catch(() => {
      setMessages([])
    })
  }, [activeContactId, user])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, activeContactId])

  useEffect(() => {
    if (!user || !userSearch.trim()) {
      setUserResults([])
      return
    }

    const timer = window.setTimeout(async () => {
      try {
        const data = await userService.search(userSearch.trim())
        setUserResults(data)
      } catch {
        setUserResults([])
      }
    }, 300)

    return () => window.clearTimeout(timer)
  }, [userSearch, user])

  useEffect(() => {
    if (!currentUserId) return
    try {
      const raw = localStorage.getItem(seenStorageKey)
      setSeenByConversation(raw ? JSON.parse(raw) : {})
    } catch {
      setSeenByConversation({})
    }
  }, [currentUserId, seenStorageKey])

  useEffect(() => {
    if (!activeContactId) return
    const activeConversation = conversations.find((conversation) => String(conversation.userId) === String(activeContactId))
    if (activeConversation?.lastMessageAt) {
      markConversationSeen(activeContactId, activeConversation.lastMessageAt)
    }
  }, [activeContactId, conversations])

  if (!user) return <Navigate to="/" replace />

  const bookingNameById = useMemo(() => {
    const map = new Map()
    bookingContacts.forEach((contact) => {
      map.set(String(contact.id), contact.name)
    })
    return map
  }, [bookingContacts])

  const contacts = useMemo(() => {
    const fromConversations = conversations.map((conversation) => ({
      id: String(conversation.userId),
      name: conversation.userName || bookingNameById.get(String(conversation.userId)) || 'Utilisateur',
      lastMessage: {
        content: conversation.lastMessage || 'Conversation active',
        createdAt: conversation.lastMessageAt,
        senderId: conversation.lastMessageSenderId || conversation.userId,
      },
    }))

    const merged = new Map(fromConversations.map((contact) => [String(contact.id), contact]))

    bookingContacts.forEach((bookingContact) => {
      const key = String(bookingContact.id)
      if (merged.has(key)) return
      merged.set(key, {
        id: key,
        name: bookingContact.name || 'Locataire',
        lastMessage: {
          content: 'Réservation active',
          createdAt: undefined,
          senderId: key,
        },
      })
    })

    return Array.from(merged.values())
  }, [conversations, bookingContacts, bookingNameById])

  const filteredContacts = contacts.filter((contact) => contact.name.toLowerCase().includes(search.toLowerCase()))
  const activeContact = contacts.find((contact) => String(contact.id) === String(activeContactId)) || null
  const bookingContactIds = useMemo(() => new Set(bookingContacts.map((contact) => String(contact.id))), [bookingContacts])
  const conversationContactIds = useMemo(() => new Set(conversations.map((conversation) => String(conversation.userId))), [conversations])

  const formatRelativeTime = (value) => {
    if (!value) return ''
    const now = Date.now()
    const then = new Date(value).getTime()
    const diffMinutes = Math.max(1, Math.round((now - then) / 60000))
    if (diffMinutes < 60) return `il y a ${diffMinutes} min`
    const diffHours = Math.round(diffMinutes / 60)
    if (diffHours < 24) return `il y a ${diffHours} h`
    const diffDays = Math.round(diffHours / 24)
    return `il y a ${diffDays} j`
  }

  const handleSend = async (event) => {
    event.preventDefault()
    const content = draft.trim()
    if (!content || !activeContactId) return

    try {
      const payload = {
        senderId: String(user?.id || ''),
        recipientId: String(activeContactId),
        content,
        timestamp: new Date().toISOString(),
      }

      const client = stompClientRef.current
      if (client?.connected && socketReady) {
        client.publish({
          destination: '/app/chat.sendMessage',
          body: JSON.stringify(payload),
        })
      } else {
        const sent = await messageService.send({
          receiverId: activeContactId,
          content,
          timestamp: payload.timestamp,
        })
        upsertMessage(sent)
      }

      setDraft('')
      refreshConversations()
    } catch (error) {
      const message = error?.response?.data?.message || error?.message || 'Envoi impossible.'
      notify(message, 'error')
    }
  }

  const handleAddConnection = async (targetUserId) => {
    try {
      await connectionService.request({ targetUserId: String(targetUserId) })
      notify('Demande de connexion envoyée.', 'success')
      setUserSearch('')
      setUserResults([])
    } catch (error) {
      const message = error?.response?.data?.message || error?.message || 'Demande impossible.'
      notify(message, 'error')
    }
  }

  const handleAcceptConnection = async (requestId) => {
    try {
      await connectionService.accept(requestId)
      notify('Connexion acceptée. Vous pouvez discuter.', 'success')
      await loadConnections()
    } catch {
      notify('Acceptation impossible.', 'error')
    }
  }

  const canMessageActiveContact = Boolean(
    activeContactId && (
      connectedIds.has(String(activeContactId))
      || bookingContactIds.has(String(activeContactId))
      || conversationContactIds.has(String(activeContactId))
    )
  )

  return (
    <section className="min-h-screen pt-24 pb-12 px-3 sm:px-6 bg-gradient-to-b from-primary-50/70 to-primary-100/50">
      <div className="max-w-7xl mx-auto">
        <div className="rounded-3xl border border-primary-200/80 bg-white/85 backdrop-blur-sm shadow-[0_20px_50px_rgba(74,56,46,0.10)] overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] min-h-[74vh]">
            <aside className="border-r border-primary-200/80 bg-primary-50/70">
              <div className="p-4 border-b border-primary-200/80">
                <div className="flex items-center justify-between mb-3">
                  <h1 className="text-2xl font-extrabold text-primary-900">Messages</h1>
                  <button
                    type="button"
                    className="p-2 rounded-xl text-primary-500 hover:bg-primary-100 transition"
                    aria-label="Options"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </div>

                <div className="relative mb-2">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary-400" />
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Rechercher..."
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-primary-200 bg-primary-100/80 text-sm text-primary-900 outline-none focus:ring-2 focus:ring-primary-200"
                  />
                </div>

                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary-400" />
                  <input
                    value={userSearch}
                    onChange={(event) => setUserSearch(event.target.value)}
                    placeholder="Chercher un utilisateur (nom/email)..."
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-primary-200 bg-white text-sm text-primary-900 outline-none focus:ring-2 focus:ring-primary-200"
                  />
                </div>
              </div>

              <div className="p-3 space-y-2 max-h-[58vh] overflow-y-auto">
                {userResults.length > 0 && (
                  <div className="space-y-2 pb-2 border-b border-primary-200/80">
                    {userResults.slice(0, 5).map((entry) => (
                      <div key={entry.id} className="p-2.5 rounded-xl bg-white border border-primary-100 flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-primary-900 truncate">{entry.fullName || entry.name || 'Utilisateur'}</p>
                          <p className="text-[11px] text-primary-500 truncate">{entry.email}</p>
                        </div>
                        <button
                          onClick={() => handleAddConnection(entry.id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs rounded-lg border border-primary-200 text-primary-700 hover:bg-primary-50"
                        >
                          <UserPlus className="w-3.5 h-3.5" />
                          Ajouter
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {pendingRequests.length > 0 && (
                  <div className="space-y-2 pb-2 border-b border-primary-200/80">
                    {pendingRequests.map((entry) => (
                      <div key={entry.id} className="p-2.5 rounded-xl bg-white border border-primary-100 flex items-center justify-between gap-2">
                        <p className="text-xs text-primary-700">Demande de contact</p>
                        <button
                          onClick={() => handleAcceptConnection(entry.id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs rounded-lg bg-primary-500 text-white hover:bg-primary-600"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Accepter
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {loading ? (
                  <div className="flex justify-center py-10">
                    <Loader2 className="w-6 h-6 animate-spin text-primary-400" />
                  </div>
                ) : filteredContacts.length === 0 ? (
                  <p className="text-sm text-primary-500 py-8 text-center">Aucune conversation</p>
                ) : (
                  filteredContacts.map((contact) => (
                    (() => {
                      const lastMessageAt = contact.lastMessage?.createdAt
                      const lastSenderId = String(contact.lastMessage?.senderId || '')
                      const seenAt = seenByConversation[String(contact.id)]
                      const isIncoming = lastSenderId && lastSenderId !== currentUserId
                      const isNewerThanSeen = lastMessageAt && (!seenAt || new Date(lastMessageAt).getTime() > new Date(seenAt).getTime())
                      const isUnread = Boolean(isIncoming && isNewerThanSeen && String(activeContactId) !== String(contact.id))

                      return (
                    <button
                      key={contact.id}
                      onClick={() => setActiveContactId(contact.id)}
                      className={`w-full text-left p-3 rounded-2xl border transition ${
                        String(activeContactId) === String(contact.id)
                          ? 'bg-white border-primary-300 shadow-sm'
                          : 'bg-primary-50/60 border-transparent hover:bg-white hover:border-primary-200'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary-200 text-primary-800 font-bold text-sm flex items-center justify-center shrink-0">
                          {contact.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-bold text-primary-900 truncate">{contact.name}</p>
                            <div className="flex items-center gap-2 shrink-0">
                              {isUnread && <span className="w-2.5 h-2.5 rounded-full bg-red-500" aria-label="Nouveau message" />}
                              <span className="text-[11px] text-primary-400">{formatRelativeTime(contact.lastMessage.createdAt)}</span>
                            </div>
                          </div>
                          <p className="text-xs text-primary-600 truncate mt-0.5">{contact.lastMessage.content}</p>
                        </div>
                      </div>
                    </button>
                      )
                    })()
                  ))
                )}
              </div>
            </aside>

            <section className="flex flex-col bg-white">
              <header className="px-5 py-4 border-b border-primary-200/80 flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-11 h-11 rounded-full bg-primary-200 text-primary-900 font-bold text-base flex items-center justify-center shrink-0">
                    {activeContact?.name?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xl font-bold text-primary-900 truncate">
                      {activeContact ? activeContact.name : 'Sélectionnez une conversation'}
                    </p>
                    <p className="text-xs text-primary-500 truncate">
                      {activeContactId
                        ? (conversationContactIds.has(String(activeContactId))
                          ? 'Conversation active'
                          : (connectedIds.has(String(activeContactId))
                          ? 'Connexion active'
                          : (bookingContactIds.has(String(activeContactId))
                            ? 'Client ayant reserve chez vous'
                            : 'En attente d\'acceptation de connexion')))
                        : 'Choisissez un contact à gauche pour démarrer'}
                    </p>
                  </div>
                </div>
                <button type="button" className="p-2 rounded-xl text-primary-500 hover:bg-primary-50 transition" aria-label="Options">
                  <MoreVertical className="w-4 h-4" />
                </button>
              </header>

              <div className="flex-1 px-4 md:px-6 py-4 overflow-y-auto bg-gradient-to-b from-white to-primary-50/25">
                {!activeContactId ? (
                  <div className="h-full flex items-center justify-center text-center">
                    <div>
                      <MessageSquare className="w-12 h-12 text-primary-300 mx-auto mb-3" />
                      <p className="text-primary-700 font-semibold">Sélectionnez une conversation</p>
                      <p className="text-sm text-primary-500 mt-1">Choisissez une conversation à gauche.</p>
                    </div>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-center">
                    <div>
                      <p className="text-primary-700 font-semibold">Aucun message pour cette conversation</p>
                      <p className="text-sm text-primary-500 mt-1">Envoyez le premier message ci-dessous.</p>
                    </div>
                  </div>
                ) : (
                  <AnimatePresence initial={false}>
                    <div className="space-y-4">
                      {messages.map((message) => {
                        const currentUser = String(user?.id)
                        const mine = sameId(message.senderId, currentUser)
                        const displayName = mine
                          ? 'Vous'
                          : (activeContact?.name || 'Invité')

                        return (
                          <motion.div
                            key={message.id}
                            layout
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.22, ease: 'easeOut' }}
                            className={`group flex items-end gap-3 ${mine ? 'justify-end' : 'justify-start'}`}
                          >
                            {!mine && (
                              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#6F4E37] text-[11px] font-bold text-white shadow-sm">
                                {getInitials(displayName)}
                              </div>
                            )}

                            <div className={`flex max-w-[86%] flex-col ${mine ? 'items-end' : 'items-start'}`}>
                              <motion.div
                                whileHover={{ y: -1 }}
                                className={`group inline-flex flex-col rounded-2xl px-4 py-3 shadow-sm transition-shadow duration-200 ${
                                  mine
                                    ? 'rounded-tr-none bg-[#6F4E37] text-white shadow-[#6F4E37]/15'
                                    : 'rounded-tl-none border border-gray-200 bg-gray-100 text-slate-800 shadow-gray-200/70'
                                }`}
                              >
                                <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</p>
                              </motion.div>

                              <div className={`mt-1 flex items-center gap-1.5 text-[11px] text-slate-500 opacity-70 transition-opacity duration-200 group-hover:opacity-100 ${mine ? 'justify-end' : 'justify-start'}`}>
                                <span className="font-medium uppercase tracking-[0.18em] opacity-70">
                                  {displayName}
                                </span>
                                <span aria-hidden="true">•</span>
                                <span className="opacity-70">{formatTime(message.createdAt)}</span>
                              </div>
                            </div>
                          </motion.div>
                        )
                      })}
                      <div ref={messagesEndRef} />
                    </div>
                  </AnimatePresence>
                )}
              </div>

              <form onSubmit={handleSend} className="p-3 md:p-4 border-t border-primary-200/80 bg-white">
                <div className="flex items-center gap-2">
                  <input
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    placeholder={activeContactId ? 'Écrire un message...' : 'Sélectionnez une conversation'}
                    disabled={!activeContactId || !canMessageActiveContact}
                    className="flex-1 px-4 py-3 rounded-xl border border-primary-200 bg-primary-50 text-sm text-primary-900 outline-none focus:ring-2 focus:ring-primary-200 disabled:opacity-60"
                  />
                  <button
                    type="submit"
                    disabled={!activeContactId || !draft.trim() || !canMessageActiveContact}
                    className="px-4 md:px-5 py-3 rounded-xl bg-primary-500 text-white text-sm font-semibold disabled:opacity-60 inline-flex items-center gap-1.5 hover:bg-primary-600 transition"
                  >
                    <Send className="w-4 h-4" /> Envoyer
                  </button>
                </div>
                <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
                  <span>{socketReady ? 'Synchronisation en temps réel active' : 'Connexion temps réel en attente'}</span>
                  <span>{activeContactId ? 'Conversation privée sécurisée' : 'Aucun destinataire sélectionné'}</span>
                </div>
              </form>
            </section>
          </div>
        </div>
      </div>
    </section>
  )
}
