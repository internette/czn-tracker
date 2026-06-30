import { CSSProperties } from 'react'
import styles from './Button.module.scss'

interface ButtonProps {
  children: React.ReactNode
  onClick?: () => void
  href?: string
  className?: string
  variant?: 'primary' | 'secondary' | 'danger'
  disabled?: boolean
  type?: 'button' | 'submit' | 'reset'
  style?: CSSProperties
  active?: boolean
  size?: 'md' | 'sm'
  ariaLabel?: string
}

export default function Button({
  children,
  onClick,
  href,
  className,
  variant = 'primary',
  disabled = false,
  type = 'button',
  style,
  active = false,
  size = 'md',
  ariaLabel,
}: ButtonProps) {
  const classNames = [
    styles.button,
    styles[variant],
    styles[size],
    active ? styles.active : '',
    className ?? '',
  ].filter(Boolean).join(' ')

  if (href) {
    return (
      <a href={href} className={classNames} style={style} aria-label={ariaLabel}>
        {children}
      </a>
    )
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={classNames}
      style={style}
      aria-label={ariaLabel}
    >
      {children}
    </button>
  )
}
