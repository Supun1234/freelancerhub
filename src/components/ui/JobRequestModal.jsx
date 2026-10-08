import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'

export default function JobRequestModal({ freelancer, onClose, onSent }) {
  const { user } = useAuth()

  const [form, setForm] = useState({
    title:       '',
    description: '',
    location:    '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState(null)

  function getInitials(name) {
    if (!name) return '?'
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
    setError(null)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)

    if (!form.title.trim()) {
      setError('Please describe the job title.')
      return
    }
    if (!form.description.trim()) {
      setError('Please describe what you need.')
      return
    }

    setLoading(true)

    // create job
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .insert({
        freelancer_id: freelancer.id,
        client_id:     user.id,
        title:         form.title.trim(),
        description:   form.description.trim(),
        location:      form.location.trim() || null,
        status:        'pending',
      })
      .select()
      .single()

    if (jobError) {
      setError(jobError.message)
      setLoading(false)
      return
    }

    // send notification to freelancer
    // get sender name
const { data: sender } = await supabase
  .from('users')
  .select('full_name')
  .eq('id', user.id)
  .single()

await supabase
  .from('notifications')
  .insert({
    user_id:      freelancer.id,
    type:         'job_request',
    reference_id: job.id,
    body:         `${sender?.full_name} sent you a job request — "${form.title}"`,
  })

    setLoading(false)
    onSent(job)
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="
        fixed z-50 inset-0
        flex items-center justify-center
        px-4
      ">
        <div className="
          w-full max-w-lg
          bg-surface border border-border
          rounded-2xl shadow-2xl
          overflow-hidden
        ">

          {/* Header */}
          <div className="
            flex items-center justify-between
            px-6 py-4
            border-b border-border
          ">
            <h2 className="font-display font-bold text-lg text-white">
              Send Job Request
            </h2>
            <button
              onClick={onClose}
              className="
                w-8 h-8 flex items-center justify-center
                text-muted hover:text-white
                bg-surface2 rounded-lg transition-colors
              "
            >
              ✕
            </button>
          </div>

          {/* Freelancer info */}
          <div className="
            flex items-center gap-3
            px-6 py-4
            bg-surface2 border-b border-border
          ">
            <div className="
              w-10 h-10 rounded-xl shrink-0
              bg-gradient-to-br from-accent2 to-blue-500
              flex items-center justify-center
              font-display font-bold text-sm text-white
            ">
              {getInitials(freelancer.full_name)}
            </div>
            <div>
              <p className="font-bold text-sm text-white">
                {freelancer.full_name}
              </p>
              <p className="text-xs text-muted">
                @{freelancer.username}
                {freelancer.location && ` · 📍 ${freelancer.location}`}
              </p>
            </div>
            {freelancer.avg_rating > 0 && (
              <div className="ml-auto text-right">
                <div className="text-accent font-display font-bold text-sm">
                  ★ {freelancer.avg_rating?.toFixed(1)}
                </div>
                <div className="text-xs text-muted">
                  {freelancer.total_reviews} reviews
                </div>
              </div>
            )}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-6 py-5 flex flex-col gap-4">

            {/* Job title */}
            <div>
              <label className="text-sm text-muted mb-1.5 block">
                What do you need? *
              </label>
              <input
                name="title"
                value={form.title}
                onChange={handleChange}
                placeholder="e.g. House rewiring, Floor plan drawing, Website bug fix"
                className="
                  w-full bg-surface2 border border-border
                  rounded-xl px-4 py-2.5 text-sm text-white
                  placeholder-muted outline-none
                  focus:border-accent2 transition-colors
                "
              />
            </div>

            {/* Description */}
            <div>
              <label className="text-sm text-muted mb-1.5 block">
                Describe the job in detail *
              </label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Explain the scope of work, any specific requirements, timeline expectations..."
                rows={4}
                className="
                  w-full bg-surface2 border border-border
                  rounded-xl px-4 py-2.5 text-sm text-white
                  placeholder-muted outline-none
                  focus:border-accent2 transition-colors
                  resize-none
                "
              />
            </div>

            {/* Location */}
            <div>
              <label className="text-sm text-muted mb-1.5 block">
                Location <span className="text-muted">(optional)</span>
              </label>
              <input
                name="location"
                value={form.location}
                onChange={handleChange}
                placeholder="Where is the work? e.g. Colombo 07, Kandy, Remote"
                className="
                  w-full bg-surface2 border border-border
                  rounded-xl px-4 py-2.5 text-sm text-white
                  placeholder-muted outline-none
                  focus:border-accent2 transition-colors
                "
              />
            </div>

            {/* Notice */}
            <div className="
              bg-accent/5 border border-accent/20
              rounded-xl px-4 py-3
              text-xs text-muted leading-relaxed
            ">
              💡 Payment is handled directly between you and the freelancer.
              FreelancerHub only facilitates the connection.
              After the job is complete, both of you can leave a review.
            </div>

            {/* Error */}
            {error && (
              <div className="
                bg-danger/10 border border-danger/30
                text-danger text-sm rounded-xl px-4 py-3
              ">
                {error}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="
                  flex-1 py-2.5 bg-surface2
                  border border-border text-white
                  font-display font-bold text-sm
                  rounded-xl hover:border-muted
                  transition-colors
                "
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="
                  flex-1 py-2.5 bg-accent2 text-black
                  font-display font-bold text-sm
                  rounded-xl hover:opacity-90
                  disabled:opacity-40 disabled:cursor-not-allowed
                  transition-opacity
                "
              >
                {loading ? 'Sending...' : 'Send Request'}
              </button>
            </div>

          </form>
        </div>
      </div>
    </>
  )
}