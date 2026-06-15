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
}

const EmailContext = createContext<EmailContextValue>({
  emails: [],
  pendingCount: 0,
  refreshEmails: async () => {},
  optimisticApprove: async () => {},
  addEmail: () => {},
})

export function EmailProvider({ children }: { children: ReactNode }) {
  const [emails, setEmails] = useState<EmailDraft[]>([])

  const refreshEmails = useCallback(async () => {
    const data = await fetchEmails()
    setEmails(data)
  }, [])

  const optimisticApprove = useCallback(async (id: string) => {
    setEmails(prev => prev.map(e => e.id === id ? { ...e, status: 'approved' as const } : e))
    await apiApproveEmail(id)
  }, [])

  const addEmail = useCallback((draft: EmailDraft) => {
    setEmails(prev => [draft, ...prev])
  }, [])

  useEffect(() => { refreshEmails() }, [refreshEmails])

  const pendingCount = emails.filter(e => e.status === 'pending').length

  return (
    <EmailContext.Provider value={{ emails, pendingCount, refreshEmails, optimisticApprove, addEmail }}>
      {children}
    </EmailContext.Provider>
  )
}

export function useEmailContext() {
  return useContext(EmailContext)
}
