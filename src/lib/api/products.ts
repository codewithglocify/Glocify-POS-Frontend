import { apiRequest } from '#/lib/api/client'
import type { CreateProductInput, Product } from '#/lib/api/types'

export function listProducts() {
  return apiRequest<Array<Product>>('/admin/v1/products')
}

export function createProduct(input: CreateProductInput) {
  return apiRequest<Product>('/admin/v1/products', {
    method: 'POST',
    body: input,
  })
}
