import { NavLink, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard,
  CalendarDays,
  GraduationCap,
  Dumbbell,
  UtensilsCrossed,
  Heart,
  Sparkles,
  Shirt,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { useState } from 'react'
import { clsx } from 'clsx'
import { setNavDirection } from '../../store/navDirection'

const NAV = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/kalender', label: 'Kalender', icon: CalendarDays },
  { to: '/zhaw', label: 'ZHAW Hub', icon: GraduationCap },
  { to: '/gym', label: 'Gym', icon: Dumbbell },
  { to: '/food', label: 'Food', icon: UtensilsCrossed },
  { to: '/health', label: 'Health', icon: Heart },
  { to: '/skin', label: 'Skincare', icon: Sparkles },
  { to: '/style', label: 'Style Board', icon: Shirt },
]

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const location = useLocation()

  return (
    <motion.aside
      animate={{ width: collapsed ? 64 : 200 }}
      transition={{ type: 'spring', stiffness: 260, damping: 28 }}
      className="relative flex flex-col h-full bg-surface border-r border-border overflow-hidden shrink-0"
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-border">
        <div className="w-7 h-7 rounded-lg bg-surface2 border border-border flex items-center justify-center shrink-0">
          <span className="text-chrome-bright text-xs font-bold font-mono">MS</span>
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.18 }}
              className="chrome-text font-semibold text-sm whitespace-nowrap"
            >
              My Space
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Nav items */}
      <nav className="flex-1 py-3 overflow-y-auto overflow-x-hidden">
        {NAV.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={() => setNavDirection(location.pathname, to)}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 px-4 py-2.5 mx-2 rounded-lg transition-all duration-150 group relative',
                isActive
                  ? 'bg-surface2 text-chrome-bright'
                  : 'text-chrome-dim hover:text-chrome hover:bg-surface2/60'
              )
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.div
                    layoutId="nav-indicator"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-chrome-bright rounded-full"
                    transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                  />
                )}
                <Icon size={16} className="shrink-0" />
                <AnimatePresence>
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.15 }}
                      className="text-sm font-medium whitespace-nowrap"
                    >
                      {label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed((c) => !c)}
        className="flex items-center justify-center w-full h-10 border-t border-border text-chrome-dim hover:text-chrome transition-colors"
      >
        {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>
    </motion.aside>
  )
}
