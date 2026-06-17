import { CSSProperties } from 'react'

interface LoadingStateProps {
  message?: string
}

const loadingStyles = {
  container: {
    marginTop: '40px',
    textAlign: 'center' as const,
    color: '#cbd5e1',
  } as CSSProperties,
  spinner: {
    display: 'inline-block',
    width: '24px',
    height: '24px',
    border: '3px solid #334155',
    borderTopColor: '#38bdf8',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    marginRight: '12px',
  } as CSSProperties,
}

export default function LoadingState({ message = 'Loading...' }: LoadingStateProps) {
  return (
    <div style={loadingStyles.container}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div style={loadingStyles.spinner} />
      <span>{message}</span>
    </div>
  )
}
