import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useNavigate, Link } from 'react-router-dom'

export default function Login() {
  const navigate = useNavigate()

  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError]     = useState(null)
  const [loading, setLoading] = useState(false)

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
    setError(null)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error: authError } = await supabase.auth.signInWithPassword({
      email:    form.email,
      password: form.password,
    })

    if (authError) {
      setError('Incorrect email or password.')
      setLoading(false)
      return
    }

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
            Welcome back.
          </p>
        </div>

        {/* Card */}
        <div className="bg-surface border border-border rounded-2xl p-8">
          <h2 className="font-display font-bold text-xl mb-6">Sign in</h2>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">

            <div>
              <label className="text-sm text-muted mb-1 block">Email</label>
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

            <div>
              <label className="text-sm text-muted mb-1 block">Password</label>
              <input
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Your password"
                className="w-full bg-surface2 border border-border rounded-lg
                           px-4 py-2.5 text-sm text-white placeholder-muted
                           outline-none focus:border-accent2 transition-colors"
              />
            </div>

            {error && (
              <div className="bg-danger/10 border border-danger/30 text-danger
                              text-sm rounded-lg px-4 py-3">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-accent2 text-black font-display font-bold
                         py-3 rounded-lg mt-2 hover:opacity-90 transition-opacity
                         disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>

          </form>

          <p className="text-center text-sm text-muted mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-accent2 hover:underline">
              Create one
            </Link>
          </p>
        </div>

      </div>
    </div>
  )
}