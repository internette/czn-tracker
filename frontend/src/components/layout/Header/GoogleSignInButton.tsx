import { useEffect, useRef, useState } from 'react'
import styles from './GoogleSignInButton.module.scss'

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string
            callback: (response: { credential?: string }) => void
            ux_mode?: 'popup'
            auto_select?: boolean
          }) => void
          renderButton: (
            parent: HTMLElement,
            options: {
              theme?: 'outline' | 'filled_blue' | 'filled_black'
              size?: 'large' | 'medium' | 'small'
              type?: 'standard' | 'icon'
              text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin'
              shape?: 'rectangular' | 'pill' | 'circle' | 'square'
              width?: number
            },
          ) => void
        }
      }
    }
  }
}

const SDK_SRC = 'https://accounts.google.com/gsi/client'

function loadGoogleSdk() {
  return new Promise<void>((resolve, reject) => {
    if (window.google?.accounts?.id) {
      resolve()
      return
    }

    const existingScript = document.querySelector<HTMLScriptElement>(`script[src="${SDK_SRC}"]`)
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(), { once: true })
      existingScript.addEventListener('error', () => reject(new Error('Unable to load Google sign-in.')), { once: true })
      return
    }

    const script = document.createElement('script')
    script.src = SDK_SRC
    script.async = true
    script.defer = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Unable to load Google sign-in.'))
    document.head.appendChild(script)
  })
}

export default function GoogleSignInButton() {
  const buttonRef = useRef<HTMLDivElement>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
    const apiBase = import.meta.env.VITE_API_BASE || ''

    if (!clientId) {
      setError('Missing VITE_GOOGLE_CLIENT_ID')
      return
    }

    loadGoogleSdk()
      .then(() => {
        if (cancelled || !buttonRef.current || !window.google?.accounts?.id) return

        buttonRef.current.innerHTML = ''
        window.google.accounts.id.initialize({
          client_id: clientId,
          ux_mode: 'popup',
          callback: async (response) => {
            if (!response.credential) {
              setError('Google did not return a sign-in credential.')
              return
            }

            try {
              const result = await fetch(`${apiBase}/api/auth/google/login`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                  'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({ credential: response.credential }),
              })

              if (!result.ok) {
                setError('Unable to sign in with Google.')
                return
              }

              window.location.reload()
            } catch (err) {
              setError('Unable to reach the login endpoint.')
            }
          },
        })
        window.google.accounts.id.renderButton(buttonRef.current, {
          theme: 'outline',
          size: 'large',
          type: 'standard',
          text: 'signin_with',
          shape: 'pill',
          width: 220,
        })
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Unable to load Google sign-in.')
        }
      })

    return () => {
      cancelled = true
    }
  }, [])

  if (error) {
    return <span className={styles.fallback}>{error}</span>
  }

  return <div ref={buttonRef} />
}
