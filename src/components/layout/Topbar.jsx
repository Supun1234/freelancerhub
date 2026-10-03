import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

export default function Topbar() {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()

  async function handleSignOut() {
    await signOut()
    navigate('/login')
  }

  // get initials from full name
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

      {/* Search bar */}
      <div className="
        flex-1 max-w-md ml-4
        flex items-center gap-2
        bg-surface2 border border-border
        rounded-lg px-3 py-2
      ">
        <span className="text-muted text-sm">🔍</span>
        <input
          type="text"
          placeholder="Search skills, people, circles..."
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
        <button className="
          w-9 h-9 flex items-center justify-center
          bg-surface2 border border-border
          rounded-lg text-base hover:border-muted
          transition-colors relative
        ">
          🔔
          {/* notification dot */}
          <span className="
            absolute top-1.5 right-1.5
            w-2 h-2 bg-accent rounded-full
          "/>
        </button>

        {/* Messages */}
        <button className="
          w-9 h-9 flex items-center justify-center
          bg-surface2 border border-border
          rounded-lg text-base hover:border-muted
          transition-colors
        ">
          💬
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
            {getInitials(profile?.full_name)}
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
                {profile?.full_name}
              </p>
              <p className="text-xs text-muted truncate">
                @{profile?.username}
              </p>
            </div>

            <Link
              to={`/profile/${profile?.username}`}
              className="
                flex items-center gap-2 px-4 py-2.5
                text-sm text-muted hover:text-white
                hover:bg-surface2 transition-colors
              "
            >
              👤 My Profile
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