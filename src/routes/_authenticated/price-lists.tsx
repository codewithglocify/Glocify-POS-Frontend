import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useCallback, useEffect, useMemo, useState } from 'react'

import { useScope } from '#/components/layout/scope-context'
import SearchSelect from '#/components/SearchSelect'
import { CloseIcon, HierarchyIcon, PlayIcon, PlusIcon } from '#/icons'
import { ApiError } from '#/lib/api/client'
import { listMasterCurrencies } from '#/lib/api/currencies'
import {
  createPriceList,
  listPriceListItems,
  listPriceLists,
} from '#/lib/api/price-lists'
import type { Currency, PriceList, PriceListItem } from '#/lib/api/types'
import { CONCEPTS, conceptLabel, matrixRows } from '#/lib/price-lists/matrix'
import {
  matchesScope,
  priceListScope,
  storeIdsByPriceList,
} from '#/lib/price-lists/scope'

export const Route = createFileRoute('/_authenticated/price-lists')({
  component: PriceListsPage,
})

function assignedLabel(list: PriceList): string {
  const count = list.storePriceLists.length
  if (count === 1) {
    return '1 store'
  }
  if (count > 1) {
    return `${count} stores`
  }
  return list.brand?.name ?? '—'
}

function errorText(err: unknown, fallback: string): string {
  if (err instanceof ApiError || err instanceof Error) {
    return err.message
  }
  return fallback
}

function PriceListsPage() {
  const navigate = useNavigate()
  const scope = useScope()
  const [priceLists, setPriceLists] = useState<Array<PriceList>>([])
  const [items, setItems] = useState<Array<PriceListItem>>([])
  const [variantId, setVariantId] = useState('')
  const [currencies, setCurrencies] = useState<Array<Currency>>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [code, setCode] = useState('')
  const [currencyCode, setCurrencyCode] = useState('')
  const [sourceSystem, setSourceSystem] = useState('POS')
  const [brandId, setBrandId] = useState('')
  const [countryId, setCountryId] = useState('')
  const [concept, setConcept] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [listsResult, itemsResult, currencyResult] =
        await Promise.allSettled([
          listPriceLists(),
          listPriceListItems(),
          listMasterCurrencies(),
        ])
      const rejected = [listsResult, itemsResult, currencyResult].find(
        (result) =>
          result.status === 'rejected' &&
          result.reason instanceof ApiError &&
          result.reason.status === 401,
      )
      if (rejected?.status === 'rejected') {
        throw rejected.reason
      }
      if (listsResult.status === 'rejected') {
        throw listsResult.reason
      }
      if (itemsResult.status === 'rejected') {
        throw itemsResult.reason
      }
      const nextItems = Array.isArray(itemsResult.value)
        ? itemsResult.value
        : []
      setPriceLists(Array.isArray(listsResult.value) ? listsResult.value : [])
      setItems(nextItems)
      setVariantId((current) =>
        nextItems.some((item) => item.variantId === current)
          ? current
          : (nextItems[0]?.variantId ?? ''),
      )
      if (
        currencyResult.status === 'fulfilled' &&
        Array.isArray(currencyResult.value)
      ) {
        setCurrencies(currencyResult.value)
      } else {
        setCurrencies([])
        setError(
          errorText(
            currencyResult.status === 'rejected' ? currencyResult.reason : null,
            'Currencies could not be loaded.',
          ),
        )
      }
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        await navigate({ to: '/login' })
        return
      }
      setError(errorText(err, 'Failed to load price lists'))
    } finally {
      setLoading(false)
    }
  }, [navigate])

  useEffect(() => {
    void load()
  }, [load])

  function openCreate() {
    const scopedCountry = scope.country
    setCode('')
    setSourceSystem('POS')
    setBrandId(scope.brand?.id ?? '')
    setCountryId(scopedCountry?.id ?? '')
    setCurrencyCode(scopedCountry?.defaultCurrencyCode ?? '')
    setConcept('')
    setFormError(null)
    setDrawerOpen(true)
  }

  function onCountryChange(nextCountryId: string) {
    setCountryId(nextCountryId)
    const country = scope.countries.find((item) => item.id === nextCountryId)
    if (country?.defaultCurrencyCode) {
      setCurrencyCode(country.defaultCurrencyCode)
    }
  }

  async function handleSave() {
    const trimmedCode = code.trim()
    const trimmedSource = sourceSystem.trim()
    if (!trimmedCode || !currencyCode || !trimmedSource) {
      return
    }

    setSaving(true)
    setFormError(null)
    try {
      await createPriceList({
        code: trimmedCode,
        currencyCode: currencyCode.trim().toUpperCase(),
        sourceSystem: trimmedSource,
        ...(brandId ? { brandId } : {}),
        ...(countryId ? { countryId } : {}),
        ...(concept ? { concept } : {}),
      })
      setDrawerOpen(false)
      await load()
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        await navigate({ to: '/login' })
        return
      }
      setFormError(errorText(err, 'Failed to create price list'))
    } finally {
      setSaving(false)
    }
  }

  const variants = useMemo(() => {
    const seen = new Map<string, string>()
    for (const item of items) {
      if (!seen.has(item.variantId)) {
        seen.set(
          item.variantId,
          `${item.variant.product.sapArticle} · ${item.variant.product.name}`,
        )
      }
    }
    return [...seen.entries()].map(([id, label]) => ({ id, label }))
  }, [items])

  const selectedVariant =
    variants.find((variant) => variant.id === variantId) ?? null

  const selectedScope = useMemo(
    () => ({
      countryId: scope.country?.id ?? '',
      regionId: scope.region?.id ?? '',
      brandId: scope.brand?.id ?? '',
      storeId: scope.store?.id ?? '',
    }),
    [scope.brand, scope.country, scope.region, scope.store],
  )
  const visibleRows = useMemo(
    () =>
      matrixRows(items, variantId, storeIdsByPriceList(priceLists)).filter(
        (row) => matchesScope(row, selectedScope),
      ),
    [items, priceLists, selectedScope, variantId],
  )
  const visibleLists = useMemo(
    () =>
      priceLists.filter((list) =>
        matchesScope(priceListScope(list), selectedScope),
      ),
    [priceLists, selectedScope],
  )

  return (
    <>
      <div className="page-head">
        <div className="titles">
          <div className="crumbs">
            <span>Catalogue & pricing</span>
          </div>
          <h1>Price lists</h1>
          <p>
            Prices per country, currency and concept, assigned to store
            clusters. Changes are staged with an effective date and activate at
            midnight in each store&apos;s own time zone.
          </p>
          <div>
            <span className="scope-note">
              <HierarchyIcon />
              Showing {scope.summary}
            </span>
          </div>
        </div>
        <div className="actions">
          <button type="button" className="btn">
            <PlayIcon />
            Push urgent price change
          </button>
          <button type="button" className="btn primary" onClick={openCreate}>
            <PlusIcon />
            New price list
          </button>
        </div>
      </div>

      {error ? (
        <p role="alert" className="alert-error">
          {error}
        </p>
      ) : null}

      <section className="panel">
        <div className="panel-h">
          <h2>Price matrix</h2>
          <span className="sub">
            {selectedVariant?.label ?? 'No priced variant'}
          </span>
          <div className="actions">
            <SearchSelect
              value={variantId}
              onChange={setVariantId}
              placeholder="Select a variant"
              disabled={variants.length === 0}
              options={variants.map((variant) => ({
                value: variant.id,
                label: variant.label,
              }))}
            />
          </div>
        </div>
        <div className="panel-b flush">
          <div className="tbl-wrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Country</th>
                  <th>Concept</th>
                  <th className="r">List price</th>
                  <th className="r">Promo price</th>
                  <th>Next change</th>
                  <th className="r">Tax</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="muted">
                      Loading prices…
                    </td>
                  </tr>
                ) : null}
                {!loading && visibleRows.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="muted">
                      No prices in this scope.
                    </td>
                  </tr>
                ) : null}
                {!loading
                  ? visibleRows.map((row) => (
                      <tr key={row.id}>
                        <td>
                          <span className="row" style={{ gap: 8 }}>
                            <span className="flag">{row.country}</span>
                            <span className="strong">{row.name}</span>
                          </span>
                        </td>
                        <td>{row.concept}</td>
                        <td className="r mono">{row.listPrice}</td>
                        <td className="r mono">
                          {row.promoPrice ?? <span className="muted">—</span>}
                        </td>
                        <td>
                          {row.nextChange ? (
                            <span className="badge warn">{row.nextChange}</span>
                          ) : (
                            <span className="muted">—</span>
                          )}
                        </td>
                        <td className="r">{row.tax}</td>
                      </tr>
                    ))
                  : null}
              </tbody>
            </table>
          </div>
          <div className="empty-note">
            Store and corporate users see the same matrix, filtered by their
            access scope.
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="panel-h">
          <h2>Price lists</h2>
          <span className="sub">
            {loading ? 'Loading…' : `${visibleLists.length} lists`}
          </span>
        </div>
        <div className="panel-b flush">
          <div className="tbl-wrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Price list</th>
                  <th>Countries</th>
                  <th>Currency</th>
                  <th>Concept</th>
                  <th>Assigned to</th>
                  <th>Source</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="muted">
                      Loading price lists…
                    </td>
                  </tr>
                ) : null}
                {!loading && visibleLists.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="muted">
                      No price lists in this scope.
                    </td>
                  </tr>
                ) : null}
                {!loading
                  ? visibleLists.map((list) => (
                      <tr key={list.id}>
                        <td className="mono strong">{list.code}</td>
                        <td>{list.country?.isoCode ?? 'All'}</td>
                        <td className="mono">{list.currencyCode}</td>
                        <td>{conceptLabel(list.concept)}</td>
                        <td>{assignedLabel(list)}</td>
                        <td>{list.sourceSystem}</td>
                      </tr>
                    ))
                  : null}
              </tbody>
            </table>
          </div>
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
          <aside className="drawer" role="dialog" aria-label="New price list">
            <div className="drawer-h">
              <div className="titles">
                <div className="eyebrow">Create</div>
                <h2>New price list</h2>
              </div>
              <button
                type="button"
                className="iconbtn drawer-close"
                aria-label="Close"
                onClick={() => setDrawerOpen(false)}
              >
                <CloseIcon />
              </button>
            </div>
            <form
              className="drawer-b"
              onSubmit={(event) => {
                event.preventDefault()
                void handleSave()
              }}
            >
              {formError ? (
                <p role="alert" className="alert-error">
                  {formError}
                </p>
              ) : null}
              <div className="field">
                <label htmlFor="price-list-code">Code</label>
                <input
                  id="price-list-code"
                  className="input"
                  value={code}
                  maxLength={64}
                  autoComplete="off"
                  onChange={(event) => setCode(event.target.value)}
                />
              </div>
              <div className="field">
                <label htmlFor="price-list-currency">Currency</label>
                <SearchSelect
                  id="price-list-currency"
                  value={currencyCode}
                  onChange={setCurrencyCode}
                  placeholder="Select a currency"
                  options={[
                    { value: '', label: 'Select a currency' },
                    ...currencies.map((currency) => ({
                      value: currency.code,
                      label: `${currency.code} · ${currency.name}`,
                    })),
                  ]}
                />
              </div>
              <div className="field">
                <label htmlFor="price-list-source">Source system</label>
                <input
                  id="price-list-source"
                  className="input"
                  value={sourceSystem}
                  onChange={(event) => setSourceSystem(event.target.value)}
                />
                <span className="hint">
                  POS for a list created in this console.
                </span>
              </div>
              <div className="field">
                <label htmlFor="price-list-country">Country</label>
                <SearchSelect
                  id="price-list-country"
                  value={countryId}
                  onChange={onCountryChange}
                  placeholder="All countries"
                  options={[
                    { value: '', label: 'All countries' },
                    ...scope.visibleCountries.map((country) => ({
                      value: country.id,
                      label: `${country.isoCode} · ${country.name}`,
                    })),
                  ]}
                />
              </div>
              <div className="field">
                <label htmlFor="price-list-brand">Brand</label>
                <SearchSelect
                  id="price-list-brand"
                  value={brandId}
                  onChange={setBrandId}
                  placeholder="All brands"
                  options={[
                    { value: '', label: 'All brands' },
                    ...scope.brands.map((brand) => ({
                      value: brand.id,
                      label: `${brand.code} · ${brand.name}`,
                    })),
                  ]}
                />
              </div>
              <div className="field">
                <label htmlFor="price-list-concept">Concept</label>
                <SearchSelect
                  id="price-list-concept"
                  value={concept}
                  onChange={setConcept}
                  placeholder="Any concept"
                  options={[
                    { value: '', label: 'Any concept' },
                    ...CONCEPTS.map((item) => ({
                      value: item.value,
                      label: item.label,
                    })),
                  ]}
                />
              </div>
            </form>
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
                disabled={
                  saving ||
                  !code.trim() ||
                  !currencyCode ||
                  !sourceSystem.trim()
                }
                onClick={() => void handleSave()}
              >
                {saving ? 'Saving…' : 'Create price list'}
              </button>
            </div>
          </aside>
        </>
      ) : null}
    </>
  )
}
