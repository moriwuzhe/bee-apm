import { defineStore } from 'pinia'
import dayjs from 'dayjs'

const LS_RANGE = 'ms_time_range'

type StoredRange = {
  start: number
  end: number
}

function defaultRange(): StoredRange {
  const end = Date.now()
  const start = end - 10 * 60 * 1000
  return { start, end }
}

function loadRange(): StoredRange {
  try {
    const raw = localStorage.getItem(LS_RANGE)
    if (!raw) return defaultRange()
    const parsed = JSON.parse(raw) as Partial<StoredRange>
    if (!parsed.start || !parsed.end) return defaultRange()
    return { start: Number(parsed.start), end: Number(parsed.end) }
  } catch {
    return defaultRange()
  }
}

export const useTimeRangeStore = defineStore('timeRange', {
  state: () => {
    const r = loadRange()
    return {
      start: new Date(r.start),
      end: new Date(r.end),
    }
  },
  getters: {
    range: (s) => [s.start, s.end] as [Date, Date],
    beginTime: (s) => dayjs(s.start).format('YYYY-MM-DD HH:mm'),
    endTime: (s) => dayjs(s.end).format('YYYY-MM-DD HH:mm'),
  },
  actions: {
    setRange(v: [Date, Date]) {
      this.start = v[0]
      this.end = v[1]
      localStorage.setItem(LS_RANGE, JSON.stringify({ start: this.start.getTime(), end: this.end.getTime() }))
    },
    setQuick(minutes: number) {
      const end = new Date()
      const start = new Date(end.getTime() - minutes * 60 * 1000)
      this.setRange([start, end])
    },
  },
})

