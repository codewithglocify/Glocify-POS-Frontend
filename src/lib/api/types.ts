export type Currency = {
  code: string
  numericCode: string
  minorUnits: number
  name: string
  isActive: boolean
  cashRoundingIncrement?: string
}

export type Region = {
  id: string
  code: string
  name: string
  dataPlane?: string
}

export type Country = {
  id: string
  regionId: string
  isoCode: string
  name: string
  defaultCurrencyCode?: string
  defaultLanguageCode?: string
  timezone?: string
  taxModel?: string
  priceTaxMode?: string
  fiscalRegime?: string
}

export type Brand = {
  id: string
  organizationId: string
  code: string
  name: string
  status: string
  createdAt?: string
  updatedAt?: string
}

export type Store = {
  id: string
  organizationId: string
  brandId: string
  countryId: string
  code: string
  name: string
  concept: string
  timezone: string
  currencyCode: string
  languageCode: string
  status: string
  taxJurisdictionCode?: string
  addressLine1?: string
  city?: string
  postalCode?: string
  createdAt?: string
  updatedAt?: string
}

export type PriceListCountry = {
  id: string
  isoCode: string
  name: string
  regionId: string
}

export type PriceListBrand = {
  id: string
  code: string
  name: string
}

export type PriceListStoreAssignment = {
  storeId: string
  priority: number
}

export type PriceList = {
  id: string
  organizationId: string
  code: string
  currencyCode: string
  sourceSystem: string
  brandId: string | null
  countryId: string | null
  concept: string | null
  country: PriceListCountry | null
  brand: PriceListBrand | null
  storePriceLists: Array<PriceListStoreAssignment>
}

export type PriceListItem = {
  id: string
  priceListId: string
  variantId: string
  unitPrice: string
  compareAtPrice: string | null
  effectiveFrom: string
  effectiveTo: string | null
  priceList: {
    id: string
    code: string
    currencyCode: string
    concept: string | null
    brandId: string | null
    countryId: string | null
    country: {
      id: string
      isoCode: string
      name: string
      regionId: string
      priceTaxMode: string
    } | null
    brand: PriceListBrand | null
  }
  variant: {
    id: string
    sku: string
    product: {
      id: string
      sapArticle: string
      name: string
    }
  }
}

export type CreatePriceListInput = {
  code: string
  currencyCode: string
  sourceSystem: string
  brandId?: string
  countryId?: string
  concept?: string
}

export type CreateBrandInput = {
  code: string
  name: string
}

export type UpdateBrandInput = {
  name?: string
  status?: string
}

export type CreateStoreInput = {
  brandId: string
  countryId: string
  code: string
  name: string
  concept: string
  timezone: string
  currencyCode: string
  languageCode: string
  taxJurisdictionCode?: string
  addressLine1?: string
  city?: string
  postalCode?: string
}

export type UpdateStoreInput = {
  name?: string
  concept?: string
  status?: string
  timezone?: string
  taxJurisdictionCode?: string
  addressLine1?: string
  city?: string
  postalCode?: string
}

export type ProductVariant = {
  id?: string
  sku: string
  color: string
  size: string
}

export type Product = {
  id: string
  sapArticle: string
  name: string
  taxClassCode: string
  styleNumber?: string
  variants: Array<ProductVariant>
  createdAt?: string
  updatedAt?: string
}

export type CreateProductInput = {
  sapArticle: string
  name: string
  taxClassCode: string
  styleNumber?: string
  variants: Array<{
    sku: string
    color: string
    size: string
  }>
}
