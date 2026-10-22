import { apiRequest } from '#/lib/api/client'
import type { CreateStoreInput, Store, UpdateStoreInput } from '#/lib/api/types'

export function listStores(countryId?: string) {
  return apiRequest<Array<Store>>('/admin/v1/stores', {
    query: { countryId },
  })
}

export function getStore(id: string) {
  return apiRequest<Store>(`/admin/v1/stores/${id}`)
}

export function createStore(input: CreateStoreInput) {
  return apiRequest<Store>('/admin/v1/stores', {
    method: 'POST',
    body: input,
  })
}

export function updateStore(id: string, input: UpdateStoreInput) {
  return apiRequest<Store>(`/admin/v1/stores/${id}`, {
    method: 'PATCH',
    body: input,
  })
}
