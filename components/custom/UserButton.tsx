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

export interface UserInfo {
  id: string
  email: string
  name: string | null
  avatar_url: string | null
  credits: number
}

interface UserButtonProps {
  onUserChange?: (user: UserInfo | null) => void
}

export function UserButton({ onUserChange }: UserButtonProps) {
  const [user, setUser] = useState<UserInfo | null>(null)
  const [scriptLoaded, setScriptLoaded] = useState(false)
  const buttonRef = useRef<HTMLDivElement>(null)

  // Restore user from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('user_info')
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        setUser(parsed)
        onUserChange?.(parsed)
      } catch {}
    }
  }, [])

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
        locale: 'en',
      })
    }
  }, [scriptLoaded])

  const handleCredentialResponse = async (response: any) => {
    try {
      // Sync to D1 database
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: response.credential }),
      })

      if (res.ok) {
        const userInfo: UserInfo = await res.json()
        localStorage.setItem('user_info', JSON.stringify(userInfo))
        setUser(userInfo)
        onUserChange?.(userInfo)
      } else {
        // Fallback: decode JWT locally if API fails
        const decoded = JSON.parse(atob(response.credential.split('.')[1]))
        const fallbackUser: UserInfo = {
          id: decoded.sub,
          email: decoded.email,
          name: decoded.name,
          avatar_url: decoded.picture,
          credits: 0,
        }
        setUser(fallbackUser)
        onUserChange?.(fallbackUser)
      }
    } catch {
      const decoded = JSON.parse(atob(response.credential.split('.')[1]))
      const fallbackUser: UserInfo = {
        id: decoded.sub,
        email: decoded.email,
        name: decoded.name,
        avatar_url: decoded.picture,
        credits: 0,
      }
      setUser(fallbackUser)
      onUserChange?.(fallbackUser)
    }
  }

  const handleSignOut = () => {
    localStorage.removeItem('user_info')
    setUser(null)
    onUserChange?.(null)
  }

  if (user) {
    return (
      <div className="flex items-center gap-3">
        {user.avatar_url ? (
          <img
            src={user.avatar_url}
            alt={user.name || user.email}
            className="w-8 h-8 rounded-full"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-medium">
            {(user.name || user.email)?.[0]?.toUpperCase()}
          </div>
        )}
        <span className="text-sm text-slate-700 dark:text-slate-300">{user.name || user.email}</span>
        <button
          onClick={handleSignOut}
          className="text-xs text-slate-500 hover:text-slate-700 px-2 py-1 rounded border border-slate-200 hover:bg-slate-50 transition-colors"
        >
          Sign out
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
