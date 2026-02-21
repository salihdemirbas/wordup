# 🧠 WordUp - İngilizce Kelime Quiz Uygulaması

İngilizce kelime bilginizi eğlenceli bir şekilde test edebileceğiniz modern ve interaktif bir quiz uygulaması.

![React](https://img.shields.io/badge/React-18-61dafb?logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green)

## 🌐 Demo

👉 **[Canlı Demo](https://salihdemirbas.github.io/wordup)**

## ✨ Özellikler

- 🎯 **Esnek Soru Sayısı** — 20, 50, 100 hazır seçeneklerle veya kendi istediğiniz sayıda soru ile sınav
- 🔄 **Çift Yönlü Quiz** — İngilizce → Türkçe veya Türkçe → İngilizce modları
- ⏱️ **Zamanlayıcı Modu** — 5, 10 veya 15 saniyelik süre limiti ile heyecanlı sınavlar
- 📊 **Sınav Geçmişi** — Tüm sonuçlarınız kaydedilir ve takip edilir
- 🏅 **En İyi Skorlar** — Kategorilere göre en yüksek puanlar saklanır
- 🔁 **Yanlışlarla Tekrar** — Yanlış bilinen kelimelerle yeniden sınav olma imkanı
- 🔊 **Ses Efektleri** — Web Audio API ile doğru/yanlış/zaman aşımı ses geri bildirimleri
- 🎨 **Modern Tasarım** — Glassmorphism, gradient animasyonlar ve responsive arayüz
- 📱 **Mobil Uyumlu** — Tüm cihazlarda kusursuz çalışır

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
| **CSS3** | Glassmorphism, animasyonlar |
| **Web Audio API** | Ses efektleri |
| **LocalStorage** | Sınav geçmişi & skorlar |

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
