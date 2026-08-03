import { screen } from '@testing-library/react'

// The embed mounts itself on import, so the host element has to exist first.
beforeEach(() => {
  jest.resetModules()
  document.body.innerHTML =
    '<div data-ga5-booking data-api-base="https://ga5starplumbing.com" data-title="Book your plumber"></div>'
  global.fetch = jest.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve({ slots: [] }) }))
})

it('mounts into every host element and honours its data attributes', async () => {
  await import('./embed.jsx')

  expect(await screen.findByText('Book your plumber')).toBeInTheDocument()
  expect(global.fetch).toHaveBeenCalledWith(
    expect.stringContaining('https://ga5starplumbing.com/api/availability'),
    expect.anything(),
  )
})

it('does not mount twice over the same element', async () => {
  const { mountBooking } = await import('./embed.jsx')
  await screen.findByText('Book your plumber')

  const host = document.querySelector('[data-ga5-booking]')
  expect(host.dataset.ga5BookingMounted).toBe('true')

  mountBooking(host)
  expect(document.querySelectorAll('form').length).toBe(1)
})
