import { createContext, useContext, useState } from 'react'

const STORAGE_KEY = 'toro_auth'

interface AuthCtx {
  user: string | null
  login: (email: string, password: string) => boolean
  logout: () => void
}

const AuthContext = createContext<AuthCtx>({} as AuthCtx)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<string | null>(() => localStorage.getItem(STORAGE_KEY))

  function login(email: string, password: string): boolean {
    if (!email || !password) return false
    localStorage.setItem(STORAGE_KEY, email)
    setUser(email)
    return true
  }

  function logout() {
    localStorage.removeItem(STORAGE_KEY)
    setUser(null)
  }

  return <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
