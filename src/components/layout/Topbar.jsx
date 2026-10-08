import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'

export default function Topbar({ onMenuClick }) {
  const { profile: authProfile, signOut } = useAuth()
  const navigate = useNavigate()

const [unreadMessages, setUnreadMessages] = useState(0)

useEffect(() => {
  if (!authProfile) return
  fetchUnreadMessages()

  const channel = supabase
    .channel('messages-badge')
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'messages',
      filter: `receiver_id=eq.${authProfile.id}`,
    }, () => {
      fetchUnreadMessages()
    })
    .subscribe()

  return () => supabase.removeChannel(channel)
}, [authProfile])

async function fetchUnreadMessages() {
  if (!authProfile) return
  const { count } = await supabase
    .from('messages')
    .select('*', { count: 'exact', head: true })
    .eq('receiver_id', authProfile.id)
    .eq('is_read', false)
  setUnreadMessages(count || 0)
}

  async function handleSignOut() {
    await signOut()
    navigate('/login')
  }

  function getInitials(name) {
    if (!name) return '?'
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <header className="
      fixed top-0 left-0 right-0 z-50
      h-14 bg-surface border-b border-border
      flex items-center px-4 gap-4
    ">

      {/* Logo */}
      <Link to="/feed" className="font-display font-black text-xl shrink-0">
        <span className="text-accent">Freelancer</span>
        <span className="text-accent2">Hub</span>
      </Link>

      {/* Burger menu — mobile only */}
      <button
        onClick={onMenuClick}
        className="
          lg:hidden
          w-9 h-9 flex items-center justify-center
          bg-surface2 border border-border
          rounded-lg text-base hover:border-muted
          transition-colors
        "
      >
        ☰
      </button>

      {/* Search bar — hidden on mobile */}
      <div className="
        hidden sm:flex
        flex-1 max-w-md ml-4
        items-center gap-2
        bg-surface2 border border-border
        rounded-lg px-3 py-2
      ">
        <span className="text-muted text-sm">🔍</span>
        <input
          type="text"
          placeholder="Search skills, people, circles..."
          onKeyDown={e => {
            if (e.key === 'Enter' && e.target.value.trim()) {
              navigate(`/search?q=${encodeURIComponent(e.target.value.trim())}`)
            }
          }}
          className="
            bg-transparent flex-1 text-sm
            text-white placeholder-muted
            outline-none
          "
        />
      </div>

      {/* Right side */}
      <div className="ml-auto flex items-center gap-2">

        {/* Notifications */}
        <button
          onClick={() => navigate('/notifications')}
          className="
            w-9 h-9 flex items-center justify-center
            bg-surface2 border border-border
            rounded-lg text-base hover:border-muted
            transition-colors relative
          "
        >
          🔔
          {unreadCount > 0 && (
            <span className="
              absolute -top-1 -right-1
              min-w-4 h-4 px-1
              bg-accent text-black
              font-display font-bold text-xs
              rounded-full flex items-center justify-center
            ">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {/* Messages */}
<button
  onClick={() => navigate('/messages')}
  className="
    w-9 h-9 flex items-center justify-center
    bg-surface2 border border-border
    rounded-lg text-base hover:border-muted
    transition-colors relative
  "
>
  💬
  {unreadMessages > 0 && (
    <span className="
      absolute -top-1 -right-1
      min-w-4 h-4 px-1
      bg-accent2 text-black
      font-display font-bold text-xs
      rounded-full flex items-center justify-center
    ">
      {unreadMessages > 9 ? '9+' : unreadMessages}
    </span>
  )}
</button>

        {/* Avatar dropdown */}
        <div className="relative group">
          <button className="
            w-9 h-9 rounded-lg
            bg-gradient-to-br from-accent to-danger
            flex items-center justify-center
            font-display font-bold text-sm text-white
            cursor-pointer
          ">
            {getInitials(authProfile?.full_name)}
          </button>

          {/* Dropdown */}
          <div className="
            absolute right-0 top-11
            w-48 bg-surface border border-border
            rounded-xl shadow-xl
            opacity-0 invisible
            group-hover:opacity-100 group-hover:visible
            transition-all duration-150
            overflow-hidden
          ">
            <div className="px-4 py-3 border-b border-border">
              <p className="text-sm font-medium text-white truncate">
                {authProfile?.full_name}
              </p>
              <p className="text-xs text-muted truncate">
                @{authProfile?.username}
              </p>
            </div>

            <Link
              to={`/profile/${authProfile?.username}`}
              className="
                flex items-center gap-2 px-4 py-2.5
                text-sm text-muted hover:text-white
                hover:bg-surface2 transition-colors
              "
            >
              👤 My Profile
            </Link>

            <Link
              to="/profile/edit"
              className="
                flex items-center gap-2 px-4 py-2.5
                text-sm text-muted hover:text-white
                hover:bg-surface2 transition-colors
              "
            >
              ✏️ Edit Profile
            </Link>

            <Link
              to="/jobs"
              className="
                flex items-center gap-2 px-4 py-2.5
                text-sm text-muted hover:text-white
                hover:bg-surface2 transition-colors
              "
            >
              📋 My Jobs
            </Link>

            <Link
              to="/notifications"
              className="
                flex items-center gap-2 px-4 py-2.5
                text-sm text-muted hover:text-white
                hover:bg-surface2 transition-colors
              "
            >
              🔔 Notifications
              {unreadCount > 0 && (
                <span className="
                  ml-auto bg-accent text-black
                  font-display font-bold text-xs
                  px-1.5 py-0.5 rounded-full
                ">
                  {unreadCount}
                </span>
              )}
            </Link>

            <button
              onClick={handleSignOut}
              className="
                w-full flex items-center gap-2 px-4 py-2.5
                text-sm text-danger hover:bg-surface2
                transition-colors
              "
            >
              🚪 Sign Out
            </button>
          </div>
        </div>

      </div>
    </header>
  )
}