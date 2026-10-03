import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import AppLayout from '../components/layout/AppLayout'

export default function Feed() {
  const { user, profile, loading } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!loading && !user) navigate('/login')
  }, [user, loading])

  if (loading) return (
    <div className="min-h-screen bg-bg flex items-center justify-center">
      <p className="text-muted">Loading...</p>
    </div>
  )

  return (
    <AppLayout>
      <div className="p-6">
        <h1 className="font-display font-bold text-2xl text-white mb-1">
          Welcome back, {profile?.full_name} 👋
        </h1>
        <p className="text-muted text-sm">
          Your feed is loading soon.
        </p>
      </div>
    </AppLayout>
  )
}