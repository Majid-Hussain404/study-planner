import { describe, expect, it } from 'vitest'
import { buildAnalytics } from './analytics'

describe('buildAnalytics', () => {
  const today = new Date(2026, 9, 8, 12)

  it('aggregates weekly study time and consistency from completed and missed sessions', () => {
    const data = buildAnalytics([], [], [
      { subject_id: 's1', starts_at: '2026-10-08T08:00:00.000Z', status: 'completed', completed_minutes: 90 },
      { subject_id: 's1', starts_at: '2026-10-07T08:00:00.000Z', status: 'missed', completed_minutes: 0 },
      { subject_id: 's1', starts_at: '2026-10-07T09:00:00.000Z', status: 'planned', completed_minutes: 0 },
    ], today)
    expect(data.totalStudyHours).toBe(1.5)
    expect(data.completed).toBe(1)
    expect(data.missed).toBe(1)
    expect(data.completionRate).toBe(50)
  })

  it('uses topic mastery for subject progress and counts missed sessions', () => {
    const data = buildAnalytics(
      [{ id: 's1', name: 'Networks', progress: 90 }],
      [{ subject_id: 's1', mastery: 40 }, { subject_id: 's1', mastery: 60 }],
      [{ subject_id: 's1', starts_at: '2026-10-08T08:00:00.000Z', status: 'missed', completed_minutes: 0 }],
      today,
    )
    expect(data.subjectProgress).toEqual([{ subjectId: 's1', name: 'Networks', progress: 50, missedSessions: 1 }])
  })
})
