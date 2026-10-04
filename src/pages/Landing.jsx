import { useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function Landing() {
  const { user, loading } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!loading && user) navigate('/feed')
  }, [user, loading])

  const circles = [
    { name: 'IT & Software',         icon: '💻', color: '#A082F0' },
    { name: 'Engineering & CAD',     icon: '⚙️', color: '#3ECFB2' },
    { name: 'Electrical',            icon: '⚡', color: '#F5A623' },
    { name: 'Construction & Trades', icon: '🏗️', color: '#E05C5C' },
    { name: 'Automotive',            icon: '🔧', color: '#4A9EE0' },
    { name: 'Teaching & Tutoring',   icon: '📚', color: '#3ECFB2' },
    { name: 'Design & Creative',     icon: '🎨', color: '#F5A623' },
    { name: 'General & Other',       icon: '🌐', color: '#6B7080' },
  ]

  const problems = [
    {
      icon: '😰',
      title: 'Facebook Groups',
      desc: 'Public phone numbers, no verification, no accountability. Anyone can claim anything.',
    },
    {
      icon: '🌍',
      title: 'Fiverr & Upwork',
      desc: 'Competing against the whole world. Sri Lankan freelancers are invisible and underpaid.',
    },
    {
      icon: '🤝',
      title: 'WhatsApp Networks',
      desc: 'Only works if you know the right people. No way to find new clients or freelancers.',
    },
  ]

  const steps = [
    {
      num: '01',
      title: 'Create your profile',
      desc: 'Add your skills, location, and join the circles that match your work. Takes 2 minutes.',
      icon: '👤',
    },
    {
      num: '02',
      title: 'Post or find work',
      desc: 'Post what you offer or browse what others need. Filter by circle, location, and availability.',
      icon: '🔍',
    },
    {
      num: '03',
      title: 'Work and build reputation',
      desc: 'Complete jobs, collect honest verified reviews, and grow your profile over time.',
      icon: '⭐',
    },
  ]

  if (loading) return (
    <div className="min-h-screen bg-bg flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-accent2 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="min-h-screen bg-bg text-white">

      {/* Nav */}
      <nav className="
        fixed top-0 left-0 right-0 z-50
        flex items-center justify-between
        px-6 py-4
        bg-bg/80 backdrop-blur-md
        border-b border-border
      ">
        <div className="font-display font-black text-xl">
          <span className="text-accent">Freelancer</span>
          <span className="text-accent2">Hub</span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/login"
            className="
              px-4 py-2 text-sm text-muted
              hover:text-white transition-colors
              font-medium
            "
          >
            Sign In
          </Link>
          <Link
            to="/register"
            className="
              px-4 py-2 text-sm
              bg-accent2 text-black
              font-display font-bold
              rounded-xl hover:opacity-90
              transition-opacity
            "
          >
            Join Free
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="
        min-h-screen flex flex-col
        items-center justify-center
        text-center px-4 pt-20
        relative overflow-hidden
      ">
        {/* Background grid */}
        <div className="
          absolute inset-0 opacity-5
          pointer-events-none
        "
          style={{
            backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 60px, #3ECFB2 60px, #3ECFB2 61px), repeating-linear-gradient(90deg, transparent, transparent 60px, #3ECFB2 60px, #3ECFB2 61px)'
          }}
        />

        {/* Badge */}
        <div className="
          inline-flex items-center gap-2
          bg-accent2/10 border border-accent2/20
          text-accent2 text-xs font-bold
          px-4 py-2 rounded-full mb-6
          font-display tracking-wide
        ">
          🇱🇰 Built for Sri Lanka
        </div>

        {/* Headline */}
        <h1 className="
          font-display font-black
          text-4xl md:text-6xl
          leading-tight mb-6
          max-w-3xl
        ">
          The professional community
          <span className="
            block
            text-transparent bg-clip-text
            bg-gradient-to-r from-accent to-accent2
          ">
            Sri Lankan freelancers
          </span>
          never had.
        </h1>

        {/* Subtext */}
        <p className="
          text-lg text-muted
          max-w-xl mb-8 leading-relaxed
        ">
          Find skilled freelancers or get found for your work.
          Not just IT — mechanics, electricians, designers,
          tutors, CAD draftsmen and more.
        </p>

        {/* CTAs */}
        <div className="flex flex-wrap gap-3 justify-center mb-12">
          <Link
            to="/register"
            className="
              px-8 py-3.5
              bg-accent2 text-black
              font-display font-bold text-base
              rounded-xl hover:opacity-90
              transition-opacity
            "
          >
            Join Free — Post Your Skills
          </Link>
          <Link
            to="/search"
            className="
              px-8 py-3.5
              bg-surface border border-border
              text-white
              font-display font-bold text-base
              rounded-xl hover:border-muted
              transition-colors
            "
          >
            Find a Freelancer →
          </Link>
        </div>

        {/* Social proof */}
        <div className="
          flex items-center gap-6
          text-sm text-muted
        ">
          <div className="flex items-center gap-2">
            <span className="text-accent2 font-bold">✓</span>
            Free to join
          </div>
          <div className="flex items-center gap-2">
            <span className="text-accent2 font-bold">✓</span>
            No commission fees
          </div>
          <div className="flex items-center gap-2">
            <span className="text-accent2 font-bold">✓</span>
            Honest reviews
          </div>
        </div>

      </section>

      {/* Problem section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-display font-black text-3xl mb-3">
              The current options don't work
            </h2>
            <p className="text-muted">
              Finding skilled people in Sri Lanka is still stuck in 2010.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {problems.map(problem => (
              <div
                key={problem.title}
                className="
                  bg-surface border border-border
                  rounded-2xl p-6
                "
              >
                <div className="text-3xl mb-4">{problem.icon}</div>
                <h3 className="font-display font-bold text-lg mb-2">
                  {problem.title}
                </h3>
                <p className="text-sm text-muted leading-relaxed">
                  {problem.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Circles section */}
      <section className="py-20 px-4 bg-surface/30">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-display font-black text-3xl mb-3">
              Every skill has a Circle
            </h2>
            <p className="text-muted max-w-lg mx-auto">
              Not just IT. FreelancerHub is for every skilled person in Sri Lanka.
              Join the circles that match your work.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {circles.map(circle => (
              <div
                key={circle.name}
                className="
                  bg-surface border border-border
                  rounded-2xl p-5
                  flex flex-col items-center
                  text-center gap-3
                  hover:border-muted/50 transition-colors
                "
              >
                <div
                  className="
                    w-12 h-12 rounded-xl
                    flex items-center justify-center
                    text-2xl
                  "
                  style={{ background: `${circle.color}20` }}
                >
                  {circle.icon}
                </div>
                <p
                  className="text-sm font-display font-bold"
                  style={{ color: circle.color }}
                >
                  {circle.name}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-display font-black text-3xl mb-3">
              How it works
            </h2>
            <p className="text-muted">
              Simple, honest, and built around trust.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {steps.map(step => (
              <div key={step.num} className="relative">

                {/* Step number */}
                <div className="
                  font-display font-black text-5xl
                  text-border mb-4
                ">
                  {step.num}
                </div>

                <div className="text-3xl mb-3">{step.icon}</div>

                <h3 className="font-display font-bold text-lg mb-2">
                  {step.title}
                </h3>
                <p className="text-sm text-muted leading-relaxed">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Honest reviews section */}
      <section className="py-20 px-4 bg-surface/30">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-display font-black text-3xl mb-4">
            Reviews you can actually trust
          </h2>
          <p className="text-muted mb-10 max-w-xl mx-auto leading-relaxed">
            Our rating system is designed to prevent fake reviews and protect
            freelancers from unfair clients.
          </p>

          <div className="grid sm:grid-cols-2 gap-4 text-left">
            {[
              {
                icon: '✅',
                title: 'Verified jobs only',
                desc: 'Only clients who completed a real job on FreelancerHub can leave a review.',
              },
              {
                icon: '🔄',
                title: 'Both sides review',
                desc: 'Freelancers rate clients too. Accountability works both ways.',
              },
              {
                icon: '🔒',
                title: 'Revealed simultaneously',
                desc: 'Neither party sees the other\'s review until both have submitted. No revenge reviews.',
              },
              {
                icon: '✍️',
                title: 'Written reason required',
                desc: 'A star rating alone is not accepted. Every review needs a written explanation.',
              },
            ].map(item => (
              <div
                key={item.title}
                className="
                  bg-surface border border-border
                  rounded-2xl p-5
                  flex gap-4
                "
              >
                <span className="text-2xl shrink-0">{item.icon}</span>
                <div>
                  <h4 className="font-display font-bold text-sm mb-1">
                    {item.title}
                  </h4>
                  <p className="text-xs text-muted leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 px-4">
        <div className="
          max-w-2xl mx-auto text-center
          bg-surface border border-border
          rounded-3xl p-12
          relative overflow-hidden
        ">
          {/* Background accent */}
          <div className="
            absolute -top-20 -right-20
            w-64 h-64 rounded-full
            bg-accent2/5
            pointer-events-none
          "/>
          <div className="
            absolute -bottom-20 -left-20
            w-64 h-64 rounded-full
            bg-accent/5
            pointer-events-none
          "/>

          <div className="relative">
            <div className="text-4xl mb-4">🇱🇰</div>
            <h2 className="font-display font-black text-3xl mb-3">
              Ready to join?
            </h2>
            <p className="text-muted mb-8 leading-relaxed">
              FreelancerHub is free to join. No commissions, no subscriptions.
              Just a community of skilled Sri Lankans helping each other.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Link
                to="/register"
                className="
                  px-8 py-3.5
                  bg-accent2 text-black
                  font-display font-bold text-base
                  rounded-xl hover:opacity-90
                  transition-opacity
                "
              >
                Create Free Account
              </Link>
              <Link
                to="/login"
                className="
                  px-8 py-3.5
                  bg-surface2 border border-border
                  text-white
                  font-display font-bold text-base
                  rounded-xl hover:border-muted
                  transition-colors
                "
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="
        border-t border-border
        px-6 py-8
        flex flex-col sm:flex-row
        items-center justify-between
        gap-4
      ">
        <div className="font-display font-black text-lg">
          <span className="text-accent">Freelancer</span>
          <span className="text-accent2">Hub</span>
        </div>
        <p className="text-xs text-muted text-center">
          Built for Sri Lanka's skilled community.
          Not a marketplace — a community.
        </p>
        <div className="flex gap-4 text-xs text-muted">
          <Link to="/register" className="hover:text-white transition-colors">
            Join
          </Link>
          <Link to="/login" className="hover:text-white transition-colors">
            Sign In
          </Link>
          <Link to="/search" className="hover:text-white transition-colors">
            Find Freelancers
          </Link>
        </div>
      </footer>

    </div>
  )
}