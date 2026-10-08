import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import AppLayout from '../components/layout/AppLayout'
import PostCard from '../components/ui/PostCard'

export default function MyPosts() {
  const { user, profile, loading } = useAuth()
  const navigate = useNavigate()

  const [posts, setPosts]       = useState([])
  const [fetching, setFetching] = useState(true)
  const [activeTab, setActiveTab] = useState('all')
  const [deleting, setDeleting] = useState(null)

  useEffect(() => {
    if (!loading && !user) navigate('/login')
  }, [user, loading])

  useEffect(() => {
    if (user) fetchMyPosts()
  }, [user])

  async function fetchMyPosts() {
    setFetching(true)
    const { data } = await supabase
      .from('posts')
      .select(`
        *,
        users ( full_name, username, avg_rating, total_jobs ),
        circles ( name, color, icon )
      `)
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
    setPosts(data || [])
    setFetching(false)
  }

  async function handleDelete(postId) {
    if (!confirm('Are you sure you want to delete this post?')) return

    setDeleting(postId)

    await supabase
      .from('posts')
      .update({ is_active: false })
      .eq('id', postId)
      .eq('user_id', user.id)

    setPosts(posts.filter(p => p.id !== postId))
    setDeleting(null)
  }

  async function handleToggleAvailability(postId, currentActive) {
    await supabase
      .from('posts')
      .update({ is_active: !currentActive })
      .eq('id', postId)
      .eq('user_id', user.id)

    fetchMyPosts()
  }

  const filteredPosts = posts.filter(post =>
    activeTab === 'all' ? true : post.type === activeTab
  )

  if (loading) return (
    <div className="min-h-screen bg-bg flex items-center justify-center">
      <p className="text-muted">Loading...</p>
    </div>
  )

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto py-6 px-4">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display font-bold text-xl text-white">
              My Posts
            </h1>
            <p className="text-sm text-muted mt-0.5">
              {posts.length} post{posts.length !== 1 ? 's' : ''} total
            </p>
          </div>
          <button
            onClick={() => navigate('/feed')}
            className="
              px-4 py-2 bg-accent2 text-black
              font-display font-bold text-sm
              rounded-xl hover:opacity-90
              transition-opacity
            "
          >
            + New Post
          </button>
        </div>

        {/* Tabs */}
        <div className="
          flex gap-1 bg-surface border border-border
          rounded-xl p-1 mb-4
        ">
          {[
            { label: 'All',      value: 'all'      },
            { label: 'Offering', value: 'offering'  },
            { label: 'Seeking',  value: 'seeking'   },
          ].map(tab => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={`
                flex-1 py-1.5 rounded-lg text-xs font-medium
                transition-colors
                ${activeTab === tab.value
                  ? 'bg-surface2 text-white'
                  : 'text-muted hover:text-white'
                }
              `}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Posts */}
        {fetching ? (
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map(i => (
              <div
                key={i}
                className="bg-surface border border-border rounded-2xl p-5 animate-pulse"
              >
                <div className="flex gap-3 mb-3">
                  <div className="w-10 h-10 bg-surface2 rounded-xl" />
                  <div className="flex-1">
                    <div className="h-3 bg-surface2 rounded w-32 mb-2" />
                    <div className="h-2 bg-surface2 rounded w-48" />
                  </div>
                </div>
                <div className="h-3 bg-surface2 rounded w-full mb-2" />
                <div className="h-3 bg-surface2 rounded w-3/4" />
              </div>
            ))}
          </div>

        ) : filteredPosts.length === 0 ? (
          <div className="
            text-center py-16
            bg-surface border border-border
            rounded-2xl px-6
          ">
            <p className="text-4xl mb-3">📭</p>
            <p className="font-display font-bold text-white mb-2">
              {activeTab === 'all'
                ? 'No posts yet'
                : `No ${activeTab} posts yet`
              }
            </p>
            <p className="text-sm text-muted mb-6">
              Share your skills or find services by creating a post.
            </p>
            <button
              onClick={() => navigate('/feed')}
              className="
                px-6 py-2.5 bg-accent2 text-black
                font-display font-bold text-sm
                rounded-xl hover:opacity-90 transition-opacity
              "
            >
              Create a Post
            </button>
          </div>

        ) : (
          <div className="flex flex-col gap-4">
            {filteredPosts.map(post => (
              <div key={post.id} className="relative">

                {/* Post card */}
                <PostCard post={post} />

                {/* Management bar */}
                <div className="
                  flex items-center gap-2
                  mt-2 px-1
                ">
                  {/* Post stats */}
                  <div className="flex items-center gap-3 text-xs text-muted">
                    <span>
                      🕐 {new Date(post.created_at).toLocaleDateString('en-US', {
                        day:   'numeric',
                        month: 'short',
                        year:  'numeric',
                      })}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="ml-auto flex items-center gap-2">

                    {/* Active/Inactive toggle */}
                    <button
                      onClick={() => handleToggleAvailability(post.id, post.is_active)}
                      className={`
                        px-3 py-1.5 rounded-lg text-xs font-medium
                        border transition-colors
                        ${post.is_active
                          ? 'bg-accent2/10 border-accent2/20 text-accent2 hover:bg-accent2/20'
                          : 'bg-muted/10 border-muted/20 text-muted hover:bg-muted/20'
                        }
                      `}
                    >
                      {post.is_active ? '● Active' : '○ Inactive'}
                    </button>

                    {/* Delete */}
                    <button
                      onClick={() => handleDelete(post.id)}
                      disabled={deleting === post.id}
                      className="
                        px-3 py-1.5 rounded-lg text-xs font-medium
                        border border-danger/20 text-danger
                        bg-danger/10 hover:bg-danger/20
                        disabled:opacity-40 disabled:cursor-not-allowed
                        transition-colors
                      "
                    >
                      {deleting === post.id ? 'Deleting...' : '🗑 Delete'}
                    </button>

                  </div>
                </div>

              </div>
            ))}
          </div>
        )}

      </div>
    </AppLayout>
  )
}