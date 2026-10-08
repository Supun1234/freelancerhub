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

  const [posts, setPosts]         = useState([])
  const [circles, setCircles]     = useState([])
  const [myCircles, setMyCircles] = useState([])
  const [fetching, setFetching]   = useState(true)
  const [activeTab, setActiveTab] = useState('all')
  const [browseAll, setBrowseAll] = useState(false)

  useEffect(() => {
    if (!loading && !user) navigate('/login')
  }, [user, loading])

  useEffect(() => {
    if (user) {
      fetchCircles()
      fetchMyCircles()
    }
  }, [user])

  useEffect(() => {
    if (user) {
      fetchPosts()
    }
  }, [user, browseAll, myCircles])

  async function fetchCircles() {
    const { data } = await supabase
      .from('circles')
      .select('*')
      .order('name')
    setCircles(data || [])
  }

  async function fetchMyCircles() {
    const { data } = await supabase
      .from('user_circles')
      .select('circle_id')
      .eq('user_id', user.id)
    setMyCircles(data?.map(c => c.circle_id) || [])
  }

  async function fetchPosts() {
    setFetching(true)

let query = supabase
  .from('posts')
  .select(`
    *,
    users ( full_name, username, avg_rating, total_jobs ),
    circles ( name, color, icon )
  `)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(20)

    // filter by joined circles if user has any
    // and not browsing all
    if (myCircles.length > 0 && !browseAll) {
      query = query.in('circle_id', myCircles)
    }

    const { data } = await query

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

  // filtered posts based on active tab
  const filteredPosts = posts.filter(post =>
    activeTab === 'all' ? true : post.type === activeTab
  )

  if (loading) return (
    <div className="min-h-screen bg-bg flex items-center justify-center">
      <p className="text-muted">Loading...</p>
    </div>
  )

  return (
    <AppLayout onCircleChange={fetchMyCircles}>
      <div className="max-w-2xl mx-auto py-4 sm:py-6 px-3 sm:px-4">

        {/* Composer */}
        <PostComposer
          circles={circles}
          onPostCreated={handlePostCreated}
        />

        {/* Browse all banner */}
        {browseAll && (
          <div className="
            flex items-center justify-between
            bg-accent/10 border border-accent/20
            rounded-xl px-4 py-3 mb-4
          ">
            <p className="text-sm text-accent font-medium">
              🌐 Showing all posts across FreelancerHub
            </p>
            <button
              onClick={() => setBrowseAll(false)}
              className="text-xs text-muted hover:text-white transition-colors"
            >
              Back to my circles
            </button>
          </div>
        )}

        {/* Feed tabs */}
        <div className="
          flex gap-1 bg-surface border border-border
          rounded-xl p-1 mb-4
        ">
          {[
  { label: 'All Posts', value: 'all'      },
  { label: 'Offering',  value: 'offering'  },
  { label: 'Seeking',   value: 'seeking'   },
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
            <p className="text-4xl mb-3">
              {activeTab === 'all' ? '🌱' : '🔍'}
            </p>
            <p className="font-display font-bold text-white mb-2">
              {activeTab === 'all'
                ? myCircles.length === 0
                  ? 'No posts yet'
                  : 'No posts in your circles'
                : `No ${activeTab} posts in your circles`
              }
            </p>
            <p className="text-sm text-muted mb-6">
              {myCircles.length === 0
                ? 'Join circles from the sidebar to see relevant posts.'
                : activeTab === 'all'
                ? 'Join more circles or browse all posts.'
                : `No ${activeTab} posts in your circles yet.`
              }
            </p>
            {activeTab === 'all' && (
              <div className="flex flex-col gap-2 items-center">
                <p className="text-xs text-muted">
                  Browse all posts across the platform:
                </p>
                <button
                  onClick={() => setBrowseAll(true)}
                  className="
                    px-5 py-2 bg-surface2 border border-border
                    text-white font-display font-bold text-sm
                    rounded-xl hover:border-muted transition-colors
                  "
                >
                  Browse All Posts
                </button>
              </div>
            )}
          </div>

        ) : (
          <div className="flex flex-col gap-4">
            {filteredPosts.map(post => (
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