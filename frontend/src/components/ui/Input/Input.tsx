import { CSSProperties, InputHTMLAttributes } from 'react'
import styles from './Input.module.scss'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
  containerStyle?: CSSProperties
}

export default function Input({
  label,
  error,
  helperText,
  containerStyle,
  type = 'text',
  ...props
}: InputProps) {
  const isTextarea = type === 'textarea'
  const inputClass = isTextarea ? styles.textarea : error ? `${styles.input} ${styles.inputError}` : styles.input

  return (
    <div className={styles.container} style={containerStyle}>
      {label && <label className={styles.label}>{label}</label>}
      {isTextarea ? (
        <textarea className={inputClass} {...(props as any)} />
      ) : (
        <input type={type} className={inputClass} {...props} />
      )}
      {error && <span className={styles.errorText}>{error}</span>}
      {helperText && !error && <span className={styles.helperText}>{helperText}</span>}
    </div>
  )
}
