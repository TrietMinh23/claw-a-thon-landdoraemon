// frontend/src/types.ts

export type EmailType =
  | 'invite'
  | 'remind_12h'
  | 'remind_15m'
  | 'setup'
  | 'followup'
  | 'custom'

// Legacy form (kept for old /api/generate compat)
export interface EmailForm {
  email_type: EmailType
  program_name: string
  purpose: string
  datetime: string
  location: string
  description: string
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface Participant {
  no: string
  name: string
  email: string
  dept: string
  group: string
  hrbp: string
  session: string
  title: string
  line_manager: string
}

export type AppState = 'idle' | 'generating' | 'ready' | 'editing'

// --- New v1 types ---

export interface WorkshopRsvp {
  accept: number
  decline: number
  tentative: number
  none: number
}

export interface Workshop {
  id: string
  name: string
  short: string
  abbr: string
  color: string
  status: string
  sessions: number
  total: number
  rsvp: WorkshopRsvp
  dates: string
  pendingEmails: number
  progress: number
  trainer: string
  room: string
}

export interface Attendee {
  name: string
  email: string
  bu: string
  session: number
  rsvp: 'accept' | 'decline' | 'tentative' | 'none'
}

export interface EmailDraft {
  id: string
  type: string
  label: string
  session: number | null
  date: string
  count: number
  status: 'pending' | 'approved'
  time: string
  preview: string
  body?: string
  subject?: string
  to?: string[]
}

export interface ImageEntry {
  dataUrl: string
  fileId: string
}

export interface ComposeGenerateRequest {
  email_type: string
  workshop_context: string
  extra_instructions: string
  file_ids: string[]
}

export interface ChatEditRequest {
  current_email: string
  message: string
  history: ChatMessage[]
  image_data_url?: string
}
