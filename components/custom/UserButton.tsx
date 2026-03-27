'use client'
import { useEffect, useState } from 'react'
import { Button } from "@/components/ui/button"

declare global {
  interface Window {
    google: any
  }
}

export function UserButton() {
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    document.body.appendChild(script)

    script.onload = () => {
      window.google.accounts.id.initialize({
        client_id: '216736949961-s8h4atj70ksuentptcdf2saj84cn4b8r.apps.googleusercontent.com',
        callback: handleCredentialResponse
      })
    }
  }, [])

  const handleCredentialResponse = (response: any) => {
    const decoded = JSON.parse(atob(response.credential.split('.')[1]))
    setUser(decoded)
  }

  const handleSignIn = () => {
    window.google.accounts.id.prompt()
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

  return <Button onClick={handleSignIn}>登录</Button>
}
