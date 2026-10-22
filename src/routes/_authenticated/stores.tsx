import { useCallback, useEffect, useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'

import { listBrands } from '#/lib/api/brands'
import { ApiError } from '#/lib/api/client'
import { listOrgCountries } from '#/lib/api/countries'
import { listMasterCurrencies } from '#/lib/api/currencies'
import { createStore, listStores, updateStore } from '#/lib/api/stores'
import { formatConcept } from '#/lib/format'
import type { Brand, Country, Currency, Store } from '#/lib/api/types'

export const Route = createFileRoute('/_authenticated/stores')({
  component: StoresPage,
})

const CONCEPTS = [
  'FULL_PRICE',
  'OUTLET',
  'MULTI_BRAND',
  'OTHER',
] as const

function StoresPage() {
  const navigate = useNavigate()
  const [stores, setStores] = useState<Array<Store>>([])
  const [brands, setBrands] = useState<Array<Brand>>([])
  const [countries, setCountries] = useState<Array<Country>>([])
  const [currencies, setCurrencies] = useState<Array<Currency>>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editing, setEditing] = useState<Store | null>(null)
  const [saving, setSaving] = useState(false)

  const [brandId, setBrandId] = useState('')
  const [countryId, setCountryId] = useState('')
  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [concept, setConcept] = useState<string>('FULL_PRICE')
  const [timezone, setTimezone] = useState('UTC')
  const [currencyCode, setCurrencyCode] = useState('')
  const [languageCode, setLanguageCode] = useState('en')
  const [status, setStatus] = useState('LIVE')
  const [addressLine1, setAddressLine1] = useState('')
  const [city, setCity] = useState('')
  const [postalCode, setPostalCode] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [storeList, brandList, countryList, currencyList] =
        await Promise.all([
          listStores(),
          listBrands(),
          listOrgCountries(),
          listMasterCurrencies(),
        ])
      setStores(storeList)
      setBrands(brandList)
      setCountries(countryList)
      setCurrencies(currencyList)
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        await navigate({ to: '/login' })
        return
      }
      setError(err instanceof Error ? err.message : 'Failed to load stores')
    } finally {
      setLoading(false)
    }
  }, [navigate])

  useEffect(() => {
    void load()
  }, [load])

  function brandName(id: string) {
    return brands.find((brand) => brand.id === id)?.name ?? id
  }

  function countryName(id: string) {
    return countries.find((country) => country.id === id)?.name ?? id
  }

  function defaultCurrencyForCountry(nextCountryId: string) {
    const country = countries.find((item) => item.id === nextCountryId)
    const preferred = country?.defaultCurrencyCode
    if (preferred && currencies.some((currency) => currency.code === preferred)) {
      return preferred
    }
    return currencies[0]?.code ?? ''
  }

  function openCreate() {
    const nextCountryId = countries[0]?.id ?? ''
    setEditing(null)
    setBrandId(brands[0]?.id ?? '')
    setCountryId(nextCountryId)
    setCode('')
    setName('')
    setConcept('FULL_PRICE')
    setTimezone(countries[0]?.timezone ?? 'UTC')
    setCurrencyCode(defaultCurrencyForCountry(nextCountryId))
    setLanguageCode(countries[0]?.defaultLanguageCode ?? 'en')
    setStatus('LIVE')
    setAddressLine1('')
    setCity('')
    setPostalCode('')
    setDrawerOpen(true)
  }

  function openEdit(store: Store) {
    setEditing(store)
    setBrandId(store.brandId)
    setCountryId(store.countryId)
    setCode(store.code)
    setName(store.name)
    setConcept(store.concept)
    setTimezone(store.timezone)
    setCurrencyCode(store.currencyCode)
    setLanguageCode(store.languageCode)
    setStatus(store.status)
    setAddressLine1(store.addressLine1 ?? '')
    setCity(store.city ?? '')
    setPostalCode(store.postalCode ?? '')
    setDrawerOpen(true)
  }

  async function handleSave() {
    setSaving(true)
    setError(null)
    try {
      if (editing) {
        await updateStore(editing.id, {
          name,
          concept,
          status,
          timezone,
          addressLine1,
          city,
          postalCode,
        })
      } else {
        await createStore({
          brandId,
          countryId,
          code,
          name,
          concept,
          timezone,
          currencyCode,
          languageCode,
          addressLine1,
          city,
          postalCode,
        })
      }
      setDrawerOpen(false)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save store')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <div className="page-head">
        <div className="titles">
          <div className="crumbs">
            <span>Organisation</span>
            <span>/</span>
            <span>Stores</span>
          </div>
          <h1>Stores</h1>
          <p>Manage stores for attached countries and brands.</p>
        </div>
        <div className="actions">
          <button type="button" className="btn" onClick={() => void load()}>
            Refresh
          </button>
          <button
            type="button"
            className="btn primary"
            onClick={openCreate}
            disabled={brands.length === 0 || countries.length === 0}
          >
            New store
          </button>
        </div>
      </div>

      {brands.length === 0 || countries.length === 0 ? (
        <div className="callout warn">
          Attach at least one country in Hierarchy and create a brand before
          adding stores.
        </div>
      ) : null}

      {error ? (
        <p role="alert" className="alert-error">
          {error}
        </p>
      ) : null}

      <section className="panel">
        <div className="panel-h">
          <div>
            <h2>Store list</h2>
            <div className="sub">{stores.length} stores</div>
          </div>
        </div>
        <div className="panel-b flush">
          {loading ? (
            <div className="panel-b muted">Loading stores…</div>
          ) : (
            <div className="tbl-wrap">
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Name</th>
                    <th>Brand</th>
                    <th>Country</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {stores.map((store) => (
                    <tr
                      key={store.id}
                      className="click"
                      onClick={() => openEdit(store)}
                    >
                      <td className="mono strong">{store.code}</td>
                      <td>{store.name}</td>
                      <td>{brandName(store.brandId)}</td>
                      <td>{countryName(store.countryId)}</td>
                      <td>
                        <span
                          className={`badge ${store.status === 'LIVE' ? 'good' : 'warn'}`}
                        >
                          {store.status}
                        </span>
                      </td>
                      <td className="r">
                        <button
                          type="button"
                          className="btn sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            openEdit(store)
                          }}
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                  {stores.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="muted">
                        No stores yet.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {drawerOpen ? (
        <>
          <button
            type="button"
            className="scrim"
            aria-label="Close drawer"
            onClick={() => setDrawerOpen(false)}
            style={{ border: 0, padding: 0, cursor: 'pointer' }}
          />
          <aside className="drawer" role="dialog" aria-label="Store form">
            <div className="drawer-h">
              <div className="titles">
                <div className="eyebrow">{editing ? 'Edit' : 'Create'}</div>
                <h2>{editing ? editing.name : 'New store'}</h2>
              </div>
              <button
                type="button"
                className="iconbtn drawer-close"
                aria-label="Close"
                onClick={() => setDrawerOpen(false)}
              >
                ×
              </button>
            </div>
            <div className="drawer-b">
              <div className="form-grid">
                {!editing ? (
                  <>
                    <div className="field">
                      <label htmlFor="store-brand">Brand</label>
                      <select
                        id="store-brand"
                        className="input"
                        value={brandId}
                        onChange={(e) => setBrandId(e.target.value)}
                      >
                        {brands.map((brand) => (
                          <option key={brand.id} value={brand.id}>
                            {brand.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="field">
                      <label htmlFor="store-country">Country</label>
                      <select
                        id="store-country"
                        className="input"
                        value={countryId}
                        onChange={(e) => {
                          const nextCountryId = e.target.value
                          setCountryId(nextCountryId)
                          setCurrencyCode(defaultCurrencyForCountry(nextCountryId))
                          const country = countries.find(
                            (item) => item.id === nextCountryId,
                          )
                          if (country?.timezone) {
                            setTimezone(country.timezone)
                          }
                          if (country?.defaultLanguageCode) {
                            setLanguageCode(country.defaultLanguageCode)
                          }
                        }}
                      >
                        {countries.map((country) => (
                          <option key={country.id} value={country.id}>
                            {country.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="field">
                      <label htmlFor="store-code">Code</label>
                      <input
                        id="store-code"
                        className="input"
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                      />
                    </div>
                  </>
                ) : null}
                <div className="field">
                  <label htmlFor="store-name">Name</label>
                  <input
                    id="store-name"
                    className="input"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div className="field">
                  <label htmlFor="store-concept">Concept</label>
                  <select
                    id="store-concept"
                    className="input"
                    value={concept}
                    onChange={(e) => setConcept(e.target.value)}
                  >
                    {CONCEPTS.map((value) => (
                      <option key={value} value={value}>
                        {formatConcept(value)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label htmlFor="store-tz">Timezone</label>
                  <input
                    id="store-tz"
                    className="input"
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                  />
                </div>
                {!editing ? (
                  <>
                    <div className="field">
                      <label htmlFor="store-currency">Currency</label>
                      <select
                        id="store-currency"
                        className="input"
                        value={currencyCode}
                        onChange={(e) => setCurrencyCode(e.target.value)}
                      >
                        {currencies.map((currency) => (
                          <option key={currency.code} value={currency.code}>
                            {currency.code} · {currency.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="field">
                      <label htmlFor="store-lang">Language</label>
                      <input
                        id="store-lang"
                        className="input"
                        value={languageCode}
                        onChange={(e) => setLanguageCode(e.target.value)}
                      />
                    </div>
                  </>
                ) : (
                  <div className="field">
                    <label htmlFor="store-status">Status</label>
                    <select
                      id="store-status"
                      className="input"
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                    >
                      <option value="LIVE">LIVE</option>
                      <option value="PLANNED">PLANNED</option>
                      <option value="SUSPENDED">SUSPENDED</option>
                    </select>
                  </div>
                )}
                <div className="field">
                  <label htmlFor="store-address">Address</label>
                  <input
                    id="store-address"
                    className="input"
                    value={addressLine1}
                    onChange={(e) => setAddressLine1(e.target.value)}
                  />
                </div>
                <div className="field">
                  <label htmlFor="store-city">City</label>
                  <input
                    id="store-city"
                    className="input"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                  />
                </div>
                <div className="field">
                  <label htmlFor="store-postal">Postal code</label>
                  <input
                    id="store-postal"
                    className="input"
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                  />
                </div>
              </div>
            </div>
            <div className="drawer-f">
              <button
                type="button"
                className="btn"
                onClick={() => setDrawerOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn primary"
                disabled={saving || !name || (!editing && !code)}
                onClick={() => void handleSave()}
              >
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </aside>
        </>
      ) : null}
    </>
  )
}
