import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import AppLayout from '../components/layout/AppLayout'

export default function Search() {
  const { user, loading } = useAuth()
  const navigate          = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const [query, setQuery]       = useState(searchParams.get('q') || '')
  const [results, setResults]   = useState([])
  const [circles, setCircles]   = useState([])
  const [fetching, setFetching] = useState(false)
  const [searched, setSearched] = useState(false)

  // filters
  const [circleFilter,       setCircleFilter]       = useState('')
  const [availabilityFilter, setAvailabilityFilter] = useState('')
  const [ratingFilter,       setRatingFilter]       = useState('')

  useEffect(() => {
    if (!loading && !user) navigate('/login')
  }, [user, loading])

  useEffect(() => {
    fetchCircles()
    // auto search if query in url
    if (searchParams.get('q')) {
      handleSearch(searchParams.get('q'))
    }
  }, [])

  async function fetchCircles() {
    const { data } = await supabase
      .from('circles')
      .select('id, name, color, icon')
      .order('name')
    setCircles(data || [])
  }

  async function handleSearch(searchQuery) {
    const q = (searchQuery || query).trim()
    if (!q) return

    setFetching(true)
    setSearched(true)
    setSearchParams({ q })

    // search users by name, username, location
    const { data: userResults } = await supabase
      .from('users')
      .select(`
        id, full_name, username,
        location, bio, availability,
        avg_rating, total_reviews, total_jobs
      `)
      .or(
        `full_name.ilike.%${q}%,` +
        `username.ilike.%${q}%,` +
        `location.ilike.%${q}%,` +
        `bio.ilike.%${q}%`
      )
      .neq('id', user.id)

    // search by skill
    const { data: skillResults } = await supabase
      .from('user_skills')
      .select('user_id')
      .ilike('skill_name', `%${q}%`)

    const skillUserIds = [...new Set(skillResults?.map(s => s.user_id) || [])]

    // fetch skill-matched users
    let skillUsers = []
    if (skillUserIds.length > 0) {
      const { data } = await supabase
        .from('users')
        .select(`
          id, full_name, username,
          location, bio, availability,
          avg_rating, total_reviews, total_jobs
        `)
        .in('id', skillUserIds)
        .neq('id', user.id)
      skillUsers = data || []
    }

    // merge and deduplicate
    const allUsers = [...(userResults || []), ...skillUsers]
    const seen     = new Set()
    const merged   = allUsers.filter(u => {
      if (seen.has(u.id)) return false
      seen.add(u.id)
      return true
    })

    // fetch skills for each user
    const userIds = merged.map(u => u.id)
    let skillsMap = {}

    if (userIds.length > 0) {
      const { data: allSkills } = await supabase
        .from('user_skills')
        .select('user_id, skill_name')
        .in('user_id', userIds)

      allSkills?.forEach(s => {
        if (!skillsMap[s.user_id]) skillsMap[s.user_id] = []
        skillsMap[s.user_id].push(s.skill_name)
      })
    }

    // fetch circles for each user
    let circlesMap = {}
    if (userIds.length > 0) {
      const { data: allCircles } = await supabase
        .from('user_circles')
        .select('user_id, circles(id, name, color)')
        .in('user_id', userIds)

      allCircles?.forEach(c => {
        if (!circlesMap[c.user_id]) circlesMap[c.user_id] = []
        circlesMap[c.user_id].push(c.circles)
      })
    }

    const enriched = merged.map(u => ({
      ...u,
      skills:  skillsMap[u.id]  || [],
      circles: circlesMap[u.id] || [],
    }))

    setResults(enriched)
    setFetching(false)
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') handleSearch()
  }

  // apply filters
  const filtered = results.filter(u => {
    if (availabilityFilter && u.availability !== availabilityFilter) return false
    if (ratingFilter && u.avg_rating < parseFloat(ratingFilter))     return false
    if (circleFilter) {
      const inCircle = u.circles?.some(c => c?.id === circleFilter)
      if (!inCircle) return false
    }
    return true
  })

  function getInitials(name) {
    if (!name) return '?'
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  function renderStars(rating) {
    return Array.from({ length: 5 }, (_, i) => (
      <span key={i} className={i < Math.round(rating) ? 'text-accent' : 'text-muted'}>
        ★
      </span>
    ))
  }

  if (loading) return (
    <div className="min-h-screen bg-bg flex items-center justify-center">
      <p className="text-muted">Loading...</p>
    </div>
  )

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto py-8 px-4">

        <h1 className="font-display font-bold text-xl text-white mb-6">
          Find Freelancers
        </h1>

        {/* Search bar */}
        <div className="
          flex gap-2 mb-4
        ">
          <div className="
            flex-1 flex items-center gap-2
            bg-surface border border-border
            rounded-xl px-4 py-3
            focus-within:border-accent2 transition-colors
          ">
            <span className="text-muted">🔍</span>
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search by skill, name, location... e.g. AutoCAD, Colombo, React"
              className="
                flex-1 bg-transparent text-sm
                text-white placeholder-muted outline-none
              "
            />
            {query && (
              <button
                onClick={() => {
                  setQuery('')
                  setResults([])
                  setSearched(false)
                  setSearchParams({})
                }}
                className="text-muted hover:text-white transition-colors"
              >
                ✕
              </button>
            )}
          </div>
          <button
            onClick={() => handleSearch()}
            disabled={!query.trim() || fetching}
            className="
              px-6 py-3 bg-accent2 text-black
              font-display font-bold text-sm
              rounded-xl hover:opacity-90
              disabled:opacity-40 disabled:cursor-not-allowed
              transition-opacity
            "
          >
            {fetching ? '...' : 'Search'}
          </button>
        </div>

        {/* Filters */}
        {searched && results.length > 0 && (
          <div className="
            flex flex-wrap gap-2 mb-6
            p-3 bg-surface border border-border
            rounded-xl
          ">
            {/* Circle filter */}
            <select
              value={circleFilter}
              onChange={e => setCircleFilter(e.target.value)}
              className="
                bg-surface2 border border-border
                rounded-lg px-3 py-1.5 text-xs text-white
                outline-none cursor-pointer
                focus:border-accent2 transition-colors
              "
            >
              <option value="">All Circles</option>
              {circles.map(c => (
                <option key={c.id} value={c.id}>
                  {c.icon} {c.name}
                </option>
              ))}
            </select>

            {/* Availability filter */}
            <select
              value={availabilityFilter}
              onChange={e => setAvailabilityFilter(e.target.value)}
              className="
                bg-surface2 border border-border
                rounded-lg px-3 py-1.5 text-xs text-white
                outline-none cursor-pointer
                focus:border-accent2 transition-colors
              "
            >
              <option value="">Any Availability</option>
              <option value="available">🟢 Available</option>
              <option value="busy">🔴 Busy</option>
            </select>

            {/* Rating filter */}
            <select
              value={ratingFilter}
              onChange={e => setRatingFilter(e.target.value)}
              className="
                bg-surface2 border border-border
                rounded-lg px-3 py-1.5 text-xs text-white
                outline-none cursor-pointer
                focus:border-accent2 transition-colors
              "
            >
              <option value="">Any Rating</option>
              <option value="4.5">★ 4.5 and above</option>
              <option value="4">★ 4.0 and above</option>
              <option value="3">★ 3.0 and above</option>
            </select>

            {/* Results count */}
            <span className="
              ml-auto text-xs text-muted
              flex items-center
            ">
              {filtered.length} result{filtered.length !== 1 ? 's' : ''}
            </span>
          </div>
        )}

        {/* Loading skeleton */}
        {fetching && (
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map(i => (
              <div
                key={i}
                className="bg-surface border border-border rounded-2xl p-5 animate-pulse"
              >
                <div className="flex gap-4">
                  <div className="w-14 h-14 bg-surface2 rounded-2xl shrink-0" />
                  <div className="flex-1">
                    <div className="h-4 bg-surface2 rounded w-40 mb-2" />
                    <div className="h-3 bg-surface2 rounded w-24 mb-3" />
                    <div className="flex gap-2">
                      <div className="h-6 bg-surface2 rounded-full w-16" />
                      <div className="h-6 bg-surface2 rounded-full w-20" />
                      <div className="h-6 bg-surface2 rounded-full w-14" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* No results */}
        {!fetching && searched && filtered.length === 0 && (
          <div className="
            text-center py-16
            bg-surface border border-border
            rounded-2xl
          ">
            <p className="text-4xl mb-3">🔍</p>
            <p className="font-display font-bold text-white mb-1">
              No freelancers found
            </p>
            <p className="text-sm text-muted">
              Try a different skill, name or location.
            </p>
          </div>
        )}

        {/* Empty state before search */}
        {!fetching && !searched && (
          <div className="
            text-center py-16
            bg-surface border border-border
            rounded-2xl
          ">
            <p className="text-4xl mb-3">👥</p>
            <p className="font-display font-bold text-white mb-2">
              Find the right person
            </p>
            <p className="text-sm text-muted mb-6">
              Search by skill, name, or location to find freelancers.
            </p>

            {/* Quick search suggestions */}
            <div className="flex flex-wrap gap-2 justify-center">
              {[
                'AutoCAD', 'Electrician', 'React',
                'Plumber', 'Colombo', 'Graphic Design',
              ].map(suggestion => (
                <button
                  key={suggestion}
                  onClick={() => {
                    setQuery(suggestion)
                    handleSearch(suggestion)
                  }}
                  className="
                    px-3 py-1.5 rounded-full text-xs
                    bg-surface2 border border-border
                    text-muted hover:text-white
                    hover:border-muted transition-colors
                  "
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Results */}
        {!fetching && filtered.length > 0 && (
          <div className="flex flex-col gap-3">
            {filtered.map(freelancer => (
              <div
                key={freelancer.id}
                onClick={() => navigate(`/profile/${freelancer.username}`)}
                className="
                  bg-surface border border-border
                  rounded-2xl p-5
                  cursor-pointer
                  hover:border-muted/50 transition-colors
                "
              >
                <div className="flex gap-4">

                  {/* Avatar */}
                  <div className="
                    w-14 h-14 rounded-2xl shrink-0
                    bg-gradient-to-br from-accent2 to-blue-500
                    flex items-center justify-center
                    font-display font-bold text-xl text-white
                  ">
                    {getInitials(freelancer.full_name)}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">

                    {/* Name + availability */}
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <h3 className="font-display font-bold text-white">
                        {freelancer.full_name}
                      </h3>
                      <span className={`
                        text-xs font-bold px-2 py-0.5 rounded-full
                        ${freelancer.availability === 'available'
                          ? 'bg-accent2/10 text-accent2'
                          : 'bg-muted/10 text-muted'
                        }
                      `}>
                        {freelancer.availability === 'available'
                          ? '🟢 Available'
                          : '🔴 Busy'
                        }
                      </span>
                    </div>

                    {/* Username + location */}
                    <p className="text-xs text-muted mb-2">
                      @{freelancer.username}
                      {freelancer.location && ` · 📍 ${freelancer.location}`}
                    </p>

                    {/* Bio */}
                    {freelancer.bio && (
                      <p className="text-sm text-white/60 leading-relaxed mb-3 line-clamp-2">
                        {freelancer.bio}
                      </p>
                    )}

                    {/* Skills */}
                    {freelancer.skills.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {freelancer.skills.slice(0, 5).map(skill => (
                          <span
                            key={skill}
                            className="
                              px-2.5 py-0.5 rounded-full text-xs
                              bg-surface2 border border-border text-muted
                            "
                          >
                            {skill}
                          </span>
                        ))}
                        {freelancer.skills.length > 5 && (
                          <span className="text-xs text-muted">
                            +{freelancer.skills.length - 5} more
                          </span>
                        )}
                      </div>
                    )}

                    {/* Circles */}
                    {freelancer.circles.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {freelancer.circles.slice(0, 3).map((circle, i) => (
                          <span
                            key={i}
                            className="
                              flex items-center gap-1
                              px-2.5 py-0.5 rounded-full text-xs
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

                    {/* Stats */}
                    <div className="flex items-center gap-4">
                      {freelancer.avg_rating > 0 && (
                        <div className="flex items-center gap-1">
                          <div className="flex text-xs">
                            {renderStars(freelancer.avg_rating)}
                          </div>
                          <span className="text-xs text-accent font-bold">
                            {freelancer.avg_rating.toFixed(1)}
                          </span>
                          <span className="text-xs text-muted">
                            ({freelancer.total_reviews})
                          </span>
                        </div>
                      )}
                      {freelancer.total_jobs > 0 && (
                        <span className="text-xs text-muted">
                          📋 {freelancer.total_jobs} jobs done
                        </span>
                      )}
                    </div>

                  </div>

                  {/* Arrow */}
                  <div className="
                    self-center text-muted
                    text-lg shrink-0
                  ">
                    →
                  </div>

                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </AppLayout>
  )
}