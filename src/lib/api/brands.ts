import { apiRequest } from '#/lib/api/client'
import type { Brand, CreateBrandInput, UpdateBrandInput } from '#/lib/api/types'

export function listBrands() {
  return apiRequest<Array<Brand>>('/admin/v1/brands')
}

export function getBrand(id: string) {
  return apiRequest<Brand>(`/admin/v1/brands/${id}`)
}

export function createBrand(input: CreateBrandInput) {
  return apiRequest<Brand>('/admin/v1/brands', {
    method: 'POST',
    body: input,
  })
}

export function updateBrand(id: string, input: UpdateBrandInput) {
  return apiRequest<Brand>(`/admin/v1/brands/${id}`, {
    method: 'PATCH',
    body: input,
  })
}
