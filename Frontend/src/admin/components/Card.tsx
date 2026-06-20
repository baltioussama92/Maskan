import type { ReactNode } from 'react'
import { cx } from './ui'

interface CardProps {
  title?: string
  subtitle?: string
  rightSlot?: ReactNode
  className?: string
  children: ReactNode
}

export default function Card({ title, subtitle, rightSlot, className = '', children }: CardProps) {
  return (
    <section
      className={cx(
        'rounded-3xl border border-[#E1D2C0] bg-gradient-to-b from-[#FFFFFF] to-[#FFFCF8] p-5 shadow-[0_12px_28px_rgba(58,45,40,0.08)]',
        className,
      )}
    >
      {(title || subtitle || rightSlot) && (
        <header className="mb-4 flex items-start justify-between gap-3">
          <div>
            {title && <h3 className="text-lg font-black tracking-tight text-[#2F241F]">{title}</h3>}
            {subtitle && <p className="mt-1 text-sm text-[#6D594D]">{subtitle}</p>}
          </div>
          {rightSlot}
        </header>
      )}
      {children}
    </section>
  )
}
