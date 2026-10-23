import type { PriceListItem } from '#/lib/api/types';

import type { ScopeTarget } from '#/lib/price-lists/scope';

export const CONCEPTS = [
  { value: 'FULL_PRICE', label: 'Full price' },
  { value: 'OUTLET', label: 'Outlet' },
  { value: 'MULTI_BRAND', label: 'Multi brand' },
  { value: 'OTHER', label: 'Other' },
] as const;

export function conceptLabel(concept: string | null): string {
  if (!concept) {
    return '—';
  }
  return CONCEPTS.find((item) => item.value === concept)?.label ?? concept;
}

export function formatMoney(currency: string, amount: string): string {
  const value = Number(amount);
  if (!Number.isFinite(value)) {
    return `${currency} ${amount}`;
  }
  return `${currency} ${value.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatWhen(iso: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    timeZone: 'UTC',
  }).format(new Date(iso));
}

export function taxLabel(mode: string | null): string {
  if (mode === 'INCLUSIVE') {
    return 'Incl.';
  }
  if (mode === 'EXCLUSIVE') {
    return 'Excl.';
  }
  return '—';
}

export type MatrixRow = ScopeTarget & {
  id: string;
  country: string;
  name: string;
  concept: string;
  listPrice: string;
  promoPrice: string | null;
  nextChange: string | null;
  tax: string;
};

export function matrixRows(
  items: Array<PriceListItem>,
  variantId: string,
  storeIdsByListId: ReadonlyMap<string, ReadonlyArray<string>> = new Map(),
): Array<MatrixRow> {
  const now = new Date().toISOString();
  const grouped = new Map<string, Array<PriceListItem>>();
  for (const item of items) {
    if (item.variantId !== variantId) {
      continue;
    }
    const group = grouped.get(item.priceListId) ?? [];
    group.push(item);
    grouped.set(item.priceListId, group);
  }

  return [...grouped.values()].map((group) => {
    const ordered = [...group].sort((left, right) => left.effectiveFrom.localeCompare(right.effectiveFrom));
    const current = [...ordered]
      .reverse()
      .find((item) => item.effectiveFrom <= now && (item.effectiveTo == null || item.effectiveTo > now));
    const next = ordered.find((item) => item.effectiveFrom > now);
    const basis = current ?? ordered[ordered.length - 1];
    const list = basis.priceList;
    return {
      id: list.id,
      country: list.country?.isoCode ?? '—',
      name: list.country?.name ?? 'All countries',
      concept: conceptLabel(list.concept),
      listPrice: current ? formatMoney(list.currencyCode, current.unitPrice) : '—',
      promoPrice: current?.compareAtPrice ? formatMoney(list.currencyCode, current.compareAtPrice) : null,
      nextChange: next ? `${formatMoney(list.currencyCode, next.unitPrice)} · ${formatWhen(next.effectiveFrom)}` : null,
      tax: taxLabel(list.country?.priceTaxMode ?? null),
      countryId: list.countryId,
      regionId: list.country?.regionId ?? null,
      brandId: list.brandId,
      storeIds: storeIdsByListId.get(list.id) ?? [],
    };
  });
}
