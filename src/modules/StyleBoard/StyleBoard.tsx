import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, X, Heart, ShoppingBag, Search } from 'lucide-react'
import { db, type StyleItem } from '../../db/db'
import { PageTransition } from '../../components/layout/PageTransition'
import { Card, SectionLabel } from '../../components/ui/Card'

const CATEGORIES = ['Tops', 'Bottoms', 'Outerwear', 'Shoes', 'Accessories', 'Bags', 'Other']

export function StyleBoard() {
  const [view, setView] = useState<'all' | 'owned' | 'wishlist'>('all')
  const [category, setCategory] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', category: 'Tops', imageUrl: '', tags: '', notes: '', owned: true, wishlist: false })
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onloadend = () => {
      const result = reader.result as string
      setPreviewUrl(result)
      setForm(f => ({ ...f, imageUrl: result }))
    }
    reader.readAsDataURL(file)
  }

  const items = useLiveQuery(() => db.styleItems.orderBy('createdAt').reverse().toArray(), []) ?? []

  const filtered = items.filter(item => {
    if (view === 'owned' && !item.owned) return false
    if (view === 'wishlist' && !item.wishlist) return false
    if (category && item.category !== category) return false
    if (search && !item.name.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const addItem = async () => {
    if (!form.name.trim()) return
    await db.styleItems.add({
      ...form,
      tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
      createdAt: Date.now(),
    })
    setForm({ name: '', category: 'Tops', imageUrl: '', tags: '', notes: '', owned: true, wishlist: false })
    setPreviewUrl(null)
    setShowForm(false)
  }

  const deleteItem = async (id: number) => {
    await db.styleItems.delete(id)
  }

  const toggleWishlist = async (item: StyleItem) => {
    await db.styleItems.update(item.id!, { wishlist: !item.wishlist })
  }

  return (
    <PageTransition>
      <div className="p-6 max-w-5xl mx-auto">
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-6">
          <div>
            <SectionLabel>Style Board</SectionLabel>
            <h1 className="chrome-text text-2xl font-semibold mt-1">Wardrobe</h1>
          </div>
          <motion.button
            onClick={() => setShowForm(s => !s)}
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className="flex items-center gap-2 px-4 py-2 bg-surface2 border border-border rounded-lg text-sm text-chrome-dim hover:text-chrome hover:border-chrome/30 transition-all">
            <Plus size={14} /> Add Item
          </motion.button>
        </motion.div>

        {/* Filters */}
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <div className="flex bg-surface2 rounded-lg border border-border p-1 gap-1">
            {(['all', 'owned', 'wishlist'] as const).map(v => (
              <button key={v} onClick={() => setView(v)}
                className={`px-3 py-1 rounded-md text-xs transition-all ${view === v ? 'bg-surface border border-border text-chrome' : 'text-chrome-dim hover:text-chrome'}`}>
                {v === 'all' ? 'All' : v === 'owned' ? 'Owned' : '♡ Wishlist'}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1 bg-surface2 border border-border rounded-lg px-3 py-1.5">
            <Search size={12} className="text-chrome-dim" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search…"
              className="bg-transparent text-xs text-chrome outline-none w-32 placeholder-chrome-dim/50" />
          </div>

          <div className="flex gap-1 flex-wrap">
            <button onClick={() => setCategory(null)}
              className={`px-2 py-1 rounded-md text-xs border transition-all ${!category ? 'border-chrome/40 text-chrome' : 'border-border text-chrome-dim hover:border-chrome/20'}`}>
              All
            </button>
            {CATEGORIES.map(c => (
              <button key={c} onClick={() => setCategory(category === c ? null : c)}
                className={`px-2 py-1 rounded-md text-xs border transition-all ${category === c ? 'border-chrome/40 text-chrome' : 'border-border text-chrome-dim hover:border-chrome/20'}`}>
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Add form */}
        <AnimatePresence>
          {showForm && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden mb-6">
              <Card>
                <SectionLabel>New Item</SectionLabel>
                <div className="mt-3 space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Item name…"
                      className="bg-surface2 border border-border rounded-lg px-3 py-2 text-sm text-chrome outline-none focus:border-chrome/30" />
                    <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                      className="bg-surface2 border border-border rounded-lg px-3 py-2 text-sm text-chrome-dim outline-none">
                      {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <label className="cursor-pointer flex items-center gap-2 px-3 py-2 border border-border rounded-lg text-xs text-chrome-dim uppercase tracking-widest hover:border-chrome/30 transition-colors">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                    Bild hochladen
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                  </label>
                  {previewUrl && (
                    <img src={previewUrl} alt="Preview" className="w-full h-24 object-cover rounded-lg" />
                  )}
                  <input value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} placeholder="Tags (comma separated)…"
                    className="w-full bg-surface2 border border-border rounded-lg px-3 py-2 text-sm text-chrome outline-none focus:border-chrome/30" />
                  <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Notes…" rows={2}
                    className="w-full bg-surface2 border border-border rounded-lg px-3 py-2 text-sm text-chrome resize-none outline-none focus:border-chrome/30" />
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 text-sm text-chrome-dim cursor-pointer">
                      <input type="checkbox" checked={form.owned} onChange={e => setForm(f => ({ ...f, owned: e.target.checked }))} className="accent-chrome" />
                      Owned
                    </label>
                    <label className="flex items-center gap-2 text-sm text-chrome-dim cursor-pointer">
                      <input type="checkbox" checked={form.wishlist} onChange={e => setForm(f => ({ ...f, wishlist: e.target.checked }))} className="accent-chrome" />
                      Wishlist
                    </label>
                  </div>
                  <button onClick={addItem} className="w-full py-2 bg-surface2 border border-border rounded-lg text-sm text-chrome hover:border-chrome/30 transition-colors">
                    Add to Wardrobe
                  </button>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card className="text-center">
            <p className="text-chrome-bright text-xl font-semibold font-mono">{items.filter(i => i.owned).length}</p>
            <SectionLabel>Owned</SectionLabel>
          </Card>
          <Card className="text-center">
            <p className="text-chrome-bright text-xl font-semibold font-mono">{items.filter(i => i.wishlist).length}</p>
            <SectionLabel>Wishlist</SectionLabel>
          </Card>
          <Card className="text-center">
            <p className="text-chrome-bright text-xl font-semibold font-mono">{CATEGORIES.filter(c => items.some(i => i.category === c)).length}</p>
            <SectionLabel>Categories</SectionLabel>
          </Card>
        </div>

        {/* Grid */}
        {filtered.length === 0 ? (
          <Card><p className="text-chrome-dim text-sm text-center py-8">No items found. Add something to your wardrobe!</p></Card>
        ) : (
          <motion.div
            className="grid grid-cols-3 gap-3"
            initial="hidden"
            animate="show"
            variants={{ show: { transition: { staggerChildren: 0.05 } } }}
          >
            {filtered.map((item) => (
              <motion.div
                key={item.id}
                variants={{ hidden: { opacity: 0, scale: 0.95 }, show: { opacity: 1, scale: 1 } }}
              >
                <Card className="group relative overflow-hidden">
                  {item.imageUrl ? (
                    <div className="w-full h-36 mb-3 rounded-lg overflow-hidden bg-surface2">
                      <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="w-full h-36 mb-3 rounded-lg bg-surface2 border border-border flex items-center justify-center">
                      <ShoppingBag size={28} className="text-chrome-dim/30" />
                    </div>
                  )}

                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-chrome font-medium truncate">{item.name}</p>
                      <p className="text-xs text-chrome-dim mt-0.5">{item.category}</p>
                    </div>
                    <div className="flex gap-1 shrink-0 ml-2">
                      <button onClick={() => toggleWishlist(item)} className={`transition-colors ${item.wishlist ? 'text-pink-400' : 'text-chrome-dim hover:text-pink-400'}`}>
                        <Heart size={13} fill={item.wishlist ? 'currentColor' : 'none'} />
                      </button>
                      <button onClick={() => deleteItem(item.id!)} className="text-chrome-dim hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100">
                        <X size={13} />
                      </button>
                    </div>
                  </div>

                  {item.tags.length > 0 && (
                    <div className="flex gap-1 mt-2 flex-wrap">
                      {item.tags.map(t => (
                        <span key={t} className="text-xs px-1.5 py-0.5 bg-surface2 border border-border rounded text-chrome-dim">{t}</span>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-1 mt-2">
                    {item.owned && <span className="text-xs px-1.5 py-0.5 rounded border border-chrome/20 text-chrome/60">owned</span>}
                    {item.wishlist && <span className="text-xs px-1.5 py-0.5 rounded border border-pink-500/20 text-pink-400/60">wishlist</span>}
                  </div>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </PageTransition>
  )
}
