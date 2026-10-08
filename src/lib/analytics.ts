export interface AnalyticsSubject {
  id: string
  name: string
  progress: number
}

export interface AnalyticsTopic {
  subject_id: string
  mastery: number
}

export interface AnalyticsSession {
  subject_id: string | null
  starts_at: string
  status: 'planned' | 'in_progress' | 'completed' | 'missed' | 'cancelled'
  completed_minutes: number
}

export interface WeeklyStudyDay {
  date: string
  day: string
  hours: number
}

export interface SubjectProgress {
  subjectId: string
  name: string
  progress: number
  missedSessions: number
}

export function buildAnalytics(
  subjects: AnalyticsSubject[],
  topics: AnalyticsTopic[],
  sessions: AnalyticsSession[],
  today = new Date(),
) {
  const weekStart = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 6)
  const weeklyStudy: WeeklyStudyDay[] = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + index)
    const key = date.toLocaleDateString('en-CA')
    const minutes = sessions
      .filter((session) => session.status === 'completed' && session.starts_at.slice(0, 10) === key)
      .reduce((total, session) => total + session.completed_minutes, 0)
    return { date: key, day: date.toLocaleDateString(undefined, { weekday: 'short' }), hours: Math.round((minutes / 60) * 10) / 10 }
  })

  const subjectProgress = subjects.map((subject) => {
    const subjectTopics = topics.filter((topic) => topic.subject_id === subject.id)
    const progress = subjectTopics.length
      ? Math.round(subjectTopics.reduce((total, topic) => total + topic.mastery, 0) / subjectTopics.length)
      : subject.progress
    const missedSessions = sessions.filter((session) => session.subject_id === subject.id && session.status === 'missed').length
    return { subjectId: subject.id, name: subject.name, progress, missedSessions }
  })

  const completed = sessions.filter((session) => session.status === 'completed').length
  const missed = sessions.filter((session) => session.status === 'missed').length
  const totalTracked = completed + missed

  return {
    weeklyStudy,
    subjectProgress,
    completed,
    missed,
    completionRate: totalTracked ? Math.round((completed / totalTracked) * 100) : 0,
    totalStudyHours: Math.round((weeklyStudy.reduce((sum, day) => sum + day.hours, 0)) * 10) / 10,
  }
}
