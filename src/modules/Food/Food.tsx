import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, X, Apple, BookOpen, ChefHat } from 'lucide-react'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { db, type Meal, type Recipe } from '../../db/db'
import { PageTransition } from '../../components/layout/PageTransition'
import { Card, SectionLabel } from '../../components/ui/Card'
import { RingWidget } from '../../components/ui/RingWidget'
import { FoodVerlauf } from '../../components/Timeline/FoodVerlauf'

const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'] as const
const MEAL_COLORS: Record<string, string> = {
  breakfast: '#f97316', lunch: '#22c55e', dinner: '#3b82f6', snack: '#8b5cf6',
}
const DEFAULT_MACRO_GOALS = { calories: 2600, protein: 150, carbs: 330, fat: 75 }
const SPRING = { type: 'spring', stiffness: 400, damping: 25 } as const
const RECIPE_CATEGORIES = ['Frühstück', 'Mittagessen', 'Abendessen', 'Snack', 'Meal Prep']

export function Food() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const date = selectedDate.toISOString().slice(0, 10)
  const [foodTab, setFoodTab] = useState<'heute' | 'verlauf' | 'rezepte'>('heute')
  const [showForm, setShowForm] = useState(false)
  const [showRecipePicker, setShowRecipePicker] = useState(false)
  const [recipeSearch, setRecipeSearch] = useState('')
  const [form, setForm] = useState({ name: '', calories: 0, protein: 0, carbs: 0, fat: 0, mealType: 'lunch' as Meal['mealType'] })

  // Recipe form state
  const [showRecipeForm, setShowRecipeForm] = useState(false)
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null)
  const [recipeForm, setRecipeForm] = useState({ name: '', category: RECIPE_CATEGORIES[0], calories: 0, protein: 0, carbs: 0, fat: 0, ingredients: '', instructions: '' })

  const meals = useLiveQuery(() => db.meals.where('date').equals(date).toArray(), [date]) ?? []
  const recipes = useLiveQuery(() => db.recipes.orderBy('name').toArray(), []) ?? []
  const savedGoals = useLiveQuery(() => db.healthGoals.get(1), [])
  const MACRO_GOALS = {
    calories: savedGoals?.calories ?? DEFAULT_MACRO_GOALS.calories,
    protein:  savedGoals?.protein  ?? DEFAULT_MACRO_GOALS.protein,
    carbs:    savedGoals?.carbs    ?? DEFAULT_MACRO_GOALS.carbs,
    fat:      savedGoals?.fat      ?? DEFAULT_MACRO_GOALS.fat,
  }

  const totals = meals.reduce(
    (acc, m) => ({ calories: acc.calories + m.calories, protein: acc.protein + m.protein, carbs: acc.carbs + m.carbs, fat: acc.fat + m.fat }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  )

  const addMeal = async () => {
    if (!form.name.trim()) return
    await db.meals.add({ ...form, date })
    setForm({ name: '', calories: 0, protein: 0, carbs: 0, fat: 0, mealType: 'lunch' })
    setShowForm(false)
  }

  const deleteMeal = async (id: number) => { await db.meals.delete(id) }
  const grouped = MEAL_TYPES.map(t => ({ type: t, items: meals.filter(m => m.mealType === t) }))

  const applyRecipe = (r: Recipe) => {
    setForm({ name: r.name, calories: r.calories, protein: r.protein, carbs: r.carbs, fat: r.fat, mealType: form.mealType })
    setShowRecipePicker(false)
    setShowForm(true)
  }

  const saveRecipe = async () => {
    if (!recipeForm.name.trim()) return
    if (editingRecipe?.id) {
      await db.recipes.update(editingRecipe.id, recipeForm)
    } else {
      await db.recipes.add(recipeForm)
    }
    resetRecipeForm()
  }

  const resetRecipeForm = () => {
    setRecipeForm({ name: '', category: RECIPE_CATEGORIES[0], calories: 0, protein: 0, carbs: 0, fat: 0, ingredients: '', instructions: '' })
    setEditingRecipe(null)
    setShowRecipeForm(false)
  }

  const startEditRecipe = (r: Recipe) => {
    setEditingRecipe(r)
    setRecipeForm({ name: r.name, category: r.category, calories: r.calories, protein: r.protein, carbs: r.carbs, fat: r.fat, ingredients: r.ingredients, instructions: r.instructions })
    setShowRecipeForm(true)
  }

  const deleteRecipe = async (id: number) => { await db.recipes.delete(id) }

  const filteredRecipes = recipes.filter(r =>
    r.name.toLowerCase().includes(recipeSearch.toLowerCase()) ||
    r.category.toLowerCase().includes(recipeSearch.toLowerCase())
  )

  return (
    <PageTransition>
      <div className="p-4 md:p-6 max-w-4xl mx-auto">
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="mb-5 md:mb-6">
          <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
            <div>
              <SectionLabel>Food</SectionLabel>
              <h1 className="chrome-text text-2xl font-semibold mt-1">Nutrition Log</h1>
            </div>
            <div className="flex bg-surface2 rounded-lg border border-border p-1 gap-1">
              {(['heute', 'verlauf', 'rezepte'] as const).map(t => (
                <motion.button key={t} onClick={() => setFoodTab(t)}
                  whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.97 }} transition={SPRING}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${foodTab === t ? 'bg-surface border border-border text-chrome' : 'text-chrome-dim hover:text-chrome'}`}>
                  {t === 'heute' ? 'Heute' : t === 'verlauf' ? 'Verlauf' : 'Rezepte'}
                </motion.button>
              ))}
            </div>
          </div>
          {/* Action row — always same height, visibility controls shift-free show/hide */}
          <div className="flex items-center justify-between" style={{ minHeight: 36 }}>
            <div style={{ visibility: foodTab === 'heute' ? 'visible' : 'hidden' }}>
              <DatePicker
                selected={selectedDate}
                onChange={(d: Date | null) => d && setSelectedDate(d)}
                dateFormat="dd.MM.yyyy"
              />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <div style={{ visibility: foodTab === 'heute' ? 'visible' : 'hidden' }}>
                <motion.button onClick={() => setShowForm(s => !s)}
                  whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.97 }} transition={SPRING}
                  className="flex items-center gap-2 px-4 py-2 bg-surface2 border border-border rounded-lg text-sm text-chrome-dim hover:text-chrome hover:border-chrome/30 transition-all">
                  <Plus size={14} /> Add Meal
                </motion.button>
              </div>
              {foodTab === 'rezepte' && (
                <motion.button onClick={() => { resetRecipeForm(); setShowRecipeForm(true) }}
                  whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.97 }} transition={SPRING}
                  className="flex items-center gap-2 px-4 py-2 bg-surface2 border border-border rounded-lg text-sm text-chrome-dim hover:text-chrome hover:border-chrome/30 transition-all">
                  <Plus size={14} /> Neues Rezept
                </motion.button>
              )}
            </div>
          </div>
        </motion.div>

        <AnimatePresence mode="wait">
          {/* ===== HEUTE TAB ===== */}
          {foodTab === 'heute' && (
            <motion.div key="heute" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {/* Macro rings */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-5 md:mb-6">
                {[
                  { key: 'calories', label: 'Calories', color: '#f97316', unit: 'kcal', val: totals.calories, max: MACRO_GOALS.calories },
                  { key: 'protein', label: 'Protein', color: '#3b82f6', unit: 'g', val: totals.protein, max: MACRO_GOALS.protein },
                  { key: 'carbs', label: 'Carbs', color: '#22c55e', unit: 'g', val: totals.carbs, max: MACRO_GOALS.carbs },
                  { key: 'fat', label: 'Fat', color: '#8b5cf6', unit: 'g', val: totals.fat, max: MACRO_GOALS.fat },
                ].map((m, i) => (
                  <Card key={m.key} delay={i * 0.07} className="flex flex-col items-center gap-2 py-4">
                    <RingWidget value={m.val} max={m.max} size={88} strokeWidth={7} color={m.color}
                      label={`${m.val}`} sublabel={m.unit} />
                    <SectionLabel>{m.label}</SectionLabel>
                    <p className="text-chrome-dim text-xs font-mono">/{m.max}{m.unit}</p>
                  </Card>
                ))}
              </div>

              {/* Add form */}
              <AnimatePresence>
                {showForm && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden mb-6">
                    <Card>
                      <div className="flex items-center justify-between mb-3">
                        <SectionLabel>Add Meal</SectionLabel>
                        <motion.button
                          onClick={() => setShowRecipePicker(s => !s)}
                          whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.97 }} transition={SPRING}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 bg-surface2 border border-border rounded-lg text-xs text-chrome-dim hover:text-chrome hover:border-chrome/30 transition-all">
                          <ChefHat size={11} /> Aus Rezept
                        </motion.button>
                      </div>
                      <AnimatePresence>
                        {showRecipePicker && (
                          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden mb-3">
                            <div className="bg-surface2 border border-border rounded-lg p-2">
                              <input
                                value={recipeSearch}
                                onChange={e => setRecipeSearch(e.target.value)}
                                placeholder="Rezept suchen…"
                                className="w-full bg-surface border border-border rounded-lg px-3 py-1.5 text-xs text-chrome outline-none focus:border-chrome/30 mb-2"
                              />
                              {filteredRecipes.length === 0 ? (
                                <p className="text-chrome-dim text-xs p-2 text-center">Keine Rezepte gefunden</p>
                              ) : (
                                <div className="max-h-36 overflow-y-auto space-y-0.5">
                                  {filteredRecipes.map(r => (
                                    <motion.button key={r.id}
                                      onClick={() => applyRecipe(r)}
                                      whileHover={{ scale: 1.01 }}
                                      className="w-full flex items-center gap-3 px-2 py-2 rounded text-xs text-chrome-dim hover:text-chrome hover:bg-surface transition-colors text-left">
                                      <span className="flex-1 font-medium">{r.name}</span>
                                      <span className="text-chrome-dim/50">{r.category}</span>
                                      <span className="text-chrome-dim font-mono">{r.calories} kcal</span>
                                    </motion.button>
                                  ))}
                                </div>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                      <div className="space-y-3">
                        <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Food name…"
                          className="w-full bg-surface2 border border-border rounded-lg px-3 py-2 text-sm text-chrome outline-none focus:border-chrome/30" />
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                          {(['calories', 'protein', 'carbs', 'fat'] as const).map(k => (
                            <div key={k}>
                              <p className="text-xs text-chrome-dim mb-1 capitalize">{k} {k === 'calories' ? '(kcal)' : '(g)'}</p>
                              <input type="number" value={form[k]} onChange={e => setForm(f => ({ ...f, [k]: +e.target.value }))}
                                className="w-full bg-surface2 border border-border rounded-lg px-2 py-1.5 text-sm text-chrome text-center outline-none focus:border-chrome/30" />
                            </div>
                          ))}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {MEAL_TYPES.map(t => (
                            <motion.button key={t} onClick={() => setForm(f => ({ ...f, mealType: t }))}
                              whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.97 }} transition={SPRING}
                              className={`flex-1 py-1.5 rounded-lg text-xs border transition-all ${form.mealType === t ? 'border-chrome/40 text-chrome bg-surface2' : 'border-border text-chrome-dim hover:border-chrome/20'}`}
                              style={form.mealType === t ? { borderColor: MEAL_COLORS[t] + '66', color: MEAL_COLORS[t] } : {}}>
                              {t}
                            </motion.button>
                          ))}
                        </div>
                        <motion.button onClick={addMeal}
                          whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.97 }} transition={SPRING}
                          className="w-full py-2 bg-surface2 border border-border rounded-lg text-sm text-chrome hover:border-chrome/30 transition-colors">
                          Add to Log
                        </motion.button>
                      </div>
                    </Card>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Meals by type */}
              <div className="space-y-4">
                {grouped.map(({ type, items }) => items.length > 0 && (
                  <Card key={type}>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-2 h-2 rounded-full" style={{ background: MEAL_COLORS[type] }} />
                      <SectionLabel>{type}</SectionLabel>
                      <span className="ml-auto text-xs text-chrome-dim font-mono">
                        {items.reduce((s, m) => s + m.calories, 0)} kcal
                      </span>
                    </div>
                    <div className="space-y-2">
                      {items.map((m) => (
                        <motion.div key={m.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                          className="flex items-center gap-3 group text-sm">
                          <Apple size={12} className="text-chrome-dim shrink-0" />
                          <span className="flex-1 text-chrome">{m.name}</span>
                          <div className="flex gap-3 text-chrome-dim font-mono text-xs">
                            <span>{m.calories}kcal</span>
                            <span>P:{m.protein}g</span>
                            <span>C:{m.carbs}g</span>
                            <span>F:{m.fat}g</span>
                          </div>
                          <button onClick={() => deleteMeal(m.id!)} className="opacity-0 group-hover:opacity-100 text-chrome-dim hover:text-red-400 transition-all">
                            <X size={12} />
                          </button>
                        </motion.div>
                      ))}
                    </div>
                  </Card>
                ))}
                {meals.length === 0 && (
                  <Card><p className="text-chrome-dim text-sm text-center py-6">No meals logged for {date}</p></Card>
                )}
              </div>
            </motion.div>
          )}

          {/* ===== VERLAUF TAB ===== */}
          {foodTab === 'verlauf' && (
            <motion.div key="verlauf" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <FoodVerlauf onBack={() => setFoodTab('heute')} />
            </motion.div>
          )}

          {/* ===== REZEPTE TAB ===== */}
          {foodTab === 'rezepte' && (
            <motion.div key="rezepte" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {/* Search */}
              <div className="mb-4">
                <input
                  value={recipeSearch}
                  onChange={e => setRecipeSearch(e.target.value)}
                  placeholder="Rezepte suchen…"
                  className="w-full bg-surface2 border border-border rounded-lg px-3 py-2 text-sm text-chrome outline-none focus:border-chrome/30"
                />
              </div>

              {/* Add/Edit form */}
              <AnimatePresence>
                {showRecipeForm && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden mb-4">
                    <Card>
                      <SectionLabel>{editingRecipe ? 'Rezept bearbeiten' : 'Neues Rezept'}</SectionLabel>
                      <div className="mt-3 space-y-3">
                        <input value={recipeForm.name} onChange={e => setRecipeForm(f => ({ ...f, name: e.target.value }))}
                          placeholder="Rezeptname…"
                          className="w-full bg-surface2 border border-border rounded-lg px-3 py-2 text-sm text-chrome outline-none focus:border-chrome/30" />
                        <select value={recipeForm.category} onChange={e => setRecipeForm(f => ({ ...f, category: e.target.value }))}
                          className="w-full bg-surface2 border border-border rounded-lg px-3 py-2 text-sm text-chrome-dim outline-none">
                          {RECIPE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                          {(['calories', 'protein', 'carbs', 'fat'] as const).map(k => (
                            <div key={k}>
                              <p className="text-xs text-chrome-dim mb-1 capitalize">{k} {k === 'calories' ? '(kcal)' : '(g)'}</p>
                              <input type="number" value={recipeForm[k]} onChange={e => setRecipeForm(f => ({ ...f, [k]: +e.target.value }))}
                                className="w-full bg-surface2 border border-border rounded-lg px-2 py-1.5 text-sm text-chrome text-center outline-none focus:border-chrome/30" />
                            </div>
                          ))}
                        </div>
                        <textarea value={recipeForm.ingredients} onChange={e => setRecipeForm(f => ({ ...f, ingredients: e.target.value }))}
                          placeholder="Zutaten (eine pro Zeile)…" rows={3}
                          className="w-full bg-surface2 border border-border rounded-lg px-3 py-2 text-sm text-chrome resize-none outline-none focus:border-chrome/30" />
                        <textarea value={recipeForm.instructions} onChange={e => setRecipeForm(f => ({ ...f, instructions: e.target.value }))}
                          placeholder="Zubereitung…" rows={3}
                          className="w-full bg-surface2 border border-border rounded-lg px-3 py-2 text-sm text-chrome resize-none outline-none focus:border-chrome/30" />
                        <div className="flex gap-2">
                          <motion.button onClick={saveRecipe}
                            whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.97 }} transition={SPRING}
                            className="flex-1 py-2 bg-surface2 border border-border rounded-lg text-sm text-chrome hover:border-chrome/30 transition-colors">
                            {editingRecipe ? 'Speichern' : 'Hinzufügen'}
                          </motion.button>
                          <motion.button onClick={resetRecipeForm}
                            whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.97 }} transition={SPRING}
                            className="px-4 py-2 bg-surface2 border border-border rounded-lg text-sm text-chrome-dim hover:text-chrome transition-colors">
                            Abbrechen
                          </motion.button>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Recipe list */}
              {filteredRecipes.length === 0 ? (
                <Card>
                  <div className="flex flex-col items-center py-10 gap-3">
                    <BookOpen size={28} className="text-chrome-dim/30" />
                    <p className="text-chrome-dim text-sm">
                      {recipeSearch ? 'Keine Rezepte gefunden' : 'Noch keine Rezepte. Füge dein erstes hinzu!'}
                    </p>
                  </div>
                </Card>
              ) : (
                <div className="space-y-3">
                  {filteredRecipes.map(r => (
                    <motion.div key={r.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                      style={{ background: '#0a0a0a', border: '0.5px solid #1a1a1a', borderRadius: 10, padding: '14px 16px' }}>
                      <div className="flex items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p style={{ fontSize: 14, color: '#c0c0c0', fontWeight: 500 }}>{r.name}</p>
                            <span style={{ fontSize: 9, color: '#555', background: '#151515', border: '0.5px solid #222',
                              borderRadius: 4, padding: '2px 6px', letterSpacing: '0.06em' }}>
                              {r.category}
                            </span>
                          </div>
                          <div style={{ display: 'flex', gap: 12, fontSize: 11, color: '#555', marginBottom: r.ingredients ? 8 : 0 }}>
                            <span style={{ color: '#f97316' }}>{r.calories} kcal</span>
                            <span>P: {r.protein}g</span>
                            <span>C: {r.carbs}g</span>
                            <span>F: {r.fat}g</span>
                          </div>
                          {r.ingredients && (
                            <p style={{ fontSize: 10, color: '#333', lineHeight: 1.5,
                              overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const }}>
                              {r.ingredients}
                            </p>
                          )}
                        </div>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <motion.button
                            onClick={() => applyRecipe(r)}
                            whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.97 }} transition={SPRING}
                            style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'transparent',
                              border: '0.5px solid #252525', borderRadius: 6, padding: '4px 8px',
                              color: '#555', fontSize: 10, cursor: 'pointer', letterSpacing: '0.04em' }}>
                            <ChefHat size={10} /> Verwenden
                          </motion.button>
                          <motion.button onClick={() => startEditRecipe(r)}
                            whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                            style={{ background: 'transparent', border: 'none', color: '#444', cursor: 'pointer', padding: 4 }}>
                            <Plus size={12} style={{ transform: 'rotate(45deg)' }} />
                          </motion.button>
                          <motion.button onClick={() => deleteRecipe(r.id!)}
                            whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                            style={{ background: 'transparent', border: 'none', color: '#444', cursor: 'pointer', padding: 4 }}>
                            <X size={12} />
                          </motion.button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PageTransition>
  )
}
