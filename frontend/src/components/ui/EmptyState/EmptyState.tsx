import { CSSProperties } from 'react'

interface EmptyStateProps {
  title: string
  description?: string
}

const emptyStateStyles = {
  container: {
    textAlign: 'center' as const,
    padding: '40px 20px',
    color: '#94a3b8',
  } as CSSProperties,
  title: {
    fontSize: '1.25rem',
    fontWeight: 600,
    color: '#cbd5e1',
    marginBottom: '8px',
  } as CSSProperties,
  description: {
    fontSize: '0.95rem',
    color: '#94a3b8',
  } as CSSProperties,
}

export default function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <div style={emptyStateStyles.container}>
      <h3 style={emptyStateStyles.title}>{title}</h3>
      {description && <p style={emptyStateStyles.description}>{description}</p>}
    </div>
  )
}
