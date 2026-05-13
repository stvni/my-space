import { useState, useEffect, useCallback } from 'react'

interface ProgressData {
  gymDone: number
  gymTotal: number
  calories: number
  calorieGoal: number
  zhawDone: number
  zhawTodos: number
  skincareDone: number
  skincareSteps: number
}

const PULSE_STYLE: React.CSSProperties = {
  width: 4, height: 4, borderRadius: '50%', background: '#333',
}

export function DashboardGreeting({ progressData }: { progressData: ProgressData }) {
  const [greeting, setGreeting] = useState('')
  const [loading, setLoading] = useState(true)

  const generate = useCallback(async () => {
    setLoading(true)
    const hour = new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Zurich' })).getHours()
    const timeOfDay =
      hour < 7  ? 'early morning (just woke up)' :
      hour < 12 ? 'morning' :
      hour < 14 ? 'midday' :
      hour < 18 ? 'afternoon' :
      hour < 22 ? 'evening' : 'late night'

    const { gymDone, gymTotal, calories, calorieGoal, zhawDone, zhawTodos, skincareDone, skincareSteps } = progressData
    const overallPct = Math.round(
      ((gymDone / Math.max(gymTotal, 1)) +
       (calories / calorieGoal) +
       (zhawDone / Math.max(zhawTodos, 1)) +
       (skincareDone / Math.max(skincareSteps, 1))) / 4 * 100
    )

    const system = `You are the personal assistant of Stefano, a Swiss Wirtschaftsinformatik student at ZHAW. He is 172cm, 49kg, trains Push/Pull/Legs, tracks calories (goal: ${calorieGoal}kcal), does skincare, wants to build muscle and a V-shape physique.

Write exactly 2-3 short sentences in German (Swiss context). Be direct, personal, honest.
- Morning with 0% done: motivate, give a clear focus for the day
- Midday with <30% done: be firm, call him out directly
- Evening with <50% done: be hard but fair, no excuses
- Any time with >80% done: acknowledge it, push for the finish
- Never be generic. Reference what's actually done or not done.
- No emojis. No markdown. Just 2-3 direct sentences.`

    const userMsg = `Time: ${timeOfDay}. Overall progress today: ${overallPct}%.
Gym: ${gymDone}/${gymTotal} exercises done.
Calories: ${calories}/${calorieGoal} kcal logged.
ZHAW todos: ${zhawDone}/${zhawTodos} done.
Skincare: ${skincareDone}/${skincareSteps} steps done.
Write the greeting now.`

    const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY
    if (!apiKey) {
      setGreeting('Setze VITE_ANTHROPIC_API_KEY in .env um die KI-Begrüssung zu aktivieren.')
      setLoading(false)
      return
    }

    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-allow-browser': 'true',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 150,
          system,
          messages: [{ role: 'user', content: userMsg }],
        }),
      })
      const data = await res.json()
      setGreeting(data.content?.[0]?.text ?? '—')
    } catch {
      setGreeting('—')
    }
    setLoading(false)
  }, [progressData])

  useEffect(() => { generate() }, [])

  return (
    <div style={{ marginTop: 10, paddingTop: 12, borderTop: '0.5px solid #1a1a1a', maxWidth: 480 }}>
      {loading ? (
        <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{ ...PULSE_STYLE, animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite` }} />
          ))}
        </div>
      ) : (
        <>
          <p style={{ fontSize: 13, color: '#666', lineHeight: 1.7, margin: 0 }}>{greeting}</p>
          <button onClick={generate}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#333', fontSize: 11, marginTop: 6, padding: 0 }}>
            ↻ aktualisieren
          </button>
        </>
      )}
    </div>
  )
}
