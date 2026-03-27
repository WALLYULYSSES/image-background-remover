'use client'
import { useSession, signIn, signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"

export function UserButton() {
  const { data: session } = useSession()
  
  if (!session?.user) {
    return <Button onClick={() => signIn("google")}>登录</Button>
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm">{session.user.name}</span>
      <Button onClick={() => signOut()} size="sm">登出</Button>
    </div>
  )
}
