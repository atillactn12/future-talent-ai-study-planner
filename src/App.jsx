import './App.css'
import { useEffect, useState } from 'react'
import { Brain, CalendarDays, Target, Sparkles } from 'lucide-react'

function App() {
  const [goal, setGoal] = useState('')
  const [deadline, setDeadline] = useState('')
  const [dailyHours, setDailyHours] = useState('')
  const [level, setLevel] = useState('Beginner')
  const [topics, setTopics] = useState('')
  const [generatedPlan, setGeneratedPlan] = useState(null)
  const [aiInsights, setAiInsights] = useState(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState('')
  const [isLoaded, setIsLoaded] = useState(false)

  const getLevelText = (currentLevel) => {
    if (currentLevel === 'Beginner') return 'Başlangıç'
    if (currentLevel === 'Intermediate') return 'Orta'
    if (currentLevel === 'Advanced') return 'İleri'
    return currentLevel
  }

  const getPriorityText = (priority) => {
    if (priority === 'High') return 'Yüksek'
    if (priority === 'Medium') return 'Orta'
    if (priority === 'Low') return 'Düşük'
    return priority
  }

  useEffect(() => {
    try {
      const savedData = localStorage.getItem('ai-study-planner-data')

      if (savedData) {
        const parsedData = JSON.parse(savedData)

        setGoal(parsedData.goal || '')
        setDeadline(parsedData.deadline || '')
        setDailyHours(parsedData.dailyHours || '')
        setLevel(parsedData.level || 'Beginner')
        setTopics(parsedData.topics || '')
        setGeneratedPlan(parsedData.generatedPlan || null)
        setAiInsights(parsedData.aiInsights || null)
      }
    } catch (error) {
      console.error('Local storage read error:', error)
    } finally {
      setIsLoaded(true)
    }
  }, [])

  useEffect(() => {
    if (!isLoaded) return

    const dataToSave = {
      goal,
      deadline,
      dailyHours,
      level,
      topics,
      generatedPlan,
      aiInsights,
    }

    localStorage.setItem('ai-study-planner-data', JSON.stringify(dataToSave))
  }, [isLoaded, goal, deadline, dailyHours, level, topics, generatedPlan, aiInsights])

  const handleGeneratePlan = async () => {
    const topicList = topics
      .split(',')
      .map((topic) => topic.trim())
      .filter((topic) => topic !== '')

    if (!goal || !deadline || !dailyHours || topicList.length === 0) {
      alert('Lütfen tüm alanları doldur.')
      return
    }

    const today = new Date()
    const endDate = new Date(deadline)
    const diffTime = endDate - today
    const daysLeft = Math.max(Math.ceil(diffTime / (1000 * 60 * 60 * 24)), 1)

    const dailyHoursNumber = Number(dailyHours)

    let riskScore = 20

    if (daysLeft <= 3) {
      riskScore += 35
    } else if (daysLeft <= 7) {
      riskScore += 20
    } else {
      riskScore += 8
    }

    if (topicList.length >= 8) {
      riskScore += 25
    } else if (topicList.length >= 5) {
      riskScore += 15
    } else {
      riskScore += 8
    }

    if (dailyHoursNumber <= 1) {
      riskScore += 25
    } else if (dailyHoursNumber <= 2) {
      riskScore += 15
    } else {
      riskScore += 8
    }

    if (riskScore > 100) riskScore = 100

    const tasks = topicList.map((topic, index) => {
      let priority = 'Low'

      if (index < 2) {
        priority = 'High'
      } else if (index < 4) {
        priority = 'Medium'
      }

      let estimatedHours = 2

      if (level === 'Intermediate') estimatedHours = 3
      if (level === 'Advanced') estimatedHours = 4

      return {
        id: index + 1,
        title: topic,
        priority,
        estimatedHours,
      }
    })

    const maxPlanDays = Math.min(daysLeft, 7)

    const dailyPlan = Array.from({ length: maxPlanDays }, (_, index) => {
      const topic = topicList[index % topicList.length]

      let focus = 'Kavram tekrarı'
      if (index % 3 === 1) focus = 'Pratik soru çözümü'
      if (index % 3 === 2) focus = 'Tekrar ve mini test'

      return {
        day: index + 1,
        topic,
        focus,
      }
    })

    const recommendations = [
      'Zor konuları ilk günlerde çalış.',
      'Her 2 günde bir mini test çöz.',
      'Tekrar yapmadan yeni konuya geçme.',
      'Kısa ama düzenli çalışma seansları uygula.',
    ]

    if (riskScore >= 70) {
      recommendations.unshift('Risk yüksek: çalışma saatini artırman gerekebilir.')
    }

    if (level === 'Beginner') {
      recommendations.push('Temel kavramları oturtmadan ileri sorulara geçme.')
    }

    const localPlan = {
      daysLeft,
      topicCount: topicList.length,
      riskScore,
      tasks,
      dailyPlan,
      recommendations,
    }

    setGeneratedPlan(localPlan)

    try {
      setAiLoading(true)
      setAiError('')
      setAiInsights(null)

      const apiUrl =
  import.meta.env.DEV
    ? 'http://localhost:3001/api/ai-insights'
    : '/api/ai-insights'

const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          goal,
          deadline,
          dailyHours,
          level,
          topics,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Yapay zeka isteği başarısız oldu.')
      }

      setAiInsights(data)
    } catch (error) {
      console.error(error)
      setAiError(error.message || 'Yapay zeka cevabı alınamadı.')
    } finally {
      setAiLoading(false)
    }
  }

  return (
    <div className="app">
      <div className="overlay"></div>

      <main className="container">
        <section className="hero">
          <p className="badge">Future Talent Bitirme Projesi</p>

          <h1>AI Study Planner</h1>

          <p className="subtitle">
            Hedef, süre, seviye ve konu listesine göre kişiselleştirilmiş
            çalışma planı oluşturan yapay zeka destekli web uygulaması.
          </p>
        </section>

        <section className="planner-layout">
          <div className="form-card">
            <h2>Plan Bilgileri</h2>
            <p className="form-subtitle">
              Aşağıdaki alanları doldur, buradan kişisel çalışma planı üreteceğiz.
            </p>

            <div className="form-grid">
              <div className="form-group">
                <label>Çalışma Hedefi</label>
                <input
                  type="text"
                  placeholder="Örn: Signals finaline hazırlanmak"
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Son Tarih</label>
                <input
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Günlük Çalışma Saati</label>
                <input
                  type="number"
                  placeholder="Örn: 3"
                  value={dailyHours}
                  onChange={(e) => setDailyHours(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Mevcut Seviye</label>
                <div className="level-buttons">
                  <button
                    type="button"
                    className={level === 'Beginner' ? 'level-btn active' : 'level-btn'}
                    onClick={() => setLevel('Beginner')}
                  >
                    Başlangıç
                  </button>

                  <button
                    type="button"
                    className={level === 'Intermediate' ? 'level-btn active' : 'level-btn'}
                    onClick={() => setLevel('Intermediate')}
                  >
                    Orta
                  </button>

                  <button
                    type="button"
                    className={level === 'Advanced' ? 'level-btn active' : 'level-btn'}
                    onClick={() => setLevel('Advanced')}
                  >
                    İleri
                  </button>
                </div>
              </div>

              <div className="form-group full-width">
                <label>Konular</label>
                <textarea
                  placeholder="Örn: Fourier Series, Sampling, Convolution, Modulation"
                  value={topics}
                  onChange={(e) => setTopics(e.target.value)}
                ></textarea>
              </div>

              <div className="form-group full-width">
                <button
                  type="button"
                  className="primary-btn full-btn"
                  onClick={handleGeneratePlan}
                  disabled={aiLoading}
                >
                  {aiLoading ? 'Yapay zeka analizi hazırlanıyor...' : 'Plan Oluştur'}
                </button>
              </div>
            </div>
          </div>

          <div className="preview-card">
            <h2>Canlı Önizleme</h2>
            <p className="form-subtitle">
              Kullanıcının girdiği bilgiler burada anlık görünsün.
            </p>

            <div className="preview-box">
              <div className="preview-item">
                <span>Hedef:</span>
                <strong>{goal || 'Henüz girilmedi'}</strong>
              </div>

              <div className="preview-item">
                <span>Son Tarih:</span>
                <strong>{deadline || 'Henüz seçilmedi'}</strong>
              </div>

              <div className="preview-item">
                <span>Günlük Saat:</span>
                <strong>{dailyHours || 'Henüz girilmedi'}</strong>
              </div>

              <div className="preview-item">
                <span>Seviye:</span>
                <strong>{getLevelText(level)}</strong>
              </div>

              <div className="preview-item topic-preview">
                <span>Konular:</span>
                <strong>{topics || 'Henüz girilmedi'}</strong>
              </div>
            </div>
          </div>
        </section>

        {generatedPlan && (
          <section className="result-section">
            <h2>Oluşturulan Çalışma Planı</h2>

            <div className="result-top-grid">
              <div className="result-stat-card">
                <span>Kalan Gün</span>
                <strong>{generatedPlan.daysLeft}</strong>
              </div>

              <div className="result-stat-card">
                <span>Konu Sayısı</span>
                <strong>{generatedPlan.topicCount}</strong>
              </div>

              <div className="result-stat-card">
                <span>Risk Skoru</span>
                <strong>{generatedPlan.riskScore}/100</strong>
              </div>
            </div>

            <div className="result-grid">
              <div className="result-card">
                <h3>Öncelikli Görevler</h3>
                <div className="task-list">
                  {generatedPlan.tasks.map((task) => (
                    <div key={task.id} className="task-item">
                      <div>
                        <strong>{task.title}</strong>
                        <p>{task.estimatedHours} saat önerilen çalışma</p>
                      </div>
                      <span className={`priority-badge ${task.priority.toLowerCase()}`}>
                        {getPriorityText(task.priority)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="result-card">
                <h3>Günlük Plan</h3>
                <div className="daily-plan-list">
                  {generatedPlan.dailyPlan.map((item) => (
                    <div key={item.day} className="daily-plan-item">
                      <div>
                        <strong>Gün {item.day}</strong>
                        <p>{item.topic}</p>
                      </div>
                      <span>{item.focus}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="result-card recommendations-card">
              <h3>Öneriler</h3>
              <ul>
                {generatedPlan.recommendations.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>

            <div className="result-card ai-card">
              <div className="ai-title-row">
                <h3>Yapay Zeka İçgörüleri</h3>
                <span className="ai-badge">Gemini AI ile destekleniyor</span>
              </div>
              <p className="ai-note">
                Kural tabanlı planlama + yapay zeka destekli kişisel içgörüler
              </p>

              {aiLoading && <p className="ai-status">Yapay zeka önerileri hazırlanıyor...</p>}

              {aiError && <p className="ai-error">{aiError}</p>}

              {aiInsights && (
                <div className="ai-content">
                  <div className="ai-block">
                    <h4>Özet</h4>
                    <p>{aiInsights.summary}</p>
                  </div>

                  <div className="ai-block">
                    <h4>Bu Plan Neden Uygun?</h4>
                    <p>{aiInsights.whyThisPlanFits}</p>
                  </div>

                  <div className="ai-block">
                    <h4>Odak Alanları</h4>
                    <ul>
                      {aiInsights.focusAreas?.map((item, index) => (
                        <li key={index}>{item}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="ai-block">
                    <h4>Tavsiyeler</h4>
                    <ul>
                      {aiInsights.advice?.map((item, index) => (
                        <li key={index}>{item}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="ai-block">
                    <h4>Motivasyon</h4>
                    <p>{aiInsights.motivation}</p>
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        <section className="cards">
          <div className="card">
            <div className="icon-box">
              <Brain size={22} />
            </div>
            <h3>Akıllı Planlama</h3>
            <p>
              Kullanıcının hedef ve çalışma süresine göre mantıklı bir çalışma
              planı üretir.
            </p>
          </div>

          <div className="card">
            <div className="icon-box">
              <Target size={22} />
            </div>
            <h3>Önceliklendirme</h3>
            <p>
              Zor veya acil konuları öne alarak çalışmayı daha verimli hale
              getirir.
            </p>
          </div>

          <div className="card">
            <div className="icon-box">
              <CalendarDays size={22} />
            </div>
            <h3>Günlük Takvim</h3>
            <p>
              Günlük ve haftalık çalışma akışı oluşturarak düzenli ilerleme
              sağlar.
            </p>
          </div>

          <div className="card">
            <div className="icon-box">
              <Sparkles size={22} />
            </div>
            <h3>Risk Analizi</h3>
            <p>
              Az zaman, fazla konu veya kısa deadline durumunda risk seviyesi
              gösterir.
            </p>
          </div>
        </section>
      </main>
    </div>
  )
}

export default App