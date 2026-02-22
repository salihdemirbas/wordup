# 🧠 WordUp - İngilizce Kelime Quiz Uygulaması

İngilizce kelime bilginizi eğlenceli bir şekilde test edebileceğiniz modern ve interaktif bir quiz uygulaması. Hem web hem de iOS platformunda çalışır.

![React](https://img.shields.io/badge/React-18-61dafb?logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=white)
![Capacitor](https://img.shields.io/badge/Capacitor-iOS-119EFF?logo=capacitor&logoColor=white)
![AdMob](https://img.shields.io/badge/AdMob-Integrated-EA4335?logo=google&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green)

## 🌐 Demo

👉 **[Canlı Demo (Web)](https://salihdemirbas.github.io/wordup)**

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
- 📱 **iOS Uygulaması** — Capacitor ile native iOS desteği (Dynamic Island/Notch uyumlu)
- 📶 **İnternet Kontrolü** — Açılışta bağlantı doğrulaması, reklam altyapısı hazırlığı
- 💰 **Reklam & In-App Purchase** — Google AdMob entegrasyonu ve reklamları kaldırma seçeneği

## 🚀 Kurulum

### Gereksinimler
- [Node.js](https://nodejs.org/) (v16 veya üzeri)
- npm
- Xcode (iOS için)

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

## � iOS Uygulaması Olarak Çalıştırmak

```bash
# Web sürümünü build edin
npm run build

# iOS projesine senkronize edin
npx cap sync

# Xcode'da açın
npx cap open ios
```

Xcode'da sol üstten hedef cihazı seçip ▶ Play'e basın.

## �🛠️ Teknolojiler

| Teknoloji | Kullanım |
|-----------|----------|
| **React 18** | Kullanıcı arayüzü |
| **Vite 5** | Build & geliştirme sunucusu |
| **Capacitor** | iOS/Android native derleme motoru |
| **Google AdMob** | Banner & Interstitial reklam entegrasyonu |
| **CSS3** | Safe-area uyumlu responsive tasarım |
| **Web Audio API** | Etkileşimli ses efektleri |
| **LocalStorage** | Sınav geçmişi, skorlar ve reklam tercihleri |

## 📁 Proje Yapısı

```
wordup/
├── src/
│   ├── App.jsx          # Ana uygulama bileşeni
│   ├── App.css          # Stiller
│   ├── adService.js     # AdMob reklam yönetim servisi
│   ├── main.jsx         # Giriş noktası
│   ├── index.css        # Global stiller
│   └── data/
│       └── words.json   # 1000 kelimelik havuz
├── ios/                 # Capacitor iOS projesi
├── capacitor.config.json
├── index.html
├── vite.config.js
└── package.json
```

## 💰 Reklam Yapılandırması

| Reklam Türü | Gösterim Zamanı |
|---|---|
| **Banner** | Ana ekranın altında (sınav esnasında gizlenir) |
| **Interstitial** | Sınav bittiğinde tam ekran |
| **Reklamları Kaldır** | $0.99 In-App Purchase ile kalıcı kaldırma |

> ⚠️ Şu an Google'ın test reklam ID'leri kullanılmaktadır. Yayına alırken gerçek AdMob ID'leri ile değiştirilmelidir.

## 📝 Lisans

Bu proje [MIT](LICENSE) lisansı altında lisanslanmıştır.

---

⭐ Beğendiyseniz yıldız vermeyi unutmayın!
