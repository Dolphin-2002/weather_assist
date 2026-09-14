import { motion, useReducedMotion } from 'motion/react'
import type { ComponentType, SVGProps } from 'react'
import './gooey-nav.css'

type Icon = ComponentType<SVGProps<SVGSVGElement>>

export type GooeyNavItem = { label: string; href: string; icon?: Icon }

type GooeyNavProps = { items: GooeyNavItem[]; value: number; onChange: (index: number) => void; className?: string }

export function GooeyNav({ items, value, onChange, className = '' }: GooeyNavProps) {
  const reduceMotion = useReducedMotion()
  return <nav className={`gooey-nav ${className}`} aria-label="Primary navigation">
    {items.map(({ label, href, icon: Icon }, index) => <a key={href} href={href} className={`gooey-nav__item ${index === value ? 'is-active' : ''}`} aria-current={index === value ? 'page' : undefined} onClick={() => onChange(index)}>
      {index === value && <motion.span className="gooey-nav__active-shape" layoutId="gooey-nav-active-shape" transition={reduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 360, damping: 28 }} />}
      <span className="gooey-nav__label">{Icon && <Icon aria-hidden="true" />}{label}</span>
    </a>)}
  </nav>
}
