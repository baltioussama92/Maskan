import { type ReactNode } from 'react'

export type Tone = 'neutral' | 'success' | 'warning' | 'danger' | 'info'

export const cx = (...classes: Array<string | false | null | undefined>) => classes.filter(Boolean).join(' ')

/** Mount animation — opacity + translateY only, respects prefers-reduced-motion */
export function adminEnter(staggerIndex = 0) {
  return cx(
    'transform-gpu opacity-0 motion-safe:animate-admin-fade-in-up motion-reduce:animate-none motion-reduce:opacity-100',
    staggerIndex > 0 && `motion-safe:[animation-delay:${staggerIndex * 60}ms]`,
  )
}

export const adminModalPanel = cx(
  'transform-gpu opacity-0 motion-safe:animate-admin-modal-in motion-reduce:animate-none motion-reduce:opacity-100',
)

export const adminModalBackdrop = cx(
  'opacity-0 motion-safe:animate-admin-fade-in motion-reduce:animate-none motion-reduce:opacity-100',
)

export const adminTableRowHover = cx(
  'origin-center transform-gpu transition-[transform,background-color] duration-200 ease-out',
  'hover:bg-gray-50/50 hover:scale-[1.01]',
  'motion-reduce:transform-none dark:hover:bg-slate-800/60',
)

const toneClass: Record<Tone, string> = {
  neutral: 'bg-[#F3ECE3] text-[#46372E] border-[#E0D0BC]',
  success: 'bg-[#EAF6EF] text-[#2A6A44] border-[#B9D8C4]',
  warning: 'bg-[#FFF6E7] text-[#8A5A18] border-[#EBCF9A]',
  danger: 'bg-[#FCECEA] text-[#8C2F2A] border-[#E7BAB5]',
  info: 'bg-[#EBF2FA] text-[#224A73] border-[#BDD2E8]',
}

export function StatusBadge({ tone = 'neutral', children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span className={cx('inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold', toneClass[tone])}>
      {children}
    </span>
  )
}

export function SurfaceCard({
  title,
  subtitle,
  action,
  children,
  className,
}: {
  title?: string
  subtitle?: string
  action?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <section
      className={cx(
        'rounded-3xl border border-[#E2D3C0] bg-gradient-to-b from-[#FFFFFF] to-[#FFFCF8] p-5 shadow-[0_12px_26px_rgba(52,37,24,0.08)] dark:border-slate-700 dark:bg-gradient-to-b dark:from-slate-900 dark:to-slate-800 dark:shadow-[0_12px_26px_rgba(2,6,23,0.6)]',
        className,
      )}
    >
      {(title || subtitle || action) && (
        <header className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            {title && <h3 className="text-lg font-bold tracking-tight text-[#2E231C] dark:text-slate-100">{title}</h3>}
            {subtitle && <p className="mt-1 text-sm text-[#6B5B4C] dark:text-slate-300">{subtitle}</p>}
          </div>
          {action}
        </header>
      )}
      {children}
    </section>
  )
}

export function MetricCard({
  label,
  value,
  delta,
  tone = 'neutral',
  icon,
}: {
  label: string
  value: string | number
  delta?: string
  tone?: Tone
  icon?: ReactNode
}) {
  const ringByTone: Record<Tone, string> = {
    neutral: 'ring-[#D8C6B1]/60',
    success: 'ring-[#B8D6C3]/70',
    warning: 'ring-[#E4C790]/70',
    danger: 'ring-[#E7BAB5]/70',
    info: 'ring-[#BDD2E8]/70',
  }

  return (
    <SurfaceCard className={cx('relative overflow-hidden p-4', `ring-1 ${ringByTone[tone]} dark:ring-slate-700`)}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#7B6959] dark:text-slate-400">{label}</p>
          <p className="mt-2 text-2xl font-black text-[#2F241D] dark:text-slate-100">{value}</p>
          {delta ? <p className="mt-1 text-xs text-[#7B6959] dark:text-slate-400">{delta}</p> : null}
        </div>
            {icon ? <div className="rounded-xl border border-[#E3D2BE] bg-[#F8F2EA] p-2.5 text-[#6A5240] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">{icon}</div> : null}
      </div>
    </SurfaceCard>
  )
}

export function SectionTabs<T extends string>({
  options,
  value,
  onChange,
}: {
  options: Array<{ key: T; label: string }>
  value: T
  onChange: (next: T) => void
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((tab) => (
        <button
          key={tab.key}
          type="button"
          onClick={() => onChange(tab.key)}
          className={cx(
            'rounded-xl border px-3.5 py-2 text-sm font-semibold transition-colors duration-200',
            tab.key === value
              ? 'border-[#2F241D] bg-[#2F241D] text-[#FFFDF8] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100'
              : 'border-[#DAC9B4] bg-[#F9F3EA] text-[#5E4C3E] hover:bg-[#EFE4D7] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700',
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}

export function SearchField({
  value,
  onChange,
  placeholder,
}: {
  value: string
  onChange: (next: string) => void
  placeholder?: string
}) {
  return (
    <input
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder || 'Search'}
      className="w-full rounded-xl border border-[#DCCCB8] bg-[#FFFDFA] px-3.5 py-2.5 text-sm text-[#2F241D] outline-none transition placeholder:text-[#8F7B69] focus:border-[#B99168] focus:ring-2 focus:ring-[#E7D5C2] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-400 dark:focus:border-slate-600 dark:focus:ring-slate-700"
    />
  )
}

export function FilterSelect({
  value,
  onChange,
  options,
}: {
  value: string
  onChange: (next: string) => void
  options: Array<{ label: string; value: string }>
}) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="rounded-xl border border-[#DCCCB8] bg-[#FFFDFA] px-3 py-2.5 text-sm text-[#2F241D] outline-none transition focus:border-[#B99168] focus:ring-2 focus:ring-[#E7D5C2] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-slate-600 dark:focus:ring-slate-700"
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  )
}

export function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-[#DCCCB8] bg-[#FCF7F0] p-8 text-center dark:border-slate-700 dark:bg-slate-900">
      <p className="text-base font-bold text-[#3B2E26] dark:text-slate-100">{title}</p>
      <p className="mt-1 text-sm text-[#756151] dark:text-slate-400">{body}</p>
    </div>
  )
}

export function SkeletonBlock({ className = '' }: { className?: string }) {
  return <div className={cx('animate-pulse rounded-xl bg-[#EFE3D6] dark:bg-slate-800', className)} />
}

export function MiniBarChart({
  data,
  labels,
}: {
  data: number[]
  labels: string[]
}) {
  const max = Math.max(...data, 1)
  return (
    <div className="space-y-2">
      <div className="flex items-end gap-2">
        {data.map((value, index) => (
          <div key={`${labels[index]}-${value}`} className="flex flex-1 flex-col items-center gap-1">
            <div
              className="w-full rounded-t-lg bg-gradient-to-t from-[#6B4C2E] to-[#D1A777] transition hover:opacity-85"
              style={{ height: `${Math.max((value / max) * 120, 8)}px` }}
            />
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        {labels.map((label) => (
          <span key={label} className="flex-1 truncate text-center text-[11px] font-semibold text-[#7A6858]">
            {label}
          </span>
        ))}
      </div>
    </div>
  )
}

export function MiniLineChart({
  points,
}: {
  points: number[]
}) {
  const width = 340
  const height = 120
  const max = Math.max(...points, 1)
  const min = Math.min(...points, 0)
  const range = Math.max(max - min, 1)
  const stepX = width / Math.max(points.length - 1, 1)

  const path = points
    .map((point, index) => {
      const x = index * stepX
      const y = height - ((point - min) / range) * (height - 18) - 9
      return `${index === 0 ? 'M' : 'L'}${x},${y}`
    })
    .join(' ')

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-36 w-full">
      <defs>
        <linearGradient id="admin-line-gradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#D4A877" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#D4A877" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${path} L ${width},${height} L 0,${height} Z`} fill="url(#admin-line-gradient)" />
      <path d={path} fill="none" stroke="#7B5636" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
