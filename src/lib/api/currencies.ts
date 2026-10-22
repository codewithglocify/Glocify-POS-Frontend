import { apiRequest } from '#/lib/api/client'
import type { Currency } from '#/lib/api/types'

export function listMasterCurrencies(active = true) {
  return apiRequest<Array<Currency>>('/admin/v1/currencies', {
    query: { active: String(active) },
  })
}
