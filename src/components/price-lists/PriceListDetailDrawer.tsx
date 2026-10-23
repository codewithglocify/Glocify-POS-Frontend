import * as React from 'react';

import { CloseIcon } from '#/icons';
import type { PriceList, PriceListItem, Store } from '#/lib/api/types';
import { conceptLabel, formatMoney, taxLabel } from '#/lib/price-lists/matrix';

type PriceListDetailDrawerProps = {
  list: PriceList;
  items: Array<PriceListItem>;
  stores: Array<Store>;
  focusVariantId: string | null;
  onClose: () => void;
};

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(iso));
}

function storeLabel(storeId: string, stores: Array<Store>): string {
  const store = stores.find((item) => item.id === storeId);
  return store ? `${store.code} · ${store.name}` : storeId;
}

function byProduct(left: PriceListItem, right: PriceListItem): number {
  const article = left.variant.product.sapArticle.localeCompare(right.variant.product.sapArticle);
  if (article !== 0) {
    return article;
  }
  return left.effectiveFrom.localeCompare(right.effectiveFrom);
}

export default function PriceListDetailDrawer({
  list,
  items,
  stores,
  focusVariantId,
  onClose,
}: PriceListDetailDrawerProps) {
  const ordered = React.useMemo(() => [...items].sort(byProduct), [items]);
  const taxMode = ordered.find((item) => item.priceList.country?.priceTaxMode)?.priceList.country?.priceTaxMode ?? null;

  return (
    <>
      <button
        type="button"
        className="scrim"
        aria-label="Close drawer"
        onClick={onClose}
        style={{ border: 0, padding: 0, cursor: 'pointer' }}
      />
      <aside className="drawer" role="dialog" aria-modal="true" aria-label={list.code}>
        <div className="drawer-h">
          <div className="titles">
            <div className="eyebrow">Price list</div>
            <h2 className="mono">{list.code}</h2>
          </div>
          <button type="button" className="iconbtn drawer-close" aria-label="Close" onClick={onClose}>
            <CloseIcon />
          </button>
        </div>
        <div className="drawer-b">
          <dl className="kv">
            <dt>Country</dt>
            <dd>{list.country ? `${list.country.isoCode} · ${list.country.name}` : 'All countries'}</dd>
            <dt>Currency</dt>
            <dd className="mono">{list.currencyCode}</dd>
            <dt>Concept</dt>
            <dd>{conceptLabel(list.concept)}</dd>
            <dt>Brand</dt>
            <dd>{list.brand ? `${list.brand.code} · ${list.brand.name}` : 'All brands'}</dd>
            <dt>Source</dt>
            <dd>{list.sourceSystem}</dd>
            <dt>Tax</dt>
            <dd>{taxLabel(taxMode)}</dd>
            <dt>Assigned to</dt>
            <dd>
              {list.storePriceLists.length > 0 ? (
                <div className="detail-stores">
                  {list.storePriceLists.map((assignment) => (
                    <div key={assignment.storeId}>
                      {storeLabel(assignment.storeId, stores)}
                      <span className="muted"> · priority {assignment.priority}</span>
                    </div>
                  ))}
                </div>
              ) : (
                (list.brand?.name ?? '—')
              )}
            </dd>
          </dl>
          <div>
            <div className="eyebrow">Prices</div>
            {ordered.length === 0 ? (
              <p className="muted">This list has no prices yet.</p>
            ) : (
              <div className="tbl-wrap">
                <table className="tbl">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th className="r">List price</th>
                      <th className="r">Compare at</th>
                      <th>Effective</th>
                      <th>Until</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ordered.map((item) => (
                      <tr key={item.id} className={item.variantId === focusVariantId ? 'is-focus' : undefined}>
                        <td>
                          <div className="strong">{item.variant.product.sapArticle}</div>
                          <div className="cell-sub">
                            {item.variant.product.name} · {item.variant.sku}
                          </div>
                        </td>
                        <td className="r mono">{formatMoney(list.currencyCode, item.unitPrice)}</td>
                        <td className="r mono">
                          {item.compareAtPrice ? (
                            formatMoney(list.currencyCode, item.compareAtPrice)
                          ) : (
                            <span className="muted">—</span>
                          )}
                        </td>
                        <td>{formatDate(item.effectiveFrom)}</td>
                        <td>{item.effectiveTo ? formatDate(item.effectiveTo) : <span className="muted">Open</span>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
        <div className="drawer-f">
          <button type="button" className="btn" onClick={onClose}>
            Close
          </button>
        </div>
      </aside>
    </>
  );
}
