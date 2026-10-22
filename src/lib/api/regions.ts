import { apiRequest } from '#/lib/api/client'
import type { Region } from '#/lib/api/types'

export function listMasterRegions() {
  return apiRequest<Array<Region>>('/admin/v1/regions')
}

export function listOrgRegions() {
  return apiRequest<Array<Region>>('/admin/v1/organizations/me/regions')
}

export function attachRegion(regionId: string) {
  return apiRequest<Region>('/admin/v1/organizations/me/regions', {
    method: 'POST',
    body: { regionId },
  })
}

export function batchAttachRegions(regionIds: string[]) {
  return apiRequest<Array<Region>>('/admin/v1/organizations/me/regions/batch', {
    method: 'POST',
    body: { regionIds },
  })
}

export function detachRegion(regionId: string) {
  return apiRequest<void>(`/admin/v1/organizations/me/regions/${regionId}`, {
    method: 'DELETE',
  })
}
