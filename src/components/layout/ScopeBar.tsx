import { useScope } from '#/components/layout/scope-context'

const ALL = ''

export default function ScopeBar() {
  const {
    regions,
    regionId,
    countryId,
    brandId,
    storeId,
    setRegionId,
    setCountryId,
    setBrandId,
    setStoreId,
    visibleCountries,
    visibleBrands,
    visibleStores,
  } = useScope()

  return (
    <div className="scope">
      <span className="lbl">Scope</span>
      <span className="scope-field">
        <select
          aria-label="Region"
          value={regionId}
          onChange={(event) => setRegionId(event.target.value)}
        >
          <option value={ALL}>All regions</option>
          {regions.map((region) => (
            <option key={region.id} value={region.id}>
              {region.code}
            </option>
          ))}
        </select>
      </span>
      <span className="scope-field">
        <span className="sep">›</span>
        <select
          aria-label="Country"
          value={countryId}
          onChange={(event) => setCountryId(event.target.value)}
        >
          <option value={ALL}>All countries</option>
          {visibleCountries.map((country) => (
            <option key={country.id} value={country.id}>
              {country.name}
            </option>
          ))}
        </select>
      </span>
      <span className="scope-field">
        <span className="sep">›</span>
        <select
          aria-label="Brand"
          value={brandId}
          onChange={(event) => setBrandId(event.target.value)}
        >
          <option value={ALL}>All brands</option>
          {visibleBrands.map((brand) => (
            <option key={brand.id} value={brand.id}>
              {brand.name}
            </option>
          ))}
        </select>
      </span>
      <span className="scope-field">
        <span className="sep">›</span>
        <select
          aria-label="Store"
          value={storeId}
          onChange={(event) => setStoreId(event.target.value)}
        >
          <option value={ALL}>All stores</option>
          {visibleStores.map((store) => (
            <option key={store.id} value={store.id}>
              {store.name}
            </option>
          ))}
        </select>
      </span>
    </div>
  )
}
