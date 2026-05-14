import { useState, useEffect, useRef, useCallback } from 'react'

interface PeakCoachProps {
  progressData: {
    gymDone: number
    gymTotal: number
    isRestDay: boolean
    calories: number
    calorieGoal: number
    protein: number
    proteinGoal: number
    water: number
    waterGoal: number
    sleep: number
    sleepGoal: number
    zhawDone: number
    zhawTotal: number
    skincareDone: number
    skincareTotal: number
    weight: number
  }
}

const DOT: React.CSSProperties = { width: 6, height: 6, borderRadius: '50%', flexShrink: 0 }

export function PeakCoach({ progressData }: PeakCoachProps) {
  const [lines, setLines]       = useState<string[]>([])
  const [headline, setHeadline] = useState('')
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState(false)
  const hasFetched              = useRef(false)

  const fetchCoachMessage = useCallback(async () => {
    setLoading(true)
    setError(false)

    const zurichDate = new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Zurich' }))
    const hour = zurichDate.getHours()
    const timeCtx =
      hour < 7  ? 'early morning — just woke up, day not started' :
      hour < 12 ? 'morning — day has started' :
      hour < 14 ? 'midday — half the day gone' :
      hour < 18 ? 'afternoon' :
      hour < 22 ? 'evening — day almost over' : 'late night'

    const {
      gymDone, gymTotal, isRestDay,
      calories, calorieGoal,
      protein, proteinGoal,
      water, waterGoal,
      sleep, sleepGoal,
      zhawDone, zhawTotal,
      skincareDone, skincareTotal,
      weight,
    } = progressData

    const calPct  = Math.round((calories / Math.max(calorieGoal, 1)) * 100)
    const waterPct = Math.round((water   / Math.max(waterGoal,   1)) * 100)
    const gymPct  = isRestDay ? 100 : Math.round((gymDone / Math.max(gymTotal, 1)) * 100)

    const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY
    console.log('[PeakCoach] API Key present:', !!apiKey)
    console.log('[PeakCoach] API Key prefix:', apiKey?.slice(0, 10))

    if (!apiKey) {
      setHeadline('Kein API Key gefunden')
      setLines([
        'VITE_ANTHROPIC_API_KEY fehlt in den Environment Variables.',
        'In Vercel: Settings → Environment Variables → hinzufügen.',
        'Dann neu deployen.',
      ])
      setLoading(false)
      return
    }

    const systemPrompt = `You are Peak Coach, the personal AI coach of Stefano.
Profile: 172cm, 49kg, ZHAW Wirtschaftsinformatik student in Switzerland, trains Push/Pull/Legs 5x/week, goal: lean bulk (gain muscle, V-shape).
Daily targets: ${calorieGoal} kcal, ${proteinGoal}g protein, ${waterGoal}L water, ${sleepGoal}h sleep.

Output format — respond with EXACTLY this JSON structure, nothing else:
{
  "headline": "One sharp, direct sentence (max 10 words). The main message.",
  "lines": [
    "bullet point 1 — specific observation with consequence",
    "bullet point 2 — specific observation with consequence",
    "bullet point 3 — specific observation with consequence",
    "bullet point 4 — actionable priority for right now"
  ]
}

Rules:
- Write in German
- Be direct and honest — no sugarcoating
- Reference actual numbers (e.g. "Nur 800 kcal bis jetzt")
- Morning/low progress: motivate and set focus
- Midday/low progress: be firm
- Evening/low progress: be hard but fair
- High progress (>80%): acknowledge and push to finish
- Never generic. Always specific to his data.
- Bullet format: "observation — consequence/action"
- No emojis in headline. Max 1 emoji per bullet if it adds clarity.`

    const userMsg = `Time: ${timeCtx} (${hour}:00 Zurich)
Gym: ${gymDone}/${gymTotal} exercises${isRestDay ? ' (Rest Day ✓)' : ''} — ${gymPct}%
Calories: ${calories}/${calorieGoal} kcal (${calPct}%)
Protein: ${protein}/${proteinGoal}g
Water: ${water}/${waterGoal}L (${waterPct}%)
Sleep last night: ${sleep}h / goal ${sleepGoal}h
ZHAW todos: ${zhawDone}/${zhawTotal} done
Skincare: ${skincareDone}/${skincareTotal} steps
Weight: ${weight}kg`

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
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 300,
          system: systemPrompt,
          messages: [{ role: 'user', content: userMsg }],
        }),
      })

      console.log('[PeakCoach] Response status:', res.status)

      if (!res.ok) {
        const errText = await res.text()
        console.error('[PeakCoach] API Error:', errText)
        setError(true)
        setHeadline('API Fehler ' + res.status)
        setLines([errText.slice(0, 120)])
        setLoading(false)
        return
      }

      const data = await res.json()
      console.log('[PeakCoach] Response received, stop_reason:', data.stop_reason)

      const text = data.content?.[0]?.text?.trim()
      if (!text) throw new Error('Empty response from API')

      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        // Fallback: display raw text if JSON parsing fails
        setHeadline('Peak Coach')
        setLines([text])
        setLoading(false)
        return
      }

      const parsed = JSON.parse(jsonMatch[0])
      setHeadline(parsed.headline ?? 'Peak Coach')
      setLines(Array.isArray(parsed.lines) ? parsed.lines : [text])

      sessionStorage.setItem('peak_coach_msg', JSON.stringify(parsed))
      sessionStorage.setItem('peak_coach_time', String(Date.now()))
    } catch (e) {
      console.error('[PeakCoach] Exception:', e)
      setError(true)
      setHeadline('Verbindungsfehler')
      setLines([String(e)])
    }
    setLoading(false)
  }, [progressData])

  useEffect(() => {
    const cached    = sessionStorage.getItem('peak_coach_msg')
    const cachedTs  = sessionStorage.getItem('peak_coach_time')
    const CACHE_TTL = 30 * 60 * 1000

    if (cached && cachedTs && Date.now() - parseInt(cachedTs) < CACHE_TTL) {
      try {
        const parsed = JSON.parse(cached)
        setHeadline(parsed.headline ?? '')
        setLines(Array.isArray(parsed.lines) ? parsed.lines : [])
        setLoading(false)
        return
      } catch { /* fall through to fetch */ }
    }

    if (hasFetched.current) return
    hasFetched.current = true
    fetchCoachMessage()
  }, [])

  const refresh = () => {
    sessionStorage.removeItem('peak_coach_msg')
    sessionStorage.removeItem('peak_coach_time')
    hasFetched.current = false
    fetchCoachMessage()
  }

  if (loading) return (
    <div style={{ padding: '16px 0', borderTop: '0.5px solid #1a1a1a' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: '#333', letterSpacing: '0.08em' }}>
        <div style={{ ...DOT, background: '#c8a040', animation: 'pulse 1s ease-in-out infinite' }} />
        PEAK COACH lädt...
      </div>
    </div>
  )

  return (
    <div style={{ padding: '16px 0', borderTop: '0.5px solid #1a1a1a', maxWidth: 560 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <div style={{ ...DOT, background: error ? '#ef4444' : '#c8a040' }} />
        <span style={{ fontSize: 9, fontWeight: 500, letterSpacing: '0.18em', color: '#555', textTransform: 'uppercase' }}>
          Peak Coach
        </span>
        <button onClick={refresh}
          style={{ marginLeft: 'auto', background: 'transparent', border: 'none', cursor: 'pointer', color: '#333', fontSize: 13 }}
          aria-label="Aktualisieren">↻</button>
      </div>

      <div style={{ fontSize: 15, fontWeight: 500, color: '#d0d0d0', lineHeight: 1.4, marginBottom: 12 }}>
        {headline}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {lines.map((line, i) => {
          const isGood    = line.startsWith('✓') || line.startsWith('✅')
          const isWarning = !isGood && (line.includes('!') || /zu wenig|fehlt|nicht|kein/i.test(line))
          const dotColor  = isGood ? '#4ade80' : isWarning ? '#f59e0b' : '#444'
          return (
            <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <div style={{ ...DOT, background: dotColor, marginTop: 6 }} />
              <span style={{ fontSize: 12, color: '#888', lineHeight: 1.6 }}>{line}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
