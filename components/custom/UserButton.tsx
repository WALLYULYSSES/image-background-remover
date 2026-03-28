'use client'
import { useEffect, useRef, useState } from 'react'
import Script from 'next/script'

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: any) => void
          renderButton: (element: HTMLElement, options: any) => void
          prompt: () => void
        }
      }
    }
  }
}

export function UserButton() {
  const [user, setUser] = useState<any>(null)
  const [scriptLoaded, setScriptLoaded] = useState(false)
  const buttonRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scriptLoaded && window.google && buttonRef.current) {
      window.google.accounts.id.initialize({
        client_id: '216736949961-s8h4atj70ksuentptcdf2saj84cn4b8r.apps.googleusercontent.com',
        callback: handleCredentialResponse
      })
      window.google.accounts.id.renderButton(buttonRef.current, {
        theme: 'outline',
        size: 'medium',
        shape: 'pill',
        text: 'signin_with',
        locale: 'zh_CN',
      })
    }
  }, [scriptLoaded])

  const handleCredentialResponse = (response: any) => {
    const decoded = JSON.parse(atob(response.credential.split('.')[1]))
    setUser(decoded)
  }

  const handleSignOut = () => {
    setUser(null)
  }

  if (user) {
    return (
      <div className="flex items-center gap-3">
        {user.picture ? (
          <img src={user.picture} alt={user.name} className="w-8 h-8 rounded-full" />
        ) : (
          <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-medium">
            {user.name?.[0]?.toUpperCase()}
          </div>
        )}
        <span className="text-sm text-slate-700 dark:text-slate-300">{user.name}</span>
        <button
          onClick={handleSignOut}
          className="text-xs text-slate-500 hover:text-slate-700 px-2 py-1 rounded border border-slate-200 hover:bg-slate-50 transition-colors"
        >
          登出
        </button>
      </div>
    )
  }

  return (
    <>
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onLoad={() => setScriptLoaded(true)}
      />
      <div ref={buttonRef} />
    </>
  )
}

