import styles from './LoadingState.module.scss'

interface LoadingStateProps {
  message?: string
}

export default function LoadingState({ message = 'Loading...' }: LoadingStateProps) {
  return (
    <div className={styles.container}>
      <div className={styles.spinner} />
      <span>{message}</span>
    </div>
  )
}
