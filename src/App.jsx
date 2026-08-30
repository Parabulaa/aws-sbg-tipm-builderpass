import { Route, Routes } from 'react-router-dom'
import AppShell from './components/AppShell.jsx'
import StartPage from './pages/StartPage.jsx'
import NotFoundPage from './pages/NotFoundPage.jsx'

export default function App() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<StartPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </AppShell>
  )
}
