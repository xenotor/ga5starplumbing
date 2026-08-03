import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import BookingWidget from './BookingWidget'

const SLOTS = [{ slot: '08:00', label: '8:00 – 10:00 AM', available: true }]

/** Stand-in for the script Cloudflare serves; render() hands back a token. */
function installTurnstile({ autoSolve = true } = {}) {
  const api = {
    render: jest.fn((_el, options) => {
      api.options = options
      if (autoSolve) options.callback('solved-token')
      return 'widget-1'
    }),
    remove: jest.fn(),
    reset: jest.fn(),
  }
  window.turnstile = api
  return api
}

beforeEach(() => {
  global.fetch = jest.fn((url, init) =>
    String(url).includes('/api/availability')
      ? Promise.resolve({ ok: true, json: () => Promise.resolve({ slots: SLOTS }) })
      : Promise.resolve({
          ok: init?.method === 'POST' && !global.__rejectBooking,
          json: () =>
            Promise.resolve(
              global.__rejectBooking
                ? { error: 'captcha_failed' }
                : { date: '2026-03-05', slot: '08:00', reference: 'AB2C4D' },
            ),
        }),
  )
  window.HTMLElement.prototype.scrollIntoView = jest.fn()
  global.__rejectBooking = false
})

afterEach(() => {
  delete window.turnstile
})

async function fillAndSubmit(user) {
  await user.click(await screen.findByRole('button', { name: '8:00 – 10:00 AM' }))
  await user.type(screen.getByLabelText(/^Name/), 'Dana Kim')
  await user.type(screen.getByLabelText(/^Phone/), '4045551234')
  await user.type(screen.getByLabelText(/^Service address/), '12 Peachtree St NE')
  await user.click(screen.getByLabelText(/call me/i))
  await user.click(screen.getByRole('button', { name: /confirm appointment/i }))
}

it('renders the widget with the configured site key', async () => {
  const api = installTurnstile()
  render(<BookingWidget siteKey="0xTESTKEY" />)

  await waitFor(() => expect(api.render).toHaveBeenCalled())
  expect(api.render.mock.calls[0][1]).toMatchObject({
    sitekey: '0xTESTKEY',
    action: 'turnstile-spin-v1',
  })
})

it('sends the solved token with the booking', async () => {
  installTurnstile()
  const user = userEvent.setup()
  render(<BookingWidget siteKey="0xTESTKEY" />)
  await fillAndSubmit(user)

  const post = global.fetch.mock.calls.find(([, init]) => init?.method === 'POST')
  expect(JSON.parse(post[1].body).turnstileToken).toBe('solved-token')
})

it('will not submit until the challenge is solved', async () => {
  installTurnstile({ autoSolve: false })
  const user = userEvent.setup()
  render(<BookingWidget siteKey="0xTESTKEY" />)
  await fillAndSubmit(user)

  expect(await screen.findByRole('alert')).toHaveTextContent(/bot check/i)
  expect(global.fetch.mock.calls.some(([, init]) => init?.method === 'POST')).toBe(false)
})

it('drops an expired token so a stale one is never posted', async () => {
  const api = installTurnstile()
  const user = userEvent.setup()
  render(<BookingWidget siteKey="0xTESTKEY" />)
  await waitFor(() => expect(api.render).toHaveBeenCalled())

  api.options['expired-callback']()
  await fillAndSubmit(user)

  expect(await screen.findByRole('alert')).toHaveTextContent(/bot check/i)
  expect(global.fetch.mock.calls.some(([, init]) => init?.method === 'POST')).toBe(false)
})

it('resets the widget after a rejected booking, since tokens are single-use', async () => {
  const api = installTurnstile()
  global.__rejectBooking = true
  const user = userEvent.setup()
  render(<BookingWidget siteKey="0xTESTKEY" />)
  await fillAndSubmit(user)

  expect(await screen.findByRole('alert')).toHaveTextContent(/bot check did not pass/i)
  expect(api.reset).toHaveBeenCalled()
})

it('omits the check entirely when no site key is configured', async () => {
  const api = installTurnstile()
  render(<BookingWidget siteKey="" />)
  await screen.findByRole('button', { name: '8:00 – 10:00 AM' })
  expect(api.render).not.toHaveBeenCalled()
})
