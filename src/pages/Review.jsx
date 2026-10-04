import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import AppLayout from '../components/layout/AppLayout'

export default function Review() {
  const { jobId } = useParams()
  const { user, loading } = useAuth()
  const navigate = useNavigate()

  const [job, setJob]           = useState(null)
  const [fetching, setFetching] = useState(true)
  const [alreadyReviewed, setAlreadyReviewed] = useState(false)
  const [rating, setRating]     = useState(0)
  const [hovered, setHovered]   = useState(0)
  const [body, setBody]         = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError]       = useState(null)
  const [done, setDone]         = useState(false)

  useEffect(() => {
    if (!loading && !user) navigate('/login')
  }, [user, loading])

  useEffect(() => {
    if (user && jobId) fetchJob()
  }, [user, jobId])

  async function fetchJob() {
    setFetching(true)

    const { data: jobData } = await supabase
      .from('jobs')
      .select(`
        *,
        freelancer:freelancer_id ( id, full_name, username, avg_rating ),
        client:client_id ( id, full_name, username )
      `)
      .eq('id', jobId)
      .single()

    if (!jobData) {
      navigate('/jobs')
      return
    }

    // must be part of this job
    if (jobData.freelancer_id !== user.id && jobData.client_id !== user.id) {
      navigate('/jobs')
      return
    }

    // must be completed
    if (jobData.status !== 'completed') {
      navigate('/jobs')
      return
    }

    setJob(jobData)

    // check if already reviewed
    const { data: existing } = await supabase
      .from('reviews')
      .select('id')
      .eq('job_id', jobId)
      .eq('reviewer_id', user.id)
      .single()

    if (existing) setAlreadyReviewed(true)

    setFetching(false)
  }

  function getInitials(name) {
    if (!name) return '?'
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  // who are we reviewing
  const reviewee = job
    ? (job.freelancer_id === user?.id ? job.client : job.freelancer)
    : null

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)

    if (rating === 0) {
      setError('Please select a star rating.')
      return
    }

    if (body.trim().length < 20) {
      setError('Please write at least 20 characters explaining your experience.')
      return
    }

    setSubmitting(true)

    // insert review
    const { error: reviewError } = await supabase
      .from('reviews')
      .insert({
        job_id:      jobId,
        reviewer_id: user.id,
        reviewee_id: reviewee.id,
        rating,
        body:        body.trim(),
        is_visible:  false,
      })

    if (reviewError) {
      setError(reviewError.message)
      setSubmitting(false)
      return
    }

    // check if both reviews now exist — if so reveal both
    await new Promise(resolve => setTimeout(resolve, 500))

    const { data: bothReviews } = await supabase
      .from('reviews')
      .select('id, reviewee_id, rating')
      .eq('job_id', jobId)

    if (bothReviews && bothReviews.length === 2) {
      // reveal both reviews
      await supabase
        .from('reviews')
        .update({ is_visible: true })
        .eq('job_id', jobId)

      // update ratings for both users
      for (const review of bothReviews) {
        await updateUserRating(review.reviewee_id)
      }

      // notify both parties
      await supabase
        .from('notifications')
        .insert([
          {
            user_id:      job.freelancer_id,
            type:         'review_visible',
            reference_id: jobId,
            body:         'Both reviews are now visible on your profile.',
          },
          {
            user_id:      job.client_id,
            type:         'review_visible',
            reference_id: jobId,
            body:         'Both reviews are now visible on your profile.',
          },
        ])
    } else {
      // notify reviewee that a review is waiting
      await supabase
        .from('notifications')
        .insert({
          user_id:      reviewee.id,
          type:         'review_pending',
          reference_id: jobId,
          body:         `Someone left you a review for "${job.title}". Leave yours to reveal both.`,
        })
    }

    setDone(true)
    setSubmitting(false)
  }

  async function updateUserRating(userId) {
  // small delay to ensure visibility update is committed
  await new Promise(resolve => setTimeout(resolve, 800))

  const { data: userReviews } = await supabase
    .from('reviews')
    .select('rating')
    .eq('reviewee_id', userId)
    .eq('is_visible', true)

  if (!userReviews || userReviews.length === 0) return

  const total = userReviews.length
  const avg   = userReviews.reduce((sum, r) => sum + r.rating, 0) / total

  const { error } = await supabase
    .from('users')
    .update({
      avg_rating:    parseFloat(avg.toFixed(1)),
      total_reviews: total,
      total_jobs:    total,
    })
    .eq('id', userId)
}

  if (loading || fetching) return (
    <div className="min-h-screen bg-bg flex items-center justify-center">
      <p className="text-muted">Loading...</p>
    </div>
  )

  return (
    <AppLayout>
      <div className="max-w-lg mx-auto py-10 px-4">

        {/* Already reviewed */}
        {alreadyReviewed && (
          <div className="
            bg-surface border border-border
            rounded-2xl p-8 text-center
          ">
            <p className="text-4xl mb-3">✅</p>
            <h2 className="font-display font-bold text-xl text-white mb-2">
              Already Reviewed
            </h2>
            <p className="text-muted text-sm mb-6">
              You already submitted a review for this job.
              It will be visible once the other party submits theirs.
            </p>
            <button
              onClick={() => navigate('/jobs')}
              className="
                px-6 py-2.5 bg-accent2 text-black
                font-display font-bold text-sm
                rounded-xl hover:opacity-90 transition-opacity
              "
            >
              Back to Jobs
            </button>
          </div>
        )}

        {/* Success state */}
        {done && (
          <div className="
            bg-surface border border-border
            rounded-2xl p-8 text-center
          ">
            <p className="text-4xl mb-3">🎉</p>
            <h2 className="font-display font-bold text-xl text-white mb-2">
              Review Submitted
            </h2>
            <p className="text-muted text-sm mb-2">
              Your review has been saved.
            </p>
            <p className="
              text-xs text-muted mb-6
              bg-surface2 border border-border
              rounded-xl px-4 py-3 leading-relaxed
            ">
              🔒 It will only become visible once{' '}
              <span className="text-white">{reviewee?.full_name}</span>{' '}
              submits their review too. This keeps both reviews honest.
            </p>
            <button
              onClick={() => navigate('/jobs')}
              className="
                px-6 py-2.5 bg-accent2 text-black
                font-display font-bold text-sm
                rounded-xl hover:opacity-90 transition-opacity
              "
            >
              Back to Jobs
            </button>
          </div>
        )}

        {/* Review form */}
        {!alreadyReviewed && !done && job && (
          <div className="
            bg-surface border border-border
            rounded-2xl overflow-hidden
          ">

            {/* Header */}
            <div className="px-6 py-5 border-b border-border">
              <h1 className="font-display font-bold text-xl text-white mb-1">
                Leave a Review
              </h1>
              <p className="text-sm text-muted">
                For job: <span className="text-white">{job.title}</span>
              </p>
            </div>

            {/* Who you're reviewing */}
            <div className="
              flex items-center gap-3
              px-6 py-4
              bg-surface2 border-b border-border
            ">
              <div className="
                w-10 h-10 rounded-xl shrink-0
                bg-gradient-to-br from-accent to-danger
                flex items-center justify-center
                font-display font-bold text-sm text-white
              ">
                {getInitials(reviewee?.full_name)}
              </div>
              <div>
                <p className="text-sm font-bold text-white">
                  Reviewing: {reviewee?.full_name}
                </p>
                <p className="text-xs text-muted">@{reviewee?.username}</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="px-6 py-5 flex flex-col gap-5">

              {/* Star rating */}
              <div>
                <label className="text-sm text-muted mb-3 block">
                  Star Rating *
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHovered(star)}
                      onMouseLeave={() => setHovered(0)}
                      className="text-4xl transition-transform hover:scale-110"
                    >
                      <span className={
                        star <= (hovered || rating)
                          ? 'text-accent'
                          : 'text-muted'
                      }>
                        ★
                      </span>
                    </button>
                  ))}
                </div>
                {rating > 0 && (
                  <p className="text-xs text-muted mt-2">
                    {['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][rating]}
                  </p>
                )}
              </div>

              {/* Written review */}
              <div>
                <label className="text-sm text-muted mb-1.5 block">
                  Your Review * <span className="text-xs">(min 20 characters)</span>
                </label>
                <textarea
                  value={body}
                  onChange={e => setBody(e.target.value)}
                  placeholder="Describe your experience. Was the work done well? Was communication good? Would you recommend them?"
                  rows={5}
                  className="
                    w-full bg-surface2 border border-border
                    rounded-xl px-4 py-3 text-sm text-white
                    placeholder-muted outline-none
                    focus:border-accent2 transition-colors
                    resize-none
                  "
                />
                <p className={`text-xs mt-1 ${body.length < 20 ? 'text-muted' : 'text-accent2'}`}>
                  {body.length} characters {body.length < 20 && `(${20 - body.length} more needed)`}
                </p>
              </div>

              {/* How it works notice */}
              <div className="
                bg-surface2 border border-border
                rounded-xl px-4 py-3
                flex flex-col gap-2
              ">
                <p className="text-xs font-display font-bold text-white">
                  🛡️ How our review system works
                </p>
                <p className="text-xs text-muted leading-relaxed">
                  🔒 Your review is saved but <strong className="text-white">hidden</strong> until{' '}
                  {reviewee?.full_name} submits theirs too.
                  Both reviews are revealed at the same time — so neither of you
                  can be influenced by the other's rating.
                </p>
                <p className="text-xs text-muted">
                  ✍️ A written reason is required — star ratings alone are not accepted.
                </p>
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

              {/* Submit */}
              <button
                type="submit"
                disabled={submitting || rating === 0 || body.trim().length < 20}
                className="
                  w-full py-3 bg-accent text-black
                  font-display font-bold text-sm
                  rounded-xl hover:opacity-90
                  disabled:opacity-40 disabled:cursor-not-allowed
                  transition-opacity
                "
              >
                {submitting ? 'Submitting...' : 'Submit Review'}
              </button>

            </form>
          </div>
        )}

      </div>
    </AppLayout>
  )
}