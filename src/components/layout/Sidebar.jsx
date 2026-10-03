import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'

export default function Sidebar() {
  const { user } = useAuth()
  const location = useLocation()

  const [circles, setCircles]     = useState([])
  const [myCircles, setMyCircles] = useState([])
  const [loading, setLoading]     = useState(true)

  useEffect(() => {
    fetchCircles()
    if (user) fetchMyCircles()
  }, [user])

  async function fetchCircles() {
    const { data } = await supabase
      .from('circles')
      .select('*')
      .order('member_count', { ascending: false })
    setCircles(data || [])
    setLoading(false)
  }

  async function fetchMyCircles() {
    const { data } = await supabase
      .from('user_circles')
      .select('circle_id')
      .eq('user_id', user.id)
    setMyCircles(data?.map(d => d.circle_id) || [])
  }

  async function toggleCircle(circleId) {
    const joined = myCircles.includes(circleId)

    if (joined) {
      await supabase
        .from('user_circles')
        .delete()
        .eq('user_id', user.id)
        .eq('circle_id', circleId)

      await supabase.rpc('decrement_member_count', { circle_id: circleId })

      setMyCircles(myCircles.filter(id => id !== circleId))
    } else {
      await supabase
        .from('user_circles')
        .insert({ user_id: user.id, circle_id: circleId })

      await supabase.rpc('increment_member_count', { circle_id: circleId })

      setMyCircles([...myCircles, circleId])
    }
  }

  const navItems = [
    { icon: '🏠', label: 'My Feed',  path: '/feed' },
    { icon: '🔍', label: 'Explore',  path: '/explore' },
    { icon: '📋', label: 'My Posts', path: '/my-posts' },
    { icon: '💬', label: 'Messages', path: '/messages' },
    { icon: '⭐', label: 'Reviews',  path: '/reviews' },
    { icon: '👤', label: 'Profile',  path: '/profile' },
  ]

  return (
    <aside className="
      fixed left-0 top-14 bottom-0
      w-56 bg-surface border-r border-border
      overflow-y-auto py-4 px-2
    ">

      {/* Main Nav */}
      <nav className="flex flex-col gap-0.5 mb-4">
        {navItems.map(item => {
          const isActive = location.pathname === item.path
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`
                flex items-center gap-2.5 px-3 py-2.5
                rounded-lg text-sm transition-colors
                ${isActive
                  ? 'bg-accent/10 text-accent font-medium'
                  : 'text-white hover:bg-surface2'
                }
              `}
            >
              <span className="text-base w-5 text-center">{item.icon}</span>
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-border my-3" />

      {/* Circles */}
      <div>
        <p className="
          text-xs font-display font-bold
          text-muted uppercase tracking-widest
          px-3 mb-2
        ">
          Circles
        </p>

        {loading ? (
          <p className="text-xs text-muted px-3">Loading...</p>
        ) : (
          <div className="flex flex-col gap-0.5">
            {circles.map(circle => {
              const joined = myCircles.includes(circle.id)
              return (
                <div
                  key={circle.id}
                  className={`
                    flex items-center gap-2.5 px-3 py-2
                    rounded-lg transition-colors group cursor-pointer
                    ${joined ? 'bg-surface2' : 'hover:bg-surface2'}
                  `}
                  onClick={() => toggleCircle(circle.id)}
                >
                  {/* color dot */}
                  <span
                    className={`
                      w-2 h-2 rounded-full shrink-0 transition-all
                      ${joined ? 'scale-125' : 'opacity-40'}
                    `}
                    style={{ background: circle.color }}
                  />

                  {/* circle name */}
                  <span className={`
                    text-sm flex-1 truncate transition-colors
                    ${joined
                      ? 'text-white font-medium'
                      : 'text-muted group-hover:text-white'
                    }
                  `}>
                    {circle.icon} {circle.name}
                  </span>

                  {/* joined checkmark */}
                  {joined && (
                    <span className="text-xs text-accent2 font-bold">✓</span>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div className="border-t border-border my-3" />

      {/* Footer */}
      <div className="px-3">
        <p className="text-xs text-muted leading-relaxed">
          FreelancerHub — built for Sri Lanka's skilled community.
        </p>
      </div>

    </aside>
  )
}