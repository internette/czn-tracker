import { InputHTMLAttributes } from 'react'
import styles from './TextInput.module.scss'

interface TextInputProps extends InputHTMLAttributes<HTMLInputElement> {}

export default function TextInput({ className, ...props }: TextInputProps) {
  return (
    <input
      className={`${styles.textInput}${className ? ` ${className}` : ''}`}
      {...props}
    />
  )
}
