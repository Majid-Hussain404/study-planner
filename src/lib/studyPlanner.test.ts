import { describe, expect, it } from 'vitest'
import {
  generateStudyPlan,
  type PlannerAvailability,
  type PlannerDeadline,
  type PlannerExistingSession,
  type PlannerSubject,
  type PlannerTopic,
} from './studyPlanner'

const mondayMorning = new Date(2026, 5, 15, 8, 0, 0)

const subject: PlannerSubject = {
  id: 'subject-1',
  name: 'Algorithms',
  difficulty: 'hard',
  priority: 'high',
  exam_date: null,
}

const topic: PlannerTopic = {
  id: 'topic-1',
  subject_id: subject.id,
  title: 'Graph traversal',
  status: 'not_started',
  estimated_minutes: 100,
  mastery: 20,
}

const mondayAvailability: PlannerAvailability[] = [
  { weekday: 1, starts_at: '09:00:00', ends_at: '12:00:00' },
]

function makePlan({
  topics = [topic],
  subjects = [subject],
  deadlines = [],
  availability = mondayAvailability,
  existingSessions = [],
  dailyStudyHours = 2,
}: {
  topics?: PlannerTopic[]
  subjects?: PlannerSubject[]
  deadlines?: PlannerDeadline[]
  availability?: PlannerAvailability[]
  existingSessions?: PlannerExistingSession[]
  dailyStudyHours?: number
} = {}) {
  return generateStudyPlan({
    subjects,
    topics,
    deadlines,
    availability,
    existingSessions,
    dailyStudyHours,
    now: mondayMorning,
  })
}

describe('generateStudyPlan', () => {
  it('keeps sessions inside availability and under the daily hour limit', () => {
    const result = makePlan({ dailyStudyHours: 1 })

    expect(result.sessions.length).toBeGreaterThan(0)
    expect(
      result.sessions.reduce(
        (total, session) => total + session.durationMinutes,
        0,
      ),
    ).toBeLessThanOrEqual(60)
    for (const session of result.sessions) {
      const start = new Date(session.startsAt)
      const end = new Date(session.endsAt)
      expect(start.getDay()).toBe(1)
      expect(start.getHours()).toBeGreaterThanOrEqual(9)
      expect(end.getHours()).toBeLessThanOrEqual(12)
      expect(session.durationMinutes).toBeLessThanOrEqual(50)
    }
  })

  it('skips existing sessions and schedules into the next free time', () => {
    const existing: PlannerExistingSession = {
      topic_id: null,
      starts_at: new Date(2026, 5, 15, 9, 0).toISOString(),
      ends_at: new Date(2026, 5, 15, 9, 50).toISOString(),
      status: 'planned',
    }
    const result = makePlan({ existingSessions: [existing] })

    expect(result.sessions[0]).toBeDefined()
    expect(
      new Date(result.sessions[0]!.startsAt).getTime(),
    ).toBeGreaterThanOrEqual(new Date(existing.ends_at).getTime())
  })

  it('prioritizes a topic with an imminent deadline', () => {
    const secondSubject: PlannerSubject = {
      id: 'subject-2',
      name: 'Networks',
      difficulty: 'easy',
      priority: 'low',
      exam_date: null,
    }
    const urgentTopic: PlannerTopic = {
      id: 'topic-urgent',
      subject_id: secondSubject.id,
      title: 'Transport layer',
      status: 'not_started',
      estimated_minutes: 60,
      mastery: 0,
    }
    const deadline: PlannerDeadline = {
      subject_id: secondSubject.id,
      due_at: new Date(2026, 5, 15, 9, 30).toISOString(),
      completed_at: null,
      priority: 'critical',
    }
    const result = makePlan({
      topics: [topic, urgentTopic],
      subjects: [subject, secondSubject],
      deadlines: [deadline],
    })

    expect(result.sessions[0]?.topicId).toBe(urgentTopic.id)
  })

  it('does not schedule completed work or duplicate completed and planned minutes', () => {
    const sessions: PlannerExistingSession[] = [
      {
        topic_id: topic.id,
        starts_at: new Date(2026, 5, 15, 9, 0).toISOString(),
        ends_at: new Date(2026, 5, 15, 9, 45).toISOString(),
        status: 'completed',
        completed_minutes: 45,
      },
      {
        topic_id: topic.id,
        starts_at: new Date(2026, 5, 15, 10, 0).toISOString(),
        ends_at: new Date(2026, 5, 15, 10, 55).toISOString(),
        status: 'planned',
      },
    ]
    const result = makePlan({
      topics: [{ ...topic, estimated_minutes: 100 }],
      existingSessions: sessions,
    })

    expect(result.sessions).toHaveLength(0)
    expect(result.unscheduled).toHaveLength(0)
  })

  it('reports remaining work when no study windows exist', () => {
    const result = makePlan({ availability: [] })

    expect(result.sessions).toHaveLength(0)
    expect(result.unscheduled).toEqual([
      { topicId: topic.id, title: topic.title, remainingMinutes: 100 },
    ])
  })
})
