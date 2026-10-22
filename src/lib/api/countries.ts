import { apiRequest } from '#/lib/api/client'
import type { Country } from '#/lib/api/types'

export function listMasterCountries(regionId?: string) {
  return apiRequest<Array<Country>>('/admin/v1/countries', {
    query: { regionId },
  })
}

export function listOrgCountries() {
  return apiRequest<Array<Country>>('/admin/v1/organizations/me/countries')
}

export function attachCountry(countryId: string) {
  return apiRequest<Country>('/admin/v1/organizations/me/countries', {
    method: 'POST',
    body: { countryId },
  })
}

export function batchAttachCountries(countryIds: string[]) {
  return apiRequest<Array<Country>>(
    '/admin/v1/organizations/me/countries/batch',
    {
      method: 'POST',
      body: { countryIds },
    },
  )
}

export function detachCountry(countryId: string) {
  return apiRequest<void>(
    `/admin/v1/organizations/me/countries/${countryId}`,
    {
      method: 'DELETE',
    },
  )
}
