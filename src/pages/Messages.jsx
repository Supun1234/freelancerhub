import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import AppLayout from '../components/layout/AppLayout'

export default function Messages() {
  const { user, profile, loading } = useAuth()
  const navigate = useNavigate()

  const [jobs, setJobs]               = useState([])
  const [selectedJob, setSelectedJob] = useState(null)
  const [messages, setMessages]       = useState([])
  const [newMessage, setNewMessage]   = useState('')
  const [fetching, setFetching]       = useState(true)
  const [sending, setSending]         = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    if (!loading && !user) navigate('/login')
  }, [user, loading])

  useEffect(() => {
    if (user) fetchJobs()
  }, [user])

  useEffect(() => {
    if (selectedJob) {
      fetchMessages(selectedJob.id)
      subscribeToMessages(selectedJob.id)
    }
  }, [selectedJob])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function fetchJobs() {
    setFetching(true)
    const { data } = await supabase
      .from('jobs')
      .select(`
        *,
        freelancer:freelancer_id ( id, full_name, username ),
        client:client_id ( id, full_name, username )
      `)
      .or(`freelancer_id.eq.${user.id},client_id.eq.${user.id}`)
      .in('status', ['pending', 'confirmed', 'completed'])
      .order('created_at', { ascending: false })
    setJobs(data || [])
    setFetching(false)
  }

  async function fetchMessages(jobId) {
    const { data } = await supabase
      .from('messages')
      .select(`
        *,
        sender:sender_id ( full_name, username )
      `)
      .eq('job_id', jobId)
      .order('created_at', { ascending: true })
    setMessages(data || [])

    // mark messages as read
    await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('job_id', jobId)
      .eq('receiver_id', user.id)
      .eq('is_read', false)
  }

  function subscribeToMessages(jobId) {
    const channel = supabase
      .channel(`messages-${jobId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `job_id=eq.${jobId}`,
      }, payload => {
        setMessages(prev => [...prev, payload.new])
      })
      .subscribe()

    return () => supabase.removeChannel(channel)
  }

  async function handleSend(e) {
    e.preventDefault()
    if (!newMessage.trim() || !selectedJob) return

    setSending(true)

    const isFreelancer = selectedJob.freelancer_id === user.id
    const receiverId   = isFreelancer
      ? selectedJob.client_id
      : selectedJob.freelancer_id

    await supabase
      .from('messages')
      .insert({
        job_id:      selectedJob.id,
        sender_id:   user.id,
        receiver_id: receiverId,
        body:        newMessage.trim(),
      })

    setNewMessage('')
    setSending(false)
  }

  function getInitials(name) {
    if (!name) return '?'
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  function timeAgo(dateStr) {
    if (!dateStr) return ''
    const diff = Math.floor((new Date() - new Date(dateStr)) / 1000)
    if (diff < 60)    return 'just now'
    if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    return `${Math.floor(diff / 86400)}d ago`
  }

  if (loading) return (
    <div className="min-h-screen bg-bg flex items-center justify-center">
      <p className="text-muted">Loading...</p>
    </div>
  )

  return (
    <AppLayout>
      <div className="flex h-[calc(100vh-56px)]">

        {/* Jobs list — left panel */}
        <div className="
          w-72 shrink-0
          border-r border-border
          overflow-y-auto
          flex flex-col
        ">
          <div className="p-4 border-b border-border">
            <h1 className="font-display font-bold text-base text-white">
              Messages
            </h1>
            <p className="text-xs text-muted mt-0.5">
              Messages are tied to confirmed jobs
            </p>
          </div>

          {fetching ? (
            <div className="p-4 flex flex-col gap-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex gap-3 animate-pulse">
                  <div className="w-10 h-10 bg-surface2 rounded-xl shrink-0" />
                  <div className="flex-1">
                    <div className="h-3 bg-surface2 rounded w-3/4 mb-2" />
                    <div className="h-2 bg-surface2 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : jobs.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
              <p className="text-3xl mb-2">💬</p>
              <p className="text-sm font-display font-bold text-white mb-1">
                No messages yet
              </p>
              <p className="text-xs text-muted">
                Messages open when a job is confirmed.
              </p>
            </div>
          ) : (
            <div className="flex flex-col">
              {jobs.map(job => {
                const isFreelancer = job.freelancer_id === user.id
                const other = isFreelancer ? job.client : job.freelancer
                const isSelected = selectedJob?.id === job.id

                return (
                  <div
                    key={job.id}
                    onClick={() => setSelectedJob(job)}
                    className={`
                      flex items-start gap-3 p-4
                      cursor-pointer transition-colors
                      border-b border-border
                      ${isSelected
                        ? 'bg-accent2/10 border-l-2 border-l-accent2'
                        : 'hover:bg-surface2'
                      }
                    `}
                  >
                    <div className="
                      w-10 h-10 rounded-xl shrink-0
                      bg-gradient-to-br from-accent to-danger
                      flex items-center justify-center
                      font-display font-bold text-sm text-white
                    ">
                      {getInitials(other?.full_name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">
                        {other?.full_name}
                      </p>
                      <p className="text-xs text-muted truncate mt-0.5">
                        {job.title}
                      </p>
                      <span className={`
  text-xs font-display font-bold
  ${job.status === 'completed'
    ? 'text-accent2'
    : job.status === 'pending'
    ? 'text-accent'
    : 'text-blue-400'
  }
`}>
  {job.status === 'completed'
    ? '✓ Completed'
    : job.status === 'pending'
    ? '● Pending'
    : '● Active'
  }
</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Chat panel — right */}
        {!selectedJob ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <p className="text-5xl mb-4">💬</p>
            <p className="font-display font-bold text-xl text-white mb-2">
              Select a conversation
            </p>
            <p className="text-sm text-muted">
              Choose a job from the left to start messaging.
            </p>
          </div>
        ) : (
          <div className="flex-1 flex flex-col">

            {/* Chat header */}
            {(() => {
              const isFreelancer = selectedJob.freelancer_id === user.id
              const other = isFreelancer ? selectedJob.client : selectedJob.freelancer
              return (
                <div className="
                  flex items-center gap-3
                  px-5 py-3
                  border-b border-border
                  bg-surface
                ">
                  <div className="
                    w-9 h-9 rounded-xl shrink-0
                    bg-gradient-to-br from-accent to-danger
                    flex items-center justify-center
                    font-display font-bold text-sm text-white
                  ">
                    {getInitials(other?.full_name)}
                  </div>
                  <div>
                    <p className="font-display font-bold text-sm text-white">
                      {other?.full_name}
                    </p>
                    <p className="text-xs text-muted">
                      Re: {selectedJob.title}
                    </p>
                  </div>
                  <button
                    onClick={() => navigate('/jobs')}
                    className="
                      ml-auto px-3 py-1.5
                      bg-surface2 border border-border
                      text-xs text-muted hover:text-white
                      rounded-lg transition-colors
                    "
                  >
                    View Job →
                  </button>
                </div>
              )
            })()}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-3">
              {messages.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-muted text-sm">
                    No messages yet. Say hello! 👋
                  </p>
                </div>
              )}

              {messages.map((msg, i) => {
                const isMine = msg.sender_id === user.id
                const showTime = i === 0 ||
                  new Date(msg.created_at) - new Date(messages[i-1].created_at) > 300000

                return (
                  <div key={msg.id}>
                    {showTime && (
                      <p className="text-center text-xs text-muted my-2">
                        {timeAgo(msg.created_at)}
                      </p>
                    )}
                    <div className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                      <div className={`
                        max-w-xs lg:max-w-md px-4 py-2.5
                        rounded-2xl text-sm leading-relaxed
                        ${isMine
                          ? 'bg-accent2 text-black rounded-br-sm'
                          : 'bg-surface2 border border-border text-white rounded-bl-sm'
                        }
                      `}>
                        {msg.body}
                      </div>
                    </div>
                  </div>
                )
              })}
              <div ref={bottomRef} />
            </div>

            {/* Message input */}
            <div className="p-4 border-t border-border">
              <form onSubmit={handleSend} className="flex gap-2">
                <input
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="
                    flex-1 bg-surface2 border border-border
                    rounded-xl px-4 py-2.5 text-sm text-white
                    placeholder-muted outline-none
                    focus:border-accent2 transition-colors
                  "
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim() || sending}
                  className="
                    px-5 py-2.5 bg-accent2 text-black
                    font-display font-bold text-sm
                    rounded-xl hover:opacity-90
                    disabled:opacity-40 disabled:cursor-not-allowed
                    transition-opacity
                  "
                >
                  Send
                </button>
              </form>
            </div>

          </div>
        )}

      </div>
    </AppLayout>
  )
}