// frontend/src/App.tsx
import { Routes, Route } from 'react-router-dom'
import AppLayout from './components/layout/AppLayout'
import DashboardPage from './components/dashboard/DashboardPage'
import ComposePage from './components/compose/ComposePage'
import EmailApprovalPage from './components/emails/EmailApprovalPage'
import PlaceholderPage from './components/shared/PlaceholderPage'

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="/compose" element={<ComposePage />} />
        <Route path="/emails" element={<EmailApprovalPage />} />
        <Route path="/workshop" element={<PlaceholderPage title="Workshop Detail" />} />
        <Route path="/rsvp" element={<PlaceholderPage title="RSVP Tracker" />} />
        <Route path="/feedback" element={<PlaceholderPage title="Feedback Report" />} />
        <Route path="/certificates" element={<PlaceholderPage title="Certificates" />} />
        <Route path="/analytics" element={<PlaceholderPage title="Analytics" />} />
        <Route path="/history" element={<PlaceholderPage title="History" />} />
      </Route>
    </Routes>
  )
}
