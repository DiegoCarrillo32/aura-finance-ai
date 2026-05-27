import React from 'react'
import { cn } from '@/lib/utils'

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  glow?: boolean
  glowColor?: string
}

export function GlassCard({
  children,
  className,
  glow = false,
  glowColor = 'rgba(139, 92, 246, 0.15)', // Default purple glow
  ...props
}: GlassCardProps) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl border border-border bg-card backdrop-blur-xl p-6 transition-all duration-300 hover:border-white/[0.15] hover:bg-card shadow-2xl',
        className
      )}
      style={
        glow
          ? ({
              '--glow-color': glowColor,
              boxShadow: '0 0 40px -10px var(--glow-color), inset 0 1px 0 0 rgba(255,255,255,0.05)',
            } as React.CSSProperties)
          : { boxShadow: 'inset 0 1px 0 0 rgba(255,255,255,0.05)' }
      }
      {...props}
    >
      {/* Background soft radial ambient light if glowing */}
      {glow && (
        <div
          className="absolute -right-24 -top-24 w-48 h-48 rounded-full blur-3xl pointer-events-none opacity-40 transition-all duration-500"
          style={{ backgroundColor: glowColor }}
        />
      )}
      <div className="relative z-10">{children}</div>
    </div>
  )
}
