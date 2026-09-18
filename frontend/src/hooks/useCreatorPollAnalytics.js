import { useEffect, useMemo, useState } from 'react'
import { api } from '../api/client'

export default function useCreatorPollAnalytics() {
  const [polls, setPolls] = useState([])
  const [pollAnalytics, setPollAnalytics] = useState({})
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    const loadPolls = async () => {
      try {
        const response = await api.get('/api/polls/mine')

        if (!Array.isArray(response)) {
          throw new Error('The polls response was not in the expected format.')
        }

        const sortedPolls = [...response].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        const nextAnalytics = {}

        await Promise.all(sortedPolls.map(async (poll) => {
          try {
            const result = await api.get(`/api/polls/${poll.id}/results`)
            const counts = result?.counts || {}
            const totalVotes = Object.values(counts).reduce((sum, value) => sum + (Number(value) || 0), 0)

            nextAnalytics[poll.id] = { totalVotes, counts }
          } catch {
            nextAnalytics[poll.id] = { totalVotes: 0, counts: {} }
          }
        }))

        if (!cancelled) {
          setPolls(sortedPolls)
          setPollAnalytics(nextAnalytics)
          setError('')
        }
      } catch (requestError) {
        if (!cancelled) {
          setError(requestError.message || 'Unable to load your polls right now.')
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    loadPolls()

    return () => {
      cancelled = true
    }
  }, [])

  const analytics = useMemo(() => {
    const performance = polls
      .map((poll) => ({
        id: poll.id,
        question: poll.question,
        votes: pollAnalytics[poll.id]?.totalVotes || 0,
        isActive: poll.isActive,
      }))
      .sort((a, b) => b.votes - a.votes)

    return {
      totalPolls: polls.length,
      activePolls: polls.filter((poll) => poll.isActive).length,
      totalVotes: performance.reduce((sum, poll) => sum + poll.votes, 0),
      maxVotes: Math.max(1, ...performance.map((poll) => poll.votes)),
      performance,
    }
  }, [polls, pollAnalytics])

  return {
    polls,
    setPolls,
    pollAnalytics,
    setPollAnalytics,
    analytics,
    isLoading,
    error,
  }
}
