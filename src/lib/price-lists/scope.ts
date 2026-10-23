import type { PriceList } from '#/lib/api/types'

export type ScopeTarget = {
  countryId: string | null
  regionId: string | null
  brandId: string | null
  storeIds: ReadonlyArray<string>
}

export type SelectedScope = {
  countryId: string
  regionId: string
  brandId: string
  storeId: string
}

export function priceListScope(list: PriceList): ScopeTarget {
  return {
    countryId: list.countryId,
    regionId: list.country?.regionId ?? null,
    brandId: list.brandId,
    storeIds: list.storePriceLists.map((assignment) => assignment.storeId),
  }
}

export function storeIdsByPriceList(
  lists: Array<PriceList>,
): Map<string, Array<string>> {
  return new Map(
    lists.map((list) => [
      list.id,
      list.storePriceLists.map((assignment) => assignment.storeId),
    ]),
  )
}

export function matchesScope(
  target: ScopeTarget,
  selected: SelectedScope,
): boolean {
  if (
    selected.countryId &&
    target.countryId &&
    target.countryId !== selected.countryId
  ) {
    return false
  }
  if (
    selected.regionId &&
    target.regionId &&
    target.regionId !== selected.regionId
  ) {
    return false
  }
  if (
    selected.brandId &&
    target.brandId &&
    target.brandId !== selected.brandId
  ) {
    return false
  }
  if (
    selected.storeId &&
    target.storeIds.length > 0 &&
    !target.storeIds.includes(selected.storeId)
  ) {
    return false
  }
  return true
}
