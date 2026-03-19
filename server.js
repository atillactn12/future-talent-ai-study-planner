import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { GoogleGenAI } from '@google/genai'

dotenv.config()

const app = express()
const port = 3001

app.use(cors())
app.use(express.json())

if (!process.env.GEMINI_API_KEY) {
  console.error('GEMINI_API_KEY bulunamadı. .env dosyasını kontrol et.')
  process.exit(1)
}

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
    whyThisPlanFits: `Plan, konu sayını ve günlük çalışma süreni dikkate alarak önce temel başlıkları yerleştiriyor ve tekrar alanı bırakıyor.`,
    focusAreas: [
      firstThree[0] || 'Core concepts',
      firstThree[1] || 'Practice questions',
      firstThree[2] || 'Revision',
    ],
    advice: [
      `İlk günlerde özellikle ${firstFour[0] || 'zorlandığın konu'} üzerine yoğunlaş.`,
      `Her 2 günde bir kısa tekrar ve mini test ekle.`,
      `Günlük ${dailyHours} saatlik çalışmayı tek blok yerine parçalara böl.`,
      `Son güne tüm konuları bırakmak yerine düzenli tekrar yap.`,
    ],
    motivation: 'Düzenli ilerlersen bu hedefe kontrollü şekilde ulaşabilirsin.',
  }
}

function normalizeInsights(rawText, fallback) {
  if (!rawText) return fallback

  try {
    const parsed = JSON.parse(rawText)

    return {
      summary: parsed.summary || fallback.summary,
      whyThisPlanFits: parsed.whyThisPlanFits || fallback.whyThisPlanFits,
      focusAreas:
        Array.isArray(parsed.focusAreas) && parsed.focusAreas.length
          ? parsed.focusAreas.slice(0, 3)
          : fallback.focusAreas,
      advice:
        Array.isArray(parsed.advice) && parsed.advice.length
          ? parsed.advice.slice(0, 4)
          : fallback.advice,
      motivation: parsed.motivation || fallback.motivation,
    }
  } catch {
    return {
      ...fallback,
      summary: rawText.length > 20 ? rawText : fallback.summary,
    }
  }
}

app.post('/api/ai-insights', async (req, res) => {
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
You are a helpful AI study coach.

Student data:
- Goal: ${goal}
- Deadline: ${deadline}
- Daily study hours: ${dailyHours}
- Level: ${level}
- Topics: ${topics}

Return valid JSON with this shape:
{
  "summary": "short paragraph",
  "whyThisPlanFits": "short paragraph",
  "focusAreas": ["item 1", "item 2", "item 3"],
  "advice": ["item 1", "item 2", "item 3", "item 4"],
  "motivation": "one short motivational sentence"
}

Do not use markdown.
Do not use triple backticks.
Keep it practical and concise.
`

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          temperature: 0.6,
          maxOutputTokens: 400,
          responseMimeType: 'application/json',
        },
      })

      const rawText = response.text?.trim() || ''
      const normalized = normalizeInsights(rawText, fallback)

      return res.json(normalized)
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

      return res.json(fallback)
    }
  }

  return res.json(fallback)
})

app.listen(port, () => {
  console.log(`AI server running on http://localhost:${port}`)
})