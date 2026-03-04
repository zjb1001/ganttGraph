import { describe, it, expect } from 'vitest'
// import type { Task, Bucket } from '@/types'

// Import the functions we want to test
// Note: Since these are not exported, we need to test them through the public API
// or re-export them for testing

// For now, let's test the utility functions that can be extracted
// We'll create standalone versions for testing

function calculateSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();

  if (s1 === s2) return 1;
  if (s1.length === 0 || s2.length === 0) return 0;

  const matrix: number[][] = [];
  for (let i = 0; i <= s2.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= s1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= s2.length; i++) {
    for (let j = 1; j <= s1.length; j++) {
      if (s2.charAt(i - 1) === s1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  const distance = matrix[s2.length][s1.length];
  const maxLen = Math.max(s1.length, s2.length);
  return 1 - distance / maxLen;
}

function parsePriority(priority?: string): 'Urgent' | 'Important' | 'Normal' | 'Low' {
  switch (priority?.toLowerCase()) {
    case 'urgent': return 'Urgent';
    case 'important': return 'Important';
    case 'low': return 'Low';
    default: return 'Normal';
  }
}

function parseStatus(status?: string): 'NotStarted' | 'InProgress' | 'Completed' {
  switch (status?.toLowerCase()) {
    case 'notstarted': return 'NotStarted';
    case 'inprogress': return 'InProgress';
    case 'completed': return 'Completed';
    default: return 'NotStarted';
  }
}

describe('Agent Tools Utilities', () => {
  describe('calculateSimilarity', () => {
    it('should return 1 for exact match', () => {
      expect(calculateSimilarity('Hello World', 'hello world')).toBe(1)
    })

    it('should return 0 for empty strings', () => {
      expect(calculateSimilarity('', 'test')).toBe(0)
      expect(calculateSimilarity('test', '')).toBe(0)
    })

    it('should calculate similarity for similar strings', () => {
      const sim = calculateSimilarity('kitten', 'sitting')
      expect(sim).toBeGreaterThan(0.5)
      expect(sim).toBeLessThan(1)
    })

    it('should handle case insensitive comparison', () => {
      expect(calculateSimilarity('HELLO', 'hello')).toBe(1)
    })

    it('should handle whitespace trimming', () => {
      expect(calculateSimilarity('  hello  ', 'hello')).toBe(1)
    })

    it('should return low similarity for different strings', () => {
      const sim = calculateSimilarity('apple', 'banana')
      expect(sim).toBeLessThan(0.5)
    })

    it('should return correct similarity for partial matches', () => {
      const sim = calculateSimilarity('backend', 'backend development')
      expect(sim).toBeGreaterThan(0.6)
    })
  })

  describe('parsePriority', () => {
    it('should parse urgent priority', () => {
      expect(parsePriority('urgent')).toBe('Urgent')
      expect(parsePriority('URGENT')).toBe('Urgent')
    })

    it('should parse important priority', () => {
      expect(parsePriority('important')).toBe('Important')
    })

    it('should parse low priority', () => {
      expect(parsePriority('low')).toBe('Low')
    })

    it('should return Normal for unknown or undefined', () => {
      expect(parsePriority()).toBe('Normal')
      expect(parsePriority('unknown')).toBe('Normal')
      expect(parsePriority('')).toBe('Normal')
    })
  })

  describe('parseStatus', () => {
    it('should parse NotStarted status', () => {
      expect(parseStatus('notstarted')).toBe('NotStarted')
      expect(parseStatus('NotStarted')).toBe('NotStarted')
    })

    it('should parse InProgress status', () => {
      expect(parseStatus('inprogress')).toBe('InProgress')
    })

    it('should parse Completed status', () => {
      expect(parseStatus('completed')).toBe('Completed')
    })

    it('should return NotStarted for unknown or undefined', () => {
      expect(parseStatus()).toBe('NotStarted')
      expect(parseStatus('unknown')).toBe('NotStarted')
      expect(parseStatus('')).toBe('NotStarted')
    })
  })
})
