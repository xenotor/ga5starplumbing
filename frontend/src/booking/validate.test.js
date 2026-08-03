import { emptyForm, validate } from './useBooking'

const good = { ...emptyForm, name: 'Dana Kim', phone: '(404) 555-0134', address: '12 Peachtree St NE' }

it('accepts a complete booking', () => {
  expect(validate(good)).toEqual({})
})

it('requires a name', () => {
  expect(validate({ ...good, name: '   ' })).toHaveProperty('name')
})

describe('phone', () => {
  it('is required', () => {
    expect(validate({ ...good, phone: '' })).toHaveProperty('phone')
  })

  it('rejects fewer than ten digits', () => {
    expect(validate({ ...good, phone: '404-555' })).toHaveProperty('phone')
  })

  it('ignores punctuation the customer types', () => {
    expect(validate({ ...good, phone: '+1 (404) 555.0134' })).toEqual({})
  })
})

describe('address', () => {
  it('is required', () => {
    expect(validate({ ...good, address: '' })).toHaveProperty('address')
  })

  it('rejects an address with no street number', () => {
    expect(validate({ ...good, address: 'my house' })).toHaveProperty('address')
  })

  it('rejects something too short to be dispatchable', () => {
    expect(validate({ ...good, address: '12 st' })).toHaveProperty('address')
  })
})

it('leaves email optional', () => {
  expect(validate({ ...good, email: '' })).toEqual({})
})
