import { SelectHTMLAttributes } from 'react'
import styles from './Dropdown.module.scss'

interface DropdownProps extends SelectHTMLAttributes<HTMLSelectElement> {}

export default function Dropdown({ className, children, ...props }: DropdownProps) {
  return (
    <select
      className={`${styles.select}${className ? ` ${className}` : ''}`}
      {...props}
    >
      {children}
    </select>
  )
}
