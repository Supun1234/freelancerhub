import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import AppLayout from '../components/layout/AppLayout'

export default function Notifications() {
  const { user, loading } = useAuth()
  const navigate = useNavigate()

  const [notifications, setNotifications] = useState([])
  const [fetching, setFetching]           = useState(true)

  useEffect(() => {
    if (!loading && !user) navigate('/login')
  }, [user, loading])

  useEffect(() => {
    if (user) {
      fetchNotifications()
      markAllRead()
    }
  }, [user])

  async function fetchNotifications() {
    setFetching(true)
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(30)
    setNotifications(data || [])
    setFetching(false)
  }

  async function markAllRead() {
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('is_read', false)
  }

  async function handleClick(notification) {
    // navigate based on type
    if (
      notification.type === 'job_request' ||
      notification.type === 'job_accepted' ||
      notification.type === 'job_completed'
    ) {
      navigate('/jobs')
    } else if (
      notification.type === 'review_visible' ||
      notification.type === 'review_pending'
    ) {
      navigate('/jobs')
    } else if (notification.type === 'post_like') {
      navigate('/feed')
    } else {
      navigate('/feed')
    }
  }

  function timeAgo(dateStr) {
    if (!dateStr) return ''
    const diff = Math.floor((new Date() - new Date(dateStr)) / 1000)
    if (diff < 60)    return 'just now'
    if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    return `${Math.floor(diff / 86400)}d ago`
  }

  const typeConfig = {
    job_request:   { icon: '📋', color: 'text-accent'  },
    job_accepted:  { icon: '✅', color: 'text-accent2' },
    job_completed: { icon: '🎉', color: 'text-accent2' },
    review_visible:{ icon: '⭐', color: 'text-accent'  },
    review_pending:{ icon: '🔒', color: 'text-muted'   },
    post_like:     { icon: '❤️', color: 'text-danger'  },
    default:       { icon: '🔔', color: 'text-muted'   },
  }

  if (loading) return (
    <div className="min-h-screen bg-bg flex items-center justify-center">
      <p className="text-muted">Loading...</p>
    </div>
  )

  return (
    <AppLayout>
      <div className="max-w-xl mx-auto py-8 px-4">

        <div className="flex items-center justify-between mb-6">
          <h1 className="font-display font-bold text-xl text-white">
            Notifications
          </h1>
          {notifications.length > 0 && (
            <button
              onClick={markAllRead}
              className="text-xs text-muted hover:text-white transition-colors"
            >
              Mark all read
            </button>
          )}
        </div>

        {fetching ? (
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map(i => (
              <div
                key={i}
                className="bg-surface border border-border rounded-2xl p-4 animate-pulse"
              >
                <div className="flex gap-3">
                  <div className="w-10 h-10 bg-surface2 rounded-xl" />
                  <div className="flex-1">
                    <div className="h-3 bg-surface2 rounded w-3/4 mb-2" />
                    <div className="h-2 bg-surface2 rounded w-1/3" />
                  </div>
                </div>
              </div>
            ))}
          </div>

        ) : notifications.length === 0 ? (
          <div className="
            text-center py-16
            bg-surface border border-border
            rounded-2xl
          ">
            <p className="text-4xl mb-3">🔔</p>
            <p className="font-display font-bold text-white mb-1">
              No notifications yet
            </p>
            <p className="text-sm text-muted">
              We'll let you know when something happens.
            </p>
          </div>

        ) : (
          <div className="flex flex-col gap-2">
            {notifications.map(notif => {
              const config = typeConfig[notif.type] || typeConfig.default
              return (
                <div
                  key={notif.id}
                  onClick={() => handleClick(notif)}
                  className={`
                    flex items-start gap-3
                    bg-surface border rounded-2xl p-4
                    cursor-pointer transition-all
                    hover:border-muted/50
                    ${notif.is_read
                      ? 'border-border'
                      : 'border-accent2/30 bg-accent2/5'
                    }
                  `}
                >
                  {/* icon */}
                  <div className="
                    w-10 h-10 rounded-xl shrink-0
                    bg-surface2 border border-border
                    flex items-center justify-center
                    text-lg
                  ">
                    {config.icon}
                  </div>

                  {/* content */}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${notif.is_read ? 'text-white/70' : 'text-white'}`}>
                      {notif.body}
                    </p>
                    <p className="text-xs text-muted mt-1">
                      {timeAgo(notif.created_at)}
                    </p>
                  </div>

                  {/* unread dot */}
                  {!notif.is_read && (
                    <div className="w-2 h-2 rounded-full bg-accent2 shrink-0 mt-1.5" />
                  )}
                </div>
              )
            })}
          </div>
        )}

      </div>
    </AppLayout>
  )
}