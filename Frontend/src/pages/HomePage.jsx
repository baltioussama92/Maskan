import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Search, ShieldCheck, Headphones, BadgePercent, Star } from 'lucide-react'
import Hero from '../components/home/Hero'
import PropertyGrid from '../components/properties/PropertyGrid'
import CtaSection from '../components/CtaSection'
import { propertyService } from '../services/propertyService'

// ── Why Maskan Features ──────────────────────────────────────
const FEATURES = [
  {
    icon: Search,
    color: 'bg-primary-100 text-primary-600',
    title: 'Recherche intelligente',
    desc:  'Filtres avancés, carte interactive et suggestions IA pour trouver exactement ce que vous cherchez.',
  },
  {
    icon: ShieldCheck,
    color: 'bg-primary-100 text-primary-600',
    title: 'Paiements sécurisés',
    desc:  'Transactions cryptées, dépôt de garantie protégé et remboursement garanti sous 24 h.',
  },
  {
    icon: Headphones,
    color: 'bg-amber-100 text-amber-600',
    title: 'Support 24/7',
    desc:  'Une équipe dédiée disponible à toute heure pour les locataires comme pour les propriétaires.',
  },
  {
    icon: BadgePercent,
    color: 'bg-rose-100 text-rose-600',
    title: 'Zéro frais cachés',
    desc:  'Tarification transparente. Le prix affiché est le prix que vous payez — sans surprise.',
  },
]

// ── Testimonials ─────────────────────────────────────────────
const TESTIMONIALS = [
  {
    text: 'J\'ai trouvé mon appartement en moins de 48 heures. L\'interface est magnifique et la réservation était hyper simple.',
    name: 'Rim K.',
    role: 'Locataire – Tunis',
    avatar: 'https://i.pravatar.cc/48?img=47',
    stars: 5,
  },
  {
    text: 'En tant que propriétaire, Maskan m\'a permis de doubler mes revenus locatifs. Le tableau de bord est très professionnel.',
    name: 'Chokri M.',
    role: 'Propriétaire – La Marsa',
    avatar: 'https://i.pravatar.cc/48?img=12',
    stars: 5,
  },
  {
    text: 'Enfin une plateforme tunisienne qui rivalise avec les grandes plateformes internationales. Bravo à l\'équipe !',
    name: 'Sonia H.',
    role: 'Locataire – Sfax',
    avatar: 'https://i.pravatar.cc/48?img=23',
    stars: 5,
  },
]

const containerVar = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1, delayChildren: 0.1 } },
}
const cardVar = {
  hidden: { opacity: 0, y: 30 },
  show:   { opacity: 1, y:  0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } },
}

export default function HomePage({ user = null, onAuthClick = null }) {
  const [searchResult, setSearchResult] = useState(null)

  const handleSearch = async ({ location }) => {
    try {
      const query = location ? { location } : {}
      const data = await propertyService.list(query)
      setSearchResult(data.content || [])
    } catch {
      setSearchResult([])
    }
  }

  return (
    <>
      {/* ── Hero ──────────────────────────────────────────────── */}
      <Hero onSearch={handleSearch} />

      {/* ── Why Maskan ────────────────────────────────────────── */}
      <section className="bg-primary-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-xs font-bold uppercase tracking-widest text-primary-600 mb-2"
            >
              Pourquoi nous choisir
            </motion.p>
            <motion.h2
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.06 }}
              className="text-3xl sm:text-4xl font-extrabold text-primary-900"
            >
              L'immobilier réinventé pour la Tunisie
            </motion.h2>
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.14 }}
              className="text-primary-500 mt-3 max-w-lg mx-auto text-sm"
            >
              Maskan combine technologie de pointe et connaissance locale pour
              offrir la meilleure expérience immobilière du pays.
            </motion.p>
          </div>

          <motion.div
            variants={containerVar}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {FEATURES.map(({ icon: Icon, color, title, desc }) => (
              <motion.div
                key={title}
                variants={cardVar}
                whileHover={{ y: -6, boxShadow: '0 20px 40px rgba(164,131,116,0.12)' }}
                className="bg-primary-100 rounded-2xl p-6 shadow-sm border border-primary-200
                           transition-shadow duration-200"
              >
                <div className={`w-11 h-11 rounded-2xl ${color} flex items-center justify-center mb-4`}>
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-primary-900 text-sm mb-2">{title}</h3>
                <p className="text-xs text-primary-500 leading-relaxed">{desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Featured Properties ───────────────────────────────── */}
      <PropertyGrid title="Propriétés en vedette" searchResult={searchResult} user={user} onAuthClick={onAuthClick} />

      {/* ── Testimonials ─────────────────────────────────────── */}
      <section className="bg-gradient-to-b from-primary-50 to-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <p className="text-xs font-bold uppercase tracking-widest text-primary-600 mb-2">
              Témoignages
            </p>
            <h2 className="text-3xl font-extrabold text-primary-900">
              Ce que disent nos utilisateurs
            </h2>
          </div>

          <motion.div
            variants={containerVar}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            {TESTIMONIALS.map(({ text, name, role, avatar, stars }) => (
              <motion.div
                key={name}
                variants={cardVar}
                whileHover={{ y: -4 }}
                className="bg-primary-100 rounded-2xl p-6 shadow-glass border border-primary-200"
              >
                <div className="flex gap-0.5 mb-4">
                  {Array.from({ length: stars }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-sm text-primary-700 leading-relaxed italic mb-5">"{text}"</p>
                <div className="flex items-center gap-3">
                  <img src={avatar} alt={name} className="w-9 h-9 rounded-full object-cover ring-2 ring-primary-200" />
                  <div>
                    <p className="text-xs font-bold text-primary-800">{name}</p>
                    <p className="text-[10px] text-primary-500">{role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <CtaSection
        onPrimaryClick={() => onAuthClick?.('register')}
        onSecondaryClick={() => onAuthClick?.('login')}
      />

    </>
  )
}
