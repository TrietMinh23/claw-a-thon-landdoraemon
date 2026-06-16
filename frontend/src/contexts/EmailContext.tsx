// frontend/src/contexts/EmailContext.tsx
import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'
import type { EmailDraft } from '../types'
import { fetchEmails, approveEmail as apiApproveEmail } from '../api'

interface EmailContextValue {
  emails: EmailDraft[]
  pendingCount: number
  refreshEmails: () => Promise<void>
  optimisticApprove: (id: string) => Promise<void>
  addEmail: (draft: EmailDraft) => void
  deleteEmail: (id: string) => void
  updateEmail: (id: string, patch: Partial<EmailDraft>) => void
}

const EmailContext = createContext<EmailContextValue>({
  emails: [],
  pendingCount: 0,
  refreshEmails: async () => {},
  optimisticApprove: async () => {},
  addEmail: () => {},
  deleteEmail: () => {},
  updateEmail: () => {},
})

export function EmailProvider({ children }: { children: ReactNode }) {
  const [emails, setEmails] = useState<EmailDraft[]>([])

  const refreshEmails = useCallback(async () => {
    const data = await fetchEmails()
    setEmails(data)
  }, [])

  const optimisticApprove = useCallback(async (id: string) => {
    setEmails(prev => prev.map(e => e.id === id ? { ...e, status: 'approved' as const } : e))
    try {
      await apiApproveEmail(id)
    } catch (err) {
      // Rollback on failure
      setEmails(prev => prev.map(e => e.id === id ? { ...e, status: 'pending' as const } : e))
      throw err
    }
  }, [])

  const addEmail = useCallback((draft: EmailDraft) => {
    setEmails(prev => [draft, ...prev])
  }, [])

  const deleteEmail = useCallback((id: string) => {
    setEmails(prev => prev.filter(e => e.id !== id))
  }, [])

  const updateEmail = useCallback((id: string, patch: Partial<EmailDraft>) => {
    setEmails(prev => prev.map(e => e.id === id ? { ...e, ...patch } : e))
  }, [])

  useEffect(() => { refreshEmails() }, [refreshEmails])

  const pendingCount = emails.filter(e => e.status === 'pending').length

  return (
    <EmailContext.Provider value={{ emails, pendingCount, refreshEmails, optimisticApprove, addEmail, deleteEmail, updateEmail }}>
      {children}
    </EmailContext.Provider>
  )
}

export function useEmailContext() {
  return useContext(EmailContext)
}
