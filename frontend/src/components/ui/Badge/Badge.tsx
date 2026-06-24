import React from 'react'
import styles from './Badge.module.scss'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'success' | 'info' | 'warning' | 'error'
  className?: string
  onClick?: () => void
}


export default function Badge({ children, className, onClick }: BadgeProps) {
  return (
    <span
      className={`${styles.badge} ${className ?? ''}`}
      onClick={onClick}
    >
      {children}
    </span>
  )
}
