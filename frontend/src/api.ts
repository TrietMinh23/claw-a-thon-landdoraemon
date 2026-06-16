// frontend/src/api.ts
import type {
  EmailForm, ChatMessage, Participant,
  Workshop, Attendee, EmailDraft,
  ComposeGenerateRequest, ChatEditRequest,
} from './types'

async function* readSSE(url: string, body: unknown): AsyncGenerator<string> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  if (!res.body) throw new Error('No response body')

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() ?? ''
    for (const line of lines) {
      if (!line.startsWith('data: ')) continue
      const payload = JSON.parse(line.slice(6))
      if (payload.done) return
      if (payload.chunk) yield payload.chunk as string
    }
  }
}

// Legacy endpoints (kept for compat)
export async function streamGenerate(form: EmailForm, onChunk: (text: string) => void): Promise<void> {
  for await (const chunk of readSSE('/api/generate', form)) onChunk(chunk)
}

export async function streamRefine(
  currentEmail: string, message: string, history: ChatMessage[], onChunk: (text: string) => void,
): Promise<void> {
  for await (const chunk of readSSE('/api/refine', { current_email: currentEmail, message, history })) onChunk(chunk)
}

export async function parseParticipants(file: File): Promise<{ participants: Participant[]; count: number }> {
  const form = new FormData()
  form.append('file', file)
  const res = await fetch('/api/parse-participants', { method: 'POST', body: form })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export async function personalizeEmails(
  emailTemplate: string, participants: Participant[],
): Promise<{ emails: { name: string; email: string; body: string }[] }> {
  const res = await fetch('/api/personalize', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email_template: emailTemplate, participants }),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

// --- v1 workshops ---
export async function fetchWorkshops(): Promise<Workshop[]> {
  const res = await fetch('/api/v1/workshops')
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export async function fetchWorkshop(id: string): Promise<Workshop> {
  const res = await fetch(`/api/v1/workshops/${id}`)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export async function fetchAttendees(workshopId: string): Promise<Attendee[]> {
  const res = await fetch(`/api/v1/workshops/${workshopId}/attendees`)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

// --- v1 emails ---
export async function fetchEmails(): Promise<EmailDraft[]> {
  const res = await fetch('/api/v1/emails')
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export async function approveEmail(id: string): Promise<void> {
  const res = await fetch(`/api/v1/emails/${id}/approve`, { method: 'PUT' })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
}

export async function postEmailDraft(draft: EmailDraft): Promise<void> {
  const res = await fetch('/api/v1/emails', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(draft),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
}

// --- v1 compose ---
export async function uploadImage(file: File): Promise<{ file_id: string }> {
  const form = new FormData()
  form.append('file', file)
  const res = await fetch('/api/v1/compose/upload-image', { method: 'POST', body: form })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export async function streamGenerateV1(
  req: ComposeGenerateRequest,
  onChunk: (text: string) => void,
): Promise<void> {
  for await (const chunk of readSSE('/api/v1/compose/generate', req)) onChunk(chunk)
}

export async function streamChatEdit(
  req: ChatEditRequest,
  onChunk: (text: string) => void,
): Promise<void> {
  for await (const chunk of readSSE('/api/v1/compose/chat-edit', req)) onChunk(chunk)
}

export async function uploadRecipients(file: File): Promise<{ participants: Participant[]; count: number }> {
  const form = new FormData()
  form.append('file', file)
  const res = await fetch('/api/v1/compose/upload-recipients', { method: 'POST', body: form })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

// --- Dashboard chat ---
export async function streamDashboardChat(
  messages: { role: string; content: string }[],
  onChunk: (text: string) => void,
): Promise<void> {
  for await (const chunk of readSSE('/api/v1/chat', { messages })) onChunk(chunk)
}

// --- Graph auth ---
export async function getGraphAuthStatus(): Promise<{ authenticated: boolean; user_display_name?: string; user_email?: string }> {
  const res = await fetch('/api/v1/graph/auth/status')
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export async function startGraphAuth(): Promise<{ user_code: string; verification_uri: string; message: string; expires_in: number }> {
  const res = await fetch('/api/v1/graph/auth/start', { method: 'POST' })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export async function pollGraphAuth(): Promise<{ done: boolean; fatal_error?: string }> {
  const res = await fetch('/api/v1/graph/auth/poll', { method: 'POST' })
  if (res.status === 400) return { done: false }
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}
