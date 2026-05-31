import { useState, useEffect, useCallback, useRef } from 'react'

const API = '/products'
const emptyForm = { name: '', price: '', quantity: '', discontinued: false }

/* ── client-side validation ── */
function validateForm(form) {
  if (!form.name.trim())                        return 'Product name is required.'
  if (form.name.trim().length > 100)            return 'Name must be 100 characters or fewer.'
  if (form.price === '' || isNaN(form.price))   return 'A valid price is required.'
  if (parseFloat(form.price) < 0)               return 'Price cannot be negative.'
  if (form.quantity === '' || isNaN(form.quantity)) return 'A valid quantity is required.'
  if (parseInt(form.quantity, 10) < 0)          return 'Quantity cannot be negative.'
  return null
}

export default function Home() {
  const [products, setProducts]       = useState([])
  const [loading, setLoading]         = useState(true)
  const [form, setForm]               = useState(emptyForm)
  const [editingId, setEditingId]     = useState(null)
  const [error, setError]             = useState('')
  const [success, setSuccess]         = useState('')
  const [saving, setSaving]           = useState(false)
  const [view, setView]               = useState('table')
  const [lastUpdated, setLastUpdated] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res  = await fetch(`${API}/`)
      if (!res.ok) throw new Error('Server error')
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

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    const validationError = validateForm(form)
    if (validationError) { setError(validationError); return }

    setSaving(true)
    const payload = {
      name:         form.name.trim(),
      price:        parseFloat(parseFloat(form.price).toFixed(2)),
      quantity:     parseInt(form.quantity, 10),
      discontinued: Boolean(form.discontinued),
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
      setSuccess(editingId ? 'Product updated successfully.' : 'Product added successfully.')
      setForm(emptyForm)
      setEditingId(null)
      load()
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const startEdit = (p) => {
    setEditingId(p.id)
    setForm({ name: p.name, price: p.price, quantity: p.quantity, discontinued: p.discontinued || false })
    setError('')
    setSuccess('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const cancelEdit = () => { setEditingId(null); setForm(emptyForm); setError(''); setSuccess('') }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this product?')) return
    setError('')
    try {
      const res = await fetch(`${API}/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const body = await res.json()
        throw new Error(body.error || 'Delete failed')
      }
      setSuccess('Product deleted.')
      load()
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.message)
    }
  }

  const totalValue = products.reduce((s, p) => s + parseFloat(p.price) * p.quantity, 0)
  const lowStock   = products.filter(p => p.quantity < 10).length
  const timeLabel  = lastUpdated
    ? lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : '—'

  return (
    <div className="flex min-h-screen flex-col bg-base font-sans">

      {/* ── FIXED LIVE INDICATOR ── */}
      <div className="fixed top-4 right-4 z-50 flex items-center gap-2 rounded-full border border-white/10 bg-base/80 px-3 py-1.5 backdrop-blur-sm">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
        </span>
        <span className="font-sans text-[0.6rem] tracking-wider text-white/60">
          Live · {timeLabel}
        </span>
      </div>

      {/* ── HERO ── */}
      <header className="relative overflow-hidden bg-gradient-to-br from-[#040e0d] via-[#061212] to-[#070e0e] pb-16 pt-10 px-8 sm:pb-20 sm:pt-12 sm:px-16 lg:px-28">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute right-0 top-0 h-72 w-72 rounded-full bg-accent opacity-8 blur-3xl" />
          <div className="absolute left-0 bottom-0 h-56 w-56 rounded-full bg-sage opacity-5 blur-2xl" />
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent/30 to-transparent" />

        <div className="relative mx-auto max-w-5xl">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">

            {/* Brand */}
            <div className="flex flex-col gap-3">
              <span className="font-sans text-[0.65rem] font-bold uppercase tracking-[0.2em] text-accent opacity-80">
                Inventory Management System
              </span>
              <div className="flex items-center gap-5">
                <div className="flex items-end gap-2">
                  <img src="/bird-logo.svg" alt="Phoenix"
                    className="h-10 w-16 shrink-0 brightness-0 invert opacity-90" />
                  <img src="/bird-logo.svg" alt=""
                    className="h-7 w-11 shrink-0 brightness-0 invert opacity-60" />
                  <img src="/bird-logo.svg" alt=""
                    className="h-4 w-7 shrink-0 brightness-0 invert opacity-40" />
                </div>
                <div>
                  <h1 className="font-serif text-xl font-bold tracking-wide text-text text-center sm:text-3xl lg:text-4xl"
                    style={{ textShadow: '2px 3px 8px rgba(0,0,0,.7)' }}>
                    Phoenix Product Catalog
                  </h1>
                  <p className="mt-1 font-sans text-[0.65rem] tracking-widest text-white/30 uppercase text-center">
                    Full-Stack Capstone Project
                  </p>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-4 sm:gap-8">
                <Stat label="Total Products" value={products.length} />
                <Stat label="Catalog Value"  value={`$${totalValue.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2})}`} />
                <Stat label="Low Stock"      value={lowStock} warn={lowStock > 0} />
              </div>
            </div>

            {/* Right side */}
            <div className="flex flex-row items-center justify-between gap-4 sm:flex-col sm:items-end sm:self-center">
              <div className="flex overflow-hidden rounded-lg border border-white/10 bg-white/5">
                {['table','cards'].map(v => (
                  <button key={v} onClick={() => setView(v)}
                    className={`px-6 py-3 text-xs font-semibold font-sans tracking-wide transition-all
                      ${view === v ? 'bg-white/15 text-white' : 'text-white/40 hover:text-white/70 hover:bg-white/8'}`}>
                    {v === 'table' ? '☰  Table' : '⊞  Cards'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ── MAIN ── */}
      <main className="relative z-10 mx-auto w-full max-w-5xl flex-1 mt-0 px-2 pb-2 sm:px-16 lg:px-28">

        {/* ── STEP 1 LABEL ── */}
        {/* ── FORM CARD ── */}
        <div className="mb-6 mt-16 rounded-2xl border border-border bg-surface-card p-2 shadow-2xl">
          <div className="mb-2 flex items-center gap-3 border-b border-border pb-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent/10 ring-1 ring-accent/20">
              <span className="h-2 w-2 rounded-full bg-accent" />
            </div>
            <h2 className="font-sans text-sm font-bold uppercase tracking-widest text-text-muted">
              {editingId ? 'Edit Product' : 'Add New Product'}
            </h2>
            {editingId && (
              <span className="ml-auto rounded-full bg-accent/10 px-3 py-1 font-sans text-[0.65rem] font-bold text-accent ring-1 ring-accent/20">
                Editing #{editingId}
              </span>
            )}
          </div>

          {error && (
            <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/8 px-5 py-4">
              <span className="mt-0.5 text-red-400">⚠</span>
              <p className="font-sans text-sm text-red-400">{error}</p>
            </div>
          )}
          {success && (
            <div className="mb-6 flex items-start gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/8 px-5 py-4">
              <span className="mt-0.5 text-emerald-400">✓</span>
              <p className="font-sans text-sm text-emerald-400">{success}</p>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-[2fr_1fr_1fr] sm:gap-6">
              <Field label="Product Name" id="name">
                <input id="name" name="name" required maxLength={100}
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
              <Field label="Quantity / Stock" id="quantity">
                <input id="quantity" name="quantity" type="number" min="0" required
                  placeholder="0"
                  value={form.quantity} onChange={handleChange}
                  className="input-base" />
              </Field>
            </div>

            {/* Discontinued toggle */}
            <label className="mt-5 flex cursor-pointer items-center gap-3 self-start rounded-xl border border-border bg-surface px-4 py-3 transition-all hover:bg-surface-high">
              <div className={`relative h-5 w-9 rounded-full transition-colors ${form.discontinued ? 'bg-red-500' : 'bg-border'}`}>
                <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${form.discontinued ? 'left-4' : 'left-0.5'}`} />
              </div>
              <input type="checkbox" name="discontinued" checked={form.discontinued} onChange={handleChange} className="sr-only" />
              <span className={`font-sans text-xs font-semibold ${form.discontinued ? 'text-red-400' : 'text-text-muted'}`}>
                {form.discontinued ? 'Discontinued' : 'Mark as Discontinued'}
              </span>
            </label>

            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
              <button type="submit" disabled={saving}
                className="w-full rounded-full bg-gradient-to-r from-accent to-accent-dark py-3.5 px-12
                           font-sans text-sm font-bold text-white transition-all
                           shadow-[0_4px_20px_rgba(20,184,166,0.35)]
                           hover:-translate-y-0.5 hover:shadow-[0_8px_28px_rgba(20,184,166,0.5)]
                           disabled:opacity-50 sm:w-auto">
                {saving ? 'Saving…' : editingId ? '✓  Update Product' : '+  Add Product'}
              </button>
              {editingId && (
                <button type="button" onClick={cancelEdit}
                  className="w-full rounded-full border border-border bg-surface px-10 py-3.5
                             font-sans text-sm font-semibold text-text-muted
                             transition-all hover:bg-surface-high sm:w-auto">
                  Cancel
                </button>
              )}
              <span className="hidden font-sans text-[0.65rem] text-text-muted sm:ml-auto sm:block">
                All fields required · Max name 100 chars · Price &amp; qty ≥ 0
              </span>
            </div>
          </form>
        </div>

        {/* ── STEP 2 LABEL ── */}
        {/* ── PRODUCT LIST CARD ── */}
        <div className="mb-6 rounded-2xl border border-border bg-surface-card shadow-2xl">
          <div className="flex items-center justify-between border-b border-border px-2 py-2">
            <div className="flex items-center gap-3">
              <span className="h-2 w-2 rounded-full bg-accent" />
              <span className="font-sans text-xs font-bold uppercase tracking-widest text-text-muted sm:text-sm">
                {loading ? 'Loading…' : `${products.length} Product${products.length !== 1 ? 's' : ''}`}
                <span className="hidden sm:inline"> in Catalog</span>
              </span>
            </div>
            <button onClick={load}
              className="rounded-lg border border-border px-5 py-2.5 font-sans text-xs
                         font-semibold text-text-muted transition-all hover:bg-surface-high hover:text-text">
              ↻  Refresh
            </button>
          </div>

          {loading ? (
            <div className="flex flex-col items-center gap-4 py-24">
              <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-border border-t-accent" />
              <p className="font-sans text-xs tracking-widest text-text-muted uppercase animate-pulse">Fetching products…</p>
            </div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center gap-4 py-24 text-text-muted">
              <span className="text-5xl opacity-20">◻</span>
              <p className="font-sans text-sm">No products yet — add one using the form above.</p>
            </div>
          ) : view === 'table' ? (
            <TableView products={products} editingId={editingId} onEdit={startEdit} onDelete={handleDelete} />
          ) : (
            <CardView products={products} editingId={editingId} onEdit={startEdit} onDelete={handleDelete} />
          )}
        </div>

        {/* ── INVENTORY DASHBOARD ── */}
        <InventoryDashboard products={products} />

        {/* ── AI BOT CHAT ── */}
        <BotChat />
      </main>

      {/* ── FOOTER ── */}
      <footer className="mt-auto border-t border-border bg-surface-card px-2 py-2 sm:px-16 lg:px-28">
        <div className="mx-auto max-w-5xl flex flex-col items-center gap-2 sm:flex-row sm:justify-between">
          <div className="flex items-center gap-3">
            <img src="/bird-logo.svg" alt="Phoenix"
              className="h-5 w-8 brightness-0 invert opacity-40" />
            <span className="font-serif text-sm text-text-muted">Phoenix Product Catalog</span>
          </div>
          <p className="font-sans text-xs text-text-muted text-center">
            © {new Date().getFullYear()} Christina Ortiz · All Rights Reserved
          </p>
          <div className="flex items-center gap-4">
            <span className="font-sans text-[0.6rem] uppercase tracking-widest text-text-muted">
              Flask · React · PostgreSQL · n8n
            </span>
          </div>
        </div>
      </footer>
    </div>
  )
}

/* ── Stat chip ── */
function Stat({ label, value, warn }) {
  return (
    <div className="flex flex-col gap-1">
      <span className={`font-sans text-lg font-bold sm:text-2xl ${warn ? 'text-amber-400' : 'text-text'}`}>
        {value}
      </span>
      <span className="font-sans text-[0.6rem] font-medium uppercase tracking-widest text-white/35">
        {label}
      </span>
    </div>
  )
}

/* ── Form field wrapper ── */
function Field({ label, id, children }) {
  return (
    <div className="flex flex-col gap-2.5">
      <label htmlFor={id}
        className="font-sans text-[0.68rem] font-bold uppercase tracking-widest text-text-muted">
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
      <table className="w-full min-w-[540px] text-sm">
        <thead>
          <tr>
            {['ID', 'Product Name', 'Price (USD)', 'Stock', 'Actions'].map(h => (
              <th key={h}
                className="bg-surface-high px-2 py-2 text-left font-sans text-[0.65rem] font-bold
                           uppercase tracking-widest text-text-muted border-b-2 border-border">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {products.map(p => (
            <tr key={p.id}
              className={`border-b border-border transition-colors last:border-0
                ${editingId === p.id ? 'bg-accent/[0.06]' : 'hover:bg-accent/[0.03]'}`}>
              <td className="px-2 py-2 font-sans text-xs font-medium text-text-muted">
                #{p.id}
              </td>
              <td className="px-2 py-2 font-serif text-sm text-text">
                <span className="flex items-center gap-2">
                  {p.name}
                  {p.discontinued && (
                    <span className="rounded-full bg-red-500/10 px-2 py-0.5 font-sans text-[0.58rem] font-bold uppercase tracking-wide text-red-400 ring-1 ring-red-500/20">
                      Discontinued
                    </span>
                  )}
                </span>
              </td>
              <td className="px-2 py-2 font-sans text-sm font-bold text-accent-mid">
                ${parseFloat(p.price).toFixed(2)}
              </td>
              <td className="px-2 py-2">
                <QtyBadge qty={p.quantity} />
              </td>
              <td className="px-2 py-2">
                <div className="flex gap-3">
                  <ActionBtn onClick={() => onEdit(p)} variant="outline">Edit</ActionBtn>
                  <ActionBtn onClick={() => onDelete(p.id)} variant="danger">Delete</ActionBtn>
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
    <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
      {products.map(p => (
        <div key={p.id}
          className={`relative flex flex-col gap-4 overflow-hidden rounded-xl border p-4
            transition-all duration-200 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/30
            ${editingId === p.id
              ? 'border-accent/40 shadow-lg shadow-accent/10'
              : 'border-border hover:border-border-light shadow-sm'}`}>
          <div className="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-accent to-accent-dark" />

          {/* Row 1: ID + badge */}
          <div className="flex items-start justify-between">
            <span className="font-sans text-[0.62rem] font-semibold uppercase tracking-wider text-text-muted">
              Item #{p.id}
            </span>
            <QtyBadge qty={p.quantity} />
          </div>

          {/* Row 2: Product name LEFT · Price RIGHT */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex flex-col gap-1 min-w-0">
              <p className="font-serif text-base leading-snug text-text truncate">{p.name}</p>
              {p.discontinued && (
                <span className="self-start rounded-full bg-red-500/10 px-2 py-0.5 font-sans text-[0.58rem] font-bold uppercase tracking-wide text-red-400 ring-1 ring-red-500/20">
                  Discontinued
                </span>
              )}
            </div>
            <span className="shrink-0 font-sans text-lg font-bold text-accent-mid">
              ${parseFloat(p.price).toFixed(2)}
            </span>
          </div>

          <div className="h-px bg-border" />

          {/* Row 3: Edit + Delete LEFT */}
          <div className="flex items-center gap-2">
            <ActionBtn onClick={() => onEdit(p)} variant="outline">Edit</ActionBtn>
            <ActionBtn onClick={() => onDelete(p.id)} variant="danger">Delete</ActionBtn>
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
    <span className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 font-sans text-xs font-bold
      ${low
        ? 'bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/20'
        : 'bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20'}`}>
      {low && (
        <span className="relative flex h-2 w-2 shrink-0">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-yellow-400 opacity-80" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-yellow-400" />
        </span>
      )}
      {qty} {low ? 'Low' : 'units'}
    </span>
  )
}

/* ── Inventory Dashboard ── */
function InventoryDashboard({ products }) {
  const ordered      = products.filter(p => !p.discontinued && p.quantity >= 10)
  const backorder    = products.filter(p => !p.discontinued && p.quantity > 0 && p.quantity < 10)
  const outStock     = products.filter(p => !p.discontinued && p.quantity === 0)
  const discontinued = products.filter(p => p.discontinued)
  const maxQty       = Math.max(...products.map(p => p.quantity), 1)

  const widgets = [
    { label: 'Ordered',       desc: 'In stock ≥ 10 units',  count: ordered.length,      color: 'teal'   },
    { label: 'Back-Order',    desc: 'Low stock 1–9 units',  count: backorder.length,     color: 'amber'  },
    { label: 'Out of Stock',  desc: 'Quantity = 0',         count: outStock.length,      color: 'red'    },
    { label: 'Discontinued',  desc: 'No longer carried',    count: discontinued.length,  color: 'gray'   },
  ]

  const colorMap = {
    teal:  { border: 'border-accent/30',    bg: 'bg-accent/10',    text: 'text-accent',          bar: 'bg-accent/80'       },
    amber: { border: 'border-amber-400/30', bg: 'bg-amber-400/10', text: 'text-amber-400',       bar: 'bg-amber-400/80'    },
    red:   { border: 'border-red-400/30',   bg: 'bg-red-400/10',   text: 'text-red-400',         bar: 'bg-red-500/80'      },
    gray:  { border: 'border-border',       bg: 'bg-surface-high', text: 'text-text-muted',      bar: 'bg-text-muted/50'   },
  }

  const barColor = (p) =>
    p.discontinued ? colorMap.gray.bar
    : p.quantity === 0 ? colorMap.red.bar
    : p.quantity < 10  ? colorMap.amber.bar
    : colorMap.teal.bar

  return (
    <div className="mb-6 overflow-hidden rounded-2xl border border-border bg-surface-card shadow-2xl">

      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-2 py-2">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
          </span>
          <span className="font-sans text-xs font-bold uppercase tracking-widest text-text-muted">
            Inventory Dashboard
          </span>
        </div>
        <span className="font-sans text-[0.6rem] text-text-muted">Live · Updates in real time</span>
      </div>

      <div className="p-4">

        {/* Stat Widgets */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {widgets.map(w => {
            const c = colorMap[w.color]
            return (
              <div key={w.label}
                className={`rounded-xl border ${c.border} ${c.bg} p-4 flex flex-col gap-2`}>
                <span className={`font-sans text-[0.6rem] font-bold uppercase tracking-widest ${c.text}`}>
                  {w.label}
                </span>
                <span className={`font-sans text-3xl font-bold ${c.text}`}>
                  {w.count}
                </span>
                <span className="font-sans text-[0.62rem] text-text-muted">{w.desc}</span>
              </div>
            )
          })}
        </div>

        {/* Bar Chart */}
        {products.length > 0 && (
          <div className="mt-6">
            <p className="mb-3 font-sans text-[0.62rem] uppercase tracking-widest text-text-muted">
              Stock Levels by Product
            </p>

            {/* Bars */}
            <div className="flex h-36 items-end gap-1.5 border-b border-border sm:gap-2">
              {products.map(p => {
                const pct = Math.max((p.quantity / maxQty) * 100, p.quantity === 0 ? 0 : 3)
                return (
                  <div key={p.id} className="group relative flex h-full flex-1 min-w-0 flex-col justify-end">
                    {/* Tooltip */}
                    <div className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap
                                    rounded-lg border border-border bg-surface-high px-2 py-1
                                    font-sans text-[0.58rem] text-text opacity-0 transition-opacity group-hover:opacity-100 z-10">
                      {p.name}: {p.quantity} units
                    </div>
                    <div
                      className={`w-full rounded-t-sm transition-all duration-700 ease-out ${barColor(p)}`}
                      style={{ height: `${pct}%` }}
                    />
                  </div>
                )
              })}
            </div>

            {/* X-axis labels */}
            <div className="mt-2 flex gap-1.5 sm:gap-2">
              {products.map(p => (
                <div key={p.id} className="flex-1 min-w-0">
                  <span className="block truncate text-center font-sans text-[0.52rem] text-text-muted">
                    {p.name.split(' ')[0]}
                  </span>
                </div>
              ))}
            </div>

            {/* Legend */}
            <div className="mt-4 flex flex-wrap gap-4">
              {[
                { label: 'Ordered (≥10)',      color: 'bg-accent/80'       },
                { label: 'Back-Order (1–9)',   color: 'bg-amber-400/80'   },
                { label: 'Out of Stock (0)',   color: 'bg-red-500/80'     },
                { label: 'Discontinued',       color: 'bg-text-muted/50'  },
              ].map(l => (
                <div key={l.label} className="flex items-center gap-1.5">
                  <span className={`h-2.5 w-2.5 rounded-sm ${l.color}`} />
                  <span className="font-sans text-[0.6rem] text-text-muted">{l.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {products.length === 0 && (
          <p className="mt-4 text-center font-sans text-xs text-text-muted">
            No products yet — add some to see the chart.
          </p>
        )}
      </div>
    </div>
  )
}

/* ── AI Bot Chat ── */
function BotChat() {
  const [messages, setMessages] = useState([
    { role: 'bot', text: "Hi! I'm your Phoenix inventory assistant. Ask me anything about the product catalog — counts, prices, stock levels, and more." }
  ])
  const [input, setInput]       = useState('')
  const [thinking, setThinking] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, thinking])

  const send = async (text) => {
    const question = (text || input).trim()
    if (!question || thinking) return
    setMessages(prev => [...prev, { role: 'user', text: question }])
    setInput('')
    setThinking(true)
    try {
      const res  = await fetch(`/api/bot?message=${encodeURIComponent(question)}`)
      if (!res.ok) throw new Error('Server error')
      const data = await res.json()
      setMessages(prev => [...prev, { role: 'bot', text: data.reply || 'No response.' }])
    } catch {
      setMessages(prev => [...prev, { role: 'bot', text: 'Could not reach the assistant. Please ensure Flask is running.' }])
    } finally {
      setThinking(false)
    }
  }

  const suggestions = [
    'How many products do we have?',
    'List all products',
    'Which products are low on stock?',
    'Show most expensive products',
  ]

  return (
    <div className="overflow-hidden rounded-2xl border border-border shadow-2xl"
         style={{ background: 'linear-gradient(160deg, #0c1e1e 0%, #091818 100%)' }}>

      {/* Header */}
      <div className="relative flex items-center justify-between border-b border-border px-2 py-2">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/40 to-transparent" />
        <div className="flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 ring-1 ring-accent/20">
            <span className="text-lg leading-none">🔥</span>
          </div>
          <div>
            <p className="font-sans text-sm font-bold text-text">AI Inventory Assistant</p>
            <p className="font-sans text-[0.62rem] text-text-muted">Phoenix · Powered by Flask &amp; PostgreSQL</p>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-border bg-surface/60 px-4 py-2">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
          </span>
          <span className="font-sans text-[0.62rem] font-semibold text-emerald-400">Online</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex h-80 flex-col gap-4 overflow-y-auto bg-base/50 px-2 py-2">
        {messages.map((m, i) => (
          <div key={i} className={`flex items-end gap-3 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {m.role === 'bot' && (
              <div className="mb-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-accent/10 ring-1 ring-accent/20 text-sm">
                🔥
              </div>
            )}
            <div className={`max-w-[75%] rounded-2xl px-5 py-3.5 font-sans text-sm leading-relaxed whitespace-pre-wrap
              ${m.role === 'user'
                ? 'rounded-br-sm bg-gradient-to-br from-accent to-accent-dark text-white shadow-lg shadow-accent/20'
                : 'rounded-bl-sm border border-border/60 bg-surface-high text-text-mid'}`}>
              {m.text}
            </div>
          </div>
        ))}
        {thinking && (
          <div className="flex items-end gap-3">
            <div className="mb-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-accent/10 ring-1 ring-accent/20 text-sm">
              🔥
            </div>
            <div className="rounded-2xl rounded-bl-sm border border-border/60 bg-surface-high px-5 py-4">
              <span className="flex gap-2 items-center">
                <span className="h-2 w-2 animate-bounce rounded-full bg-text-muted" style={{ animationDelay: '0ms' }} />
                <span className="h-2 w-2 animate-bounce rounded-full bg-text-muted" style={{ animationDelay: '150ms' }} />
                <span className="h-2 w-2 animate-bounce rounded-full bg-text-muted" style={{ animationDelay: '300ms' }} />
              </span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Suggested prompts */}
      <div className="flex flex-wrap items-center gap-3 border-t border-border px-2 py-2">
        <span className="font-sans text-[0.6rem] font-bold uppercase tracking-widest text-text-muted">
          Try:
        </span>
        {suggestions.map(s => (
          <button key={s} onClick={() => send(s)} disabled={thinking}
            className="rounded-full border border-border bg-surface/60 px-5 py-2 font-sans text-xs
                       text-text-muted transition-all hover:border-accent/40 hover:bg-accent/5 hover:text-text
                       disabled:opacity-30">
            {s}
          </button>
        ))}
      </div>

      {/* Input row */}
      <div className="flex gap-4 border-t border-border bg-surface/40 px-4 py-4">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
          placeholder="Ask about your inventory…"
          className="input-base flex-1"
        />
        <button onClick={() => send()} disabled={!input.trim() || thinking}
          className="shrink-0 rounded-xl bg-gradient-to-br from-accent to-accent-dark px-5 py-3 sm:px-8 sm:py-3.5
                     font-sans text-sm font-bold text-white transition-all
                     shadow-[0_4px_16px_rgba(20,184,166,0.3)]
                     hover:-translate-y-0.5 hover:shadow-[0_6px_22px_rgba(20,184,166,0.45)]
                     disabled:opacity-30">
          Send
        </button>
      </div>
    </div>
  )
}

/* ── Action buttons ── */
function ActionBtn({ onClick, variant, children }) {
  const base = 'rounded-lg px-5 py-2.5 font-sans text-xs font-semibold transition-all'
  const styles = {
    outline: 'border border-border text-text-muted hover:bg-surface-high hover:border-border-light hover:text-text',
    danger:  'bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20',
  }
  return <button onClick={onClick} className={`${base} ${styles[variant]}`}>{children}</button>
}
