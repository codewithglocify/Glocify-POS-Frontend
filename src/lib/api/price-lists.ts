import { apiRequest } from '#/lib/api/client'
import type {
  CreatePriceListInput,
  PriceList,
  PriceListItem,
} from '#/lib/api/types'

export function listPriceLists() {
  return apiRequest<Array<PriceList>>('/admin/v1/price-lists')
}

export function listPriceListItems() {
  return apiRequest<Array<PriceListItem>>('/admin/v1/price-list-items')
}

export function createPriceList(input: CreatePriceListInput) {
  return apiRequest<PriceList>('/admin/v1/price-lists', {
    method: 'POST',
    body: input,
  })
}
