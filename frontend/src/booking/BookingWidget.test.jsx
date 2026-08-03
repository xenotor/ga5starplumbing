import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import BookingWidget from './BookingWidget'

const SLOTS = [
  { slot: '08:00', label: '8:00 – 10:00 AM', available: true },
  { slot: '10:00', label: '10:00 AM – 12:00 PM', available: false },
]

function mockApi({ book = { ok: true, body: {} } } = {}) {
  return jest.fn((url, init) => {
    if (String(url).includes('/api/availability')) {
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ slots: SLOTS }) })
    }
    if (String(url).includes('/api/appointments') && init?.method === 'POST') {
      return Promise.resolve({ ok: book.ok, json: () => Promise.resolve(book.body) })
    }
    throw new Error(`unexpected fetch: ${url}`)
  })
}

async function fillContactDetails(user) {
  await user.type(screen.getByLabelText(/^Name/), 'Dana Kim')
  await user.type(screen.getByLabelText(/^Phone/), '4045551234')
  await user.type(screen.getByLabelText(/^Service address/), '12 Peachtree St')
  // Both contact boxes start blank, so every booking has to pick one.
  await user.click(screen.getByLabelText(/text me/i))
  await user.click(screen.getByLabelText(/call me/i))
}

// The bot check is exercised in its own file; here it is switched off so the
// booking assertions stay about booking.
function renderWidget(props = {}) {
  return render(<BookingWidget siteKey="" {...props} />)
}

beforeEach(() => {
  global.fetch = mockApi()
  window.HTMLElement.prototype.scrollIntoView = jest.fn()
})

it('loads the first day and disables a taken window', async () => {
  renderWidget()
  await screen.findByRole('button', { name: '8:00 – 10:00 AM' })
  expect(screen.getByRole('button', { name: '10:00 AM – 12:00 PM' })).toBeDisabled()
})

it('books the selected day and slot', async () => {
  global.fetch = mockApi({
    book: { ok: true, body: { date: '2026-03-05', slot: '08:00', reference: 'AB2C4D' } },
  })
  const user = userEvent.setup()
  renderWidget()

  await user.click(await screen.findByRole('button', { name: '8:00 – 10:00 AM' }))
  await fillContactDetails(user)
  await user.click(screen.getByRole('button', { name: /confirm appointment/i }))

  expect(await screen.findByText(/you are booked/i)).toBeInTheDocument()
  expect(screen.getByText('AB2C4D')).toBeInTheDocument()

  const post = global.fetch.mock.calls.find(([, init]) => init?.method === 'POST')
  expect(JSON.parse(post[1].body)).toMatchObject({
    slot: '08:00',
    name: 'Dana Kim',
    contactPref: 'text,call',
  })
})

it('refuses to submit without a time window', async () => {
  const user = userEvent.setup()
  renderWidget()
  await screen.findByRole('button', { name: '8:00 – 10:00 AM' })

  await fillContactDetails(user)
  await user.click(screen.getByRole('button', { name: /confirm appointment/i }))

  expect(await screen.findByRole('alert')).toHaveTextContent(/pick a time/i)
  expect(global.fetch.mock.calls.some(([, init]) => init?.method === 'POST')).toBe(false)
})

it('explains a slot lost to a race in the customer’s words', async () => {
  global.fetch = mockApi({ book: { ok: false, body: { error: 'slot_unavailable' } } })
  const user = userEvent.setup()
  renderWidget()

  await user.click(await screen.findByRole('button', { name: '8:00 – 10:00 AM' }))
  await fillContactDetails(user)
  await user.click(screen.getByRole('button', { name: /confirm appointment/i }))

  expect(await screen.findByRole('alert')).toHaveTextContent(/just taken/i)
})

it('sends availability and booking to the configured origin', async () => {
  renderWidget({ apiBase: 'https://ga5starplumbing.com' })
  await waitFor(() =>
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('https://ga5starplumbing.com/api/availability'),
      expect.anything(),
    ),
  )
})

it('sends only the contact channels left ticked', async () => {
  const user = userEvent.setup()
  renderWidget()

  await user.click(await screen.findByRole('button', { name: '8:00 – 10:00 AM' }))
  await fillContactDetails(user)
  await user.click(screen.getByLabelText(/text me/i)) // leaves only "Call me"
  await user.click(screen.getByRole('button', { name: /confirm appointment/i }))

  const post = await waitFor(() =>
    global.fetch.mock.calls.find(([, init]) => init?.method === 'POST'),
  )
  expect(JSON.parse(post[1].body).contactPref).toBe('call')
})

it('will not submit with no way to reach the customer', async () => {
  const user = userEvent.setup()
  renderWidget()

  await user.click(await screen.findByRole('button', { name: '8:00 – 10:00 AM' }))
  await fillContactDetails(user)
  await user.click(screen.getByLabelText(/text me/i)) // untick both again
  await user.click(screen.getByLabelText(/call me/i))
  await user.click(screen.getByRole('button', { name: /confirm appointment/i }))

  expect(await screen.findByText(/pick at least one/i)).toBeInTheDocument()
  expect(global.fetch.mock.calls.some(([, init]) => init?.method === 'POST')).toBe(false)
})
