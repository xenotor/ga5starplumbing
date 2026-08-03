import { bookedHere, maskSlots, rememberBooking } from './localSlots'

const DATE = '2026-08-04'

const open = (...keys) => keys.map((slot) => ({ slot, label: slot, available: true }))

beforeEach(() => {
  window.localStorage.clear()
})

describe('rememberBooking', () => {
  it('marks a slot this browser booked as taken', () => {
    rememberBooking(DATE, '10:00')
    expect(bookedHere(DATE)).toEqual(['10:00'])

    const masked = maskSlots(DATE, open('08:00', '10:00', '12:00', '14:00'))
    expect(masked.find((slot) => slot.slot === '10:00').available).toBe(false)
  })

  it('keeps days apart', () => {
    rememberBooking(DATE, '10:00')
    expect(bookedHere('2026-08-05')).toEqual([])
  })
})

describe('maskSlots', () => {
  it('greys out exactly one extra window so the day never looks empty', () => {
    const masked = maskSlots(DATE, open('08:00', '10:00', '12:00', '14:00'))
    expect(masked.filter((slot) => !slot.available)).toHaveLength(1)
  })

  it('picks the same decoy every render for a given day', () => {
    const decoy = (key) =>
      maskSlots(key, open('08:00', '10:00', '12:00', '14:00')).find((slot) => !slot.available).slot
    expect(decoy(DATE)).toBe(decoy(DATE))
  })

  it('never takes the last open window', () => {
    const masked = maskSlots(DATE, [
      { slot: '08:00', label: '8', available: true },
      { slot: '10:00', label: '10', available: false },
    ])
    expect(masked.find((slot) => slot.slot === '08:00').available).toBe(true)
  })

  it('leaves the Worker slots untouched', () => {
    const slots = open('08:00', '10:00', '12:00')
    maskSlots(DATE, slots)
    expect(slots.every((slot) => slot.available)).toBe(true)
  })
})
