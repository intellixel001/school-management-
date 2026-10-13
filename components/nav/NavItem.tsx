'use client'

import Link from 'next/link'
import { LucideIcon } from 'lucide-react'
import { Badge } from '@/components/ui'

export interface NavItemProps {
  href: string
  icon: LucideIcon
  label: string
  isActive: boolean
  isCollapsed: boolean
  badge?: number
}

export function NavItem({ href, icon: Icon, label, isActive, isCollapsed, badge }: NavItemProps) {
  return (
    <Link
      href={href}
      className={`group relative flex items-center h-[40px] px-[12px] rounded-[var(--radius-md)] outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--accent-primary)] ${
        isActive
          ? 'bg-[var(--accent-tint)] text-[var(--accent-primary)]'
          : 'text-[var(--text-secondary)] hover:bg-[var(--bg-surface-3)] hover:text-[var(--text-secondary)]'
      }`}
      style={{
        transition: 'background-color var(--transition-fast), color var(--transition-fast)'
      }}
    >


      {/* Icon with scale on hover */}
      <div className="relative flex-shrink-0 flex items-center justify-center transition-transform duration-120 ease-out group-hover:scale-110">
        <Icon size={18} strokeWidth={1.5} className={isActive ? 'text-[var(--accent-primary)]' : 'text-[var(--text-secondary)]'} />

        {/* Collapsed Badge Dot */}
        {badge && badge > 0 && isCollapsed && (
          <div className="absolute -top-1 -right-1 w-[6px] h-[6px] bg-[var(--accent-danger)] rounded-full border-[1.5px] border-[var(--bg-surface)]" />
        )}
      </div>

      {/* Label (hidden when collapsed) */}
      <span
        className="ml-3 text-[14px] font-medium whitespace-nowrap overflow-hidden transition-all duration-350 ease-in-out"
        style={{
          width: isCollapsed ? 0 : 'auto',
          opacity: isCollapsed ? 0 : 1,
        }}
      >
        {label}
      </span>

      {/* Expanded Badge */}
      {badge && badge > 0 && !isCollapsed && (
        <div className="ml-auto flex-shrink-0 transition-opacity duration-350 ease-in-out" style={{ opacity: isCollapsed ? 0 : 1 }}>
          <Badge variant="danger" size="sm">{badge}</Badge>
        </div>
      )}
    </Link>
  )
}
