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
