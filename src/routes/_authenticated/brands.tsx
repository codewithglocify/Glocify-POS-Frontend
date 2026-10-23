import { useCallback, useEffect, useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'

import { CloseIcon } from '#/icons'
import { createBrand, listBrands, updateBrand } from '#/lib/api/brands'
import { ApiError } from '#/lib/api/client'
import type { Brand } from '#/lib/api/types'

export const Route = createFileRoute('/_authenticated/brands')({
  component: BrandsPage,
})

function BrandsPage() {
  const navigate = useNavigate()
  const [brands, setBrands] = useState<Array<Brand>>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editing, setEditing] = useState<Brand | null>(null)
  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [status, setStatus] = useState('ACTIVE')
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setBrands(await listBrands())
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        await navigate({ to: '/login' })
        return
      }
      setError(err instanceof Error ? err.message : 'Failed to load brands')
    } finally {
      setLoading(false)
    }
  }, [navigate])

  useEffect(() => {
    void load()
  }, [load])

  function openCreate() {
    setEditing(null)
    setCode('')
    setName('')
    setStatus('ACTIVE')
    setDrawerOpen(true)
  }

  function openEdit(brand: Brand) {
    setEditing(brand)
    setCode(brand.code)
    setName(brand.name)
    setStatus(brand.status)
    setDrawerOpen(true)
  }

  async function handleSave() {
    setSaving(true)
    setError(null)
    try {
      if (editing) {
        await updateBrand(editing.id, { name, status })
      } else {
        await createBrand({ code, name })
      }
      setDrawerOpen(false)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save brand')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <div className="page-head">
        <div className="titles">
          <div className="crumbs">
            <span>Organisation</span>
            <span>/</span>
            <span>Brands</span>
          </div>
          <h1>Brands</h1>
          <p>Create and update brands for the caller organisation.</p>
        </div>
        <div className="actions">
          <button type="button" className="btn" onClick={() => void load()}>
            Refresh
          </button>
          <button type="button" className="btn primary" onClick={openCreate}>
            New brand
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
            <h2>Brand catalogue</h2>
            <div className="sub">{brands.length} brands</div>
          </div>
        </div>
        <div className="panel-b flush">
          {loading ? (
            <div className="panel-b muted">Loading brands…</div>
          ) : (
            <div className="tbl-wrap">
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Name</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {brands.map((brand) => (
                    <tr key={brand.id} className="click" onClick={() => openEdit(brand)}>
                      <td className="mono strong">{brand.code}</td>
                      <td>{brand.name}</td>
                      <td>
                        <span
                          className={`badge ${brand.status === 'ACTIVE' ? 'good' : 'warn'}`}
                        >
                          {brand.status}
                        </span>
                      </td>
                      <td className="r">
                        <button
                          type="button"
                          className="btn sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            openEdit(brand)
                          }}
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                  {brands.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="muted">
                        No brands yet. Create one to get started.
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
          <aside className="drawer" role="dialog" aria-label="Brand form">
            <div className="drawer-h">
              <div className="titles">
                <div className="eyebrow">{editing ? 'Edit' : 'Create'}</div>
                <h2>{editing ? editing.name : 'New brand'}</h2>
              </div>
              <button
                type="button"
                className="iconbtn drawer-close"
                aria-label="Close"
                onClick={() => setDrawerOpen(false)}
              >
                <CloseIcon />
              </button>
            </div>
            <div className="drawer-b">
              <div className="field">
                <label htmlFor="brand-code">Code</label>
                <input
                  id="brand-code"
                  className="input"
                  value={code}
                  disabled={Boolean(editing)}
                  onChange={(e) => setCode(e.target.value)}
                />
              </div>
              <div className="field">
                <label htmlFor="brand-name">Name</label>
                <input
                  id="brand-name"
                  className="input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              {editing ? (
                <div className="field">
                  <label htmlFor="brand-status">Status</label>
                  <select
                    id="brand-status"
                    className="input"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">INACTIVE</option>
                  </select>
                </div>
              ) : null}
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
                disabled={saving || !name || (!editing && !code)}
                onClick={() => void handleSave()}
              >
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </aside>
        </>
      ) : null}
    </>
  )
}
