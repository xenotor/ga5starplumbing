import { dateKeyIn, upcomingDays } from './dates'

describe('dateKeyIn', () => {
  it('reads the date in the business timezone, not the browser', () => {
    // 03:30 UTC on the 5th is still 23:30 on the 4th in Atlanta.
    const instant = new Date('2026-03-05T03:30:00Z')
    expect(dateKeyIn(instant, 'America/New_York')).toBe('2026-03-04')
    expect(dateKeyIn(instant, 'UTC')).toBe('2026-03-05')
  })
})

describe('upcomingDays', () => {
  it('starts on the business-timezone today', () => {
    const days = upcomingDays(3, 'America/New_York', new Date('2026-03-05T03:30:00Z'))
    expect(days.map((day) => day.key)).toEqual(['2026-03-04', '2026-03-05', '2026-03-06'])
  })

  it('crosses a month boundary without repeating a day', () => {
    const days = upcomingDays(4, 'UTC', new Date('2026-01-30T12:00:00Z'))
    expect(days.map((day) => day.key)).toEqual(['2026-01-30', '2026-01-31', '2026-02-01', '2026-02-02'])
  })

  it('keeps consecutive days across the spring DST change', () => {
    // US DST starts 2026-03-08; a naive local-hours walk drops or repeats a day.
    const days = upcomingDays(3, 'America/New_York', new Date('2026-03-07T15:00:00Z'))
    expect(days.map((day) => day.key)).toEqual(['2026-03-07', '2026-03-08', '2026-03-09'])
  })

  it('labels each chip for screen readers', () => {
    const [first] = upcomingDays(1, 'UTC', new Date('2026-03-05T12:00:00Z'))
    expect(first).toMatchObject({ weekday: 'Thu', dayOfMonth: '5', month: 'Mar' })
    expect(first.label).toBe('Thursday, March 5')
  })
})
