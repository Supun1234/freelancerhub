import Topbar from './Topbar'
import Sidebar from './Sidebar'

export default function AppLayout({ children }) {
  return (
    <div className="min-h-screen bg-bg">
      <Topbar />
      <Sidebar />
      {/* main content pushed right of sidebar and below topbar */}
      <main className="ml-56 pt-14 min-h-screen">
        {children}
      </main>
    </div>
  )
}