import '@testing-library/jest-dom'

// The booking widget remembers this browser's own bookings in localStorage and
// greys those windows out; leaking that between tests hides slots the next test
// needs to click.
beforeEach(() => {
  window.localStorage.clear()
})
