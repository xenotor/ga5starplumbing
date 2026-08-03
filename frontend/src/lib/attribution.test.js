import { captureAttribution, getAttribution } from './attribution'

describe('attribution', () => {
  beforeEach(() => sessionStorage.clear())

  it('captures Facebook ad params from the landing URL', () => {
    const captured = captureAttribution('?fbclid=IwAR123&utm_source=facebook&utm_campaign=atl-drains')
    expect(captured).toMatchObject({
      fbclid: 'IwAR123',
      utm_source: 'facebook',
      utm_campaign: 'atl-drains',
    })
  })

  it('survives a later navigation that has no ad params', () => {
    captureAttribution('?fbclid=IwAR123')
    expect(captureAttribution('')).toMatchObject({ fbclid: 'IwAR123' })
    expect(getAttribution()).toMatchObject({ fbclid: 'IwAR123' })
  })

  it('lets a fresh ad click take over the credit', () => {
    captureAttribution('?utm_campaign=old')
    expect(captureAttribution('?utm_campaign=new')).toMatchObject({ utm_campaign: 'new' })
  })

  it('ignores params it was not asked to track', () => {
    expect(captureAttribution('?evil=<script>')).toEqual({})
  })

  it('caps a param long enough to be an attack rather than an id', () => {
    const captured = captureAttribution(`?fbclid=${'x'.repeat(5000)}`)
    expect(captured.fbclid).toHaveLength(512)
  })
})
