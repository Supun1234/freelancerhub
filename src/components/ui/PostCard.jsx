import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'

export default function PostCard({ post, onUpdate }) {
  const { user } = useAuth()
  const [liked, setLiked] = useState(post.user_has_liked || false)
  const [likeCount, setLikeCount] = useState(post.like_count || 0)
  const [showComments, setShowComments] = useState(false)
  const [comments, setComments] = useState([])
  const [commentText, setCommentText] = useState('')
  const [loadingComments, setLoadingComments] = useState(false)
  const navigate = useNavigate()

  // post type style
  const typeConfig = {
    offering: {
      label: 'OFFERING',
      bg: 'bg-accent2/10',
      text: 'text-accent2',
      border: 'border-accent2/20',
    },
    seeking: {
      label: 'SEEKING',
      bg: 'bg-accent/10',
      text: 'text-accent',
      border: 'border-accent/20',
    },
    question: {
      label: 'QUESTION',
      bg: 'bg-purple-500/10',
      text: 'text-purple-400',
      border: 'border-purple-500/20',
    },
  }

  const type = typeConfig[post.type] || typeConfig.offering

  // get initials
  function getInitials(name) {
    if (!name) return '?'
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  // format time ago
  function timeAgo(dateStr) {
    const now = new Date()
    const date = new Date(dateStr)
    const diff = Math.floor((now - date) / 1000)

    if (diff < 60)     return 'just now'
    if (diff < 3600)   return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400)  return `${Math.floor(diff / 3600)}h ago`
    return `${Math.floor(diff / 86400)}d ago`
  }

  // handle like
  async function handleLike() {
    if (!user) return

    if (liked) {
      // unlike
      await supabase
        .from('post_likes')
        .delete()
        .eq('post_id', post.id)
        .eq('user_id', user.id)

      await supabase
        .from('posts')
        .update({ like_count: likeCount - 1 })
        .eq('id', post.id)

      setLiked(false)
      setLikeCount(prev => prev - 1)
    } else {
      // like
      await supabase
        .from('post_likes')
        .insert({ post_id: post.id, user_id: user.id })

      await supabase
        .from('posts')
        .update({ like_count: likeCount + 1 })
        .eq('id', post.id)

      setLiked(true)
      setLikeCount(prev => prev + 1)
    }
  }

  // load comments
  async function handleToggleComments() {
    if (!showComments && comments.length === 0) {
      setLoadingComments(true)
      const { data } = await supabase
        .from('comments')
        .select(`
          *,
          users ( full_name, username, avatar_url )
        `)
        .eq('post_id', post.id)
        .order('created_at', { ascending: true })

      setComments(data || [])
      setLoadingComments(false)
    }
    setShowComments(!showComments)
  }

  // submit comment
  async function handleComment(e) {
    e.preventDefault()
    if (!commentText.trim() || !user) return

    const { data, error } = await supabase
      .from('comments')
      .insert({
        post_id: post.id,
        user_id: user.id,
        body: commentText.trim(),
      })
      .select(`
        *,
        users ( full_name, username, avatar_url )
      `)
      .single()

    if (!error) {
      setComments([...comments, data])
      setCommentText('')

      // update comment count
      await supabase
        .from('posts')
        .update({ comment_count: post.comment_count + 1 })
        .eq('id', post.id)
    }
  }

  return (
    <div className="
      bg-surface border border-border
      rounded-2xl p-5
      hover:border-muted/50 transition-colors
    ">

      {/* Header */}
      <div className="flex items-start gap-3 mb-3">

        {/* Avatar */}
        <Link to={`/profile/${post.users?.username}`}>
          <div className="
            w-10 h-10 rounded-xl shrink-0
            bg-gradient-to-br from-accent2 to-blue-500
            flex items-center justify-center
            font-display font-bold text-sm text-white
          ">
            {getInitials(post.users?.full_name)}
          </div>
        </Link>

        {/* Name + meta */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Link
              to={`/profile/${post.users?.username}`}
              className="font-display font-bold text-sm text-white hover:text-accent2 transition-colors"
            >
              {post.users?.full_name}
            </Link>
            <span className="text-muted text-xs">@{post.users?.username}</span>
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
            <span className="text-muted text-xs">·</span>
            {/* location */}
            {post.location && (
              <>
                <span className="text-xs text-muted">📍 {post.location}</span>
                <span className="text-muted text-xs">·</span>
              </>
            )}
            {/* time */}
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

      {/* Body */}
      {post.title && (
        <h3 className="font-display font-bold text-base text-white mb-1">
          {post.title}
        </h3>
      )}
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

      {/* Footer actions */}
      <div className="
        flex items-center gap-1
        pt-3 border-t border-border
      ">

        {/* Like */}
        <button
          onClick={handleLike}
          className={`
            flex items-center gap-1.5 px-3 py-1.5
            rounded-lg text-xs font-medium
            transition-colors
            ${liked
              ? 'text-danger bg-danger/10'
              : 'text-muted hover:text-white hover:bg-surface2'
            }
          `}
        >
          {liked ? '❤️' : '🤍'} {likeCount}
        </button>

        {/* Comments */}
        <button
          onClick={handleToggleComments}
          className="
            flex items-center gap-1.5 px-3 py-1.5
            rounded-lg text-xs font-medium text-muted
            hover:text-white hover:bg-surface2
            transition-colors
          "
        >
          💬 {post.comment_count || 0}
        </button>

        {/* Share */}
        <button className="
          flex items-center gap-1.5 px-3 py-1.5
          rounded-lg text-xs font-medium text-muted
          hover:text-white hover:bg-surface2
          transition-colors
        ">
          🔗 Share
        </button>

        {/* Contact button — only on other people's posts */}
        {user && post.user_id !== user.id && (
          <button 
            onClick={() => navigate(`/profile/${post.users?.username}`)}
            className="
            ml-auto px-4 py-1.5
            bg-accent2 text-black
            font-display font-bold text-xs
            rounded-lg hover:opacity-90
            transition-opacity
          ">
            {post.type === 'seeking' ? 'I Can Help' : 'Contact'}
          </button>
        )}

      </div>

      {/* Comments section */}
      {showComments && (
        <div className="mt-4 pt-4 border-t border-border">

          {loadingComments ? (
            <p className="text-xs text-muted">Loading comments...</p>
          ) : (
            <div className="flex flex-col gap-3 mb-3">
              {comments.length === 0 && (
                <p className="text-xs text-muted">
                  No comments yet. Be the first.
                </p>
              )}
              {comments.map(comment => (
                <div key={comment.id} className="flex gap-2.5">
                  <div className="
                    w-7 h-7 rounded-lg shrink-0
                    bg-gradient-to-br from-accent to-danger
                    flex items-center justify-center
                    font-display font-bold text-xs text-white
                  ">
                    {getInitials(comment.users?.full_name)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-bold text-white">
                        {comment.users?.full_name}
                      </span>
                      <span className="text-xs text-muted">
                        {timeAgo(comment.created_at)}
                      </span>
                    </div>
                    <p className="text-xs text-white/70 leading-relaxed">
                      {comment.body}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Comment input */}
          <form onSubmit={handleComment} className="flex gap-2">
            <input
              value={commentText}
              onChange={e => setCommentText(e.target.value)}
              placeholder="Write a comment..."
              className="
                flex-1 bg-surface2 border border-border
                rounded-lg px-3 py-2 text-xs text-white
                placeholder-muted outline-none
                focus:border-accent2 transition-colors
              "
            />
            <button
              type="submit"
              disabled={!commentText.trim()}
              className="
                px-4 py-2 bg-accent2 text-black
                font-display font-bold text-xs
                rounded-lg hover:opacity-90
                disabled:opacity-40 disabled:cursor-not-allowed
                transition-opacity
              "
            >
              Post
            </button>
          </form>

        </div>
      )}

    </div>
  )
}