import { useState, useEffect, useRef, useCallback } from 'react'
import { checkRateLimit, formatRemainingTime } from '../utils/rateLimiter'

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

export function PeakCoach({ progressData }: PeakCoachProps) {
  const [lines, setLines]       = useState<string[]>([])
  const [headline, setHeadline] = useState('')
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState(false)
  const hasFetched              = useRef(false)

  const fetchCoachMessage = useCallback(async () => {
    setLoading(true)
    setError(false)

    const limit = checkRateLimit('peak_coach', 10, 15 * 60 * 1000)
    if (!limit.allowed) {
      setError(true)
      setHeadline('Zu viele Anfragen')
      setLines([`Bitte warte noch ${formatRemainingTime(limit.remainingMs)}.`])
      setLoading(false)
      return
    }

    const zurichDate = new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Zurich' }))
    const hour = zurichDate.getHours()
    const timeCtx =
      hour < 7  ? 'früh morgens — gerade aufgewacht, Tag noch nicht begonnen' :
      hour < 12 ? 'morgens — Tag hat begonnen' :
      hour < 14 ? 'mittags — halber Tag vorbei' :
      hour < 18 ? 'nachmittags' :
      hour < 22 ? 'abends — Tag fast vorbei' : 'spät nachts'

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

    const calPct   = Math.round((calories / Math.max(calorieGoal, 1)) * 100)
    const waterPct = Math.round((water    / Math.max(waterGoal,   1)) * 100)
    const gymPct   = isRestDay ? 100 : Math.round((gymDone / Math.max(gymTotal, 1)) * 100)

    const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY

    console.log('[PeakCoach] Starting fetch...')
    console.log('[PeakCoach] API key exists:', !!apiKey)
    console.log('[PeakCoach] API key starts with:', apiKey?.substring(0, 14))

    if (!apiKey || apiKey.trim() === '') {
      setHeadline('API Key fehlt')
      setLines([
        'VITE_ANTHROPIC_API_KEY ist nicht gesetzt.',
        'In Vercel: Settings → Environment Variables → hinzufügen.',
        'Danach: Vercel Dashboard → Redeploy.',
      ])
      setLoading(false)
      return
    }

    const systemPrompt = `Du bist der persönliche Tagescoach von Stefano.
Profil: 172cm, 49kg, Wirtschaftsinformatik-Student ZHAW Schweiz, trainiert 5x/Woche, Ziel: Masse aufbauen, V-Form.
Tagesziele: ${calorieGoal} kcal, ${proteinGoal}g Eiweiss, ${waterGoal}L Wasser, ${sleepGoal}h Schlaf.

Ausgabeformat — antworte NUR mit diesem JSON, nichts sonst:
{
  "headline": "Ein präziser, direkter Satz (max 12 Wörter). Die Kernaussage.",
  "lines": [
    "Beobachtung — Konsequenz oder Handlung",
    "Beobachtung — Konsequenz oder Handlung",
    "Beobachtung — Konsequenz oder Handlung",
    "Konkrete Priorität für jetzt"
  ]
}

Regeln:
- Schreibe auf Deutsch, kein Englisch
- Direkt und ehrlich — kein Schönreden
- Nenne echte Zahlen (z.B. "Erst 800 kcal — fehlen noch 1800")
- Morgens/wenig erledigt: motivieren, Fokus setzen
- Mittags/wenig erledigt: klar ansprechen
- Abends/wenig erledigt: hart aber fair
- Viel erledigt (>80%): anerkennen, letzten Push geben
- Keine Anglizismen (nicht: "Lean Bulk", "Push Day" — stattdessen: "Muskelaufbau", "Drücktag")
- Keine Emojis in der Überschrift
- Max 1 Emoji pro Stichpunkt wenn sinnvoll`

    const userMsg = `Zeit: ${timeCtx} (${hour}:00 Zürich)
Training: ${gymDone}/${gymTotal} Übungen${isRestDay ? ' (Ruhetag ✓)' : ''} — ${gymPct}%
Kalorien: ${calories}/${calorieGoal} kcal (${calPct}%)
Eiweiss: ${protein}/${proteinGoal}g
Wasser: ${water}/${waterGoal}L (${waterPct}%)
Schlaf letzte Nacht: ${sleep}h / Ziel ${sleepGoal}h
ZHAW Aufgaben: ${zhawDone}/${zhawTotal} erledigt
Hautpflege: ${skincareDone}/${skincareTotal} Schritte
Gewicht: ${weight}kg`

    try {
      console.log('[PeakCoach] Sending request to Anthropic...')

      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey.trim(),
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
      console.log('[PeakCoach] Response ok:', res.ok)

      if (!res.ok) {
        const errorBody = await res.text()
        console.error('[PeakCoach] Error body:', errorBody)

        const errorMessages: Record<number, string[]> = {
          401: [
            'API Key ungültig oder abgelaufen.',
            'Gehe zu console.anthropic.com → API Keys → neuen Key erstellen.',
            'Dann in Vercel: Settings → Environment Variables → aktualisieren.',
            'Danach neu deployen.',
          ],
          403: ['Zugriff verweigert.', 'Prüfe ob der API Key aktiv ist auf console.anthropic.com.'],
          429: ['Anfrage-Limit erreicht.', 'Bitte 1 Minute warten und dann neu laden.'],
          500: ['Anthropic Server-Fehler.', 'Bitte später nochmal versuchen.'],
        }

        setError(true)
        setHeadline(`Fehler ${res.status}`)
        setLines(errorMessages[res.status] ?? [`HTTP Fehler ${res.status}`, errorBody.slice(0, 150)])
        setLoading(false)
        return
      }

      const data = await res.json()
      console.log('[PeakCoach] Success, stop_reason:', data.stop_reason)

      const text = data.content?.[0]?.text?.trim()
      if (!text) throw new Error('Leere Antwort von der API')

      let h = 'Tagescoach'
      let l: string[] = [text]

      try {
        const jsonMatch = text.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0])
          h = parsed.headline || 'Tagescoach'
          l = Array.isArray(parsed.lines) ? parsed.lines : text.split('\n').filter(Boolean)
        } else {
          l = text.split('\n').filter((s: string) => s.trim())
        }
      } catch { /* keep raw text fallback */ }

      setHeadline(h)
      setLines(l)
      sessionStorage.setItem('peak_coach_msg', JSON.stringify({ headline: h, lines: l }))
      sessionStorage.setItem('peak_coach_time', String(Date.now()))

    } catch (err) {
      console.error('[PeakCoach] Exception:', err)
      setError(true)
      setHeadline('Verbindungsfehler')
      const isNetworkError = err instanceof TypeError && String(err).includes('fetch')
      setLines(isNetworkError
        ? ['Netzwerkfehler — keine Verbindung zur API.', 'Internetverbindung prüfen.']
        : [String(err).slice(0, 200), 'Bitte Seite neu laden.'])
    }
    setLoading(false)
  }, [progressData])

  useEffect(() => {
    const cached   = sessionStorage.getItem('peak_coach_msg')
    const cachedTs = sessionStorage.getItem('peak_coach_time')
    if (cached && cachedTs && Date.now() - parseInt(cachedTs) < 30 * 60 * 1000) {
      try {
        const p = JSON.parse(cached)
        setHeadline(p.headline ?? '')
        setLines(Array.isArray(p.lines) ? p.lines : [])
        setLoading(false)
        return
      } catch { /* fall through */ }
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

  return (
    <div style={{
      background: '#0a0a0a',
      border: '0.5px solid #1e1e1e',
      borderRadius: 12,
      padding: 16,
      width: '100%',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{
            width: 5, height: 5, borderRadius: '50%', flexShrink: 0,
            background: loading ? '#333' : error ? '#ef4444' : '#c8a040',
          }} />
          <span style={{ fontSize: 8, fontWeight: 500, letterSpacing: '0.18em', color: '#444', textTransform: 'uppercase' }}>
            Tagescoach
          </span>
        </div>
        <button
          onClick={refresh}
          style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#333', fontSize: 12, padding: 4 }}
          onMouseEnter={e => (e.currentTarget.style.color = '#888')}
          onMouseLeave={e => (e.currentTarget.style.color = '#333')}
          aria-label="Aktualisieren"
        >↻</button>
      </div>

      {/* Loading dots */}
      {loading && (
        <div style={{ display: 'flex', gap: 4, padding: '6px 0' }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{
              width: 3, height: 3, borderRadius: '50%', background: '#2a2a2a',
              animation: `pulse 1.2s ease-in-out ${i * 0.15}s infinite`,
            }} />
          ))}
        </div>
      )}

      {/* Content */}
      {!loading && (
        <>
          <div style={{
            fontSize: 12, fontWeight: 500, color: '#c8c8c8',
            lineHeight: 1.5, marginBottom: 10, paddingBottom: 10,
            borderBottom: '0.5px solid #1a1a1a',
          }}>
            {headline}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            {lines.map((line, i) => {
              const isGood = line.startsWith('✓') || line.startsWith('✅') ||
                /gut|stark|super|top|erledigt/i.test(line)
              const isWarn = !isGood && (line.includes('!') ||
                /zu wenig|fehlt|nicht|kein|erst|nur/i.test(line))
              const dotColor = isGood ? '#4ade80' : isWarn ? '#f59e0b' : '#2a2a2a'
              return (
                <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                  <div style={{
                    width: 3, height: 3, borderRadius: '50%',
                    background: dotColor, flexShrink: 0, marginTop: 5,
                  }} />
                  <span style={{ fontSize: 11, color: '#555', lineHeight: 1.6 }}>{line}</span>
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
