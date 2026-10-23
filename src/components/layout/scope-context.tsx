import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

import { listBrands } from '#/lib/api/brands'
import { listOrgCountries } from '#/lib/api/countries'
import { listOrgRegions } from '#/lib/api/regions'
import { listStores } from '#/lib/api/stores'
import type { Brand, Country, Region, Store } from '#/lib/api/types'

const ALL = ''

type ScopeContextValue = {
  regions: Array<Region>
  countries: Array<Country>
  brands: Array<Brand>
  stores: Array<Store>
  regionId: string
  countryId: string
  brandId: string
  storeId: string
  setRegionId: (id: string) => void
  setCountryId: (id: string) => void
  setBrandId: (id: string) => void
  setStoreId: (id: string) => void
  region: Region | null
  country: Country | null
  brand: Brand | null
  store: Store | null
  visibleCountries: Array<Country>
  visibleBrands: Array<Brand>
  visibleStores: Array<Store>
  ready: boolean
  summary: string
}

const ScopeContext = createContext<ScopeContextValue | null>(null)

function asList<T>(result: PromiseSettledResult<Array<T>>): Array<T> {
  return result.status === 'fulfilled' && Array.isArray(result.value)
    ? result.value
    : []
}

function findById<T extends { id: string }>(
  items: Array<T>,
  id: string,
): T | null {
  if (!id) {
    return null
  }
  return items.find((item) => item.id === id) ?? null
}

function scopeSummary(parts: Array<string | null>): string {
  const chosen = parts.filter((part): part is string => Boolean(part))
  return chosen.length > 0 ? chosen.join(' › ') : 'All regions'
}

export function ScopeProvider({ children }: { children: ReactNode }) {
  const [regions, setRegions] = useState<Array<Region>>([])
  const [countries, setCountries] = useState<Array<Country>>([])
  const [brands, setBrands] = useState<Array<Brand>>([])
  const [stores, setStores] = useState<Array<Store>>([])
  const [ready, setReady] = useState(false)

  const [regionId, setRegionId] = useState(ALL)
  const [countryId, setCountryId] = useState(ALL)
  const [brandId, setBrandId] = useState(ALL)
  const [storeId, setStoreId] = useState(ALL)

  useEffect(() => {
    let cancelled = false

    Promise.allSettled([
      listOrgRegions(),
      listOrgCountries(),
      listBrands(),
      listStores(),
    ]).then(([regionResult, countryResult, brandResult, storeResult]) => {
      if (cancelled) {
        return
      }
      setRegions(asList(regionResult))
      setCountries(asList(countryResult))
      setBrands(asList(brandResult))
      setStores(asList(storeResult))
      setReady(true)
    })

    return () => {
      cancelled = true
    }
  }, [])

  const visibleCountries = useMemo(
    () =>
      countries.filter((country) => !regionId || country.regionId === regionId),
    [countries, regionId],
  )

  const scopeCountryIds = useMemo(() => {
    if (countryId) {
      return new Set([countryId])
    }
    if (regionId) {
      return new Set(visibleCountries.map((country) => country.id))
    }
    return null
  }, [countryId, regionId, visibleCountries])

  const visibleStores = useMemo(
    () =>
      stores.filter((store) => {
        if (scopeCountryIds && !scopeCountryIds.has(store.countryId)) {
          return false
        }
        if (brandId && store.brandId !== brandId) {
          return false
        }
        return true
      }),
    [brandId, scopeCountryIds, stores],
  )

  const visibleBrands = useMemo(() => {
    if (!scopeCountryIds) {
      return brands
    }
    const brandIds = new Set(
      stores
        .filter((store) => scopeCountryIds.has(store.countryId))
        .map((store) => store.brandId),
    )
    return brands.filter((brand) => brandIds.has(brand.id))
  }, [brands, scopeCountryIds, stores])

  useEffect(() => {
    if (!ready) {
      return
    }
    if (countryId && !visibleCountries.some((country) => country.id === countryId)) {
      setCountryId(ALL)
    }
  }, [countryId, ready, visibleCountries])

  useEffect(() => {
    if (!ready) {
      return
    }
    if (brandId && !visibleBrands.some((brand) => brand.id === brandId)) {
      setBrandId(ALL)
    }
  }, [brandId, ready, visibleBrands])

  useEffect(() => {
    if (!ready) {
      return
    }
    if (storeId && !visibleStores.some((store) => store.id === storeId)) {
      setStoreId(ALL)
    }
  }, [ready, storeId, visibleStores])

  const region = findById(regions, regionId)
  const country = findById(visibleCountries, countryId)
  const brand = findById(visibleBrands, brandId)
  const store = findById(visibleStores, storeId)

  const summary = scopeSummary([
    region?.code ?? null,
    country?.name ?? null,
    brand?.name ?? null,
    store?.name ?? null,
  ])

  const value = useMemo<ScopeContextValue>(
    () => ({
      regions,
      countries,
      brands,
      stores,
      regionId,
      countryId,
      brandId,
      storeId,
      setRegionId,
      setCountryId,
      setBrandId,
      setStoreId,
      region,
      country,
      brand,
      store,
      visibleCountries,
      visibleBrands,
      visibleStores,
      ready,
      summary,
    }),
    [
      brand,
      brandId,
      brands,
      countries,
      country,
      countryId,
      ready,
      region,
      regionId,
      regions,
      store,
      storeId,
      stores,
      summary,
      visibleBrands,
      visibleCountries,
      visibleStores,
    ],
  )

  return <ScopeContext.Provider value={value}>{children}</ScopeContext.Provider>
}

export function useScope(): ScopeContextValue {
  const scope = useContext(ScopeContext)
  if (!scope) {
    throw new Error('useScope must be used within ScopeProvider')
  }
  return scope
}
