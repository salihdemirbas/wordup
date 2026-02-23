import { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import './App.css'
import wordsData from './data/words.json'
import {
  initializeAds,
  showBanner,
  hideBanner,
  removeBanner,
  prepareInterstitial,
  showInterstitial,
  isAdsRemoved,
  setAdsRemoved,
  getPlatform,
} from './adService'

// ===== İNTERNET BAĞLANTI KONTROLÜ =====
function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine)

  useEffect(() => {
    const goOnline = () => setIsOnline(true)
    const goOffline = () => setIsOnline(false)
    window.addEventListener('online', goOnline)
    window.addEventListener('offline', goOffline)
    return () => {
      window.removeEventListener('online', goOnline)
      window.removeEventListener('offline', goOffline)
    }
  }, [])

  return isOnline
}

// ===== İNTERNET YOK EKRANI =====
function NoInternetScreen() {
  const handleRetry = () => {
    if (navigator.onLine) {
      window.location.reload()
    }
  }

  return (
    <div className="screen no-internet-screen">
      <div className="no-internet-content fade-in">
        <div className="no-internet-icon">📡</div>
        <h1 className="no-internet-title">İnternet Bağlantısı Gerekli</h1>
        <p className="no-internet-description">
          WordUp'ı kullanabilmek için aktif bir internet bağlantısına ihtiyacın var.
          Lütfen Wi-Fi veya mobil verini kontrol et.
        </p>
        <button className="no-internet-retry-btn" onClick={handleRetry}>
          <span>🔄</span>
          <span>Tekrar Dene</span>
        </button>
      </div>
    </div>
  )
}

const shuffle = (array) => {
  const arr = [...array]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
      ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

const getRandomQuestions = (data, count) => {
  const shuffled = shuffle(data)
  return shuffled.slice(0, count)
}

// Ters mod için İngilizce seçenekler oluştur
const prepareReverseOptions = (questions, allWords) => {
  return questions.map(q => {
    const otherWords = allWords.filter(w => w.english !== q.english)
    const distractors = shuffle(otherWords).slice(0, 3).map(w => w.english)
    return { ...q, reverseOptions: [q.english, ...distractors] }
  })
}

const getPerformanceMessage = (percentage) => {
  if (percentage >= 85) {
    return { text: "Mükemmel! Harika bir performans gösterdin!", emoji: "🏆", color: "#f59e0b" }
  } else if (percentage >= 70) {
    return { text: "Çok iyi! Başarılı bir sınav geçirdin.", emoji: "👏", color: "#10b981" }
  } else if (percentage >= 60) {
    return { text: "İyi ama biraz daha çalışmalısın.", emoji: "📚", color: "#6366f1" }
  } else {
    return { text: "Daha fazla pratik yapmalısın.", emoji: "💪", color: "#ef4444" }
  }
}

// ===== LOCAL STORAGE YARDIMCILAR =====
const HISTORY_KEY = 'quiz_history'
const BEST_SCORES_KEY = 'quiz_best_scores'

function getQuizHistory() {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY)) || []
  } catch { return [] }
}

function saveQuizResult(result) {
  const history = getQuizHistory()
  history.unshift(result)
  if (history.length > 50) history.length = 50
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history))
  updateBestScore(result)
}

function getBestScores() {
  try {
    return JSON.parse(localStorage.getItem(BEST_SCORES_KEY)) || {}
  } catch { return {} }
}

function updateBestScore(result) {
  if (result.status === 'quit') return
  const best = getBestScores()
  const key = `q${result.totalQuestions}`
  if (!best[key] || result.percentage > best[key].percentage) {
    best[key] = {
      percentage: result.percentage,
      date: result.date,
      correctCount: result.correctCount,
      totalQuestions: result.totalQuestions,
    }
  }
  localStorage.setItem(BEST_SCORES_KEY, JSON.stringify(best))
}

function clearHistory() {
  localStorage.removeItem(HISTORY_KEY)
  localStorage.removeItem(BEST_SCORES_KEY)
}

// ===== SES TOGGLE BİLEŞENİ =====
function SoundToggle({ isMuted, onToggle, variant = 'light' }) {
  return (
    <button
      className={`sound-toggle ${variant === 'dark' ? 'sound-toggle-dark' : ''}`}
      onClick={onToggle}
      title={isMuted ? 'Sesi Aç' : 'Sesi Kapat'}
      aria-label={isMuted ? 'Sesi Aç' : 'Sesi Kapat'}
    >
      {isMuted ? (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
          <line x1="23" y1="9" x2="17" y2="15" />
          <line x1="17" y1="9" x2="23" y2="15" />
        </svg>
      ) : (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
          <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
          <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
        </svg>
      )}
    </button>
  )
}

// ===== WEB AUDIO API SES EFEKTLERİ =====
function useSoundEffects(mutedRef) {
  const audioCtxRef = useRef(null)

  const getAudioCtx = useCallback(() => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)()
    }
    return audioCtxRef.current
  }, [])

  const playCorrectSound = useCallback(() => {
    if (mutedRef.current) return
    try {
      const ctx = getAudioCtx()
      const now = ctx.currentTime
      // Canlı, 4 notalık hızlı pırıltı melodisi (Do, Mi, Sol, İnce Do)
      const frequencies = [523.25, 659.25, 783.99, 1046.50]
      frequencies.forEach((freq, i) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.type = 'triangle' // Daha parlak bir ses dalgası
        osc.frequency.value = freq

        const t = now + i * 0.08 // Notaları daha sık hızla çal
        gain.gain.setValueAtTime(0, t)
        gain.gain.linearRampToValueAtTime(0.15, t + 0.02)
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25)
        osc.start(t)
        osc.stop(t + 0.3)
      })
    } catch (e) { /* sessiz */ }
  }, [getAudioCtx, mutedRef])

  const playWrongSound = useCallback(() => {
    if (mutedRef.current) return
    try {
      const ctx = getAudioCtx()
      const now = ctx.currentTime
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.type = 'sawtooth'
      osc.frequency.setValueAtTime(150, now)
      osc.frequency.linearRampToValueAtTime(120, now + 0.25)
      gain.gain.setValueAtTime(0.18, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3)
      osc.start(now)
      osc.stop(now + 0.35)
      const osc2 = ctx.createOscillator()
      const gain2 = ctx.createGain()
      osc2.connect(gain2)
      gain2.connect(ctx.destination)
      osc2.type = 'sawtooth'
      osc2.frequency.value = 100
      gain2.gain.setValueAtTime(0, now + 0.1)
      gain2.gain.linearRampToValueAtTime(0.12, now + 0.13)
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.35)
      osc2.start(now + 0.1)
      osc2.stop(now + 0.4)
    } catch (e) { /* sessiz */ }
  }, [getAudioCtx, mutedRef])

  const playFinishSound = useCallback(() => {
    if (mutedRef.current) return
    try {
      const ctx = getAudioCtx()
      const now = ctx.currentTime

      // Yumuşak, basit ve rahatsız etmeyen, ama canlı bir arpej (Do - Mi - Sol - Do)
      const notes = [
        { f: 523.25, t: 0.00 }, // C5
        { f: 659.25, t: 0.10 }, // E5
        { f: 783.99, t: 0.20 }, // G5
        { f: 1046.50, t: 0.30 } // C6
      ]

      notes.forEach(({ f, t }) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.connect(gain)
        gain.connect(ctx.destination)

        // Pürüzsüz ve kulak tırmalamayan 'sine' (Sinüs) dalgası
        osc.type = 'sine'
        osc.frequency.value = f

        const startTime = now + t
        gain.gain.setValueAtTime(0, startTime)
        // Sesi (volume) düşük tuttuk (0.1), yumuşak bir fade-out efekti verdik
        gain.gain.linearRampToValueAtTime(0.12, startTime + 0.05)
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.8)

        osc.start(startTime)
        osc.stop(startTime + 0.85)
      })
    } catch (e) { /* sessiz */ }
  }, [getAudioCtx, mutedRef])

  const playTimeoutSound = useCallback(() => {
    if (mutedRef.current) return
    try {
      const ctx = getAudioCtx()
      const now = ctx.currentTime
      const tones = [440, 349.23, 261.63]
      tones.forEach((freq, i) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.type = 'triangle'
        osc.frequency.value = freq
        const t = now + i * 0.15
        gain.gain.setValueAtTime(0.2, t)
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3)
        osc.start(t)
        osc.stop(t + 0.35)
      })
    } catch (e) { /* sessiz */ }
  }, [getAudioCtx, mutedRef])

  return { playCorrectSound, playWrongSound, playFinishSound, playTimeoutSound }
}

function FloatingShapes() {
  return (
    <div className="floating-shapes">
      <div className="shape shape-1"></div>
      <div className="shape shape-2"></div>
      <div className="shape shape-3"></div>
      <div className="shape shape-4"></div>
      <div className="shape shape-5"></div>
      <div className="shape shape-6"></div>
    </div>
  )
}

// ===== BAŞLANGIÇ EKRANI =====
function StartScreen({ onStart, isMuted, onToggleSound, adsRemoved, onRemoveAds }) {
  const [customCount, setCustomCount] = useState('')
  const [inputError, setInputError] = useState('')
  const [timerEnabled, setTimerEnabled] = useState(false)
  const [timerSeconds, setTimerSeconds] = useState(10)
  const [quizMode, setQuizMode] = useState('normal') // 'normal' | 'reverse'
  const [showHistory, setShowHistory] = useState(false)
  const [history, setHistory] = useState(() => getQuizHistory())
  const bestScores = getBestScores()
  const timerSectionRef = useRef(null)

  const presetOptions = [
    { count: 20, label: '20', icon: '⚡' },
    { count: 50, label: '50', icon: '🎯' },
    { count: 100, label: '100', icon: '🔥' },
  ]
  const timerOptions = [5, 10, 15]
  const maxQuestions = wordsData.length

  const handlePresetClick = (count) => {
    setInputError('')
    onStart(count, timerEnabled ? timerSeconds : 0, quizMode)
  }

  const handleCustomChange = (e) => {
    const value = e.target.value
    if (value === '' || /^\d+$/.test(value)) {
      setCustomCount(value)
      setInputError('')
    }
  }

  const handleCustomStart = () => {
    const num = parseInt(customCount, 10)
    if (!customCount || isNaN(num)) { setInputError('Lütfen bir sayı girin.'); return }
    if (num < 1) { setInputError('En az 1 soru seçmelisiniz.'); return }
    if (num > 1000) { setInputError('En fazla 1000 soru seçebilirsiniz.'); return }
    if (num > maxQuestions) { setInputError(`Havuzda toplam ${maxQuestions} soru bulunuyor.`); return }
    setInputError('')
    onStart(num, timerEnabled ? timerSeconds : 0, quizMode)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleCustomStart()
  }

  const handleClearHistory = () => {
    clearHistory()
    setHistory([])
  }

  const handleTimerToggle = () => {
    setTimerEnabled(prev => {
      const newState = !prev
      if (newState) {
        setTimeout(() => {
          timerSectionRef.current?.scrollIntoView({
            behavior: 'smooth',
            block: 'start' // Alanın tepeye yapışarak en aşağıları bile göstermesini sağlar
          })
        }, 150) // DOM güncellenmesi için esneklik süresi arttırıldı
      }
      return newState
    })
  }

  const overallBest = Object.values(bestScores).sort((a, b) => b.percentage - a.percentage)[0]

  return (
    <div className="screen start-screen">
      <FloatingShapes />
      <SoundToggle isMuted={isMuted} onToggle={onToggleSound} />
      <div className="start-content fade-in">
        <div className="logo-icon">🧠</div>
        <h1 className="start-title">
          <span className="title-highlight">WordUp</span>
        </h1>
        <p className="start-description">
          İngilizce kelime öğrenmenin en eğlenceli yolu! Kendini test et ve seviyeni yükselt.
        </p>

        {/* Sınav Geçmişi Özet */}
        {(history.length > 0 || overallBest) && (
          <div className="history-summary glass-card">
            <div className="summary-row">
              {overallBest && (
                <div className="best-score-badge">
                  <span className="badge-icon">🏅</span>
                  <div className="badge-info">
                    <span className="badge-value">%{overallBest.percentage}</span>
                    <span className="badge-label">En İyi Skor</span>
                  </div>
                </div>
              )}
              <div className="history-count-badge">
                <span className="badge-icon">📊</span>
                <div className="badge-info">
                  <span className="badge-value">{history.length}</span>
                  <span className="badge-label">Toplam Sınav</span>
                </div>
              </div>
            </div>
            <button
              className="show-history-btn"
              onClick={() => setShowHistory(!showHistory)}
            >
              <span>{showHistory ? 'Geçmişi Gizle' : 'Geçmişi Gör'}</span>
              <span className={`toggle-chevron-sm ${showHistory ? 'open' : ''}`}>▾</span>
            </button>

            {showHistory && (
              <div className="history-list slide-in">
                {history.slice(0, 10).map((item, i) => (
                  <div className="history-item" key={i}>
                    <span className="history-date">{new Date(item.date).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' })}</span>
                    <span className="history-questions">{item.totalQuestions} soru</span>
                    <span className="history-badges">
                      {item.quizMode === 'reverse' && <span className="history-mode-badge">🔄</span>}
                      {item.timerMode > 0 && <span className="history-timer-badge">⏱️{item.timerMode}s</span>}
                    </span>
                    <span className={`history-score ${item.status === 'quit' ? 'quit' : item.percentage >= 70 ? 'good' : item.percentage >= 50 ? 'ok' : 'bad'}`}>
                      {item.status === 'quit' ? 'Bırakıldı' : `%${item.percentage}`}
                    </span>
                  </div>
                ))}
                {history.length > 10 && (
                  <p className="history-more">+{history.length - 10} sınav daha...</p>
                )}
                <button className="clear-history-btn" onClick={handleClearHistory}>
                  🗑️ Geçmişi Temizle
                </button>
              </div>
            )}
          </div>
        )}

        <div className="count-selection glass-card">
          <p className="count-label">Kaç soruluk sınav istiyorsun?</p>

          <div className="preset-buttons">
            {presetOptions.map(({ count, label, icon }) => (
              <button
                key={count}
                className="preset-btn"
                onClick={() => handlePresetClick(count)}
              >
                <span className="preset-icon">{icon}</span>
                <span className="preset-number">{label}</span>
                <span className="preset-text">Soru</span>
              </button>
            ))}
          </div>

          <div className="custom-divider">
            <span className="divider-line"></span>
            <span className="divider-text">veya kendin belirle</span>
            <span className="divider-line"></span>
          </div>

          <div className="custom-input-container">
            <div className="input-wrapper">
              <input
                type="text"
                inputMode="numeric"
                className="custom-input"
                placeholder="1 — 1000"
                value={customCount}
                onChange={handleCustomChange}
                onKeyDown={handleKeyDown}
                maxLength={4}
              />
            </div>
            <button
              className="custom-start-btn"
              onClick={handleCustomStart}
              disabled={!customCount}
            >
              Başla →
            </button>
          </div>

          {inputError && (
            <div className="input-error slide-in">
              <span className="error-icon">⚠️</span>
              {inputError}
            </div>
          )}

          {/* Quiz Mode Toggle */}
          <div className="mode-toggle-section">
            <span className="mode-label">Sınav Yönü</span>
            <div className="mode-toggle-group">
              <button
                className={`mode-btn ${quizMode === 'normal' ? 'active' : ''}`}
                onClick={() => setQuizMode('normal')}
              >
                <span>🇬🇧</span>
                <span>→</span>
                <span>🇹🇷</span>
              </button>
              <button
                className={`mode-btn ${quizMode === 'reverse' ? 'active' : ''}`}
                onClick={() => setQuizMode('reverse')}
              >
                <span>🇹🇷</span>
                <span>→</span>
                <span>🇬🇧</span>
              </button>
            </div>
            <span className="mode-description">
              {quizMode === 'normal'
                ? 'İngilizce kelime → Türkçe cevap'
                : 'Türkçe kelime → İngilizce cevap'}
            </span>
          </div>

          {/* Timer Toggle */}
          <div className="timer-toggle-section" ref={timerSectionRef}>
            <button
              className={`timer-toggle-btn ${timerEnabled ? 'active' : ''}`}
              onClick={handleTimerToggle}
            >
              <span className="timer-toggle-icon">⏱️</span>
              <span className="timer-toggle-text">Zamanlayıcı</span>
              <span className={`timer-switch ${timerEnabled ? 'on' : ''}`}>
                <span className="timer-switch-knob"></span>
              </span>
            </button>

            {timerEnabled && (
              <div className="timer-options slide-in">
                {timerOptions.map((sec) => (
                  <button
                    key={sec}
                    className={`timer-option ${timerSeconds === sec ? 'selected' : ''}`}
                    onClick={() => setTimerSeconds(sec)}
                  >
                    {sec}s
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <p className="total-info">Toplam {maxQuestions} kelime havuzundan rastgele sorular</p>

        {/* Reklamları Kaldır Butonu */}
        {!adsRemoved && (
          <button className="remove-ads-btn" onClick={onRemoveAds}>
            <span className="remove-ads-icon">✨</span>
            <span className="remove-ads-text">Reklamları Kaldır</span>
            <span className="remove-ads-price">$0.99</span>
          </button>
        )}
      </div>
    </div>
  )
}

// ===== BİTİŞ EKRANI =====
function FinishScreen({ stats, onGoHome, onQuickRestart, onRetryWrong, wrongWords, quizMode, isMuted, onToggleSound }) {
  const { totalQuestions, correctCount, wrongCount, skippedCount, status } = stats
  const percentage = Math.round((correctCount / totalQuestions) * 100)
  const performance = getPerformanceMessage(percentage)
  const [showWrongList, setShowWrongList] = useState(false)

  const isReverse = quizMode === 'reverse'

  if (status === 'quit') {
    return (
      <div className="screen finish-screen">
        <FloatingShapes />
        <SoundToggle isMuted={isMuted} onToggle={onToggleSound} />
        <div className="finish-content fade-in">
          <div className="finish-emoji-big">👋</div>
          <h1 className="finish-title">Sınav Yarıda Bırakıldı</h1>
          <p className="performance-text">
            Bir dahaki sefere daha iyi hazırlanıp tekrar deneyebilirsin!
          </p>
          <div className="finish-actions" style={{ marginTop: '2rem' }}>
            <button className="restart-btn" onClick={onGoHome}>
              <span>🏠 Ana Sayfaya Dön</span>
              <span className="btn-arrow">→</span>
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="screen finish-screen">
      <FloatingShapes />
      <SoundToggle isMuted={isMuted} onToggle={onToggleSound} />
      <div className="finish-content fade-in">
        <div className="finish-emoji-big">{performance.emoji}</div>
        <h1 className="finish-title">Sınav Tamamlandı!</h1>

        <div className="score-ring-container">
          <div className="score-ring">
            <svg viewBox="0 0 120 120" className="score-svg">
              <circle cx="60" cy="60" r="52" className="score-bg-circle" />
              <circle
                cx="60" cy="60" r="52"
                className="score-fill-circle"
                style={{
                  strokeDasharray: `${(percentage / 100) * 327} 327`,
                  stroke: performance.color,
                }}
              />
            </svg>
            <div className="score-text">
              <span className="score-percent">%{percentage}</span>
              <span className="score-label">Başarı</span>
            </div>
          </div>
        </div>

        <div className="stats-container">
          <div className="stat-card">
            <div className="stat-icon">📝</div>
            <span className="stat-value">{totalQuestions}</span>
            <span className="stat-label">Toplam</span>
          </div>
          <div className="stat-card stat-correct">
            <div className="stat-icon">✅</div>
            <span className="stat-value">{correctCount}</span>
            <span className="stat-label">Doğru</span>
          </div>
          <div className="stat-card stat-wrong">
            <div className="stat-icon">❌</div>
            <span className="stat-value">{wrongCount}</span>
            <span className="stat-label">Yanlış</span>
          </div>
          <div className="stat-card stat-skipped">
            <div className="stat-icon">⏭️</div>
            <span className="stat-value">{skippedCount}</span>
            <span className="stat-label">Pas</span>
          </div>
        </div>

        <p className="performance-text">{performance.text}</p>

        {wrongWords.length > 0 && (
          <div className="wrong-words-section">
            <button
              className="wrong-words-toggle"
              onClick={() => setShowWrongList(!showWrongList)}
            >
              <span>📋 Yanlış Bilinen Kelimeler ({wrongWords.length})</span>
              <span className={`toggle-chevron ${showWrongList ? 'open' : ''}`}>▾</span>
            </button>

            {showWrongList && (
              <div className="wrong-words-list slide-in">
                {wrongWords.map((word, i) => (
                  <div className="wrong-word-item" key={i}>
                    <span className="wrong-word-en">{isReverse ? word.turkish : word.english}</span>
                    <span className="wrong-word-arrow">→</span>
                    <span className="wrong-word-tr">{isReverse ? word.english : word.turkish}</span>
                  </div>
                ))}
              </div>
            )}

            <button className="retry-wrong-btn" onClick={onRetryWrong}>
              <span>🔄</span>
              <span>Yanlışlarla Tekrar Sınav</span>
            </button>
          </div>
        )}

        <div className="finish-actions">
          <button className="quick-restart-btn" onClick={onQuickRestart}>
            <span>🔁</span>
            <span>Aynı Ayarlarla Tekrar</span>
          </button>
          <button className="restart-btn" onClick={onGoHome}>
            <span>🏠 Ana Sayfaya Dön</span>
            <span className="btn-arrow">→</span>
          </button>
        </div>
      </div>
    </div>
  )
}

// ===== ZAMANLAYICI HOOK =====
function useTimer(seconds, onTimeout) {
  const [timeLeft, setTimeLeft] = useState(seconds)
  const intervalRef = useRef(null)
  const callbackRef = useRef(onTimeout)

  useEffect(() => {
    callbackRef.current = onTimeout
  }, [onTimeout])

  const start = useCallback(() => {
    setTimeLeft(seconds)
    if (intervalRef.current) clearInterval(intervalRef.current)
    intervalRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(intervalRef.current)
          intervalRef.current = null
          callbackRef.current()
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }, [seconds])

  const stop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  const reset = useCallback(() => {
    stop()
    setTimeLeft(seconds)
  }, [seconds, stop])

  const pause = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  const resume = useCallback(() => {
    if (intervalRef.current) return
    intervalRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(intervalRef.current)
          intervalRef.current = null
          callbackRef.current()
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }, [])

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  return { timeLeft, start, stop, reset, pause, resume }
}

// ===== ANA UYGULAMA =====
function App() {
  const isOnline = useOnlineStatus()
  const [passedInitialCheck, setPassedInitialCheck] = useState(false)
  const [gameState, setGameState] = useState('start')
  const [currentIndex, setCurrentIndex] = useState(0)
  const [quizQuestions, setQuizQuestions] = useState([])
  const [selectedOption, setSelectedOption] = useState(null)
  const [isCorrect, setIsCorrect] = useState(null)
  const [correctCount, setCorrectCount] = useState(0)
  const [wrongCount, setWrongCount] = useState(0)
  const [hasWrongAnswer, setHasWrongAnswer] = useState(false)
  const [wrongWords, setWrongWords] = useState([])
  const [isMuted, setIsMuted] = useState(false)
  const [timerMode, setTimerMode] = useState(0)
  const [timedOut, setTimedOut] = useState(false)
  const [quizMode, setQuizMode] = useState('normal') // 'normal' | 'reverse'
  const [lastQuestionCount, setLastQuestionCount] = useState(20)
  const [skippedCount, setSkippedCount] = useState(0)
  const [showQuitPopup, setShowQuitPopup] = useState(false)
  const [quizStatus, setQuizStatus] = useState('completed')
  const [adsRemoved, setAdsRemovedState] = useState(() => isAdsRemoved())
  const mutedRef = useRef(false)

  // AdMob başlat & banner göster
  useEffect(() => {
    async function setupAds() {
      await initializeAds()
      if (!isAdsRemoved()) {
        showBanner()
      }
    }
    setupAds()
  }, [])

  // İlk açılışta internet varsa geçmesine izin ver
  useEffect(() => {
    if (isOnline && !passedInitialCheck) {
      setPassedInitialCheck(true)
    }
  }, [isOnline, passedInitialCheck])

  const toggleSound = useCallback(() => {
    setIsMuted(prev => {
      const next = !prev
      mutedRef.current = next
      return next
    })
  }, [])

  const { playCorrectSound, playWrongSound, playFinishSound, playTimeoutSound } = useSoundEffects(mutedRef)

  const currentWord = quizQuestions[currentIndex]
  const isReverse = quizMode === 'reverse'

  // Normal: Türkçe seçenekler (options), Ters: İngilizce seçenekler (reverseOptions)
  const shuffledOptions = useMemo(() => {
    if (gameState !== 'playing' || !currentWord) return []
    if (isReverse) {
      return shuffle(currentWord.reverseOptions || [])
    }
    return shuffle(currentWord.options)
  }, [currentIndex, gameState])

  // Doğru cevap: normal modda turkish, ters modda english
  const correctAnswer = currentWord ? (isReverse ? currentWord.english : currentWord.turkish) : ''

  // Timer timeout handler
  const handleTimeout = useCallback(() => {
    setTimedOut(true)
    playTimeoutSound()
    if (!hasWrongAnswer) {
      setWrongCount(prev => prev + 1)
      if (currentWord) {
        setWrongWords(prev => [...prev, currentWord])
      }
    }
    setTimeout(() => {
      setTimedOut(false)
      setSelectedOption(null)
      setIsCorrect(null)
      setHasWrongAnswer(false)
      if (currentIndex === quizQuestions.length - 1) {
        playFinishSound()
        setGameState('finished')
      } else {
        setCurrentIndex(prev => prev + 1)
      }
    }, 1200)
  }, [currentIndex, quizQuestions.length, hasWrongAnswer, currentWord, playTimeoutSound, playFinishSound])

  const timer = useTimer(timerMode || 10, handleTimeout)

  useEffect(() => {
    if (gameState === 'playing' && timerMode > 0 && !timedOut) {
      timer.start()
    }
    return () => timer.stop()
  }, [currentIndex, gameState])

  const startQuizWithQuestions = (questions, timerSec = 0, mode = 'normal') => {
    let prepared = questions
    if (mode === 'reverse') {
      prepared = prepareReverseOptions(questions, wordsData)
    }
    setQuizQuestions(prepared)
    setCurrentIndex(0)
    setCorrectCount(0)
    setWrongCount(0)
    setSkippedCount(0)
    setQuizStatus('completed')
    setHasWrongAnswer(false)
    setWrongWords([])
    setSelectedOption(null)
    setIsCorrect(null)
    setTimedOut(false)
    setTimerMode(timerSec)
    setQuizMode(mode)
    setGameState('playing')
    // Sınav başlarken banner'ı gizle ve interstitial'ı hazırla
    hideBanner()
    prepareInterstitial()
  }

  const handleStart = (questionCount, timerSec = 0, mode = 'normal') => {
    setLastQuestionCount(questionCount)
    const selected = getRandomQuestions(wordsData, questionCount)
    startQuizWithQuestions(selected, timerSec, mode)
  }

  const handleGoHome = () => {
    timer.stop()
    setQuizQuestions([])
    setCurrentIndex(0)
    setSelectedOption(null)
    setIsCorrect(null)
    setCorrectCount(0)
    setWrongCount(0)
    setSkippedCount(0)
    setQuizStatus('completed')
    setShowQuitPopup(false)
    setHasWrongAnswer(false)
    setWrongWords([])
    setTimedOut(false)
    setGameState('start')
    // Ana sayfaya dönünce banner'ı tekrar göster
    if (!isAdsRemoved()) showBanner()
  }

  const handleQuickRestart = () => {
    const selected = getRandomQuestions(wordsData, lastQuestionCount)
    startQuizWithQuestions(selected, timerMode, quizMode)
  }

  const handleRetryWrong = () => {
    if (wrongWords.length === 0) return
    startQuizWithQuestions(shuffle([...wrongWords]), timerMode, quizMode)
  }

  // Sınav bitince sonucu kaydet
  useEffect(() => {
    if (gameState === 'finished' && quizQuestions.length > 0) {
      const percentage = Math.round((correctCount / quizQuestions.length) * 100)
      saveQuizResult({
        date: new Date().toISOString(),
        totalQuestions: quizQuestions.length,
        correctCount,
        wrongCount,
        skippedCount,
        percentage,
        timerMode,
        quizMode,
        status: quizStatus
      })

      // Sınav bittiğinde interstitial reklam göster
      showInterstitial()
    }
  }, [gameState])

  const handleSkip = () => {
    if (selectedOption !== null || timedOut) return
    if (timerMode > 0) timer.stop()

    setSkippedCount(prev => prev + 1)
    if (currentWord) {
      setWrongWords(prev => [...prev, currentWord]) // Yanlış testine dahil etmek için
    }

    if (currentIndex === quizQuestions.length - 1) {
      playFinishSound()
      setGameState('finished')
    } else {
      setCurrentIndex(prev => prev + 1)
      if (timerMode > 0) timer.start()
    }
  }

  const handleQuitModalOpen = () => {
    if (timerMode > 0) timer.pause()
    setShowQuitPopup(true)
  }

  const handleQuitConfirm = () => {
    setShowQuitPopup(false)
    setQuizStatus('quit')
    setGameState('finished')
  }

  const handleQuitCancel = () => {
    setShowQuitPopup(false)
    if (timerMode > 0 && gameState === 'playing') timer.resume()
  }

  // Reklamları kaldır (In-App Purchase)
  const handleRemoveAds = async () => {
    // TODO: Developer hesabı alındıktan sonra
    // gerçek StoreKit/Google Play Billing satın alma akışı buraya eklenecek.
    // Şu an sadece local olarak işaretliyoruz (test amaçlı).
    const platform = getPlatform()
    const storeName = platform === 'android' ? 'Google Play Developer' : 'Apple Developer'
    const confirmed = window.confirm(
      `Reklamları kaldırmak için $0.99 ödeme yapılacaktır. Devam etmek istiyor musun?\n\n(Bu özellik ${storeName} hesabı kurulduğunda aktif olacaktır)`
    )
    if (confirmed) {
      setAdsRemoved(true)
      setAdsRemovedState(true)
      removeBanner()
    }
  }

  const handleOptionClick = (option) => {
    if (selectedOption !== null || timedOut) return

    const correct = option === correctAnswer
    setSelectedOption(option)
    setIsCorrect(correct)

    if (correct) {
      if (timerMode > 0) timer.stop()
      playCorrectSound()
      if (!hasWrongAnswer) {
        setCorrectCount(prev => prev + 1)
      }
      setTimeout(() => {
        setSelectedOption(null)
        setIsCorrect(null)
        setHasWrongAnswer(false)
        setTimedOut(false)
        if (currentIndex === quizQuestions.length - 1) {
          playFinishSound()
          setGameState('finished')
        } else {
          setCurrentIndex(prev => prev + 1)
        }
      }, 800)
    } else {
      playWrongSound()
      if (!hasWrongAnswer) {
        setWrongCount(prev => prev + 1)
        setWrongWords(prev => [...prev, currentWord])
        setHasWrongAnswer(true)
      }
      setTimeout(() => {
        setSelectedOption(null)
        setIsCorrect(null)
      }, 800)
    }
  }

  const getButtonClass = (option) => {
    if (timedOut) return 'option-btn dimmed'
    if (selectedOption === null || selectedOption === undefined) return 'option-btn'
    if (selectedOption === option) {
      return `option-btn ${isCorrect ? 'correct' : 'wrong'}`
    }
    if (isCorrect && option === correctAnswer) {
      return 'option-btn correct'
    }
    return 'option-btn dimmed'
  }

  // Açılışta internet yoksa blokla (hook'lardan SONRA yapılmalı — React kuralı)
  if (!passedInitialCheck && !isOnline) {
    return <NoInternetScreen />
  }

  if (gameState === 'start') {
    return (
      <StartScreen
        onStart={handleStart}
        isMuted={isMuted}
        onToggleSound={toggleSound}
        adsRemoved={adsRemoved}
        onRemoveAds={handleRemoveAds}
      />
    )
  }

  if (gameState === 'finished') {
    return (
      <FinishScreen
        stats={{
          totalQuestions: quizQuestions.length,
          correctCount,
          wrongCount,
          skippedCount,
          status: quizStatus
        }}
        wrongWords={wrongWords}
        quizMode={quizMode}
        onGoHome={handleGoHome}
        onQuickRestart={handleQuickRestart}
        onRetryWrong={handleRetryWrong}
        isMuted={isMuted}
        onToggleSound={toggleSound}
      />
    )
  }

  const progressPercent = ((currentIndex + 1) / quizQuestions.length) * 100
  const timerPercent = timerMode > 0 ? (timer.timeLeft / timerMode) * 100 : 0
  const timerDanger = timerMode > 0 && timer.timeLeft <= 3

  // Gösterilecek kelime: normal modda english, ters modda turkish
  const displayWord = isReverse ? currentWord.turkish : currentWord.english
  const questionLabel = isReverse
    ? 'Bu kelimenin İngilizcesi nedir?'
    : 'Bu kelimenin Türkçesi nedir?'

  return (
    <div className="app quiz-screen">
      {/* Header */}
      <div className="quiz-header">
        <div className="header-top">
          <div className="header-counter">
            <span className="counter-current">{currentIndex + 1}</span>
            <span className="counter-sep">/</span>
            <span className="counter-total">{quizQuestions.length}</span>
          </div>

          {/* Timer */}
          {timerMode > 0 && (
            <div className={`timer-display ${timerDanger ? 'danger' : ''} ${timedOut ? 'expired' : ''}`}>
              <svg className="timer-ring" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="15.5" className="timer-ring-bg" />
                <circle
                  cx="18" cy="18" r="15.5"
                  className="timer-ring-fill"
                  style={{
                    strokeDasharray: `${timerPercent} 100`,
                  }}
                />
              </svg>
              <span className="timer-number">{timedOut ? '!' : timer.timeLeft}</span>
            </div>
          )}

          <div className="header-right">
            <span className="mode-indicator">{isReverse ? '🔄 TR→EN' : '🇬🇧 EN→TR'}</span>
            <div className="header-stats">
              <span className="mini-stat correct-stat">✓ {correctCount}</span>
              <span className="mini-stat wrong-stat">✗ {wrongCount}</span>
            </div>
            <button className="header-action-btn" onClick={handleSkip} title="Pas Geç">⏭️</button>
            <button className="header-action-btn quit-btn" onClick={handleQuitModalOpen} title="Sınavı Terk Et">✖</button>
            <SoundToggle isMuted={isMuted} onToggle={toggleSound} variant="dark" />
          </div>
        </div>
        <div className="progress-track">
          <div
            className="progress-fill"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Timeout Overlay */}
      {timedOut && (
        <div className="timeout-overlay fade-in">
          <div className="timeout-message">
            <span className="timeout-icon">⏰</span>
            <span className="timeout-text">Süre Doldu!</span>
            <span className="timeout-answer">
              Doğru cevap: <strong>{correctAnswer}</strong>
            </span>
          </div>
        </div>
      )}

      {/* Word Display */}
      <div className="word-section">
        <div className="word-card fade-in" key={currentIndex}>
          <span className="word-label">{questionLabel}</span>
          <h1 className="word">{displayWord}</h1>
        </div>
      </div>

      {/* Options */}
      <div className="options-section">
        <div className="options-grid">
          {shuffledOptions.map((option, index) => (
            <button
              key={`q${currentIndex}-opt${index}-${option}`}
              className={getButtonClass(option)}
              onClick={() => handleOptionClick(option)}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      {/* Quit Popup */}
      {showQuitPopup && (
        <div className="quit-overlay fade-in">
          <div className="quit-popup slide-in">
            <button className="quit-close-btn" onClick={handleQuitCancel}>✕</button>
            <div className="quit-icon">🥺</div>
            <h3 className="quit-title">Gerçekten ayrılmak istiyor musun?</h3>
            <p className="quit-text">
              Harika gidiyordun! Biraz daha devam edersen quiz'i başarıyla tamamlayabilirsin. Yine de bitirmek istiyor musun?
            </p>
            <div className="quit-actions">
              <button className="quit-cancel-btn" onClick={handleQuitCancel}>Hayır, Devam Et</button>
              <button className="quit-confirm-btn" onClick={handleQuitConfirm}>Evet, Bırak</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
