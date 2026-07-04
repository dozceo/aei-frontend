'use client'

import { StatCard } from '@/components/design-system'
import { attendedToday, countLoopDays, useParticipant } from '@/hooks/useParticipant'

export function StudentTodayStats() {
  const { data: participant, isLoading } = useParticipant()

  const streak =
    participant?.streaks?.current ??
    participant?.streak ??
    (participant?.loopAttendance ? countLoopDays(participant.loopAttendance) : null)

  const attendanceLabel = isLoading
    ? '…'
    : participant
      ? attendedToday(participant.loopAttendance) ? 'Done today' : 'Not yet'
      : '—'

  return (
    <div className="grid grid-cols-2 gap-3">
      <StatCard
        label="Streak"
        value={isLoading ? '…' : streak != null ? String(streak) : '—'}
        hint="From zero2dev participant record"
      />
      <StatCard label="Attendance" value={attendanceLabel} hint="Today's loop in zero2dev" />
    </div>
  )
}
