# 🧠 WordUp - İngilizce Kelime Quiz Uygulaması

İngilizce kelime bilginizi eğlenceli bir şekilde test edebileceğiniz modern ve interaktif bir quiz uygulaması.

![React](https://img.shields.io/badge/React-18-61dafb?logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green)

## 🌐 Demo

👉 **[Canlı Demo](https://salihdemirbas.github.io/wordup)**

## ✨ Özellikler

- 🎯 **Geniş Kelime Havuzu** — Tam 1000 kelimelik zengin İngilizce kelime arşivi
- 🔀 **Esnek Soru Seçimi** — 20, 50, 100 veya kendi belirleyeceğiniz sayıda soru ile test olma
- 🔄 **Çift Yönlü Quiz** — İngilizce → Türkçe veya Türkçe → İngilizce modları
- ⏭️ **Pas Geç & İptal Et** — Soruları atlama ve quizi yarıda kesip durum kaydetme imkanı
- ⏱️ **Zamanlayıcı Modu** — 5, 10 veya 15 saniyelik süre limiti ile heyecanlı sınavlar
- 📊 **Sınav Geçmişi** — Tüm sonuçlar, yarıda kesilen ve pas geçilen detaylarıyla kaydedilir
- 🏅 **En İyi Skorlar** — Kategorilere göre en yüksek puanlar saklanır
- 🔁 **Yanlışlarla Tekrar** — Yanlış bilinen veya pas geçilen kelimelerle yeniden sınav olma imkanı
- 🔊 **Ses Efektleri** — Web Audio API ile doğru/yanlış/zaman aşımı sesleri
- 🎨 **Modern & Animasyonlu Tasarım** — Glassmorphism, akıllı timer kaydırmaları
- 📱 **Mobil Uygulama (iOS/Capacitor)** — Özel güvenli alan (Notch/Safe-area) uyumluluğu ve tam ekran mobil görünüm

## 🚀 Kurulum

### Gereksinimler
- [Node.js](https://nodejs.org/) (v16 veya üzeri)
- npm

### Adımlar

```bash
# Repoyu klonlayın
git clone https://github.com/salihdemirbas/wordup.git

# Proje dizinine girin
cd wordup

# Bağımlılıkları yükleyin
npm install

# Geliştirme sunucusunu başlatın
npm run dev
```

Tarayıcınızda `http://localhost:5173` adresini açın.

## 🛠️ Teknolojiler

| Teknoloji | Kullanım |
|-----------|----------|
| **React 18** | Kullanıcı arayüzü |
| **Vite 5** | Build & geliştirme sunucusu |
| **Capacitor** | iOS/Android native derleme motoru |
| **CSS3** | Ortama duyarlı safe-area esneklikleri, animasyonlar |
| **Web Audio API** | Cihaza özgü etkileşimli ses efektleri |
| **LocalStorage** | Sınav geçmişi, yarım bırakılan testler ve skorlar |

## 📱 iOS Uygulaması Olarak Çalıştırmak (Capacitor)

Uygulama, web platformunun yanı sıra yerleşik iOS özellikleri ile donatılmış bir mobil uygulamadır (Çentik/Home Indicator uyumlu).

```bash
# İlk olarak güncel web sürümünü build edin
npm run build

# Değişiklikleri iOS kütüphanesine transfer edin
npx cap sync

# Xcode'da projeyi açın ve simülatöre kurun
npx cap open ios
```

## 📁 Proje Yapısı

```
wordup/
├── src/
│   ├── App.jsx          # Ana uygulama bileşeni
│   ├── App.css          # Stiller
│   ├── main.jsx         # Giriş noktası
│   ├── index.css        # Global stiller
│   └── data/
│       └── words.json   # Kelime havuzu
├── index.html
├── vite.config.js
└── package.json
```

## 📝 Lisans

Bu proje [MIT](LICENSE) lisansı altında lisanslanmıştır.

---

⭐ Beğendiyseniz yıldız vermeyi unutmayın!
