'use client'
import { useEffect, useState } from 'react'
import Script from 'next/script'
import { Button } from "@/components/ui/button"

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: any) => void
          prompt: () => void
        }
      }
    }
  }
}

export function UserButton() {
  const [user, setUser] = useState<any>(null)
  const [scriptLoaded, setScriptLoaded] = useState(false)

  useEffect(() => {
    if (scriptLoaded && window.google) {
      window.google.accounts.id.initialize({
        client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '216736949961-s8h4atj70ksuentptcdf2saj84cn4b8r.apps.googleusercontent.com',
        callback: handleCredentialResponse
      })
    }
  }, [scriptLoaded])

  const handleCredentialResponse = (response: any) => {
    const decoded = JSON.parse(atob(response.credential.split('.')[1]))
    setUser(decoded)
  }

  const handleSignIn = () => {
    if (window.google) {
      window.google.accounts.id.prompt()
    }
  }

  const handleSignOut = () => {
    setUser(null)
  }

  if (user) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm">{user.name}</span>
        <Button onClick={handleSignOut} size="sm">登出</Button>
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
      <Button onClick={handleSignIn}>登录</Button>
    </>
  )
}
