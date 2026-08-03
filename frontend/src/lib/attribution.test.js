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

  it('captures the ad set and ad, not just the campaign', () => {
    const captured = captureAttribution(
      '?utm_campaign=ga5_leads_drain&adset_id=6789&adset_name=atlanta&ad_id=123&ad_name=drain-01&placement=fb%3Afeed',
    )
    expect(captured).toMatchObject({
      adset_id: '6789',
      adset_name: 'atlanta',
      ad_id: '123',
      ad_name: 'drain-01',
      placement: 'fb:feed',
    })
  })

  it('packs a click id into _fbc when the pixel has not written the cookie', () => {
    const captured = captureAttribution('?fbclid=IwAR123')
    expect(captured.fbc).toMatch(/^fb\.1\.\d+\.IwAR123$/)
  })

  it('prefers the pixel cookies over a synthesized click id', () => {
    document.cookie = '_fbp=fb.1.111.222'
    document.cookie = '_fbc=fb.1.333.realclick'
    const captured = captureAttribution('?fbclid=IwAR123')
    expect(captured).toMatchObject({ fbp: 'fb.1.111.222', fbc: 'fb.1.333.realclick' })
    document.cookie = '_fbp=; max-age=0'
    document.cookie = '_fbc=; max-age=0'
  })

  it('leaves the Meta keys off a visit that carried no ad params', () => {
    const captured = captureAttribution('?utm_campaign=ga5_leads_drain')
    expect(captured.fbc).toBeUndefined()
    expect(captured.fbp).toBeUndefined()
  })

  it('caps a param long enough to be an attack rather than an id', () => {
    const captured = captureAttribution(`?fbclid=${'x'.repeat(5000)}`)
    expect(captured.fbclid).toHaveLength(512)
  })
})
