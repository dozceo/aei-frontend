import Link from 'next/link'
import {
  GraduationCap,
  HeartHandshake,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/design-system'

const ROLES = [
  {
    role: 'student',
    title: 'Student',
    description: 'Daily loop, quizzes, brain tools, and play.',
    href: '/login?role=student',
    portalHref: '/student',
    icon: GraduationCap,
    accent: 'var(--primary)',
  },
  {
    role: 'teacher',
    title: 'Teacher',
    description: 'Roster, topics, chapters, and schedule.',
    href: '/login?role=teacher',
    portalHref: '/teacher',
    icon: Sparkles,
    accent: 'var(--sky)',
  },
  {
    role: 'parent',
    title: 'Parent',
    description: 'Progress summaries, inbox, and reports.',
    href: '/login?role=parent',
    portalHref: '/parent',
    icon: HeartHandshake,
    accent: 'var(--sage)',
  },
  {
    role: 'admin',
    title: 'Admin',
    description: 'Participants, EWS, analytics, and settings.',
    href: '/login?role=admin',
    portalHref: '/admin',
    icon: ShieldCheck,
    accent: 'var(--honey)',
  },
] as const

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-lg flex-col overflow-x-hidden px-4 py-8">
      <section className="animate-rise mb-8 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--ink-subtle)]">
          Sankalp AEI
        </p>
        <h1 className="mt-2 font-serif text-4xl font-semibold leading-tight text-[var(--ink)]">
          Learn with clarity.
        </h1>
        <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-[var(--ink-muted)]">
          One platform for students, teachers, parents, and admins — built for daily learning loops and
          meaningful insight.
        </p>
      </section>

      <section className="grid flex-1 gap-3">
        {ROLES.map((entry, index) => {
          const Icon = entry.icon
          return (
            <Card
              key={entry.role}
              raised
              className={`animate-rise animate-rise-delay-${Math.min(index + 1, 3)} overflow-hidden`}
            >
              <CardHeader className="flex-row items-start gap-3 space-y-0">
                <div
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[var(--radius-md)]"
                  style={{ backgroundColor: `color-mix(in srgb, ${entry.accent} 15%, white)` }}
                >
                  <Icon className="h-5 w-5" style={{ color: entry.accent }} />
                </div>
                <div className="min-w-0 flex-1">
                  <CardTitle>{entry.title}</CardTitle>
                  <CardDescription>{entry.description}</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="flex gap-2">
                <Link href={entry.href} className="flex-1">
                  <Button className="w-full">Sign in</Button>
                </Link>
                <Link href={entry.portalHref} className="flex-1">
                  <Button variant="secondary" className="w-full">Portal</Button>
                </Link>
              </CardContent>
            </Card>
          )
        })}
      </section>

      <footer className="mt-8 text-center text-xs text-[var(--ink-subtle)]">
        Responsive · 360px-first · Session secured via BFF
      </footer>
    </main>
  )
}
