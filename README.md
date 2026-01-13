# Fen Bilimleri Quiz Backend API

## 🚀 Kurulum

```bash
# Backend klasörüne gir
cd backend

# Dependencies'leri yükle
npm install

# Development modunda başlat
npm run dev

# Production modunda başlat
npm start
```

## 📊 Endpoint'ler

### POST /generate-questions
AI destekli soru üretimi

**Request Body:**
```json
{
  "grade": "5. Sınıf",
  "unit": "Güneş, Dünya ve Ay", 
  "topic": "Güneş'in yapısı ve özellikleri",
  "questionCount": 5
}
```

**Response:**
```json
{
  "success": true,
  "questions": [
    {
      "question": "Güneş'in çekirdeğinde gerçekleşen füzyon reaksiyonu sonucunda ne oluşur?",
      "options": ["Sadece ışık", "Işık ve ısı enerjisi", "Sadece ısı enerjisi", "Sadece radyasyon"],
      "answer": 1,
      "explanation": "Güneş'te hidrojen çekirdeği birleşerek helyuma dönüşür ve bu süreçte devasa miktarda ışık ve ısı enerjisi açığa çıkar.",
      "isAI": true,
      "grade": "5. Sınıf",
      "unit": "Güneş, Dünya ve Ay",
      "topic": "Güneş'in yapısı ve özellikleri",
      "emoji": "🤖"
    }
  ],
  "count": 5,
  "message": "5 yapay zeka sorusu üretildi"
}
```

### GET /health
Servis durumu kontrolü

## 🔧 Environment Variables

`.env` dosyasında:
```
GEMINI_API_KEY=AIzaSyA1q1h2GscJ2XZ8e0fK0rBFN28T0hp63Ik
PORT=3001
NODE_ENV=development
```

## 🛡️ Güvenlik

- API key backend'de gizli
- Input validation
- Error handling
- CORS enabled

## 📝 Özellikler

- ✅ Gemini AI entegrasyonu
- ✅ JSON format kontrolü
- ✅ Soru validasyonu
- ✅ Error handling
- ✅ Logging
- ✅ Health check
- ✅ Production ready
