import { describe, it, expect } from 'vitest'
import {
  formatDate,
  formatDateTime,
  getDaysBetween,
  addDays,
  isToday,
  isSameDay,
  getWeekStart,
  getWeekEnd,
  getMonthStart,
  getMonthEnd,
  getDateRange,
} from '../utils/date'

describe('Date Utilities', () => {
  describe('formatDate', () => {
    it('should format date as YYYY-MM-DD', () => {
      const date = new Date(2026, 2, 4) // March 4, 2026
      expect(formatDate(date)).toBe('2026-03-04')
    })

    it('should pad single digit month and day', () => {
      const date = new Date(2026, 0, 1) // January 1, 2026
      expect(formatDate(date)).toBe('2026-01-01')
    })
  })

  describe('formatDateTime', () => {
    it('should format datetime correctly', () => {
      const date = new Date(2026, 2, 4, 14, 30)
      expect(formatDateTime(date)).toBe('2026-03-04 14:30')
    })

    it('should pad hours and minutes', () => {
      const date = new Date(2026, 2, 4, 9, 5)
      expect(formatDateTime(date)).toBe('2026-03-04 09:05')
    })
  })

  describe('getDaysBetween', () => {
    it('should calculate days between two dates', () => {
      const start = new Date(2026, 2, 1)
      const end = new Date(2026, 2, 4)
      expect(getDaysBetween(start, end)).toBe(3)
    })

    it('should return 0 for same day', () => {
      const date = new Date(2026, 2, 4)
      expect(getDaysBetween(date, date)).toBe(0)
    })

    it('should handle negative result when end is before start', () => {
      const start = new Date(2026, 2, 4)
      const end = new Date(2026, 2, 1)
      expect(getDaysBetween(start, end)).toBe(-3)
    })
  })

  describe('addDays', () => {
    it('should add days correctly', () => {
      const date = new Date(2026, 2, 4)
      const result = addDays(date, 5)
      expect(formatDate(result)).toBe('2026-03-09')
    })

    it('should handle month boundary', () => {
      const date = new Date(2026, 2, 30)
      const result = addDays(date, 5)
      expect(formatDate(result)).toBe('2026-04-04')
    })

    it('should handle subtracting days', () => {
      const date = new Date(2026, 2, 4)
      const result = addDays(date, -3)
      expect(formatDate(result)).toBe('2026-03-01')
    })
  })

  describe('isToday', () => {
    it('should return true for today', () => {
      const today = new Date()
      expect(isToday(today)).toBe(true)
    })

    it('should return false for other days', () => {
      const other = new Date(2020, 0, 1)
      expect(isToday(other)).toBe(false)
    })
  })

  describe('isSameDay', () => {
    it('should return true for same day', () => {
      const date1 = new Date(2026, 2, 4, 10, 30)
      const date2 = new Date(2026, 2, 4, 18, 45)
      expect(isSameDay(date1, date2)).toBe(true)
    })

    it('should return false for different days', () => {
      const date1 = new Date(2026, 2, 4)
      const date2 = new Date(2026, 2, 5)
      expect(isSameDay(date1, date2)).toBe(false)
    })
  })

  describe('getWeekStart', () => {
    it('should return Sunday for a date in the middle of week', () => {
      const wednesday = new Date(2026, 2, 4) // Wednesday
      const sunday = getWeekStart(wednesday)
      expect(sunday.getDay()).toBe(0) // Sunday
      expect(formatDate(sunday)).toBe('2026-03-01')
    })
  })

  describe('getWeekEnd', () => {
    it('should return Saturday for a date in the middle of week', () => {
      const wednesday = new Date(2026, 2, 4)
      const saturday = getWeekEnd(wednesday)
      expect(saturday.getDay()).toBe(6) // Saturday
      expect(formatDate(saturday)).toBe('2026-03-07')
    })
  })

  describe('getMonthStart', () => {
    it('should return first day of month', () => {
      const date = new Date(2026, 2, 15)
      const start = getMonthStart(date)
      expect(formatDate(start)).toBe('2026-03-01')
    })
  })

  describe('getMonthEnd', () => {
    it('should return last day of month', () => {
      const date = new Date(2026, 2, 15)
      const end = getMonthEnd(date)
      expect(formatDate(end)).toBe('2026-03-31')
    })

    it('should handle February in leap year', () => {
      const date = new Date(2024, 1, 15) // 2024 is leap year
      const end = getMonthEnd(date)
      expect(formatDate(end)).toBe('2024-02-29')
    })
  })

  describe('getDateRange', () => {
    it('should return array of dates between range', () => {
      const start = new Date(2026, 2, 1)
      const end = new Date(2026, 2, 5)
      const range = getDateRange(start, end)
      expect(range).toHaveLength(5)
      expect(formatDate(range[0])).toBe('2026-03-01')
      expect(formatDate(range[4])).toBe('2026-03-05')
    })

    it('should return single date when start equals end', () => {
      const date = new Date(2026, 2, 4)
      const range = getDateRange(date, date)
      expect(range).toHaveLength(1)
    })
  })
})
