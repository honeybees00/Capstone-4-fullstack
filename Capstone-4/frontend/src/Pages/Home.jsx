import { useState, useEffect, useCallback } from 'react'

const API = '/products'
const emptyForm = { name: '', price: '', quantity: '' }

export default function Home() {
  const [products, setProducts]   = useState([])
  const [loading, setLoading]     = useState(true)
  const [form, setForm]           = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [error, setError]         = useState('')
  const [saving, setSaving]       = useState(false)
  const [view, setView]           = useState('table')
  const [lastUpdated, setLastUpdated] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res  = await fetch(`${API}/`)
      const data = await res.json()
      setProducts(Array.isArray(data) ? data : [])
      setLastUpdated(new Date())
    } catch {
      setError('Could not reach the server.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const handleChange = (e) =>
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSaving(true)
    const payload = {
      name:     form.name.trim(),
      price:    parseFloat(form.price),
      quantity: parseInt(form.quantity, 10),
    }
    try {
      const url    = editingId ? `${API}/${editingId}` : `${API}/`
      const method = editingId ? 'PUT' : 'POST'
      const res    = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const body = await res.json()
        throw new Error(body.error || 'Save failed')
      }
      setForm(emptyForm)
      setEditingId(null)
      load()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const startEdit = (p) => {
    setEditingId(p.id)
    setForm({ name: p.name, price: p.price, quantity: p.quantity })
    setError('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const cancelEdit = () => {
    setEditingId(null)
    setForm(emptyForm)
    setError('')
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this product?')) return
    try {
      const res = await fetch(`${API}/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const body = await res.json()
        throw new Error(body.error || 'Delete failed')
      }
      load()
    } catch (err) {
      setError(err.message)
    }
  }

  const totalValue  = products.reduce((s, p) => s + parseFloat(p.price) * p.quantity, 0)
  const lowStock    = products.filter(p => p.quantity < 10).length
  const timeLabel   = lastUpdated
    ? lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : '—'

  return (
    <div className="min-h-screen bg-cream font-sans">

      {/* ── HERO ── */}
      <header className="relative overflow-hidden bg-gradient-to-br from-burgundy-dark via-burgundy to-burgundy-mid pb-12 pt-8 px-4 sm:pb-14 sm:pt-10 sm:px-6">

        {/* radial glows */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute right-0 top-0 h-64 w-64 rounded-full bg-peach opacity-10 blur-3xl" />
          <div className="absolute left-0 bottom-0 h-48 w-48 rounded-full bg-peach opacity-5 blur-2xl" />
        </div>

        <div className="relative mx-auto max-w-5xl">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">

            {/* Brand */}
            <div className="flex flex-col gap-1">
              <span className="font-sans text-[0.65rem] font-bold uppercase tracking-[0.18em] text-peach opacity-80">
                Inventory Management
              </span>
              <div className="flex items-center gap-3">
                <img src="/bird-logo.svg" alt="Phoenix"
                  className="h-8 w-12 shrink-0 brightness-0 invert opacity-90 sm:h-9 sm:w-14" />
                <h1 className="font-serif text-2xl font-normal tracking-tight text-white sm:text-3xl"
                  style={{ textShadow: '2px 3px 6px rgba(80,65,70,.65), 0 1px 2px rgba(40,25,30,.45)' }}>
                  Phoenix Product Catalog
                </h1>
              </div>

              {/* Live stats row */}
              <div className="mt-3 flex flex-wrap gap-4 sm:gap-5">
                <Stat label="Products"    value={products.length} />
                <Stat label="Total Value" value={`$${totalValue.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2})}`} />
                <Stat label="Low Stock"   value={lowStock} warn={lowStock > 0} />
              </div>
            </div>

            {/* Right side: live indicator + view toggle */}
            <div className="flex flex-row items-center justify-between gap-3 sm:flex-col sm:items-end sm:self-center">
              {/* Live indicator */}
              <div className="flex items-center gap-1.5 text-[0.65rem] text-white/50 font-sans">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-peach opacity-60" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-peach" />
                </span>
                Live · {timeLabel}
              </div>

              {/* View toggle */}
              <div className="flex overflow-hidden rounded-lg border border-white/20 bg-white/10">
                {['table','cards'].map(v => (
                  <button key={v}
                    onClick={() => setView(v)}
                    className={`px-3 py-1.5 text-xs font-semibold font-sans tracking-wide transition-all sm:px-4
                      ${view === v
                        ? 'bg-white/20 text-white'
                        : 'text-white/50 hover:text-white hover:bg-white/10'}`}>
                    {v === 'table' ? '☰ Table' : '⊞ Cards'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ── MAIN ── */}
      <main className="relative z-10 mx-auto -mt-6 max-w-5xl px-3 pb-16 sm:px-4">

        {/* ── FORM CARD ── */}
        <div className="mb-4 rounded-2xl border border-cream-dark bg-white p-4 shadow-md sm:p-6">
          <div className="mb-5 flex items-center gap-2 border-b border-cream-dark pb-4">
            <span className="h-2 w-2 rounded-full bg-peach" />
            <h2 className="font-sans text-[0.72rem] font-bold uppercase tracking-widest text-brown-mid">
              {editingId ? 'Edit Product' : 'Add New Product'}
            </h2>
          </div>

          {error && (
            <div className="mb-4 rounded-lg border-l-4 border-red-500 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-[2fr_1fr_1fr]">
              <Field label="Product Name" id="name">
                <input id="name" name="name" required
                  placeholder="e.g. Wireless Headphones"
                  value={form.name} onChange={handleChange}
                  className="input-base" />
              </Field>
              <Field label="Price (USD)" id="price">
                <input id="price" name="price" type="number" step="0.01" min="0" required
                  placeholder="0.00"
                  value={form.price} onChange={handleChange}
                  className="input-base" />
              </Field>
              <Field label="Quantity" id="quantity">
                <input id="quantity" name="quantity" type="number" min="0" required
                  placeholder="0"
                  value={form.quantity} onChange={handleChange}
                  className="input-base" />
              </Field>
            </div>

            <div className="mt-5 flex flex-col gap-3 xs:flex-row sm:flex-row">
              <button type="submit" disabled={saving}
                className="w-full rounded-lg bg-gradient-to-r from-burgundy to-burgundy-dark px-5 py-2.5
                           font-sans text-sm font-bold text-white shadow-md transition-all
                           hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-50 sm:w-auto">
                {saving ? 'Saving…' : editingId ? '✓ Update Product' : '+ Add Product'}
              </button>
              {editingId && (
                <button type="button" onClick={cancelEdit}
                  className="w-full rounded-lg border border-cream-dark bg-cream px-5 py-2.5
                             font-sans text-sm font-semibold text-brown-mid
                             transition-all hover:bg-cream-dark sm:w-auto">
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        {/* ── PRODUCT LIST CARD ── */}
        <div className="rounded-2xl border border-cream-dark bg-white shadow-md">
          {/* Toolbar */}
          <div className="flex items-center justify-between border-b border-cream-dark px-4 py-3 sm:px-6 sm:py-4">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-peach" />
              <span className="font-sans text-[0.72rem] font-bold uppercase tracking-widest text-brown-mid">
                {loading ? 'Loading…' : `${products.length} product${products.length !== 1 ? 's' : ''}`}
              </span>
            </div>
            <button onClick={load}
              className="rounded-md border border-cream-dark px-3 py-1 font-sans text-xs
                         font-semibold text-brown-mid transition-all hover:bg-cream-dark">
              ↻ Refresh
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center py-16">
              <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-cream-dark border-t-burgundy" />
            </div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-16 text-brown-light">
              <span className="text-4xl opacity-40">◻</span>
              <p className="font-sans text-sm">No products yet — add one above.</p>
            </div>
          ) : view === 'table' ? (
            <TableView products={products} editingId={editingId} onEdit={startEdit} onDelete={handleDelete} />
          ) : (
            <CardView products={products} editingId={editingId} onEdit={startEdit} onDelete={handleDelete} />
          )}
        </div>
      </main>
    </div>
  )
}

/* ── Stat chip ── */
function Stat({ label, value, warn }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className={`font-sans text-lg font-bold ${warn ? 'text-peach' : 'text-white'}`}>
        {value}
      </span>
      <span className="font-sans text-[0.62rem] font-medium uppercase tracking-widest text-white/40">
        {label}
      </span>
    </div>
  )
}

/* ── Form field wrapper ── */
function Field({ label, id, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id}
        className="font-sans text-[0.68rem] font-bold uppercase tracking-widest text-brown-mid">
        {label}
      </label>
      {children}
    </div>
  )
}

/* ── Table view ── */
function TableView({ products, editingId, onEdit, onDelete }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr>
            {['ID','Product Name','Price','Qty','Actions'].map(h => (
              <th key={h}
                className="bg-cream px-3 py-3 text-left font-sans text-[0.65rem] font-bold
                           uppercase tracking-widest text-brown-mid first:rounded-none
                           border-b-2 border-cream-dark sm:px-5">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {products.map(p => (
            <tr key={p.id}
              className={`group border-b border-cream-dark transition-colors last:border-0
                ${editingId === p.id ? 'bg-peach-light' : 'hover:bg-peach-soft'}`}>
              <td className="px-3 py-3 font-sans text-xs font-medium text-brown-light sm:px-5 sm:py-3.5">
                #{p.id}
              </td>
              <td className="px-3 py-3 font-serif font-normal text-burgundy-dark sm:px-5 sm:py-3.5">
                {p.name}
              </td>
              <td className="px-3 py-3 font-sans font-bold text-brown sm:px-5 sm:py-3.5">
                ${parseFloat(p.price).toFixed(2)}
              </td>
              <td className="px-3 py-3 sm:px-5 sm:py-3.5">
                <QtyBadge qty={p.quantity} />
              </td>
              <td className="px-3 py-3 sm:px-5 sm:py-3.5">
                <div className="flex gap-1.5 sm:gap-2">
                  <ActionBtn onClick={() => onEdit(p)} variant="outline">Edit</ActionBtn>
                  <ActionBtn onClick={() => onDelete(p.id)} variant="danger">Del</ActionBtn>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/* ── Card grid view ── */
function CardView({ products, editingId, onEdit, onDelete }) {
  return (
    <div className="grid grid-cols-1 gap-3 p-3 sm:grid-cols-2 sm:gap-4 sm:p-6 lg:grid-cols-3">
      {products.map(p => (
        <div key={p.id}
          className={`relative flex flex-col gap-3 overflow-hidden rounded-xl border p-5
            transition-all duration-200 hover:-translate-y-1 hover:shadow-lg
            ${editingId === p.id
              ? 'border-burgundy-mid shadow-md shadow-burgundy/10'
              : 'border-cream-dark shadow-sm'}`}>
          {/* Top accent bar */}
          <div className="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-peach to-burgundy-mid" />

          <div className="flex items-start justify-between">
            <span className="font-sans text-[0.65rem] font-semibold uppercase tracking-wider text-brown-light">
              Item #{p.id}
            </span>
            <QtyBadge qty={p.quantity} />
          </div>

          <p className="font-serif text-base text-burgundy-dark">{p.name}</p>

          <div className="h-px bg-cream-dark" />

          <div className="flex items-center justify-between">
            <span className="font-sans text-xl font-bold text-brown">
              ${parseFloat(p.price).toFixed(2)}
            </span>
            <div className="flex gap-2">
              <ActionBtn onClick={() => onEdit(p)} variant="outline">Edit</ActionBtn>
              <ActionBtn onClick={() => onDelete(p.id)} variant="danger">✕</ActionBtn>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

/* ── Qty badge ── */
function QtyBadge({ qty }) {
  const low = qty < 10
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 font-sans text-xs font-bold
      ${low
        ? 'bg-amber-50 text-amber-700 ring-1 ring-amber-200'
        : 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'}`}>
      {qty} {low ? '⚠ low' : 'units'}
    </span>
  )
}

/* ── Action buttons ── */
function ActionBtn({ onClick, variant, children }) {
  const base = 'rounded-md px-3 py-1 font-sans text-xs font-semibold transition-all'
  const styles = {
    outline: 'border border-brown-light text-brown-mid hover:bg-peach-light hover:border-burgundy-mid',
    danger:  'bg-red-50 text-red-600 border border-red-100 hover:bg-red-100',
  }
  return (
    <button onClick={onClick} className={`${base} ${styles[variant]}`}>
      {children}
    </button>
  )
}
