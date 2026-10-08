import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import AppLayout from '../components/layout/AppLayout'

export default function Jobs() {
  const { user, loading } = useAuth()
  const navigate = useNavigate()

  const [jobs, setJobs]         = useState([])
  const [fetching, setFetching] = useState(true)
  const [activeTab, setActiveTab] = useState('all')

  useEffect(() => {
    if (!loading && !user) navigate('/login')
  }, [user, loading])

  useEffect(() => {
    if (user) fetchJobs()
  }, [user])

  async function fetchJobs() {
    setFetching(true)

    const { data } = await supabase
      .from('jobs')
      .select(`
        *,
        freelancer:freelancer_id ( id, full_name, username, avg_rating ),
        client:client_id ( id, full_name, username )
      `)
      .or(`freelancer_id.eq.${user.id},client_id.eq.${user.id}`)
      .order('created_at', { ascending: false })

    setJobs(data || [])
    setFetching(false)
  }

  async function handleAccept(jobId) {
    await supabase
      .from('jobs')
      .update({ status: 'confirmed', freelancer_confirmed: true })
      .eq('id', jobId)

    // notify client
    const job = jobs.find(j => j.id === jobId)
const { data: sender } = await supabase
  .from('users')
  .select('full_name')
  .eq('id', user.id)
  .single()

await supabase
  .from('notifications')
  .insert({
    user_id:      job.client.id,
    type:         'job_accepted',
    reference_id: jobId,
    body:         `${sender?.full_name} accepted your job request — "${job.title}"`,
  })

    fetchJobs()
  }

  async function handleDecline(jobId) {
    await supabase
      .from('jobs')
      .update({ status: 'cancelled' })
      .eq('id', jobId)

    fetchJobs()
  }

  async function handleMarkComplete(jobId) {
    const job = jobs.find(j => j.id === jobId)
    const isFreelancer = job.freelancer_id === user.id

    const update = isFreelancer
      ? { freelancer_confirmed: true }
      : { client_confirmed: true }

    // check if both sides confirmed
    const bothConfirmed = isFreelancer
      ? job.client_confirmed
      : job.freelancer_confirmed

    if (bothConfirmed) {
      update.status       = 'completed'
      update.completed_at = new Date().toISOString()
    }

    await supabase
      .from('jobs')
      .update(update)
      .eq('id', jobId)

    // notify other party
    const notifyId = isFreelancer ? job.client.id : job.freelancer.id
    const { data: sender } = await supabase
  .from('users')
  .select('full_name')
  .eq('id', user.id)
  .single()

await supabase
  .from('notifications')
  .insert({
    user_id:      notifyId,
    type:         'job_completed',
    reference_id: jobId,
    body:         bothConfirmed
      ? `Job "${job.title}" is complete — leave a review for ${sender?.full_name}!`
      : `${sender?.full_name} marked "${job.title}" as done. Please confirm.`,
  })

    fetchJobs()
  }

  function getInitials(name) {
    if (!name) return '?'
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  function timeAgo(dateStr) {
    if (!dateStr) return ''
    const diff = Math.floor((new Date() - new Date(dateStr)) / 1000)
    if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    return `${Math.floor(diff / 86400)}d ago`
  }

  const statusConfig = {
    pending:   { label: 'Pending',    bg: 'bg-accent/10',  text: 'text-accent'  },
    confirmed: { label: 'Confirmed',  bg: 'bg-blue-500/10', text: 'text-blue-400' },
    completed: { label: 'Completed',  bg: 'bg-accent2/10', text: 'text-accent2' },
    disputed:  { label: 'Disputed',   bg: 'bg-danger/10',  text: 'text-danger'  },
    cancelled: { label: 'Cancelled',  bg: 'bg-muted/10',   text: 'text-muted'   },
  }

  const filteredJobs = jobs.filter(job => {
    if (activeTab === 'all')       return true
    if (activeTab === 'incoming')  return job.freelancer_id === user.id && job.status === 'pending'
    if (activeTab === 'active')    return job.status === 'confirmed'
    if (activeTab === 'completed') return job.status === 'completed'
    return true
  })

  if (loading) return (
    <div className="min-h-screen bg-bg flex items-center justify-center">
      <p className="text-muted">Loading...</p>
    </div>
  )

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto py-6 px-4">

        <h1 className="font-display font-bold text-xl text-white mb-4">
          My Jobs
        </h1>

        {/* Tabs */}
        <div className="
          flex gap-1 bg-surface border border-border
          rounded-xl p-1 mb-4
        ">
          {[
            { label: 'All',       value: 'all'       },
            { label: 'Incoming',  value: 'incoming'  },
            { label: 'Active',    value: 'active'    },
            { label: 'Completed', value: 'completed' },
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

        {/* Job list */}
        {fetching ? (
          <p className="text-muted text-sm text-center py-12">Loading jobs...</p>
        ) : filteredJobs.length === 0 ? (
          <div className="text-center py-16 bg-surface border border-border rounded-2xl">
            <p className="text-4xl mb-3">📋</p>
            <p className="font-display font-bold text-white mb-1">No jobs here</p>
            <p className="text-sm text-muted">
              {activeTab === 'incoming'
                ? 'No pending job requests.'
                : 'Nothing to show here yet.'
              }
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {filteredJobs.map(job => {
              const isFreelancer = job.freelancer_id === user.id
              const other = isFreelancer ? job.client : job.freelancer
              const status = statusConfig[job.status] || statusConfig.pending

              return (
                <div
                  key={job.id}
                  className="bg-surface border border-border rounded-2xl p-5"
                >

                  {/* Job header */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <h3 className="font-display font-bold text-sm text-white mb-1">
                        {job.title}
                      </h3>
                      <p className="text-xs text-muted">
                        {isFreelancer ? '👤 From client:' : '🛠️ Freelancer:'}{' '}
                        <span className="text-white">{other?.full_name}</span>
                        {' · '}{timeAgo(job.created_at)}
                      </p>
                    </div>
                    <span className={`
                      shrink-0 px-2.5 py-1 rounded-lg
                      text-xs font-display font-bold
                      ${status.bg} ${status.text}
                    `}>
                      {status.label}
                    </span>
                  </div>

                  {/* Description */}
                  {job.description && (
                    <p className="text-sm text-white/60 leading-relaxed mb-3">
                      {job.description}
                    </p>
                  )}

                  {/* Location */}
                  {job.location && (
                    <p className="text-xs text-muted mb-3">
                      📍 {job.location}
                    </p>
                  )}

                  {/* Other party */}
                  <div className="
                    flex items-center gap-2.5
                    bg-surface2 border border-border
                    rounded-xl px-3 py-2 mb-3
                  ">
                    <div className="
                      w-7 h-7 rounded-lg shrink-0
                      bg-gradient-to-br from-accent to-danger
                      flex items-center justify-center
                      font-display font-bold text-xs text-white
                    ">
                      {getInitials(other?.full_name)}
                    </div>
                    <div>
                      <p className="text-xs font-medium text-white">
                        {other?.full_name}
                      </p>
                      <p className="text-xs text-muted">
                        @{other?.username}
                        {!isFreelancer && other?.avg_rating > 0 &&
                          ` · ★ ${other.avg_rating?.toFixed(1)}`
                        }
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">

                    {/* Freelancer sees Accept/Decline on pending */}
                    {isFreelancer && job.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleDecline(job.id)}
                          className="
                            flex-1 py-2 bg-surface2 border border-border
                            text-muted font-display font-bold text-xs
                            rounded-xl hover:border-danger hover:text-danger
                            transition-colors
                          "
                        >
                          Decline
                        </button>
                        <button
                          onClick={() => handleAccept(job.id)}
                          className="
                            flex-1 py-2 bg-accent2 text-black
                            font-display font-bold text-xs
                            rounded-xl hover:opacity-90 transition-opacity
                          "
                        >
                          Accept
                        </button>
                      </>
                    )}

                    {/* Both see Mark Complete on confirmed */}
                    {job.status === 'confirmed' && (
                      <>
                        {/* check if this user already confirmed */}
                        {((isFreelancer && !job.freelancer_confirmed) ||
                          (!isFreelancer && !job.client_confirmed)) ? (
                          <button
                            onClick={() => handleMarkComplete(job.id)}
                            className="
                              flex-1 py-2 bg-accent2 text-black
                              font-display font-bold text-xs
                              rounded-xl hover:opacity-90 transition-opacity
                            "
                          >
                            ✓ Mark as Complete
                          </button>
                        ) : (
                          <div className="
                            flex-1 py-2 text-center
                            text-xs text-muted
                            bg-surface2 border border-border rounded-xl
                          ">
                            Waiting for other party to confirm...
                          </div>
                        )}
                      </>
                    )}

                    {/* Completed — leave review */}
                    {job.status === 'completed' && (
                      <button
                        onClick={() => navigate(`/review/${job.id}`)}
                        className="
                          flex-1 py-2 bg-accent text-black
                          font-display font-bold text-xs
                          rounded-xl hover:opacity-90 transition-opacity
                        "
                      >
                        ⭐ Leave Review
                      </button>
                    )}

                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </AppLayout>
  )
}