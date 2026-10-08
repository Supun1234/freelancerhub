import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'

export default function PostComposer({ circles, onPostCreated }) {
  const { user, profile } = useAuth()

  const [open, setOpen]           = useState(false)
  const [type, setType]           = useState('offering')
  const [title, setTitle]         = useState('')
  const [body, setBody]           = useState('')
  const [location, setLocation]   = useState(profile?.location || '')
  const [circleId, setCircleId]   = useState('')
  const [tagInput, setTagInput]   = useState('')
  const [tags, setTags]           = useState([])
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState(null)

  function getInitials(name) {
    if (!name) return '?'
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  // post type options
const types = [
  { value: 'offering', label: '🛠️ Offering', desc: 'I have a skill to offer' },
  { value: 'seeking',  label: '🔍 Seeking',  desc: 'I need a service'        },
]

  // add tag on Enter or comma
  function handleTagKeyDown(e) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addTag()
    }
  }

  function addTag() {
    const cleaned = tagInput.trim().replace(/,/g, '')
    if (cleaned && !tags.includes(cleaned) && tags.length < 6) {
      setTags([...tags, cleaned])
      setTagInput('')
    }
  }

  function removeTag(tag) {
    setTags(tags.filter(t => t !== tag))
  }

  function reset() {
    setOpen(false)
    setType('offering')
    setTitle('')
    setBody('')
    setLocation(profile?.location || '')
    setCircleId('')
    setTagInput('')
    setTags([])
    setError(null)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)

    if (!body.trim()) {
      setError('Please write something.')
      return
    }

    if (!circleId) {
      setError('Please select a circle.')
      return
    }

    setLoading(true)

    const { data, error: insertError } = await supabase
      .from('posts')
      .insert({
        user_id:   user.id,
        circle_id: circleId,
        type,
        title:     title.trim() || null,
        body:      body.trim(),
        location:  location.trim() || null,
        tags:      tags.length > 0 ? tags : null,
      })
      .select(`
        *,
        users ( full_name, username ),
        circles ( name, color, icon )
      `)
      .single()

    if (insertError) {
      setError(insertError.message)
      setLoading(false)
      return
    }

    // update circle post count
    await supabase.rpc('increment_post_count', { circle_id: circleId })

    onPostCreated(data)
    reset()
    setLoading(false)
  }

  return (
    <div className="bg-surface border border-border rounded-2xl p-5 mb-4">

      {/* Collapsed state — just a prompt */}
      {!open ? (
        <div
          className="flex items-center gap-3 cursor-pointer"
          onClick={() => setOpen(true)}
        >
          {/* avatar */}
          <div className="
            w-10 h-10 rounded-xl shrink-0
            bg-gradient-to-br from-accent to-danger
            flex items-center justify-center
            font-display font-bold text-sm text-white
          ">
            {getInitials(profile?.full_name)}
          </div>

          {/* prompt */}
          <div className="
            flex-1 bg-surface2 border border-border
            rounded-xl px-4 py-2.5 text-sm text-muted
            hover:border-muted/50 transition-colors
          ">
            What are you offering or looking for today?
          </div>
        </div>

      ) : (

        /* Expanded state — full form */
        <form onSubmit={handleSubmit}>

          {/* Post type selector */}
          <div className="flex gap-2 mb-4">
            {types.map(t => (
              <button
                key={t.value}
                type="button"
                onClick={() => setType(t.value)}
                className={`
                  flex-1 py-2 px-3 rounded-xl
                  text-xs font-display font-bold
                  border transition-all
                  ${type === t.value
                    ? 'bg-accent2/10 border-accent2/30 text-accent2'
                    : 'bg-surface2 border-border text-muted hover:text-white'
                  }
                `}
              >
                {t.label}
                <span className="block font-sans font-normal text-xs mt-0.5 opacity-70">
                  {t.desc}
                </span>
              </button>
            ))}
          </div>

          {/* Title */}
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Title (optional)"
            className="
              w-full bg-surface2 border border-border
              rounded-xl px-4 py-2.5 text-sm text-white
              placeholder-muted outline-none mb-3
              focus:border-accent2 transition-colors
            "
          />

          {/* Body */}
          <textarea
            value={body}
            onChange={e => setBody(e.target.value)}
            placeholder={
              type === 'offering'
                ? 'Describe your service, experience, availability...'
                : type === 'seeking'
                ? 'Describe what you need, location, budget range...'
                : 'Ask your question...'
            }
            rows={4}
            className="
              w-full bg-surface2 border border-border
              rounded-xl px-4 py-2.5 text-sm text-white
              placeholder-muted outline-none mb-3
              focus:border-accent2 transition-colors
              resize-none
            "
          />

          {/* Circle + Location row */}
          <div className="flex gap-2 mb-3">

            {/* Circle selector */}
            <select
              value={circleId}
              onChange={e => setCircleId(e.target.value)}
              className="
                flex-1 bg-surface2 border border-border
                rounded-xl px-4 py-2.5 text-sm text-white
                outline-none focus:border-accent2
                transition-colors cursor-pointer
              "
            >
              <option value="" disabled>Select a circle *</option>
              {circles.map(c => (
                <option key={c.id} value={c.id}>
                  {c.icon} {c.name}
                </option>
              ))}
            </select>

            {/* Location */}
            <input
              value={location}
              onChange={e => setLocation(e.target.value)}
              placeholder="📍 Location"
              className="
                flex-1 bg-surface2 border border-border
                rounded-xl px-4 py-2.5 text-sm text-white
                placeholder-muted outline-none
                focus:border-accent2 transition-colors
              "
            />
          </div>

          {/* Tags */}
          <div className="mb-4">
            <div className="
              flex flex-wrap gap-1.5 items-center
              bg-surface2 border border-border
              rounded-xl px-3 py-2
              focus-within:border-accent2 transition-colors
            ">
              {tags.map(tag => (
                <span
                  key={tag}
                  className="
                    flex items-center gap-1
                    px-2.5 py-0.5 rounded-full
                    bg-surface border border-border
                    text-xs text-white
                  "
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="text-muted hover:text-danger ml-1"
                  >
                    ×
                  </button>
                </span>
              ))}
              <input
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={handleTagKeyDown}
                onBlur={addTag}
                placeholder={tags.length === 0 ? 'Add tags — press Enter (AutoCAD, Colombo...)' : ''}
                className="
                  flex-1 min-w-32 bg-transparent
                  text-sm text-white placeholder-muted
                  outline-none
                "
              />
            </div>
            <p className="text-xs text-muted mt-1 px-1">
              Press Enter or comma to add a tag. Max 6 tags.
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="
              bg-danger/10 border border-danger/30
              text-danger text-sm rounded-xl
              px-4 py-3 mb-3
            ">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={reset}
              className="
                px-4 py-2 text-sm text-muted
                hover:text-white transition-colors
              "
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading || !body.trim() || !circleId}
              className="
                px-6 py-2 bg-accent text-black
                font-display font-bold text-sm
                rounded-xl hover:opacity-90
                disabled:opacity-40 disabled:cursor-not-allowed
                transition-opacity
              "
            >
              {loading ? 'Posting...' : 'Post'}
            </button>
          </div>

        </form>
      )}
    </div>
  )
}