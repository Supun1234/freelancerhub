import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useNavigate, Link } from 'react-router-dom'

export default function Register() {
  const navigate = useNavigate()

  const [form, setForm] = useState({
    full_name: '',
    username:  '',
    email:     '',
    password:  '',
    location:  '',
  })

  const [error,   setError]   = useState(null)
  const [loading, setLoading] = useState(false)

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
    setError(null)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // basic validation
    if (!form.full_name || !form.username || !form.email || !form.password) {
      setError('Please fill in all required fields.')
      setLoading(false)
      return
    }

    if (form.password.length < 6) {
      setError('Password must be at least 6 characters.')
      setLoading(false)
      return
    }

    // check username is not taken
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('username', form.username.toLowerCase())
      .single()

    if (existing) {
      setError('That username is already taken.')
      setLoading(false)
      return
    }

    // create auth user
    const { data, error: authError } = await supabase.auth.signUp({
      email:    form.email,
      password: form.password,
    })

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    // create profile in public.users
    const { error: profileError } = await supabase
      .from('users')
      .insert({
        id:        data.user.id,
        full_name: form.full_name,
        username:  form.username.toLowerCase(),
        location:  form.location,
      })

    if (profileError) {
      setError(profileError.message)
      setLoading(false)
      return
    }

    // success — go to feed
    navigate('/feed')
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-4">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="font-display font-black text-3xl">
            <span className="text-accent">Freelancer</span>
            <span className="text-accent2">Hub</span>
          </h1>
          <p className="text-muted text-sm mt-2">
            The professional community Sri Lankan freelancers never had.
          </p>
        </div>

        {/* Card */}
        <div className="bg-surface border border-border rounded-2xl p-8">
          <h2 className="font-display font-bold text-xl mb-6">Create your account</h2>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">

            {/* Full Name */}
            <div>
              <label className="text-sm text-muted mb-1 block">Full Name *</label>
              <input
                name="full_name"
                value={form.full_name}
                onChange={handleChange}
                placeholder="Rajith Kumara"
                className="w-full bg-surface2 border border-border rounded-lg
                           px-4 py-2.5 text-sm text-white placeholder-muted
                           outline-none focus:border-accent2 transition-colors"
              />
            </div>

            {/* Username */}
            <div>
              <label className="text-sm text-muted mb-1 block">Username *</label>
              <input
                name="username"
                value={form.username}
                onChange={handleChange}
                placeholder="rajith_cad"
                className="w-full bg-surface2 border border-border rounded-lg
                           px-4 py-2.5 text-sm text-white placeholder-muted
                           outline-none focus:border-accent2 transition-colors"
              />
              <p className="text-xs text-muted mt-1">
                freelancerhub.lk/profile/{form.username || 'yourname'}
              </p>
            </div>

            {/* Email */}
            <div>
              <label className="text-sm text-muted mb-1 block">Email *</label>
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="you@email.com"
                className="w-full bg-surface2 border border-border rounded-lg
                           px-4 py-2.5 text-sm text-white placeholder-muted
                           outline-none focus:border-accent2 transition-colors"
              />
            </div>

            {/* Password */}
            <div>
              <label className="text-sm text-muted mb-1 block">Password *</label>
              <input
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Min. 6 characters"
                className="w-full bg-surface2 border border-border rounded-lg
                           px-4 py-2.5 text-sm text-white placeholder-muted
                           outline-none focus:border-accent2 transition-colors"
              />
            </div>

            {/* Location */}
            <div>
              <label className="text-sm text-muted mb-1 block">
                Location <span className="text-muted">(optional)</span>
              </label>
              <input
                name="location"
                value={form.location}
                onChange={handleChange}
                placeholder="Colombo, Kandy, Galle..."
                className="w-full bg-surface2 border border-border rounded-lg
                           px-4 py-2.5 text-sm text-white placeholder-muted
                           outline-none focus:border-accent2 transition-colors"
              />
            </div>

            {/* Error */}
            {error && (
              <div className="bg-danger/10 border border-danger/30 text-danger
                              text-sm rounded-lg px-4 py-3">
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-accent2 text-black font-display font-bold
                         py-3 rounded-lg mt-2 hover:opacity-90 transition-opacity
                         disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </button>

          </form>

          <p className="text-center text-sm text-muted mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-accent2 hover:underline">
              Sign in
            </Link>
          </p>
        </div>

      </div>
    </div>
  )
}