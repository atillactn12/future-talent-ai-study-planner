import { GoogleGenAI } from '@google/genai'

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
})

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

function buildFallbackInsights({ goal, deadline, dailyHours, level, topics }) {
  const topicList = topics
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)

  const firstThree = topicList.slice(0, 3)
  const firstFour = topicList.slice(0, 4)

  return {
    summary: `${goal} hedefin için ${deadline} tarihine kadar günlük ${dailyHours} saatlik çalışma planı, ${level} seviyene göre dengeli bir hazırlık yaklaşımı sunuyor.`,
    whyThisPlanFits:
      'Plan, konu sayını ve günlük çalışma süreni dikkate alarak önce temel başlıkları yerleştiriyor ve tekrar alanı bırakıyor.',
    focusAreas: [
      firstThree[0] || 'Temel kavramlar',
      firstThree[1] || 'Soru çözümü',
      firstThree[2] || 'Tekrar',
    ],
    advice: [
      `İlk günlerde özellikle ${firstFour[0] || 'zorlandığın konu'} üzerine yoğunlaş.`,
      'Her 2 günde bir kısa tekrar ve mini test ekle.',
      `Günlük ${dailyHours} saatlik çalışmayı tek blok yerine parçalara böl.`,
      'Son güne tüm konuları bırakmak yerine düzenli tekrar yap.',
    ],
    motivation: 'Düzenli ilerlersen bu hedefe kontrollü şekilde ulaşabilirsin.',
  }
}

function toSafeArray(value, fallback) {
  if (!Array.isArray(value)) return fallback
  const cleaned = value
    .map((item) => String(item).trim())
    .filter(Boolean)
  return cleaned.length ? cleaned : fallback
}

function mapParsedInsights(parsed, fallback) {
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return fallback
  }

  return {
    summary:
      typeof parsed.summary === 'string' && parsed.summary.trim()
        ? parsed.summary.trim()
        : fallback.summary,
    whyThisPlanFits:
      typeof parsed.whyThisPlanFits === 'string' && parsed.whyThisPlanFits.trim()
        ? parsed.whyThisPlanFits.trim()
        : fallback.whyThisPlanFits,
    focusAreas: toSafeArray(parsed.focusAreas, fallback.focusAreas).slice(0, 3),
    advice: toSafeArray(parsed.advice, fallback.advice).slice(0, 4),
    motivation:
      typeof parsed.motivation === 'string' && parsed.motivation.trim()
        ? parsed.motivation.trim()
        : fallback.motivation,
  }
}

function normalizeInsights(rawText, fallback) {
  if (!rawText || typeof rawText !== 'string') return fallback

  const cleaned = rawText
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim()

  const firstBrace = cleaned.indexOf('{')
  const lastBrace = cleaned.lastIndexOf('}')

  const candidate =
    firstBrace !== -1 && lastBrace !== -1
      ? cleaned.slice(firstBrace, lastBrace + 1)
      : cleaned

  const attempts = [
    candidate,
    candidate.replace(/'/g, '"'),
    candidate
      .replace(/([{,]\s*)([A-Za-z_][A-Za-z0-9_]*)(\s*:)/g, '$1"$2"$3')
      .replace(/'/g, '"'),
  ]

  for (const text of attempts) {
    try {
      const parsed = JSON.parse(text)

      if (typeof parsed === 'string') {
        try {
          const nestedParsed = JSON.parse(parsed)
          return mapParsedInsights(nestedParsed, fallback)
        } catch {
          return fallback
        }
      }

      return mapParsedInsights(parsed, fallback)
    } catch {
      // sıradaki denemeye geç
    }
  }

  return fallback
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { goal, deadline, dailyHours, level, topics } = req.body

    if (!goal || !deadline || !dailyHours || !topics) {
      return res.status(400).json({
        error: 'Eksik alan var.',
      })
    }

    const fallback = buildFallbackInsights({
      goal,
      deadline,
      dailyHours,
      level,
      topics,
    })

    const prompt = `
Sen yardımcı bir çalışma koçusun.

Öğrenci bilgileri:
- Hedef: ${goal}
- Son tarih: ${deadline}
- Günlük çalışma saati: ${dailyHours}
- Seviye: ${level}
- Konular: ${topics}

Yalnızca geçerli bir JSON nesnesi döndür.
Cevap Türkçe olsun.
Markdown kullanma.
Üçlü ters tırnak kullanma.
JSON dışına hiçbir açıklama ekleme.

JSON anahtarları tam olarak şunlar olsun:
summary
whyThisPlanFits
focusAreas
advice
motivation

Kurallar:
- summary: kısa bir paragraf
- whyThisPlanFits: kısa bir paragraf
- focusAreas: tam 3 maddelik dizi
- advice: tam 4 maddelik dizi
- motivation: tek kısa motivasyon cümlesi
- pratik ve kişiselleştirilmiş cevap ver
`

    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
          config: {
            temperature: 0.4,
            maxOutputTokens: 400,
            responseMimeType: 'application/json',
          },
        })

        const rawText = response.text?.trim() || ''
        const normalized = normalizeInsights(rawText, fallback)

        return res.status(200).json(normalized)
      } catch (error) {
        const message = String(error?.message || '')
        const isUnavailable =
          error?.status === 503 ||
          /503|UNAVAILABLE|high demand|overloaded/i.test(message)

        console.error(`AI attempt ${attempt} failed:`, message)

        if (isUnavailable && attempt < 3) {
          await sleep(1500 * attempt)
          continue
        }

        return res.status(200).json(fallback)
      }
    }

    return res.status(200).json(fallback)
  } catch (error) {
    console.error('Function error:', error)
    return res.status(500).json({
      error: 'Sunucu hatası oluştu.',
    })
  }
}