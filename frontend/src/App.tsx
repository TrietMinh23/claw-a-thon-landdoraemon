// frontend/src/App.tsx
import { Routes, Route } from 'react-router-dom'
import AppLayout from './components/layout/AppLayout'
import DashboardPage from './components/dashboard/DashboardPage'
import ComposePage from './components/compose/ComposePage'
import EmailApprovalPage from './components/emails/EmailApprovalPage'
import WorkshopPage from './components/workshop/WorkshopPage'
import RSVPPage from './components/rsvp/RSVPPage'
import FeedbackPage from './components/feedback/FeedbackPage'
import CertificatesPage from './components/certificates/CertificatesPage'

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="/compose" element={<ComposePage />} />
        <Route path="/emails" element={<EmailApprovalPage />} />
        <Route path="/workshop" element={<WorkshopPage />} />
        <Route path="/rsvp" element={<RSVPPage />} />
        <Route path="/feedback" element={<FeedbackPage />} />
        <Route path="/certificates" element={<CertificatesPage />} />
      </Route>
    </Routes>
  )
}
