import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

export default function PostCard({ post }) {
  const { user } = useAuth()
  const navigate = useNavigate()

  function getInitials(name) {
    if (!name) return '?'
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  function timeAgo(dateStr) {
    const now  = new Date()
    const date = new Date(dateStr)
    const diff = Math.floor((now - date) / 1000)
    if (diff < 60)    return 'just now'
    if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    return `${Math.floor(diff / 86400)}d ago`
  }

  const typeConfig = {
  offering: {
    label:  'OFFERING',
    bg:     'bg-accent2/10',
    text:   'text-accent2',
    border: 'border-accent2/20',
  },
  seeking: {
    label:  'SEEKING',
    bg:     'bg-accent/10',
    text:   'text-accent',
    border: 'border-accent/20',
  },
}

  const type = typeConfig[post.type] || typeConfig.offering

  return (
    <div className="
      bg-surface border border-border
      rounded-2xl p-5
      hover:border-muted/50 transition-colors
    ">

      {/* Header */}
      <div className="flex items-start gap-3 mb-3">

        {/* Avatar */}
        <div
          onClick={() => navigate(`/profile/${post.users?.username}`)}
          className="
            w-11 h-11 rounded-xl shrink-0
            bg-gradient-to-br from-accent2 to-blue-500
            flex items-center justify-center
            font-display font-bold text-sm text-white
            cursor-pointer hover:opacity-90 transition-opacity
          "
        >
          {getInitials(post.users?.full_name)}
        </div>

        {/* Name + meta */}
        <div className="flex-1 min-w-0">
          <div
            onClick={() => navigate(`/profile/${post.users?.username}`)}
            className="
              font-display font-bold text-sm text-white
              hover:text-accent2 transition-colors
              cursor-pointer inline-block
            "
          >
            {post.users?.full_name}
          </div>

          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            {/* circle */}
            {post.circles && (
              <span
                className="text-xs font-medium"
                style={{ color: post.circles.color }}
              >
                ● {post.circles.name}
              </span>
            )}

            {post.location && (
              <>
                <span className="text-muted text-xs">·</span>
                <span className="text-xs text-muted">
                  📍 {post.location}
                </span>
              </>
            )}

            <span className="text-muted text-xs">·</span>
            <span className="text-xs text-muted">
              {timeAgo(post.created_at)}
            </span>
          </div>
        </div>

        {/* Post type badge */}
        <span className={`
          shrink-0 px-2.5 py-1 rounded-lg
          text-xs font-display font-bold
          border ${type.bg} ${type.text} ${type.border}
        `}>
          {type.label}
        </span>

      </div>

      {/* Title */}
      {post.title && (
        <h3 className="
          font-display font-bold text-base text-white mb-1
        ">
          {post.title}
        </h3>
      )}

      {/* Body */}
      <p className="text-sm text-white/70 leading-relaxed mb-3">
        {post.body}
      </p>

      {/* Tags */}
      {post.tags && post.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {post.tags.map(tag => (
            <span
              key={tag}
              className="
                px-2.5 py-0.5 rounded-full
                bg-surface2 border border-border
                text-xs text-muted
              "
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="
        flex items-center justify-between
        pt-3 border-t border-border
      ">

        {/* Stats */}
        <div className="flex items-center gap-3">
          {post.users?.avg_rating > 0 && (
            <div className="flex items-center gap-1">
              <span className="text-accent text-xs">★</span>
              <span className="text-xs font-bold text-accent">
                {post.users.avg_rating?.toFixed(1)}
              </span>
            </div>
          )}
          {post.users?.total_jobs > 0 && (
            <div className="flex items-center gap-1 text-xs text-muted">
              <span>📋</span>
              <span>{post.users.total_jobs} jobs done</span>
            </div>
          )}
          {!post.users?.avg_rating && !post.users?.total_jobs && (
            <span className="text-xs text-muted">New member</span>
          )}
        </div>

        {/* Contact button */}
        {user && post.user_id !== user.id && (
          <button
            onClick={() => navigate(`/profile/${post.users?.username}`)}
            className="
              px-5 py-2
              bg-accent2 text-black
              font-display font-bold text-xs
              rounded-xl hover:opacity-90
              transition-opacity
            "
          >
            {post.type === 'seeking' ? 'I Can Help →' : 'Contact →'}
          </button>
        )}

        {/* Own post indicator */}
        {user && post.user_id === user.id && (
          <span className="text-xs text-muted">Your post</span>
        )}

      </div>

    </div>
  )
}