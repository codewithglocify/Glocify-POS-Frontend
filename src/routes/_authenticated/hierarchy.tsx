import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type MouseEvent,
  type ReactNode,
} from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'

import { listBrands } from '#/lib/api/brands'
import { ApiError } from '#/lib/api/client'
import {
  attachCountry,
  detachCountry,
  listMasterCountries,
  listOrgCountries,
} from '#/lib/api/countries'
import { listMasterCurrencies } from '#/lib/api/currencies'
import {
  attachRegion,
  detachRegion,
  listMasterRegions,
  listOrgRegions,
} from '#/lib/api/regions'
import { createStore, listStores } from '#/lib/api/stores'
import { formatConcept } from '#/lib/format'
import type { Brand, Country, Currency, Region, Store } from '#/lib/api/types'

export const Route = createFileRoute('/_authenticated/hierarchy')({
  component: HierarchyPage,
})

type Level = 'Organisation' | 'Region' | 'Country' | 'Brand' | 'Store'

type Selection =
  | { level: 'Organisation'; id: 'ORG' }
  | { level: 'Region'; id: string }
  | { level: 'Country'; id: string }
  | { level: 'Brand'; id: string; countryId: string; brandId: string }
  | { level: 'Store'; id: string }

type DrawerKind = 'attach-region' | 'attach-country' | 'create-store' | null

const CONCEPTS = ['FULL_PRICE', 'OUTLET', 'MULTI_BRAND', 'OTHER'] as const

function HierarchyPage() {
  const navigate = useNavigate()

  const [orgRegions, setOrgRegions] = useState<Array<Region>>([])
  const [masterRegions, setMasterRegions] = useState<Array<Region>>([])
  const [orgCountries, setOrgCountries] = useState<Array<Country>>([])
  const [masterCountries, setMasterCountries] = useState<Array<Country>>([])
  const [brands, setBrands] = useState<Array<Brand>>([])
  const [stores, setStores] = useState<Array<Store>>([])
  const [currencies, setCurrencies] = useState<Array<Currency>>([])

  const [selected, setSelected] = useState<Selection>({
    level: 'Organisation',
    id: 'ORG',
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const [drawer, setDrawer] = useState<DrawerKind>(null)
  const [pickId, setPickId] = useState('')
  const [storeForm, setStoreForm] = useState({
    brandId: '',
    countryId: '',
    code: '',
    name: '',
    concept: 'FULL_PRICE',
    timezone: 'UTC',
    currencyCode: '',
    languageCode: 'en',
    addressLine1: '',
    city: '',
    postalCode: '',
  })

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [
        attachedRegions,
        allRegions,
        attachedCountries,
        allCountries,
        brandList,
        storeList,
        currencyList,
      ] = await Promise.all([
        listOrgRegions(),
        listMasterRegions(),
        listOrgCountries(),
        listMasterCountries(),
        listBrands(),
        listStores(),
        listMasterCurrencies(),
      ])
      setOrgRegions(attachedRegions)
      setMasterRegions(allRegions)
      setOrgCountries(attachedCountries)
      setMasterCountries(allCountries)
      setBrands(brandList)
      setStores(storeList)
      setCurrencies(currencyList)
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        await navigate({ to: '/login' })
        return
      }
      setError(err instanceof Error ? err.message : 'Failed to load hierarchy')
    } finally {
      setLoading(false)
    }
  }, [navigate])

  useEffect(() => {
    void load()
  }, [load])

  const orgRegionIds = useMemo(
    () => new Set(orgRegions.map((r) => r.id)),
    [orgRegions],
  )
  const orgCountryIds = useMemo(
    () => new Set(orgCountries.map((c) => c.id)),
    [orgCountries],
  )

  const countriesByRegion = useCallback(
    (regionId: string) =>
      orgCountries.filter((country) => country.regionId === regionId),
    [orgCountries],
  )

  const brandsInCountry = useCallback(
    (countryId: string) => {
      const brandIds = new Set(
        stores
          .filter((store) => store.countryId === countryId)
          .map((store) => store.brandId),
      )
      return brands.filter((brand) => brandIds.has(brand.id))
    },
    [brands, stores],
  )

  const storesFor = useCallback(
    (countryId: string, brandId: string) =>
      stores.filter(
        (store) =>
          store.countryId === countryId && store.brandId === brandId,
      ),
    [stores],
  )

  function isSelected(level: Level, id: string) {
    if (selected.level === 'Brand') {
      return (
        level === 'Brand' &&
        selected.id === id
      )
    }
    return selected.level === level && selected.id === id
  }

  function selectNode(next: Selection, event?: MouseEvent) {
    if (event && (event.target as HTMLElement).tagName === 'SUMMARY') {
      event.preventDefault()
      const details = (event.target as HTMLElement).closest('details')
      if (details) {
        details.open = true
      }
    }
    setSelected(next)
  }

  const availableRegions = masterRegions.filter((r) => !orgRegionIds.has(r.id))
  const availableCountries = useMemo(() => {
    if (selected.level !== 'Region') {
      return []
    }
    return masterCountries.filter(
      (country) =>
        country.regionId === selected.id && !orgCountryIds.has(country.id),
    )
  }, [masterCountries, orgCountryIds, selected])

  function openAttachRegion() {
    setPickId(availableRegions[0]?.id ?? '')
    setDrawer('attach-region')
  }

  function openAttachCountry() {
    if (selected.level !== 'Region') {
      return
    }
    setPickId(availableCountries[0]?.id ?? '')
    setDrawer('attach-country')
  }

  function resolveCurrencyCode(preferred?: string) {
    if (preferred && currencies.some((currency) => currency.code === preferred)) {
      return preferred
    }
    return currencies[0]?.code ?? ''
  }

  function openCreateStore(countryId: string, brandId?: string) {
    const country = orgCountries.find((c) => c.id === countryId)
    setStoreForm({
      brandId: brandId ?? brands[0]?.id ?? '',
      countryId,
      code: '',
      name: '',
      concept: 'FULL_PRICE',
      timezone: country?.timezone ?? 'UTC',
      currencyCode: resolveCurrencyCode(country?.defaultCurrencyCode),
      languageCode: country?.defaultLanguageCode ?? 'en',
      addressLine1: '',
      city: '',
      postalCode: '',
    })
    setDrawer('create-store')
  }

  async function handleAttachRegion() {
    if (!pickId) {
      return
    }
    setBusy(true)
    setError(null)
    try {
      await attachRegion(pickId)
      setDrawer(null)
      await load()
      setSelected({ level: 'Region', id: pickId })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to attach region')
    } finally {
      setBusy(false)
    }
  }

  async function handleAttachCountry() {
    if (!pickId) {
      return
    }
    setBusy(true)
    setError(null)
    try {
      await attachCountry(pickId)
      setDrawer(null)
      await load()
      setSelected({ level: 'Country', id: pickId })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to attach country')
    } finally {
      setBusy(false)
    }
  }

  async function handleDetachRegion(regionId: string) {
    setBusy(true)
    setError(null)
    try {
      await detachRegion(regionId)
      setSelected({ level: 'Organisation', id: 'ORG' })
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to detach region')
    } finally {
      setBusy(false)
    }
  }

  async function handleDetachCountry(countryId: string) {
    setBusy(true)
    setError(null)
    try {
      await detachCountry(countryId)
      const country = orgCountries.find((c) => c.id === countryId)
      setSelected(
        country
          ? { level: 'Region', id: country.regionId }
          : { level: 'Organisation', id: 'ORG' },
      )
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to detach country')
    } finally {
      setBusy(false)
    }
  }

  async function handleCreateStore() {
    setBusy(true)
    setError(null)
    try {
      const created = await createStore({
        brandId: storeForm.brandId,
        countryId: storeForm.countryId,
        code: storeForm.code,
        name: storeForm.name,
        concept: storeForm.concept,
        timezone: storeForm.timezone,
        currencyCode: storeForm.currencyCode,
        languageCode: storeForm.languageCode,
        addressLine1: storeForm.addressLine1 || undefined,
        city: storeForm.city || undefined,
        postalCode: storeForm.postalCode || undefined,
      })
      setDrawer(null)
      await load()
      setSelected({ level: 'Store', id: created.id })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create store')
    } finally {
      setBusy(false)
    }
  }

  function addChildAction() {
    switch (selected.level) {
      case 'Organisation':
        return { label: 'Attach region', onClick: openAttachRegion }
      case 'Region':
        return { label: 'Attach country', onClick: openAttachCountry }
      case 'Country':
        return {
          label: 'Add store',
          onClick: () => openCreateStore(selected.id),
        }
      case 'Brand':
        return {
          label: 'Add store',
          onClick: () =>
            openCreateStore(selected.countryId, selected.brandId),
        }
      default:
        return null
    }
  }

  const addChild = addChildAction()

  return (
    <>
      <div className="page-head">
        <div className="titles">
          <div className="crumbs">
            <span>Organisation</span>
            <span>/</span>
            <span>Hierarchy</span>
          </div>
          <h1>Hierarchy</h1>
          <p>
            The organisation model every setting, report and permission hangs
            off: Region → Country → Brand → Store.
          </p>
        </div>
        <div className="actions">
          <button type="button" className="btn" onClick={() => void load()}>
            Refresh
          </button>
        </div>
      </div>

      {error ? (
        <p role="alert" className="alert-error">
          {error}
        </p>
      ) : null}

      {loading ? (
        <div className="panel">
          <div className="panel-b muted">Loading hierarchy…</div>
        </div>
      ) : (
        <div className="grid g-1-2">
          <section className="panel">
            <div className="panel-h">
              <h2>Organisation tree</h2>
              <span className="sub">{stores.length} stores</span>
            </div>
            <div className="tree">
              <details open>
                <summary
                  className={isSelected('Organisation', 'ORG') ? 'sel' : ''}
                  onClick={(e) =>
                    selectNode({ level: 'Organisation', id: 'ORG' }, e)
                  }
                >
                  <b>Organisation</b>
                  <span className="lvl">Global</span>
                </summary>

                {orgRegions.map((region) => {
                  const regionCountries = countriesByRegion(region.id)
                  return (
                    <details key={region.id} open>
                      <summary
                        className={
                          isSelected('Region', region.id) ? 'sel' : ''
                        }
                        onClick={(e) =>
                          selectNode({ level: 'Region', id: region.id }, e)
                        }
                      >
                        {region.code}{' '}
                        <span className="muted small">{region.name}</span>
                        <span className="lvl">Region</span>
                      </summary>

                      {regionCountries.map((country) => {
                        const countryBrands = brandsInCountry(country.id)
                        return (
                          <details key={country.id} open>
                            <summary
                              className={
                                isSelected('Country', country.id) ? 'sel' : ''
                              }
                              onClick={(e) =>
                                selectNode(
                                  { level: 'Country', id: country.id },
                                  e,
                                )
                              }
                            >
                              {country.name}
                              <span className="lvl">
                                {
                                  stores.filter(
                                    (s) => s.countryId === country.id,
                                  ).length
                                }{' '}
                                stores
                              </span>
                            </summary>

                            {countryBrands.map((brand) => {
                              const brandKey = `${country.id}:${brand.id}`
                              const brandStores = storesFor(
                                country.id,
                                brand.id,
                              )
                              return (
                                <details key={brandKey} open>
                                  <summary
                                    className={
                                      isSelected('Brand', brandKey)
                                        ? 'sel'
                                        : ''
                                    }
                                    onClick={(e) =>
                                      selectNode(
                                        {
                                          level: 'Brand',
                                          id: brandKey,
                                          countryId: country.id,
                                          brandId: brand.id,
                                        },
                                        e,
                                      )
                                    }
                                  >
                                    {brand.name}
                                    <span className="lvl">Brand</span>
                                  </summary>
                                  {brandStores.map((store) => (
                                    <div
                                      key={store.id}
                                      className={`leaf${isSelected('Store', store.id) ? ' sel' : ''}`}
                                      tabIndex={0}
                                      role="button"
                                      onClick={() =>
                                        selectNode({
                                          level: 'Store',
                                          id: store.id,
                                        })
                                      }
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                          selectNode({
                                            level: 'Store',
                                            id: store.id,
                                          })
                                        }
                                      }}
                                    >
                                      {store.code}
                                      <span className="lvl">
                                        {formatConcept(store.concept)}
                                      </span>
                                    </div>
                                  ))}
                                </details>
                              )
                            })}

                            {countryBrands.length === 0 ? (
                              <div className="leaf muted">
                                No brands with stores in this country yet
                              </div>
                            ) : null}
                          </details>
                        )
                      })}
                    </details>
                  )
                })}
              </details>
            </div>
            <div className="empty-note">
              Showing Region → Country → Brand → Store from attached
              organisation data. Brands appear under a country once stores link
              them.
            </div>
          </section>

          <HierarchyDetail
            selected={selected}
            orgRegions={orgRegions}
            orgCountries={orgCountries}
            brands={brands}
            stores={stores}
            countriesByRegion={countriesByRegion}
            storesFor={storesFor}
            addChild={addChild}
            busy={busy}
            onDetachRegion={(id) => void handleDetachRegion(id)}
            onDetachCountry={(id) => void handleDetachCountry(id)}
          />
        </div>
      )}

      {drawer ? (
        <>
          <button
            type="button"
            className="scrim"
            aria-label="Close drawer"
            onClick={() => setDrawer(null)}
            style={{ border: 0, padding: 0, cursor: 'pointer' }}
          />
          <aside className="drawer" role="dialog">
            {drawer === 'attach-region' ? (
              <>
                <div className="drawer-h">
                  <div className="titles">
                    <div className="eyebrow">Attach</div>
                    <h2>Attach region</h2>
                  </div>
                  <button
                    type="button"
                    className="iconbtn drawer-close"
                    aria-label="Close"
                    onClick={() => setDrawer(null)}
                  >
                    ×
                  </button>
                </div>
                <div className="drawer-b">
                  {availableRegions.length === 0 ? (
                    <div className="callout">
                      All master regions are already attached.
                    </div>
                  ) : (
                    <div className="field">
                      <label htmlFor="attach-region">Region</label>
                      <select
                        id="attach-region"
                        className="input"
                        value={pickId}
                        onChange={(e) => setPickId(e.target.value)}
                      >
                        {availableRegions.map((region) => (
                          <option key={region.id} value={region.id}>
                            {region.code} · {region.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
                <div className="drawer-f">
                  <button
                    type="button"
                    className="btn"
                    onClick={() => setDrawer(null)}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn primary"
                    disabled={busy || !pickId || availableRegions.length === 0}
                    onClick={() => void handleAttachRegion()}
                  >
                    {busy ? 'Attaching…' : 'Attach'}
                  </button>
                </div>
              </>
            ) : null}

            {drawer === 'attach-country' ? (
              <>
                <div className="drawer-h">
                  <div className="titles">
                    <div className="eyebrow">Attach</div>
                    <h2>Attach country</h2>
                  </div>
                  <button
                    type="button"
                    className="iconbtn drawer-close"
                    aria-label="Close"
                    onClick={() => setDrawer(null)}
                  >
                    ×
                  </button>
                </div>
                <div className="drawer-b">
                  {availableCountries.length === 0 ? (
                    <div className="callout">
                      No unattached countries left for this region.
                    </div>
                  ) : (
                    <div className="field">
                      <label htmlFor="attach-country">Country</label>
                      <select
                        id="attach-country"
                        className="input"
                        value={pickId}
                        onChange={(e) => setPickId(e.target.value)}
                      >
                        {availableCountries.map((country) => (
                          <option key={country.id} value={country.id}>
                            {country.isoCode} · {country.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  <div className="callout">
                    New countries start with values inherited from their parent
                    region.
                  </div>
                </div>
                <div className="drawer-f">
                  <button
                    type="button"
                    className="btn"
                    onClick={() => setDrawer(null)}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn primary"
                    disabled={
                      busy || !pickId || availableCountries.length === 0
                    }
                    onClick={() => void handleAttachCountry()}
                  >
                    {busy ? 'Attaching…' : 'Attach'}
                  </button>
                </div>
              </>
            ) : null}

            {drawer === 'create-store' ? (
              <>
                <div className="drawer-h">
                  <div className="titles">
                    <div className="eyebrow">Create</div>
                    <h2>Add store</h2>
                  </div>
                  <button
                    type="button"
                    className="iconbtn drawer-close"
                    aria-label="Close"
                    onClick={() => setDrawer(null)}
                  >
                    ×
                  </button>
                </div>
                <div className="drawer-b">
                  <div className="form-grid">
                    <div className="field">
                      <label htmlFor="hs-brand">Brand</label>
                      <select
                        id="hs-brand"
                        className="input"
                        value={storeForm.brandId}
                        onChange={(e) =>
                          setStoreForm((f) => ({
                            ...f,
                            brandId: e.target.value,
                          }))
                        }
                      >
                        {brands.map((brand) => (
                          <option key={brand.id} value={brand.id}>
                            {brand.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="field">
                      <label htmlFor="hs-country">Country</label>
                      <select
                        id="hs-country"
                        className="input"
                        value={storeForm.countryId}
                        onChange={(e) =>
                          setStoreForm((f) => ({
                            ...f,
                            countryId: e.target.value,
                          }))
                        }
                      >
                        {orgCountries.map((country) => (
                          <option key={country.id} value={country.id}>
                            {country.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="field">
                      <label htmlFor="hs-code">Code</label>
                      <input
                        id="hs-code"
                        className="input mono"
                        value={storeForm.code}
                        onChange={(e) =>
                          setStoreForm((f) => ({
                            ...f,
                            code: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className="field">
                      <label htmlFor="hs-name">Name</label>
                      <input
                        id="hs-name"
                        className="input"
                        value={storeForm.name}
                        onChange={(e) =>
                          setStoreForm((f) => ({
                            ...f,
                            name: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className="field">
                      <label htmlFor="hs-concept">Concept</label>
                      <select
                        id="hs-concept"
                        className="input"
                        value={storeForm.concept}
                        onChange={(e) =>
                          setStoreForm((f) => ({
                            ...f,
                            concept: e.target.value,
                          }))
                        }
                      >
                        {CONCEPTS.map((value) => (
                          <option key={value} value={value}>
                            {formatConcept(value)}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="field">
                      <label htmlFor="hs-tz">Timezone</label>
                      <input
                        id="hs-tz"
                        className="input"
                        value={storeForm.timezone}
                        onChange={(e) =>
                          setStoreForm((f) => ({
                            ...f,
                            timezone: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className="field">
                      <label htmlFor="hs-cur">Currency</label>
                      <select
                        id="hs-cur"
                        className="input"
                        value={storeForm.currencyCode}
                        onChange={(e) =>
                          setStoreForm((f) => ({
                            ...f,
                            currencyCode: e.target.value,
                          }))
                        }
                      >
                        {currencies.map((currency) => (
                          <option key={currency.code} value={currency.code}>
                            {currency.code} · {currency.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="field">
                      <label htmlFor="hs-lang">Language</label>
                      <input
                        id="hs-lang"
                        className="input"
                        value={storeForm.languageCode}
                        onChange={(e) =>
                          setStoreForm((f) => ({
                            ...f,
                            languageCode: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className="field">
                      <label htmlFor="hs-city">City</label>
                      <input
                        id="hs-city"
                        className="input"
                        value={storeForm.city}
                        onChange={(e) =>
                          setStoreForm((f) => ({
                            ...f,
                            city: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className="field">
                      <label htmlFor="hs-addr">Address</label>
                      <input
                        id="hs-addr"
                        className="input"
                        value={storeForm.addressLine1}
                        onChange={(e) =>
                          setStoreForm((f) => ({
                            ...f,
                            addressLine1: e.target.value,
                          }))
                        }
                      />
                    </div>
                  </div>
                </div>
                <div className="drawer-f">
                  <button
                    type="button"
                    className="btn"
                    onClick={() => setDrawer(null)}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn primary"
                    disabled={
                      busy ||
                      !storeForm.code ||
                      !storeForm.name ||
                      !storeForm.brandId ||
                      !storeForm.countryId ||
                      brands.length === 0
                    }
                    onClick={() => void handleCreateStore()}
                  >
                    {busy ? 'Creating…' : 'Create store'}
                  </button>
                </div>
              </>
            ) : null}
          </aside>
        </>
      ) : null}
    </>
  )
}

function HierarchyDetail({
  selected,
  orgRegions,
  orgCountries,
  brands,
  stores,
  countriesByRegion,
  storesFor,
  addChild,
  busy,
  onDetachRegion,
  onDetachCountry,
}: {
  selected: Selection
  orgRegions: Array<Region>
  orgCountries: Array<Country>
  brands: Array<Brand>
  stores: Array<Store>
  countriesByRegion: (regionId: string) => Array<Country>
  storesFor: (countryId: string, brandId: string) => Array<Store>
  addChild: { label: string; onClick: () => void } | null
  busy: boolean
  onDetachRegion: (id: string) => void
  onDetachCountry: (id: string) => void
}) {
  let title = 'Organisation'
  let levelLabel: Level = selected.level
  let rows: Array<[string, string]> = []
  let callout =
    'Root of the organisation hierarchy. Attach regions, then countries, then create brands and stores.'
  let kids: ReactNode = null
  let secondary: ReactNode = null

  if (selected.level === 'Organisation') {
    title = 'Organisation'
    rows = [
      ['Level', 'Organisation'],
      ['Regions', String(orgRegions.length)],
      ['Countries', String(orgCountries.length)],
      ['Brands', String(brands.length)],
      ['Stores', String(stores.length)],
    ]
    kids = (
      <ChildTable
        headers={['Region', 'Countries', 'Stores']}
        rows={orgRegions.map((region) => {
          const countries = countriesByRegion(region.id)
          const storeCount = stores.filter((store) =>
            countries.some((country) => country.id === store.countryId),
          ).length
          return [
            <span key="n">
              <b>{region.code}</b>
              <div className="cell-sub">{region.name}</div>
            </span>,
            String(countries.length),
            String(storeCount),
          ]
        })}
      />
    )
  } else if (selected.level === 'Region') {
    const region = orgRegions.find((r) => r.id === selected.id)
    title = region ? `${region.code} · ${region.name}` : 'Region'
    const countries = countriesByRegion(selected.id)
    rows = [
      ['Level', 'Region'],
      ['Code', region?.code ?? '—'],
      ['Name', region?.name ?? '—'],
      ['Data plane', region?.dataPlane ?? '—'],
      ['Countries', String(countries.length)],
    ]
    callout =
      'Inherits from Organisation. Attach countries that belong to this region.'
    secondary = (
      <button
        type="button"
        className="btn sm danger"
        disabled={busy}
        onClick={() => onDetachRegion(selected.id)}
      >
        Detach region
      </button>
    )
    kids = (
      <ChildTable
        headers={['Country', 'ISO', 'Currency', 'Stores']}
        rows={countries.map((country) => [
          country.name,
          country.isoCode,
          country.defaultCurrencyCode ?? '—',
          String(
            stores.filter((store) => store.countryId === country.id).length,
          ),
        ])}
      />
    )
  } else if (selected.level === 'Country') {
    const country = orgCountries.find((c) => c.id === selected.id)
    const region = orgRegions.find((r) => r.id === country?.regionId)
    title = country?.name ?? 'Country'
    const countryStores = stores.filter((s) => s.countryId === selected.id)
    rows = [
      ['Level', 'Country'],
      ['ISO', country?.isoCode ?? '—'],
      ['Region', region ? `${region.code} · ${region.name}` : '—'],
      ['Currency', country?.defaultCurrencyCode ?? '—'],
      ['Language', country?.defaultLanguageCode ?? '—'],
      ['Timezone', country?.timezone ?? '—'],
      ['Tax model', country?.taxModel ?? '—'],
      ['Fiscal regime', country?.fiscalRegime ?? 'None'],
    ]
    callout =
      'Country is where legal rules live: tax, fiscal, and localisation defaults.'
    secondary = (
      <button
        type="button"
        className="btn sm danger"
        disabled={busy}
        onClick={() => onDetachCountry(selected.id)}
      >
        Detach country
      </button>
    )
    kids = (
      <ChildTable
        headers={['Store', 'Brand', 'Concept', 'Status']}
        rows={countryStores.map((store) => {
          const brand = brands.find((b) => b.id === store.brandId)
          return [
            <span key="s">
              <b>{store.code}</b>
              <div className="cell-sub">{store.name}</div>
            </span>,
            brand?.name ?? store.brandId,
            formatConcept(store.concept),
            store.status,
          ]
        })}
      />
    )
  } else if (selected.level === 'Brand') {
    const brand = brands.find((b) => b.id === selected.brandId)
    const country = orgCountries.find((c) => c.id === selected.countryId)
    title = brand
      ? `${brand.name} in ${country?.name ?? 'country'}`
      : 'Brand'
    const brandStores = storesFor(selected.countryId, selected.brandId)
    rows = [
      ['Level', 'Brand (within country)'],
      ['Code', brand?.code ?? '—'],
      ['Name', brand?.name ?? '—'],
      ['Status', brand?.status ?? '—'],
      ['Stores here', String(brandStores.length)],
    ]
    callout =
      'Brand appears under a country when at least one store links them. Create stores to expand the tree.'
    kids = (
      <ChildTable
        headers={['Store', 'Concept', 'Status', 'City']}
        rows={brandStores.map((store) => [
          <span key="s">
            <b>{store.code}</b>
            <div className="cell-sub">{store.name}</div>
          </span>,
          formatConcept(store.concept),
          store.status,
          store.city ?? '—',
        ])}
      />
    )
  } else {
    const store = stores.find((s) => s.id === selected.id)
    const brand = brands.find((b) => b.id === store?.brandId)
    const country = orgCountries.find((c) => c.id === store?.countryId)
    title = store ? `${store.code} · ${store.name}` : 'Store'
    rows = [
      ['Level', 'Store'],
      ['Brand', brand?.name ?? '—'],
      ['Concept', store?.concept ? formatConcept(store.concept) : '—'],
      ['Country', country?.name ?? '—'],
      ['City', store?.city ?? '—'],
      ['Timezone', store?.timezone ?? '—'],
      ['Status', store?.status ?? '—'],
      ['Currency', store?.currencyCode ?? '—'],
    ]
    callout =
      'Store overrides are managed on the Stores page. Use the sidebar Stores module for full edit.'
  }

  return (
    <section className="panel" id="hier-detail">
      <div className="panel-h">
        <div style={{ display: 'grid', gap: 2 }}>
          <span className="eyebrow">{levelLabel}</span>
          <h2>{title}</h2>
        </div>
        <div className="actions">
          {secondary}
          {addChild ? (
            <button
              type="button"
              className="btn sm primary"
              disabled={busy}
              onClick={addChild.onClick}
            >
              {addChild.label}
            </button>
          ) : null}
        </div>
      </div>
      <div className="panel-b stack">
        <dl className="kv">
          {rows.map(([key, value]) => (
            <div key={key} style={{ display: 'contents' }}>
              <dt>{key}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
        <div className="callout">
          <div>{callout}</div>
        </div>
      </div>
      {kids ? (
        <div
          className="panel-b flush"
          style={{ borderTop: '1px solid var(--line)' }}
        >
          {kids}
        </div>
      ) : null}
    </section>
  )
}

function ChildTable({
  headers,
  rows,
}: {
  headers: Array<string>
  rows: Array<Array<ReactNode>>
}) {
  if (rows.length === 0) {
    return <div className="empty-note">No child records.</div>
  }

  return (
    <div className="tbl-wrap">
      <table className="tbl">
        <thead>
          <tr>
            {headers.map((header) => (
              <th key={header}>{header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((cells, index) => (
            <tr key={index}>
              {cells.map((cell, cellIndex) => (
                <td key={cellIndex}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
