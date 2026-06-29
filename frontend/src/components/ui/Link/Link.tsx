import { Link as RouterLink } from 'react-router-dom'
import { CSSProperties } from 'react'
import styles from './Link.module.scss'

interface LinkProps {
  to: string
  children: React.ReactNode
  external?: boolean
  style?: CSSProperties
}

export default function Link({ to, children, external = false, style }: LinkProps) {
  if (external) {
    return (
      <a href={to} className={styles.link} style={style}>
        {children}
      </a>
    )
  }

  return (
    <RouterLink to={to} className={styles.link} style={style}>
      {children}
    </RouterLink>
  )
}
