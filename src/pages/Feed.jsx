import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import AppLayout from '../components/layout/AppLayout'
import PostCard from '../components/ui/PostCard'
import PostComposer from '../components/ui/PostComposer'

export default function Feed() {
  const { user, loading } = useAuth()
  const navigate = useNavigate()

  const [posts, setPosts]     = useState([])
  const [circles, setCircles] = useState([])
  const [fetching, setFetching] = useState(true)

  useEffect(() => {
    if (!loading && !user) navigate('/login')
  }, [user, loading])

  useEffect(() => {
    if (user) {
      fetchPosts()
      fetchCircles()
    }
  }, [user])

  async function fetchCircles() {
    const { data } = await supabase
      .from('circles')
      .select('*')
      .order('name')
    setCircles(data || [])
  }

  async function fetchPosts() {
    setFetching(true)

    const { data } = await supabase
      .from('posts')
      .select(`
        *,
        users ( full_name, username ),
        circles ( name, color, icon )
      `)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(20)

    // check which posts the current user liked
    if (data && data.length > 0) {
      const { data: likes } = await supabase
        .from('post_likes')
        .select('post_id')
        .eq('user_id', user.id)

      const likedIds = new Set(likes?.map(l => l.post_id) || [])

      const postsWithLikes = data.map(post => ({
        ...post,
        user_has_liked: likedIds.has(post.id),
      }))

      setPosts(postsWithLikes)
    } else {
      setPosts([])
    }

    setFetching(false)
  }

  function handlePostCreated(newPost) {
    setPosts(prev => [{ ...newPost, user_has_liked: false }, ...prev])
  }

  if (loading) return (
    <div className="min-h-screen bg-bg flex items-center justify-center">
      <p className="text-muted">Loading...</p>
    </div>
  )

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto py-6 px-4">

        {/* Composer */}
        <PostComposer
          circles={circles}
          onPostCreated={handlePostCreated}
        />

        {/* Feed tabs */}
        <div className="
          flex gap-1 bg-surface border border-border
          rounded-xl p-1 mb-4
        ">
          {['All Posts', 'Offering', 'Seeking', 'Questions'].map((tab, i) => (
            <button
              key={tab}
              className={`
                flex-1 py-1.5 rounded-lg text-xs font-medium
                transition-colors
                ${i === 0
                  ? 'bg-surface2 text-white'
                  : 'text-muted hover:text-white'
                }
              `}
            >
              {tab}
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
        ) : posts.length === 0 ? (
          <div className="
            text-center py-16
            bg-surface border border-border
            rounded-2xl
          ">
            <p className="text-4xl mb-3">🌱</p>
            <p className="font-display font-bold text-white mb-1">
              No posts yet
            </p>
            <p className="text-sm text-muted">
              Be the first to post something.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {posts.map(post => (
              <PostCard
                key={post.id}
                post={post}
              />
            ))}
          </div>
        )}

      </div>
    </AppLayout>
  )
}