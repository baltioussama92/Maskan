import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { MessageSquare, Send, Search, Loader2, UserPlus, CheckCircle2, MoreVertical, ArrowLeft } from 'lucide-react'
import { API_BASE_URL, WS_URL } from '../config/env'
import { AnimatePresence, motion } from 'framer-motion'
import { messageService } from '../services/messageService'
import { userService } from '../services/userService'
import { connectionService } from '../services/connectionService'
import { bookingService } from '../services/bookingService'
import { useNotifications } from '../context/NotificationContext'
import { getStoredAuthToken } from '../api/apiClient'

const formatTime = (value) => {
  if (!value) return ''
  return new Date(value).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
}

const sameId = (left, right) => String(left) === String(right)

const sortMessages = (items) => [...items].sort(
  (a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime(),
)

/** Log axios/fetch errors with enough detail to debug CORS, 403, 404, etc. */
const logApiError = (label, error) => {
  const status = error?.response?.status
  const statusText = error?.response?.statusText
  const url = error?.config?.url ?? error?.response?.config?.url
  const message = error?.response?.data?.message ?? error?.message
  const isNetwork = !error?.response && Boolean(error?.request)
  console.error(`[Maskan Messages] ${label}`, {
    status,
    statusText,
    url: url ? (url.startsWith('http') ? url : `${API_BASE_URL}${url}`) : undefined,
    message,
    responseData: error?.response?.data,
    isNetworkError: isNetwork,
    isCorsSuspect: isNetwork && !error?.response,
    is403Forbidden: status === 403,
    is404NotFound: status === 404,
    is401Unauthorized: status === 401,
  })
}

export default function MessagesPage({ user }) {
  const location = useLocation()
  const { notify } = useNotifications()
  const messagesEndRef = useRef(null)
  const chatScrollRef = useRef(null)
  const [conversationsLoading, setConversationsLoading] = useState(true)
  const [conversationsError, setConversationsError] = useState(null)
  const [mobilePane, setMobilePane] = useState('list')
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
      setMobilePane('chat')
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
    setConversationsLoading(true)
    setConversationsError(null)
    try {
      const data = await messageService.conversations()
      setConversations(data)
      if (!activeContactId && data.length && window.matchMedia('(min-width: 768px)').matches) {
        setActiveContactId(String(data[0].userId))
      }
      return data
    } catch (error) {
      logApiError('GET /messages/conversations', error)
      setConversationsError(
        error?.response?.data?.message || error?.message || 'Impossible de charger les conversations.',
      )
      setConversations([])
      throw error
    } finally {
      setConversationsLoading(false)
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
    const guests = new Map();

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
    if (!user) return undefined
    let active = true

    const fetchConversations = async () => {
      try {
        await loadConversations()
      } catch {
        if (active) {
          notify('Chargement des conversations impossible.', 'error')
        }
      }
    }

    const fetchConnections = async () => {
      try {
        await loadConnections()
      } catch (error) {
        logApiError('GET /connections', error)
      }
    }

    const fetchBookingContacts = async () => {
      try {
        await loadBookingContacts()
      } catch (error) {
        logApiError('GET owner bookings (contacts)', error)
      }
    }

    fetchConversations()
    fetchConnections()
    fetchBookingContacts()

    return () => {
      active = false
    }
  }, [user, loadConversations, notify])

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
        webSocketFactory: () => new SockJS(WS_URL),
        reconnectDelay: 4000,
        connectHeaders: token ? { Authorization: `Bearer ${token}` } : {},
        debug: (msg) => {
          if (import.meta.env.DEV) console.debug('[Maskan WS]', msg)
        },
        onConnect: () => {
          if (disposed) return
          console.info('[Maskan] WebSocket Connected ✅', { url: WS_URL })
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
        onWebSocketClose: () => {
          if (!disposed) {
            console.warn('[Maskan] WebSocket Closed ⚠️', { url: WS_URL })
            setSocketReady(false)
          }
        },
        onStompError: (frame) => {
          if (!disposed) {
            console.error('[Maskan] WebSocket STOMP Error ❌', {
              url: WS_URL,
              message: frame?.headers?.message,
              body: frame?.body,
            })
            setSocketReady(false)
          }
        },
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
    const scrollTarget = messagesEndRef.current
    if (!scrollTarget) return
    scrollTarget.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages, activeContactId])

  const handleSelectContact = (contactId) => {
    setActiveContactId(contactId)
    setMobilePane('chat')
  }

  const handleBackToList = () => {
    setMobilePane('list')
  }

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
    <section className="min-h-screen w-full max-w-full overflow-x-hidden pt-20 sm:pt-24 pb-6 sm:pb-12 px-3 sm:px-6 bg-gradient-to-b from-primary-50/70 to-primary-100/50">
      <div className="max-w-7xl mx-auto">
        <div className="rounded-3xl border border-primary-200/80 bg-white/85 backdrop-blur-sm shadow-[0_20px_50px_rgba(74,56,46,0.10)] overflow-hidden">
          <div className="flex flex-col md:grid md:grid-cols-[minmax(280px,340px)_1fr] min-h-[calc(100dvh-7rem)] max-h-[calc(100dvh-5rem)] md:min-h-[74vh] md:max-h-none">
            {/* ── Sidebar: conversation list ── */}
            <aside
              className={`flex flex-col border-r border-primary-200/80 bg-primary-50/70 min-h-0 ${
                mobilePane === 'chat' ? 'hidden md:flex' : 'flex'
              }`}
            >
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

              <div className="flex-1 min-h-0 p-3 space-y-2 overflow-y-auto">
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

                {conversationsLoading ? (
                  <div className="flex flex-col items-center justify-center gap-2 py-10">
                    <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
                    <p className="text-xs text-primary-500">Chargement des conversations…</p>
                  </div>
                ) : conversationsError ? (
                  <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-center">
                    <p className="text-sm font-semibold text-red-800">Erreur de chargement</p>
                    <p className="mt-1 text-xs text-red-600">{conversationsError}</p>
                    <button
                      type="button"
                      onClick={() => loadConversations().catch(() => {})}
                      className="mt-3 rounded-lg bg-primary-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary-600"
                    >
                      Réessayer
                    </button>
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
                      type="button"
                      onClick={() => handleSelectContact(contact.id)}
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

            {/* ── Chat pane ── */}
            <section
              className={`flex flex-col bg-white min-h-0 ${
                mobilePane === 'list' ? 'hidden md:flex' : 'flex'
              }`}
            >
              <header className="shrink-0 px-4 sm:px-5 py-3 sm:py-4 border-b border-primary-200/80 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                  <button
                    type="button"
                    onClick={handleBackToList}
                    className="md:hidden p-2 -ml-1 rounded-xl text-primary-600 hover:bg-primary-50 transition shrink-0"
                    aria-label="Retour aux conversations"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-primary-200 text-primary-900 font-bold text-sm sm:text-base flex items-center justify-center shrink-0">
                    {activeContact?.name?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                  <div className="min-w-0">
                    <p className="text-lg sm:text-xl font-bold text-primary-900 truncate">
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

              <div
                ref={chatScrollRef}
                className="flex-1 min-h-0 overflow-y-auto px-3 sm:px-6 py-4 bg-[#f0f2f5] md:bg-gradient-to-b md:from-white md:to-primary-50/25"
              >
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
                    <div className="space-y-3 pb-2">
                      {messages.map((message) => {
                        const currentUser = String(user?.id)
                        const mine = sameId(message.senderId, currentUser)

                        return (
                          <motion.div
                            key={message.id}
                            layout
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.18, ease: 'easeOut' }}
                            className={`flex ${mine ? 'justify-end' : 'justify-start'}`}
                          >
                            <div className={`flex max-w-[85%] sm:max-w-[72%] flex-col ${mine ? 'items-end' : 'items-start'}`}>
                              <div
                                className={`rounded-2xl px-4 py-2.5 shadow-sm ${
                                  mine
                                    ? 'rounded-br-md bg-primary-500 text-white'
                                    : 'rounded-bl-md bg-white text-gray-800 border border-gray-100'
                                }`}
                              >
                                <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</p>
                              </div>
                              <span className={`mt-1 px-1 text-[10px] text-gray-500 ${mine ? 'text-right' : 'text-left'}`}>
                                {formatTime(message.createdAt)}
                              </span>
                            </div>
                          </motion.div>
                        )
                      })}
                      <div ref={messagesEndRef} aria-hidden="true" />
                    </div>
                  </AnimatePresence>
                )}
              </div>

              <form
                onSubmit={handleSend}
                className="sticky bottom-0 shrink-0 border-t border-primary-200/80 bg-white p-3 md:p-4"
              >
                <div className="flex items-end gap-2">
                  <input
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    placeholder={activeContactId ? 'Écrire un message…' : 'Sélectionnez une conversation'}
                    disabled={!activeContactId || !canMessageActiveContact}
                    className="flex-1 min-w-0 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-primary-400 focus:ring-2 focus:ring-primary-500/30 disabled:opacity-60"
                  />
                  <button
                    type="submit"
                    disabled={!activeContactId || !draft.trim() || !canMessageActiveContact}
                    className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary-500 text-white shadow-md transition hover:bg-primary-600 disabled:opacity-50 disabled:shadow-none sm:h-auto sm:w-auto sm:rounded-2xl sm:px-5 sm:py-3"
                    aria-label="Envoyer"
                  >
                    <Send className="w-4 h-4 sm:mr-1.5" />
                    <span className="hidden sm:inline text-sm font-semibold">Envoyer</span>
                  </button>
                </div>
                <p className="mt-2 hidden sm:block text-[11px] text-gray-400">
                  {socketReady ? 'Temps réel actif' : 'Mode hors ligne — envoi via API'}
                </p>
              </form>
            </section>
          </div>
        </div>
      </div>
    </section>
  )
}
