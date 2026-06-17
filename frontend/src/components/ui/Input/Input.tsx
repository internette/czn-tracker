import { CSSProperties, InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
  containerStyle?: CSSProperties
}

const inputStyles = {
  container: {
    display: 'grid',
    gap: '8px',
    marginBottom: '12px',
  } as CSSProperties,
  label: {
    fontSize: '0.9rem',
    fontWeight: 500,
    color: '#cbd5e1',
  } as CSSProperties,
  input: {
    width: '100%',
    background: '#0f172a',
    color: '#e2e8f0',
    border: '1px solid #334155',
    borderRadius: '12px',
    padding: '12px',
    fontSize: '1rem',
    fontFamily: 'inherit',
    transition: 'all 0.3s ease',
  } as CSSProperties,
  textarea: {
    minHeight: '100px',
    width: '100%',
    background: '#0f172a',
    color: '#e2e8f0',
    border: '1px solid #334155',
    borderRadius: '12px',
    padding: '12px',
    fontSize: '1rem',
    fontFamily: 'inherit',
    transition: 'all 0.3s ease',
    resize: 'vertical' as const,
  } as CSSProperties,
  error: {
    borderColor: '#fb7185',
  } as CSSProperties,
  helperText: {
    fontSize: '0.85rem',
    color: '#94a3b8',
  } as CSSProperties,
  errorText: {
    color: '#fb7185',
  } as CSSProperties,
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
  const inputElement = isTextarea ? 'textarea' : 'input'
  const baseStyle = isTextarea ? inputStyles.textarea : inputStyles.input
  const inputStyle = {
    ...baseStyle,
    ...(error && inputStyles.error),
  }

  return (
    <div style={{ ...inputStyles.container, ...containerStyle }}>
      {label && <label style={inputStyles.label}>{label}</label>}
      {isTextarea ? (
        <textarea
          style={inputStyle}
          {...(props as any)}
        />
      ) : (
        <input
          type={type}
          style={inputStyle}
          {...props}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = '#38bdf8'
            e.currentTarget.style.boxShadow = '0 0 0 2px rgba(56, 189, 248, 0.1)'
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = error ? '#fb7185' : '#334155'
            e.currentTarget.style.boxShadow = 'none'
          }}
        />
      )}
      {error && <span style={inputStyles.errorText}>{error}</span>}
      {helperText && !error && <span style={inputStyles.helperText}>{helperText}</span>}
    </div>
  )
}
