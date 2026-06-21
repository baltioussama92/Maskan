import React, { useEffect, useState, useTransition } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Star, Shield, TrendingUp, ChevronDown } from 'lucide-react'
import SearchBar from './SearchBar'
import ScrollReveal from '../ui/ScrollReveal'
import { propertyService } from '../../services/propertyService'
import { useAppMotion } from '../../hooks/useAppMotion'

const HERO_BG_WEBP = '/home-hero.webp'
const HERO_BG_JPG = '/home-hero.jpg'

function FloatingBadge({ className, icon: Icon, label, sub, reduceMotion }) {
  const Wrapper = reduceMotion ? 'div' : motion.div
  const motionProps = reduceMotion
    ? {}
    : {
        animate: { y: [0, -6, 0] },
        transition: { duration: 3.5, repeat: Infinity, ease: 'easeInOut' },
      }

  return (
    <Wrapper
      {...motionProps}
      className={`absolute rounded-2xl border border-primary-200/20 bg-primary-50/70 px-4 py-3 shadow-glass backdrop-blur-xl pointer-events-none max-md:hidden ${className}`}
    >
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-primary-100 flex items-center justify-center shrink-0">
          <Icon className="text-primary-600" style={{ width: '1.1rem', height: '1.1rem' }} />
        </div>
        <div>
          <p className="text-xs font-bold text-primary-800 leading-none">{label}</p>
          <p className="text-[10px] text-primary-500 mt-0.5">{sub}</p>
        </div>
      </div>
    </Wrapper>
  )
}

const containerVar = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.15 } },
}
const itemVar = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
}
const itemVarInstant = {
  hidden: { opacity: 1, y: 0 },
  show: { opacity: 1, y: 0 },
}

export default function Hero() {
  const navigate = useNavigate()
  const [, startTransition] = useTransition()
  const { reduceMotion, subtle } = useAppMotion()
  const activeItemVar = reduceMotion ? itemVarInstant : itemVar

  const [popularCities, setPopularCities] = useState([])
  const [stats, setStats] = useState([
    { label: 'Propriétés listées', value: '0' },
    { label: 'Villes couvertes', value: '0' },
    { label: 'Disponibles', value: '0' },
    { label: 'Prix moyen', value: '0 DT' },
  ])

  useEffect(() => {
    let active = true
    propertyService.list()
      .then((data) => {
        if (!active) return
        const items = data.content || []
        const prices = items
          .map((p) => Number(p.price ?? p.pricePerNight ?? 0))
          .filter((value) => Number.isFinite(value) && value > 0)
        const avgPrice = prices.length
          ? Math.round(prices.reduce((sum, value) => sum + value, 0) / prices.length)
          : 0
        const cityCount = new Set(items.map((p) => p.location).filter(Boolean)).size
        const availableCount = items.filter((p) => p.available !== false).length

        setStats([
          { label: 'Propriétés listées', value: String(items.length) },
          { label: 'Villes couvertes', value: String(cityCount) },
          { label: 'Disponibles', value: String(availableCount) },
          { label: 'Prix moyen', value: `${avgPrice.toLocaleString('fr-TN')} DT` },
        ])

        const cityCounts = {}
        items.forEach((p) => {
          if (p.location) cityCounts[p.location] = (cityCounts[p.location] || 0) + 1
        })
        const topCities = Object.entries(cityCounts)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 5)
          .map(([city]) => city)
        setPopularCities(topCities)
      })
      .catch(() => {})

    return () => { active = false }
  }, [])

  const goToCity = (city) => {
    startTransition(() => {
      navigate(`/explorer?city=${encodeURIComponent(city)}`)
    })
  }

  const handleSearch = (params) => {
    startTransition(() => {
      const query = new URLSearchParams()
      if (params.location) query.set('city', params.location)
      if (params.checkIn) query.set('checkIn', params.checkIn)
      if (params.checkOut) query.set('checkOut', params.checkOut)
      if (params.guests) query.set('guests', String(params.guests))
      navigate(`/explorer?${query.toString()}`)
    })
  }

  return (
    <section className="relative min-h-[100svh] flex flex-col justify-center overflow-hidden contain-layout">

      {/* Static hero background — no video decode cost */}
      <div className="absolute inset-0 -z-10" aria-hidden="true">
        <picture>
          <source srcSet={HERO_BG_WEBP} type="image/webp" />
          <img
            src={HERO_BG_JPG}
            alt=""
            width={1920}
            height={1080}
            decoding="async"
            fetchPriority="high"
            className="h-full w-full object-cover object-center"
          />
        </picture>
      </div>

      <div className="absolute inset-0 bg-gradient-to-b from-primary-900/70 via-primary-900/50 to-primary-900/80" />
      <div className="absolute inset-0 bg-gradient-to-r from-primary-900/50 to-transparent" />

      <div
        className="absolute inset-0 opacity-10 max-md:hidden"
        style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.6) 1px, transparent 0)',
          backgroundSize: '32px 32px',
        }}
      />

      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-500/20 rounded-full blur-3xl pointer-events-none max-md:hidden" />
      <div className="absolute bottom-1/3 right-1/4 w-72 h-72 bg-primary-300/15 rounded-full blur-3xl pointer-events-none max-md:hidden" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pt-28 pb-16 w-full">
        <motion.div
          variants={reduceMotion ? undefined : containerVar}
          initial={reduceMotion ? false : 'hidden'}
          animate={reduceMotion ? false : 'show'}
          className="flex flex-col items-center text-center gap-6"
        >
          <motion.div variants={activeItemVar}>
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary-50/10 backdrop-blur-sm border border-primary-200/20 text-primary-50/90 text-xs font-semibold uppercase tracking-widest">
              <span className="w-2 h-2 rounded-full bg-primary-300 motion-safe:animate-pulse" />
              Plateforme #1 en Tunisie
            </span>
          </motion.div>

          <ScrollReveal
            as="h1"
            delay={reduceMotion ? 0 : 0.1}
            direction="up"
            className="text-4xl sm:text-5xl lg:text-7xl font-extrabold text-primary-50 leading-[1.1] max-w-4xl min-h-[2.2em] sm:min-h-[1.5em]"
          >
            Trouvez le{' '}
            <span className="relative inline-block gradient-text">logement idéal</span>
            {' '}en Tunisie
          </ScrollReveal>

          <motion.p variants={activeItemVar} className="max-w-xl text-lg text-primary-50/75 leading-relaxed font-light">
            Appartements, villas et studios à des milliers de propriétés vérifiées,
            des hôtes de confiance, des réservations sécurisées.
          </motion.p>

          <motion.div variants={activeItemVar} className="relative z-30 w-full flex justify-center min-h-[72px]">
            <SearchBar onSearch={handleSearch} />
          </motion.div>

          <motion.div variants={activeItemVar} className="flex flex-wrap items-center justify-center gap-2 min-h-[36px]">
            <span className="text-primary-50/50 text-xs font-medium mr-1">Populaire :</span>
            {(popularCities.length > 0 ? popularCities : ['Tunis', 'Hammamet', 'La Marsa', 'Djerba', 'Sfax']).map((city) => (
              <button
                key={city}
                type="button"
                onClick={() => goToCity(city)}
                className="h-8 min-w-[4.5rem] px-3.5 rounded-full text-xs font-medium bg-primary-50/10 backdrop-blur-sm border border-primary-200/20 text-primary-50/80 hover:bg-primary-50/20 hover:text-primary-50 transition-colors duration-150 md:hover:scale-105 active:scale-[0.98]"
              >
                {city}
              </button>
            ))}
          </motion.div>
        </motion.div>

        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 20 }}
          animate={reduceMotion ? false : { opacity: 1, y: 0 }}
          transition={subtle}
          className="relative z-10 mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto min-h-[88px]"
        >
          {stats.map(({ label, value }) => (
            <div key={label} className="rounded-2xl border border-primary-200/10 bg-primary-900/45 px-5 py-4 text-center backdrop-blur-xl">
              <p className="text-2xl font-extrabold text-primary-50 leading-none tabular-nums">{value}</p>
              <p className="text-xs text-primary-50/50 mt-1 font-medium">{label}</p>
            </div>
          ))}
        </motion.div>
      </div>

      <FloatingBadge className="top-[28%] left-[6%] hidden lg:flex" icon={Star} label="Note Moyenne 4.9" sub="Sur 18 000+ avis" reduceMotion={reduceMotion} />
      <FloatingBadge className="top-[36%] right-[5%] hidden lg:flex" icon={Shield} label="Paiements sécurisés" sub="Cryptage SSL 256-bit" reduceMotion={reduceMotion} />
      <FloatingBadge className="bottom-[28%] left-[8%] hidden xl:flex" icon={TrendingUp} label="+340 nouvelles annonces" sub="Cette semaine" reduceMotion={reduceMotion} />

      {!reduceMotion && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="absolute bottom-8 right-8 flex-col items-center gap-1 z-10 hidden md:flex"
        >
          <span className="text-[10px] text-primary-50/40 uppercase tracking-widest font-semibold">Défiler</span>
          <motion.div animate={{ y: [0, 6, 0] }} transition={{ repeat: Infinity, duration: 1.5 }}>
            <ChevronDown className="w-4 h-4 text-primary-50/40" />
          </motion.div>
        </motion.div>
      )}
    </section>
  )
}
