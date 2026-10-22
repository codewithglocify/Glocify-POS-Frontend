import { useCallback, useEffect, useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'

import { ApiError } from '#/lib/api/client'
import { createProduct, listProducts } from '#/lib/api/products'
import type { Product } from '#/lib/api/types'

export const Route = createFileRoute('/_authenticated/products')({
  component: ProductsPage,
})

type VariantDraft = {
  key: string
  sku: string
  color: string
  size: string
}

function emptyVariant(): VariantDraft {
  return {
    key: crypto.randomUUID(),
    sku: '',
    color: '',
    size: '',
  }
}

function ProductsPage() {
  const navigate = useNavigate()
  const [products, setProducts] = useState<Array<Product>>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  const [name, setName] = useState('')
  const [sapArticle, setSapArticle] = useState('')
  const [styleNumber, setStyleNumber] = useState('')
  const [taxClassCode, setTaxClassCode] = useState('')
  const [variants, setVariants] = useState<Array<VariantDraft>>([emptyVariant()])

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setProducts(await listProducts())
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        await navigate({ to: '/login' })
        return
      }
      setError(err instanceof Error ? err.message : 'Failed to load products')
    } finally {
      setLoading(false)
    }
  }, [navigate])

  useEffect(() => {
    void load()
  }, [load])

  function openCreate() {
    setName('')
    setSapArticle('')
    setStyleNumber('')
    setTaxClassCode('')
    setVariants([emptyVariant()])
    setDrawerOpen(true)
  }

  function updateVariant(
    key: string,
    field: 'sku' | 'color' | 'size',
    value: string,
  ) {
    setVariants((current) =>
      current.map((variant) =>
        variant.key === key ? { ...variant, [field]: value } : variant,
      ),
    )
  }

  function removeVariant(key: string) {
    setVariants((current) =>
      current.length <= 1 ? current : current.filter((v) => v.key !== key),
    )
  }

  async function handleSave() {
    const cleanedVariants = variants
      .map((variant) => ({
        sku: variant.sku.trim(),
        color: variant.color.trim(),
        size: variant.size.trim(),
      }))
      .filter((variant) => variant.sku)

    if (cleanedVariants.length === 0) {
      setError('Add at least one variant with a SKU')
      return
    }

    setSaving(true)
    setError(null)
    try {
      await createProduct({
        name: name.trim(),
        sapArticle: sapArticle.trim(),
        taxClassCode: taxClassCode.trim(),
        styleNumber: styleNumber.trim() || undefined,
        variants: cleanedVariants,
      })
      setDrawerOpen(false)
      await load()
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setError('A product with this article or SKU already exists')
      } else {
        setError(err instanceof Error ? err.message : 'Failed to create product')
      }
    } finally {
      setSaving(false)
    }
  }

  const canSave =
    name.trim() &&
    sapArticle.trim() &&
    taxClassCode.trim() &&
    variants.some((variant) => variant.sku.trim())

  return (
    <>
      <div className="page-head">
        <div className="titles">
          <div className="crumbs">
            <span>Catalogue</span>
            <span>/</span>
            <span>Products</span>
          </div>
          <h1>Products</h1>
          <p>List products and create articles with variants.</p>
        </div>
        <div className="actions">
          <button type="button" className="btn" onClick={() => void load()}>
            Refresh
          </button>
          <button type="button" className="btn primary" onClick={openCreate}>
            New product
          </button>
        </div>
      </div>

      {error ? (
        <p role="alert" className="alert-error">
          {error}
        </p>
      ) : null}

      <section className="panel">
        <div className="panel-h">
          <div>
            <h2>Product catalogue</h2>
            <div className="sub">{products.length} products</div>
          </div>
        </div>
        <div className="panel-b flush">
          {loading ? (
            <div className="panel-b muted">Loading products…</div>
          ) : (
            <div className="tbl-wrap">
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>SAP article</th>
                    <th>Style</th>
                    <th>Tax class</th>
                    <th>Variants</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product.id}>
                      <td className="strong">{product.name}</td>
                      <td className="mono">{product.sapArticle}</td>
                      <td className="mono">{product.styleNumber ?? '—'}</td>
                      <td>
                        <span className="tag">{product.taxClassCode}</span>
                      </td>
                      <td>
                        <span className="badge plain">
                          {product.variants?.length ?? 0}
                        </span>
                        <div className="cell-sub">
                          {(product.variants ?? [])
                            .slice(0, 3)
                            .map((variant) => variant.sku)
                            .join(', ')}
                          {(product.variants?.length ?? 0) > 3 ? '…' : ''}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {products.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="muted">
                        No products yet. Create one to get started.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {drawerOpen ? (
        <>
          <button
            type="button"
            className="scrim"
            aria-label="Close drawer"
            onClick={() => setDrawerOpen(false)}
            style={{ border: 0, padding: 0, cursor: 'pointer' }}
          />
          <aside className="drawer" role="dialog" aria-label="Create product">
            <div className="drawer-h">
              <div className="titles">
                <div className="eyebrow">Create</div>
                <h2>New product</h2>
              </div>
              <button
                type="button"
                className="iconbtn drawer-close"
                aria-label="Close"
                onClick={() => setDrawerOpen(false)}
              >
                ×
              </button>
            </div>
            <div className="drawer-b">
              <div className="form-grid">
                <div className="field">
                  <label htmlFor="product-name">Name</label>
                  <input
                    id="product-name"
                    className="input"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div className="field">
                  <label htmlFor="product-sap">SAP article</label>
                  <input
                    id="product-sap"
                    className="input mono"
                    value={sapArticle}
                    onChange={(e) => setSapArticle(e.target.value)}
                  />
                </div>
                <div className="field">
                  <label htmlFor="product-style">Style number</label>
                  <input
                    id="product-style"
                    className="input mono"
                    value={styleNumber}
                    onChange={(e) => setStyleNumber(e.target.value)}
                  />
                </div>
                <div className="field">
                  <label htmlFor="product-tax">Tax class code</label>
                  <input
                    id="product-tax"
                    className="input mono"
                    value={taxClassCode}
                    onChange={(e) => setTaxClassCode(e.target.value)}
                  />
                </div>
              </div>

              <div className="stack" style={{ marginTop: 8 }}>
                <div className="row">
                  <h3>Variants</h3>
                  <button
                    type="button"
                    className="btn sm"
                    onClick={() =>
                      setVariants((current) => [...current, emptyVariant()])
                    }
                  >
                    Add variant
                  </button>
                </div>
                {variants.map((variant, index) => (
                  <div key={variant.key} className="form-grid">
                    <div className="field">
                      <label htmlFor={`variant-sku-${variant.key}`}>
                        SKU {index + 1}
                      </label>
                      <input
                        id={`variant-sku-${variant.key}`}
                        className="input mono"
                        value={variant.sku}
                        onChange={(e) =>
                          updateVariant(variant.key, 'sku', e.target.value)
                        }
                      />
                    </div>
                    <div className="field">
                      <label htmlFor={`variant-color-${variant.key}`}>
                        Color
                      </label>
                      <input
                        id={`variant-color-${variant.key}`}
                        className="input"
                        value={variant.color}
                        onChange={(e) =>
                          updateVariant(variant.key, 'color', e.target.value)
                        }
                      />
                    </div>
                    <div className="field">
                      <label htmlFor={`variant-size-${variant.key}`}>
                        Size
                      </label>
                      <input
                        id={`variant-size-${variant.key}`}
                        className="input"
                        value={variant.size}
                        onChange={(e) =>
                          updateVariant(variant.key, 'size', e.target.value)
                        }
                      />
                    </div>
                    <div className="field" style={{ alignSelf: 'end' }}>
                      <button
                        type="button"
                        className="btn sm danger"
                        disabled={variants.length <= 1}
                        onClick={() => removeVariant(variant.key)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="drawer-f">
              <button
                type="button"
                className="btn"
                onClick={() => setDrawerOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn primary"
                disabled={saving || !canSave}
                onClick={() => void handleSave()}
              >
                {saving ? 'Creating…' : 'Create product'}
              </button>
            </div>
          </aside>
        </>
      ) : null}
    </>
  )
}
