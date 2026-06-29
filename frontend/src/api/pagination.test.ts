import { describe, it, expect } from 'vitest'
import { ACTIVITIES_PAGE_SIZE, DAILY_SUMMARIES_PAGE_SIZE } from './hooks'

// Mirrors the getNextPageParam logic used in useActivities / useDailySummaries
function activitiesNextPage(lastPage: unknown[], lastPageParam: number): number | undefined {
  return lastPage.length === ACTIVITIES_PAGE_SIZE ? lastPageParam + 1 : undefined
}

function dailyNextPage(lastPage: unknown[], lastPageParam: number): number | undefined {
  return lastPage.length === DAILY_SUMMARIES_PAGE_SIZE ? lastPageParam + 1 : undefined
}

describe('infinite query pagination — activities', () => {
  it('returns next page when current page is full', () => {
    const fullPage = Array.from({ length: ACTIVITIES_PAGE_SIZE })
    expect(activitiesNextPage(fullPage, 1)).toBe(2)
    expect(activitiesNextPage(fullPage, 5)).toBe(6)
  })

  it('returns undefined when current page is not full', () => {
    expect(activitiesNextPage([], 1)).toBeUndefined()
    expect(activitiesNextPage(Array.from({ length: 10 }), 2)).toBeUndefined()
    expect(activitiesNextPage(Array.from({ length: ACTIVITIES_PAGE_SIZE - 1 }), 3)).toBeUndefined()
  })
})

describe('infinite query pagination — daily summaries', () => {
  it('returns next page when current page is full', () => {
    const fullPage = Array.from({ length: DAILY_SUMMARIES_PAGE_SIZE })
    expect(dailyNextPage(fullPage, 1)).toBe(2)
  })

  it('returns undefined on the last partial page', () => {
    expect(dailyNextPage(Array.from({ length: 15 }), 2)).toBeUndefined()
    expect(dailyNextPage([], 1)).toBeUndefined()
  })
})

describe('page flattening', () => {
  it('flattens multiple pages into a single array', () => {
    const pages = [[1, 2, 3], [4, 5, 6], [7]]
    expect(pages.flat()).toEqual([1, 2, 3, 4, 5, 6, 7])
  })

  it('returns empty array for no pages', () => {
    const pages: number[][] = []
    expect(pages.flat()).toEqual([])
  })

  it('preserves order across pages', () => {
    const pages = [['a', 'b'], ['c', 'd']]
    expect(pages.flat()).toEqual(['a', 'b', 'c', 'd'])
  })
})
