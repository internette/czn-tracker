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
}

export default function Button({
  children,
  onClick,
  href,
  variant = 'primary',
  disabled = false,
  type = 'button',
  style,
}: ButtonProps) {
  const classNames = [styles.button, styles[variant]].filter(Boolean).join(' ')

  if (href) {
    return (
      <a href={href} className={classNames} style={style}>
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
    >
      {children}
    </button>
  )
}
