import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import AppLayout from '../components/layout/AppLayout'
import PostCard from '../components/ui/PostCard'
import JobRequestModal from '../components/ui/JobRequestModal'

export default function Profile() {
  const { username } = useParams()
  const { user, profile: myProfile } = useAuth()
  const navigate = useNavigate()

  const [profile, setProfile]   = useState(null)
  const [posts, setPosts]       = useState([])
  const [reviews, setReviews]   = useState([])
  const [skills, setSkills]     = useState([])
  const [circles, setCircles]   = useState([])
  const [jobs, setJobs]         = useState([])
  const [loading, setLoading]   = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [activeTab, setActiveTab] = useState('posts')
  const [showJobRequest, setShowJobRequest] = useState(false)
  const [jobSent, setJobSent]               = useState(false)

  const isOwnProfile = myProfile?.username === username

  useEffect(() => {
    if (username) fetchProfile()
  }, [username])

  async function fetchProfile() {
    setLoading(true)

    // fetch user profile
    const { data: profileData } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .single()

    if (!profileData) {
      setNotFound(true)
      setLoading(false)
      return
    }

    setProfile(profileData)

    // fetch in parallel
    const [
      postsRes,
      reviewsRes,
      skillsRes,
      circlesRes,
      jobsRes,
    ] = await Promise.all([
      // posts
      supabase
        .from('posts')
        .select('*, users(full_name, username), circles(name, color, icon)')
        .eq('user_id', profileData.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false }),

      // reviews received
      supabase
        .from('reviews')
        .select('*, reviewer:reviewer_id(full_name, username)')
        .eq('reviewee_id', profileData.id)
        .eq('is_visible', true)
        .order('created_at', { ascending: false }),

      // skills
      supabase
        .from('user_skills')
        .select('*')
        .eq('user_id', profileData.id),

      // circles
      supabase
        .from('user_circles')
        .select('circles(name, color, icon)')
        .eq('user_id', profileData.id),

      
      // completed jobs
// completed jobs — fetch both sides separately then merge
Promise.all([
  supabase
    .from('jobs')
    .select(`
      *,
      freelancer:freelancer_id ( full_name, username ),
      client:client_id ( full_name, username )
    `)
    .eq('freelancer_id', profileData.id)
    .eq('status', 'completed')
    .order('created_at', { ascending: false }),

  supabase
    .from('jobs')
    .select(`
      *,
      freelancer:freelancer_id ( full_name, username ),
      client:client_id ( full_name, username )
    `)
    .eq('client_id', profileData.id)
    .eq('status', 'completed')
    .order('created_at', { ascending: false }),
]).then(([freelancerJobs, clientJobs]) => ({
  data: [
    ...(freelancerJobs.data || []),
    ...(clientJobs.data || []),
  ]
})),
    ])

    setPosts(postsRes.data || [])
    setReviews(reviewsRes.data || [])
    setSkills(skillsRes.data || [])
    setCircles(circlesRes.data?.map(c => c.circles) || [])
    setJobs(jobsRes.data || [])
    setLoading(false)
  }

  function getInitials(name) {
    if (!name) return '?'
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  function timeAgo(dateStr) {
    if (!dateStr) return ''
    const diff = Math.floor((new Date() - new Date(dateStr)) / 1000)
    if (diff < 86400)  return `${Math.floor(diff / 3600)}h ago`
    if (diff < 2592000) return `${Math.floor(diff / 86400)}d ago`
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
  }

  function renderStars(rating) {
    return Array.from({ length: 5 }, (_, i) => (
      <span key={i} className={i < rating ? 'text-accent' : 'text-muted'}>★</span>
    ))
  }

  if (loading) return (
    <div className="min-h-screen bg-bg flex items-center justify-center">
      <p className="text-muted">Loading profile...</p>
    </div>
  )

  if (notFound) return (
    <AppLayout>
      <div className="max-w-2xl mx-auto py-16 px-4 text-center">
        <p className="text-4xl mb-3">🔍</p>
        <p className="font-display font-bold text-white text-xl mb-2">
          User not found
        </p>
        <p className="text-muted text-sm mb-6">
          @{username} doesn't exist on FreelancerHub.
        </p>
        <button
          onClick={() => navigate('/feed')}
          className="px-6 py-2 bg-accent2 text-black font-display font-bold rounded-xl"
        >
          Back to Feed
        </button>
      </div>
    </AppLayout>
  )

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto py-6 px-4">

        {/* Hero Card */}
        <div className="bg-surface border border-border rounded-2xl overflow-hidden mb-4">

          {/* Banner */}
          <div className="h-24 bg-gradient-to-br from-surface2 via-surface to-bg relative">
            <div className="absolute inset-0 opacity-20"
              style={{
                backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 20px, rgba(62,207,178,0.3) 20px, rgba(62,207,178,0.3) 21px)'
              }}
            />
          </div>

          <div className="px-6 pb-6">

            {/* Avatar + actions */}
            <div className="flex items-end justify-between -mt-7 mb-4">
              <div className="
                w-16 h-16 rounded-2xl
                bg-gradient-to-br from-accent2 to-blue-500
                flex items-center justify-center
                font-display font-bold text-2xl text-white
                border-4 border-bg
              ">
                {getInitials(profile.full_name)}
              </div>

              <div className="flex gap-2 mt-8">
                {isOwnProfile ? (
                  <button 
                    onClick={() => navigate('/profile/edit')}
                    className="
                     px-4 py-2 bg-surface2 border border-border
                     text-white font-display font-bold text-xs
                     rounded-xl hover:border-muted transition-colors
                  ">
                    ✏️ Edit Profile
                  </button>
                ) : (
                  <>
                  <button className="
                      px-4 py-2 bg-surface2 border border-border
                      text-white font-display font-bold text-xs
                      rounded-xl hover:border-muted transition-colors
                    ">
                      + Follow
                  </button>
                  <button 
                      onClick={() => setShowJobRequest(true)}
                      disabled={jobSent}
                      className="
                        px-4 py-2 bg-accent2 text-black
                        font-display font-bold text-xs
                        rounded-xl hover:opacity-90
                        disabled:opacity-50 disabled:cursor-not-allowed
                        transition-opacity
                      "
                  >
                      {jobSent ? '✓ Request Sent' : '💬 Contact'}
                  </button>
                  </>
                )}
              </div>
            </div>

            {/* Name + role */}
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-1">
                <h1 className="font-display font-bold text-xl text-white">
                  {profile.full_name}
                </h1>
                {profile.is_verified && (
                  <span className="
                    text-xs font-bold font-display
                    bg-accent2/10 text-accent2
                    border border-accent2/20
                    px-2 py-0.5 rounded-lg
                  ">
                    ✓ Verified
                  </span>
                )}
                <span className={`
                  text-xs font-bold font-display px-2 py-0.5 rounded-lg
                  ${profile.availability === 'available'
                    ? 'bg-accent2/10 text-accent2 border border-accent2/20'
                    : 'bg-muted/10 text-muted border border-muted/20'
                  }
                `}>
                  {profile.availability === 'available' ? '🟢 Available' : '🔴 Busy'}
                </span>
              </div>

              <p className="text-muted text-sm">
                @{profile.username}
                {profile.location && ` · 📍 ${profile.location}`}
              </p>

              {profile.bio && (
                <p className="text-white/70 text-sm mt-3 leading-relaxed">
                  {profile.bio}
                </p>
              )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-3 mb-4">
              {[
                { num: profile.total_jobs,    label: 'Jobs Done'   },
                { num: profile.avg_rating > 0 ? profile.avg_rating?.toFixed(1) : '—', label: 'Avg Rating' },
                { num: profile.total_reviews, label: 'Reviews'     },
                { num: posts.length,          label: 'Posts'       },
              ].map(stat => (
                <div
                  key={stat.label}
                  className="bg-surface2 border border-border rounded-xl p-3 text-center"
                >
                  <div className="font-display font-bold text-lg text-accent">
                    {stat.num}
                  </div>
                  <div className="text-xs text-muted mt-0.5">{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Skills */}
            {skills.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-4">
                {skills.map(skill => (
                  <span
                    key={skill.id}
                    className="
                      px-3 py-1 rounded-full text-xs
                      bg-surface2 border border-border text-muted
                    "
                  >
                    {skill.skill_name}
                  </span>
                ))}
              </div>
            )}

            {/* Circles */}
            {circles.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {circles.map((circle, i) => (
                  <span
                    key={i}
                    className="
                      flex items-center gap-1.5
                      px-3 py-1 rounded-full text-xs
                      bg-surface2 border border-border
                    "
                    style={{ color: circle?.color }}
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ background: circle?.color }}
                    />
                    {circle?.name}
                  </span>
                ))}
              </div>
            )}

          </div>
        </div>

        {/* Tabs */}
        <div className="
          flex gap-1 bg-surface border border-border
          rounded-xl p-1 mb-4
        ">
          {[
            { label: `Posts (${posts.length})`,     value: 'posts'   },
            { label: `Reviews (${reviews.length})`, value: 'reviews' },
            { label: `Jobs (${jobs.length})`,       value: 'jobs'    },
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

        {/* Tab content */}

        {/* Posts tab */}
        {activeTab === 'posts' && (
          <div className="flex flex-col gap-4">
            {posts.length === 0 ? (
              <div className="text-center py-12 bg-surface border border-border rounded-2xl">
                <p className="text-3xl mb-2">📭</p>
                <p className="text-muted text-sm">No posts yet.</p>
              </div>
            ) : (
              posts.map(post => (
                <PostCard key={post.id} post={post} />
              ))
            )}
          </div>
        )}

        {/* Reviews tab */}
        {activeTab === 'reviews' && (
          <div className="flex flex-col gap-4">

            {/* Rating summary */}
            {reviews.length > 0 && (
              <div className="bg-surface border border-border rounded-2xl p-5">
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <div className="font-display font-black text-5xl text-accent">
                      {profile.avg_rating?.toFixed(1) || '—'}
                    </div>
                    <div className="flex justify-center text-lg mt-1">
                      {renderStars(Math.round(profile.avg_rating || 0))}
                    </div>
                    <div className="text-xs text-muted mt-1">
                      {profile.total_reviews} reviews
                    </div>
                  </div>

                  {/* trust badges */}
                  <div className="flex-1 flex flex-col gap-2">
                    {[
                      'Only verified job reviews',
                      'Both sides rated each other',
                      'Reviews revealed simultaneously',
                    ].map(badge => (
                      <div key={badge} className="flex items-center gap-2 text-xs text-muted">
                        <span className="w-1.5 h-1.5 rounded-full bg-accent2 shrink-0" />
                        {badge}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {reviews.length === 0 ? (
              <div className="text-center py-12 bg-surface border border-border rounded-2xl">
                <p className="text-3xl mb-2">⭐</p>
                <p className="text-muted text-sm">No reviews yet.</p>
              </div>
            ) : (
              reviews.map(review => (
                <div
                  key={review.id}
                  className="bg-surface border border-border rounded-2xl p-5"
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div className="
                      w-9 h-9 rounded-xl shrink-0
                      bg-gradient-to-br from-accent to-danger
                      flex items-center justify-center
                      font-display font-bold text-xs text-white
                    ">
                      {getInitials(review.reviewer?.full_name)}
                    </div>
                    <div className="flex-1">
                      <div className="font-bold text-sm text-white">
                        {review.reviewer?.full_name}
                      </div>
                      <div className="text-xs text-muted">
                        @{review.reviewer?.username}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex text-sm">
                        {renderStars(review.rating)}
                      </div>
                      <div className="text-xs text-muted mt-0.5">
                        {timeAgo(review.created_at)}
                      </div>
                    </div>
                  </div>

                  <div className="
                    text-xs font-medium text-accent2
                    bg-accent2/10 border border-accent2/20
                    px-2 py-1 rounded-lg inline-flex
                    items-center gap-1 mb-3
                  ">
                    ✓ Verified Job
                  </div>

                  <p className="text-sm text-white/70 leading-relaxed">
                    {review.body}
                  </p>

                  <button className="
                    mt-3 text-xs text-muted hover:text-danger
                    transition-colors flex items-center gap-1
                  ">
                    ⚑ Flag review
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {/* Jobs tab */}
{activeTab === 'jobs' && (
  <div className="flex flex-col gap-3">
    {jobs.length === 0 ? (
      <div className="text-center py-12 bg-surface border border-border rounded-2xl">
        <p className="text-3xl mb-2">📋</p>
        <p className="text-muted text-sm">No completed jobs yet.</p>
      </div>
    ) : (
      jobs.map(job => {
        const isFreelancer = job.freelancer_id === profile.id
        const other = isFreelancer ? job.client : job.freelancer
        return (
          <div
            key={job.id}
            className="bg-surface border border-border rounded-2xl p-4"
          >
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="flex-1">
                <h3 className="font-display font-bold text-sm text-white mb-1">
                  {job.title}
                </h3>
                {job.description && (
                  <p className="text-xs text-muted leading-relaxed">
                    {job.description}
                  </p>
                )}
              </div>
              <span className="
                shrink-0 px-2.5 py-1 rounded-lg text-xs
                font-display font-bold
                bg-accent2/10 text-accent2 border border-accent2/20
              ">
                Completed
              </span>
            </div>

            <div className="flex items-center gap-3 mt-3 pt-3 border-t border-border">
              <span className="text-xs text-muted">
                {isFreelancer ? '👤 Client:' : '🛠️ Freelancer:'}
              </span>
              <span className="text-xs text-white font-medium">
                {other?.full_name}
              </span>
              {job.location && (
                <>
                  <span className="text-muted">·</span>
                  <span className="text-xs text-muted">📍 {job.location}</span>
                </>
              )}
              <span className="text-muted">·</span>
              <span className="text-xs text-muted">
                {timeAgo(job.completed_at || job.created_at)}
              </span>
            </div>
          </div>
        )
      })
    )}
  </div>
)}

      </div>
      {showJobRequest && (
  <JobRequestModal
    freelancer={profile}
    onClose={() => setShowJobRequest(false)}
    onSent={(job) => {
      setJobSent(true)
      setShowJobRequest(false)
    }}
  />
)}
    </AppLayout>
  )
}