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
  const [showMenu, setShowMenu] = useState(false)
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
    setShowMenu(false)
  }

  if (user) {
    return (
      <div className="relative">
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
        >
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
        </button>

        {showMenu && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setShowMenu(false)}
            />
            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 py-1 z-20">
              <div className="px-4 py-2 border-b border-slate-200 dark:border-slate-700">
                <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                  {user.name || user.email}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                  {user.email}
                </p>
              </div>
              <a
                href="/dashboard"
                className="block px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                onClick={() => setShowMenu(false)}
              >
                Dashboard
              </a>
              <button
                onClick={handleSignOut}
                className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                Sign out
              </button>
            </div>
          </>
        )}
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
