# 🏛️ Dijital Muhtar — Vatandaş Hak ve Belge Asistanı

Sıfır sunucu maliyetiyle tamamen tarayıcıda çalışan, vatandaşların resmi belgelerini analiz etmesine ve temel kamu hizmetlerine erişmesine yardımcı olan bir PWA uygulaması.

## ✨ Özellikler

| Modül | Teknoloji | Açıklama |
|-------|-----------|----------|
| 📷 OCR Tarayıcı | Tesseract.js | Kamera/galeri → Türkçe metin çıkarma |
| 🤖 AI Analiz | Gemini 1.5 Flash | Belge özeti, eylem planı, yasal haklar |
| 🗺️ Harita | Leaflet + OpenStreetMap | Eczane, toplanma alanı, sosyal yardım |
| 📄 Dilekçe | jsPDF | 4 hazır şablon → PDF indirme |
| 📱 PWA | Service Worker | Çevrimdışı destek, ana ekrana ekle |

## 🚀 Kurulum

```bash
# 1. Bağımlılıkları yükle
npm install

# 2. API anahtarı ayarla
cp .env.example .env
# .env dosyasını düzenle → VITE_GEMINI_API_KEY=...

# 3. Geliştirme sunucusu
npm run dev

# 4. Production build
npm run build
npm run preview
```

## 🔑 Gemini API Anahtarı

1. https://aistudio.google.com/app/apikey adresine gidin
2. Ücretsiz API anahtarı oluşturun
3. `.env` dosyasına yapıştırın: `VITE_GEMINI_API_KEY=AIza...`

> **Not:** AI analizi olmadan da OCR tarayıcı, harita ve dilekçe modülleri çalışır.

## 📁 Dosya Yapısı

```
dijital-muhtar/
├── public/
│   ├── manifest.json          # PWA manifest
│   ├── sw.js                  # Service Worker
│   └── icons/                 # PWA ikonları (kendiniz ekleyin)
├── src/
│   ├── App.jsx                # Ana navigasyon & state
│   ├── App.css                # Global design system
│   ├── main.jsx               # React entry point
│   └── components/
│       ├── OCRScanner.jsx     # Kamera + Tesseract.js
│       ├── AIAssistant.jsx    # Gemini API + sonuç ekranı
│       ├── MapComponent.jsx   # Leaflet harita
│       └── PetitionBuilder.jsx # Dilekçe + jsPDF
├── index.html                 # PWA meta tags
├── vite.config.js
└── package.json
```

## 🔒 Gizlilik

- Belgeler yalnızca **cihazınızda** işlenir (Tesseract.js client-side)
- OCR metni AI analizi için **yalnızca Gemini API'ye** gönderilir
- Harita verileri OpenStreetMap/Overpass'tan çekilir, kişisel veri saklanmaz
- PDF dosyaları **sadece cihazınıza** kaydedilir

## 🌐 Dağıtım (Ücretsiz)

```bash
# Vercel
npx vercel --prod

# Netlify
npm run build && netlify deploy --prod --dir=dist

# GitHub Pages
npm run build
# dist/ klasörünü gh-pages branch'e push edin
```

## 📱 PWA İkon Üretimi

```bash
# İkon üretmek için (public/icons/icon.svg gerekli)
npx @vite-pwa/assets-generator --preset minimal public/icons/icon.svg
```

## 🛠️ Katkı

PR ve öneriler için GitHub Issues kullanın.

---

Türkiye Cumhuriyeti vatandaşları için ❤️ ile geliştirilmiştir.
