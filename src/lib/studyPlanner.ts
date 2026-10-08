export interface PlannerSubject {
  id: string
  name: string
  difficulty: 'easy' | 'medium' | 'hard'
  priority: 'low' | 'medium' | 'high' | 'critical'
  exam_date: string | null
}

export interface PlannerTopic {
  id: string
  subject_id: string
  title: string
  status: 'not_started' | 'in_progress' | 'completed'
  estimated_minutes: number
  mastery: number
}

export interface PlannerDeadline {
  subject_id: string | null
  due_at: string
  completed_at: string | null
  priority: 'low' | 'medium' | 'high' | 'critical'
}

export interface PlannerAvailability {
  weekday: number
  starts_at: string
  ends_at: string
}

export interface PlannerExistingSession {
  topic_id: string | null
  starts_at: string
  ends_at: string
  status: 'planned' | 'in_progress' | 'completed' | 'missed' | 'cancelled'
  completed_minutes?: number
}

export interface GeneratedStudySession {
  topicId: string
  subjectId: string
  title: string
  startsAt: string
  endsAt: string
  durationMinutes: number
}

export interface UnscheduledTopic {
  topicId: string
  title: string
  remainingMinutes: number
}

export interface StudyPlanResult {
  sessions: GeneratedStudySession[]
  unscheduled: UnscheduledTopic[]
}

const priorityWeight: Record<PlannerSubject['priority'], number> = {
  low: 0,
  medium: 8,
  high: 16,
  critical: 24,
}

const difficultyWeight: Record<PlannerSubject['difficulty'], number> = {
  easy: 0,
  medium: 6,
  hard: 12,
}

function timeOnDate(day: Date, time: string): Date {
  const [hours = 0, minutes = 0] = time.split(':').map(Number)
  return new Date(
    day.getFullYear(),
    day.getMonth(),
    day.getDate(),
    hours,
    minutes,
  )
}

function topicDeadline(
  topic: PlannerTopic,
  subject: PlannerSubject | undefined,
  deadlines: PlannerDeadline[],
): number | null {
  const candidates = deadlines
    .filter(
      (deadline) =>
        !deadline.completed_at && deadline.subject_id === topic.subject_id,
    )
    .map((deadline) => new Date(deadline.due_at).getTime())

  if (subject?.exam_date) {
    const [year, month, day] = subject.exam_date.split('-').map(Number)
    candidates.push(new Date(year, month - 1, day, 9).getTime())
  }

  return candidates.length > 0 ? Math.min(...candidates) : null
}

function urgencyWeight(dueAt: number | null, now: number): number {
  if (dueAt === null) return 0
  const daysUntilDue = Math.max(0, (dueAt - now) / 86_400_000)
  return Math.min(30, 30 / (daysUntilDue + 1))
}

export function generateStudyPlan({
  subjects,
  topics,
  deadlines,
  availability,
  existingSessions,
  dailyStudyHours,
  now = new Date(),
}: {
  subjects: PlannerSubject[]
  topics: PlannerTopic[]
  deadlines: PlannerDeadline[]
  availability: PlannerAvailability[]
  existingSessions: PlannerExistingSession[]
  dailyStudyHours: number
  now?: Date
}): StudyPlanResult {
  const nowTime = now.getTime()
  const subjectById = new Map(subjects.map((subject) => [subject.id, subject]))
  const remainingMinutes = new Map<string, number>()

  for (const topic of topics) {
    if (topic.status === 'completed' || topic.mastery >= 100) continue
    const alreadyAccountedMinutes = existingSessions
      .filter((session) => {
        if (session.topic_id !== topic.id) return false
        if (session.status === 'completed') return true
        return (
          (session.status === 'planned' || session.status === 'in_progress') &&
          new Date(session.ends_at).getTime() > nowTime
        )
      })
      .reduce((total, session) => {
        if (session.status === 'completed')
          return total + (session.completed_minutes ?? 0)
        return (
          total +
          Math.max(
            0,
            (new Date(session.ends_at).getTime() -
              new Date(session.starts_at).getTime()) /
              60_000,
          )
        )
      }, 0)
    remainingMinutes.set(
      topic.id,
      Math.max(0, topic.estimated_minutes - alreadyAccountedMinutes),
    )
  }

  const topicOrder = topics
    .filter((topic) => (remainingMinutes.get(topic.id) ?? 0) > 0)
    .map((topic) => {
      const subject = subjectById.get(topic.subject_id)
      const dueAt = topicDeadline(topic, subject, deadlines)
      const nearestDeadline = deadlines
        .filter(
          (deadline) =>
            !deadline.completed_at && deadline.subject_id === topic.subject_id,
        )
        .sort(
          (a, b) => new Date(a.due_at).getTime() - new Date(b.due_at).getTime(),
        )[0]
      const priority = nearestDeadline?.priority ?? subject?.priority ?? 'low'
      const score =
        priorityWeight[priority] +
        (subject ? difficultyWeight[subject.difficulty] : 0) +
        (100 - topic.mastery) * 0.2 +
        urgencyWeight(dueAt, nowTime) +
        (topic.status === 'in_progress' ? 4 : 0)
      return { topic, score, dueAt: dueAt ?? Number.POSITIVE_INFINITY }
    })
    .sort(
      (a, b) =>
        b.score - a.score ||
        a.dueAt - b.dueAt ||
        a.topic.title.localeCompare(b.topic.title),
    )

  const sessions: GeneratedStudySession[] = []
  const busy = existingSessions
    .filter(
      (session) =>
        session.status === 'planned' || session.status === 'in_progress',
    )
    .map((session) => ({
      start: new Date(session.starts_at),
      end: new Date(session.ends_at),
    }))
  const dailyLimit = Math.max(30, dailyStudyHours * 60)
  const firstDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  for (let offset = 0; offset < 7; offset += 1) {
    const day = new Date(
      firstDay.getFullYear(),
      firstDay.getMonth(),
      firstDay.getDate() + offset,
    )
    let scheduledToday = existingSessions
      .filter(
        (session) =>
          (session.status === 'planned' || session.status === 'in_progress') &&
          new Date(session.starts_at).getFullYear() === day.getFullYear() &&
          new Date(session.starts_at).getMonth() === day.getMonth() &&
          new Date(session.starts_at).getDate() === day.getDate(),
      )
      .reduce(
        (total, session) =>
          total +
          Math.max(
            0,
            (new Date(session.ends_at).getTime() -
              new Date(session.starts_at).getTime()) /
              60_000,
          ),
        0,
      )
    const dayWindows = availability
      .filter((window) => window.weekday === day.getDay())
      .map((window) => ({
        start: timeOnDate(day, window.starts_at),
        end: timeOnDate(day, window.ends_at),
      }))
      .sort((a, b) => a.start.getTime() - b.start.getTime())

    for (const window of dayWindows) {
      let cursor = new Date(
        Math.max(
          window.start.getTime(),
          offset === 0 ? nowTime : window.start.getTime(),
        ),
      )
      cursor.setSeconds(0, 0)

      while (
        cursor.getTime() + 15 * 60_000 <= window.end.getTime() &&
        scheduledToday < dailyLimit
      ) {
        const conflict = busy
          .filter(
            (event) =>
              event.start.getTime() < window.end.getTime() &&
              event.end.getTime() > cursor.getTime(),
          )
          .sort((a, b) => a.start.getTime() - b.start.getTime())[0]
        if (conflict && conflict.start.getTime() <= cursor.getTime()) {
          cursor = new Date(conflict.end.getTime() + 10 * 60_000)
          continue
        }

        const item = topicOrder.find(
          ({ topic }) => (remainingMinutes.get(topic.id) ?? 0) > 0,
        )
        if (!item) break
        const nextConflict = conflict?.start.getTime() ?? window.end.getTime()
        const available = Math.floor(
          (Math.min(window.end.getTime(), nextConflict) - cursor.getTime()) /
            60_000,
        )
        const taskRemaining = remainingMinutes.get(item.topic.id) ?? 0
        const duration = Math.min(
          50,
          taskRemaining,
          available,
          dailyLimit - scheduledToday,
        )
        if (duration < 15) {
          if (conflict) cursor = new Date(conflict.end.getTime() + 10 * 60_000)
          else break
          continue
        }

        const start = new Date(cursor)
        const end = new Date(cursor.getTime() + duration * 60_000)
        sessions.push({
          topicId: item.topic.id,
          subjectId: item.topic.subject_id,
          title: item.topic.title,
          startsAt: start.toISOString(),
          endsAt: end.toISOString(),
          durationMinutes: duration,
        })
        busy.push({ start, end })
        remainingMinutes.set(item.topic.id, taskRemaining - duration)
        scheduledToday += duration
        cursor = new Date(end.getTime() + 10 * 60_000)
      }
    }
  }

  const unscheduled = topicOrder.flatMap(({ topic }) => {
    const minutes = remainingMinutes.get(topic.id) ?? 0
    return minutes > 0
      ? [{ topicId: topic.id, title: topic.title, remainingMinutes: minutes }]
      : []
  })

  return { sessions, unscheduled }
}
