# StockMind - AI-Powered Stock Prediction Tool

![StockMind](https://img.shields.io/badge/StockMind-v1.0-cyan)
![Next.js](https://img.shields.io/badge/Next.js-14-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue)

**StockMind** adalah alat prediksi saham berbasis AI yang terinspirasi dari konsep OpenAlice. Alat ini menyediakan visualisasi data pasar, analisis teknikal, dan prediksi harga menggunakan algoritma machine learning sederhana.

## ✨ Fitur

### 📊 Chart & Visualisasi
- **Candlestick Chart** - Visualisasi harga OHLC real-time
- **SMA (Simple Moving Average)** - Rata-rata bergerak 20 hari
- **EMA (Exponential Moving Average)** - Rata-rata bergerak eksponensial 12 hari
- **RSI (Relative Strength Index)** - Indikator momentum
- **Volume Chart** - Analisis volume trading

### 🔍 Analisis Teknikal
- Trend detection (Bullish/Bearish)
- Momentum analysis (Overbought/Oversold)
- Signal strength (Buy/Sell/Hold)
- Volatility measurement

### 🤖 AI Predictions
- Prediksi harga 7 hari ke depan
- Confidence score untuk setiap prediksi
- Trend forecasting berdasarkan data historis

### 📰 News & Sentiment
- Integrasi berita terbaru
- Analisis sentiment (Positive/Negative/Neutral)
- Market overview

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Open http://localhost:3000
```

## 📁 Struktur Project

```
stock-prediction-tool/
├── app/
│   ├── page.tsx          # Main page
│   ├── layout.tsx        # Root layout
│   └── globals.css        # Global styles
├── components/
│   └── StockPredictionTool.tsx  # Main component
├── package.json
├── tailwind.config.ts
└── tsconfig.json
```

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Charts**: Canvas API (Custom)
- **State**: React Hooks

## 📈 Indikator Teknikal

| Indikator | Period | Description |
|-----------|--------|-------------|
| SMA | 20 days | Simple Moving Average |
| EMA | 12 days | Exponential Moving Average |
| RSI | 14 days | Relative Strength Index |

## ⚠️ Disclaimer

> Data yang disediakan hanya untuk tujuan edukasional. 
> **Bukan** nasihat keuangan. Selalu lakukan riset sendiri sebelum membuat keputusan investasi.

## 🎨 Design

Desain terminal trading modern dengan:
- Dark theme (#0a0e17)
- Accent colors: Cyan (#06b6d4), Amber (#f59e0b), Purple (#a855f7)
- Responsive layout
- Smooth animations

## 📝 License

MIT License

---

Dibuat dengan ❤️ berdasarkan konsep dari [OpenAlice](https://github.com/TraderAlice/OpenAlice)