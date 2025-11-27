"use client"

import { useState } from "react"
import SettingsAuth from "@/components/settings-auth"
import ImageManager from "@/components/image-manager"

type User = "vii" | "zud" | null

export default function SettingsPage() {
  const [authenticatedUser, setAuthenticatedUser] = useState<User>(null)

  const handleLogout = () => {
    setAuthenticatedUser(null)
  }

  if (!authenticatedUser) {
    return <SettingsAuth onAuthenticated={setAuthenticatedUser} />
  }

  return <ImageManager user={authenticatedUser} onLogout={handleLogout} />
}
