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

const PULSE: React.CSSProperties = { width: 4, height: 4, borderRadius: '50%', background: '#333' }

export function DashboardGreeting({ progressData }: { progressData: ProgressData }) {
  const [greeting, setGreeting] = useState('')
  const [loading, setLoading] = useState(true)

  const generate = useCallback(async () => {
    setLoading(true)
    setGreeting('')

    const safe = {
      gymDone:       progressData?.gymDone       ?? 0,
      gymTotal:      progressData?.gymTotal       ?? 0,
      calories:      progressData?.calories       ?? 0,
      calorieGoal:   progressData?.calorieGoal    ?? 2600,
      zhawDone:      progressData?.zhawDone       ?? 0,
      zhawTodos:     progressData?.zhawTodos      ?? 0,
      skincareDone:  progressData?.skincareDone   ?? 0,
      skincareSteps: progressData?.skincareSteps  ?? 4,
    }

    const hour = new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Zurich' })).getHours()
    const timeOfDay =
      hour < 7  ? 'early morning (just woke up)' :
      hour < 12 ? 'morning' :
      hour < 14 ? 'midday' :
      hour < 18 ? 'afternoon' :
      hour < 22 ? 'evening' : 'late night'

    const overallPct = Math.round(
      ((safe.gymDone / Math.max(safe.gymTotal, 1)) +
       (safe.calories / safe.calorieGoal) +
       (safe.zhawDone / Math.max(safe.zhawTodos, 1)) +
       (safe.skincareDone / Math.max(safe.skincareSteps, 1))) / 4 * 100
    )

    const system = `You are the personal assistant of Stefano, a Swiss Wirtschaftsinformatik student at ZHAW. He is 172cm, 49kg, trains Push/Pull/Legs, tracks calories (goal: ${safe.calorieGoal}kcal), does skincare, wants to build muscle and a V-shape physique.

Write exactly 2-3 short sentences in German (Swiss context). Be direct, personal, honest.
- Morning with 0% done: motivate, give a clear focus for the day
- Midday with <30% done: be firm, call him out directly
- Evening with <50% done: be hard but fair, no excuses
- Any time with >80% done: acknowledge it, push for the finish
- Never be generic. Reference what's actually done or not done.
- No emojis. No markdown. Just 2-3 direct sentences.`

    const userMsg = `Time: ${timeOfDay}. Overall progress today: ${overallPct}%.
Gym: ${safe.gymDone}/${safe.gymTotal} exercises done.
Calories: ${safe.calories}/${safe.calorieGoal} kcal logged.
ZHAW todos: ${safe.zhawDone}/${safe.zhawTodos} done.
Skincare: ${safe.skincareDone}/${safe.skincareSteps} steps done.
Write the greeting now.`

    const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY
    if (!apiKey) {
      setGreeting('API Key fehlt — in Vercel Environment Variables eintragen.')
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
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 150,
          system,
          messages: [{ role: 'user', content: userMsg }],
        }),
      })
      const data = await res.json()
      const text = data.content?.[0]?.text?.trim()
      setGreeting(text || 'Lade Empfehlung...')
    } catch {
      setGreeting('Verbindungsfehler — bitte erneut versuchen.')
    }
    setLoading(false)
  }, [progressData])

  useEffect(() => { generate() }, [])

  return (
    <div style={{ marginTop: 10, paddingTop: 12, borderTop: '0.5px solid #1a1a1a', maxWidth: 480 }}>
      {loading ? (
        <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{ ...PULSE, animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite` }} />
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
