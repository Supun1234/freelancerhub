import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import AppLayout from '../components/layout/AppLayout'

export default function EditProfile() {
  const { user, profile, loading } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({
    full_name:    '',
    bio:          '',
    location:     '',
    availability: 'available',
    languages:    [],
  })

  const [skills, setSkills]       = useState([])
  const [skillInput, setSkillInput] = useState('')
  const [saving, setSaving]       = useState(false)
  const [error, setError]         = useState(null)
  const [success, setSuccess]     = useState(false)

  useEffect(() => {
    if (!loading && !user) navigate('/login')
  }, [user, loading])

  useEffect(() => {
    if (profile) {
      setForm({
        full_name:    profile.full_name    || '',
        bio:          profile.bio          || '',
        location:     profile.location     || '',
        availability: profile.availability || 'available',
        languages:    profile.languages    || ['English'],
      })
      fetchSkills()
    }
  }, [profile])

  async function fetchSkills() {
    const { data } = await supabase
      .from('user_skills')
      .select('*')
      .eq('user_id', user.id)
    setSkills(data || [])
  }

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
    setError(null)
    setSuccess(false)
  }

  // skill add
  function handleSkillKeyDown(e) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addSkill()
    }
  }

  async function addSkill() {
    const cleaned = skillInput.trim().replace(/,/g, '')
    if (!cleaned) return
    if (skills.find(s => s.skill_name.toLowerCase() === cleaned.toLowerCase())) {
      setSkillInput('')
      return
    }
    if (skills.length >= 12) return

    const { data } = await supabase
      .from('user_skills')
      .insert({ user_id: user.id, skill_name: cleaned })
      .select()
      .single()

    if (data) {
      setSkills([...skills, data])
      setSkillInput('')
    }
  }

  async function removeSkill(skillId) {
    await supabase
      .from('user_skills')
      .delete()
      .eq('id', skillId)
    setSkills(skills.filter(s => s.id !== skillId))
  }

  async function handleSave(e) {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    if (!form.full_name.trim()) {
      setError('Full name is required.')
      return
    }

    setSaving(true)

    const { error: updateError } = await supabase
      .from('users')
      .update({
        full_name:    form.full_name.trim(),
        bio:          form.bio.trim() || null,
        location:     form.location.trim() || null,
        availability: form.availability,
        languages:    form.languages,
      })
      .eq('id', user.id)

    if (updateError) {
      setError(updateError.message)
      setSaving(false)
      return
    }

    setSaving(false)
    setSuccess(true)

    // go back to profile after short delay
    setTimeout(() => {
      navigate(`/profile/${profile.username}`)
    }, 1200)
  }

  function getInitials(name) {
    if (!name) return '?'
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  const languageOptions = ['English', 'Sinhala', 'Tamil']

  function toggleLanguage(lang) {
    const current = form.languages || []
    if (current.includes(lang)) {
      if (current.length === 1) return // keep at least one
      setForm({ ...form, languages: current.filter(l => l !== lang) })
    } else {
      setForm({ ...form, languages: [...current, lang] })
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-bg flex items-center justify-center">
      <p className="text-muted">Loading...</p>
    </div>
  )

  return (
    <AppLayout>
      <div className="max-w-xl mx-auto py-8 px-4">

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => navigate(`/profile/${profile?.username}`)}
            className="
              w-9 h-9 flex items-center justify-center
              bg-surface border border-border
              rounded-lg text-muted hover:text-white
              transition-colors
            "
          >
            ←
          </button>
          <h1 className="font-display font-bold text-xl text-white">
            Edit Profile
          </h1>
        </div>

        <form onSubmit={handleSave} className="flex flex-col gap-4">

          {/* Avatar preview */}
          <div className="
            bg-surface border border-border
            rounded-2xl p-6 flex items-center gap-4
          ">
            <div className="
              w-16 h-16 rounded-2xl shrink-0
              bg-gradient-to-br from-accent2 to-blue-500
              flex items-center justify-center
              font-display font-bold text-2xl text-white
            ">
              {getInitials(form.full_name || profile?.full_name)}
            </div>
            <div>
              <p className="font-display font-bold text-white text-sm mb-1">
                {form.full_name || profile?.full_name}
              </p>
              <p className="text-xs text-muted">@{profile?.username}</p>
              <p className="text-xs text-muted mt-1">
                Avatar is generated from your initials.
              </p>
            </div>
          </div>

          {/* Basic info */}
          <div className="bg-surface border border-border rounded-2xl p-5 flex flex-col gap-4">
            <p className="font-display font-bold text-sm text-white">
              Basic Info
            </p>

            {/* Full name */}
            <div>
              <label className="text-xs text-muted mb-1.5 block">
                Full Name *
              </label>
              <input
                name="full_name"
                value={form.full_name}
                onChange={handleChange}
                placeholder="Your full name"
                className="
                  w-full bg-surface2 border border-border
                  rounded-xl px-4 py-2.5 text-sm text-white
                  placeholder-muted outline-none
                  focus:border-accent2 transition-colors
                "
              />
            </div>

            {/* Bio */}
            <div>
              <label className="text-xs text-muted mb-1.5 block">
                Bio
              </label>
              <textarea
                name="bio"
                value={form.bio}
                onChange={handleChange}
                placeholder="Tell people about yourself, your experience, what you do..."
                rows={4}
                className="
                  w-full bg-surface2 border border-border
                  rounded-xl px-4 py-2.5 text-sm text-white
                  placeholder-muted outline-none
                  focus:border-accent2 transition-colors
                  resize-none
                "
              />
              <p className="text-xs text-muted mt-1">
                {form.bio.length} / 300 characters
              </p>
            </div>

            {/* Location */}
            <div>
              <label className="text-xs text-muted mb-1.5 block">
                Location
              </label>
              <input
                name="location"
                value={form.location}
                onChange={handleChange}
                placeholder="e.g. Colombo, Kandy, Galle..."
                className="
                  w-full bg-surface2 border border-border
                  rounded-xl px-4 py-2.5 text-sm text-white
                  placeholder-muted outline-none
                  focus:border-accent2 transition-colors
                "
              />
            </div>

          </div>

          {/* Availability */}
          <div className="bg-surface border border-border rounded-2xl p-5">
            <p className="font-display font-bold text-sm text-white mb-3">
              Availability
            </p>
            <div className="flex gap-2">
              {[
                { value: 'available', label: '🟢 Available', desc: 'Open for new work' },
                { value: 'busy',      label: '🔴 Busy',      desc: 'Not taking new work' },
              ].map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setForm({ ...form, availability: opt.value })}
                  className={`
                    flex-1 py-3 px-4 rounded-xl
                    border transition-all text-left
                    ${form.availability === opt.value
                      ? 'bg-accent2/10 border-accent2/30'
                      : 'bg-surface2 border-border hover:border-muted'
                    }
                  `}
                >
                  <p className={`
                    text-sm font-display font-bold
                    ${form.availability === opt.value ? 'text-accent2' : 'text-white'}
                  `}>
                    {opt.label}
                  </p>
                  <p className="text-xs text-muted mt-0.5">{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Languages */}
          <div className="bg-surface border border-border rounded-2xl p-5">
            <p className="font-display font-bold text-sm text-white mb-3">
              Languages
            </p>
            <div className="flex gap-2">
              {languageOptions.map(lang => (
                <button
                  key={lang}
                  type="button"
                  onClick={() => toggleLanguage(lang)}
                  className={`
                    flex-1 py-2.5 rounded-xl
                    border transition-all text-sm font-medium
                    ${form.languages?.includes(lang)
                      ? 'bg-accent2/10 border-accent2/30 text-accent2'
                      : 'bg-surface2 border-border text-muted hover:text-white'
                    }
                  `}
                >
                  {lang}
                </button>
              ))}
            </div>
          </div>

          {/* Skills */}
          <div className="bg-surface border border-border rounded-2xl p-5">
            <p className="font-display font-bold text-sm text-white mb-1">
              Skills
            </p>
            <p className="text-xs text-muted mb-3">
              Add up to 12 skills. Press Enter or comma to add.
            </p>

            {/* Skill tags */}
            <div className="
              flex flex-wrap gap-1.5 items-center
              bg-surface2 border border-border
              rounded-xl px-3 py-2 mb-2
              focus-within:border-accent2 transition-colors
              min-h-12
            ">
              {skills.map(skill => (
                <span
                  key={skill.id}
                  className="
                    flex items-center gap-1
                    px-2.5 py-1 rounded-full
                    bg-surface border border-border
                    text-xs text-white
                  "
                >
                  {skill.skill_name}
                  <button
                    type="button"
                    onClick={() => removeSkill(skill.id)}
                    className="text-muted hover:text-danger ml-1 transition-colors"
                  >
                    ×
                  </button>
                </span>
              ))}
              {skills.length < 12 && (
                <input
                  value={skillInput}
                  onChange={e => setSkillInput(e.target.value)}
                  onKeyDown={handleSkillKeyDown}
                  onBlur={addSkill}
                  placeholder={skills.length === 0 ? 'AutoCAD, React, Plumbing...' : ''}
                  className="
                    flex-1 min-w-24 bg-transparent
                    text-sm text-white placeholder-muted
                    outline-none
                  "
                />
              )}
            </div>
            <p className="text-xs text-muted">
              {skills.length} / 12 skills added
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

          {/* Success */}
          {success && (
            <div className="
              bg-accent2/10 border border-accent2/30
              text-accent2 text-sm rounded-xl px-4 py-3
            ">
              ✓ Profile updated! Redirecting...
            </div>
          )}

          {/* Save button */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => navigate(`/profile/${profile?.username}`)}
              className="
                flex-1 py-3 bg-surface2
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
              disabled={saving}
              className="
                flex-1 py-3 bg-accent2 text-black
                font-display font-bold text-sm
                rounded-xl hover:opacity-90
                disabled:opacity-40 disabled:cursor-not-allowed
                transition-opacity
              "
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>

        </form>
      </div>
    </AppLayout>
  )
}