import { useState } from 'react'
import Topbar from './Topbar'
import Sidebar from './Sidebar'

export default function AppLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-bg">
      <Topbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main content */}
      <main className="lg:ml-56 pt-14 min-h-screen">
        {children}
      </main>
    </div>
  )
}