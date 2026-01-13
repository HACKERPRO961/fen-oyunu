/**
 * Fen Bilimleri Quiz Backend API
 * Node.js + Express + Gemini AI
 */

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Gemini AI Client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Sunucu uyandırma endpoint'i
 */
app.get('/', (req, res) => {
  res.send("Server awake - Fen Bilimleri Quiz API");
});

/**
 * Soru üretimi için Gemini API'ye gönderilecek prompt
 * @param {string} grade - Sınıf seviyesi
 * @param {string} unit - Ünite adı
 * @param {string} topic - Alt konu
 * @param {number} questionCount - Soru sayısı
 * @returns {string} - Gemini için hazırlanmış prompt
 */
function generatePrompt(grade, unit, topic, questionCount) {
  return `Sen bir Fen Bilimleri öğretmenisin. 
${grade}. sınıf seviyesine uygun, "${unit}" ünitesi, "${topic}" konusu için ${questionCount} adet çoktan seçmeli soru hazırla.

KRİTİK KURALLAR:
1. SADECE JSON formatında cevap ver
2. Format: {"questions": [{"question": "...", "options": ["A", "B", "C", "D"], "answer": 0, "explanation": "..."}]}
3. Her soruda TAM 4 şık olsun
4. answer 0-3 arasında olmalı (0=A, 1=B, 2=C, 3=D)
5. Cümleler kısa ve anlaşılır olsun
6. Sorular ${grade}. sınıf seviyesinde olsun
7. Açıklamalar basit ve öğretici olsun
8. Türkçe ve anlaşılır dil kullan
9. JSON syntax hatası yapma

ÖRNEK SORU:
{
  "question": "Güneş'in çekirdeğinde gerçekleşen füzyon reaksiyonu sonucunda ne oluşur?",
  "options": [
    "Sadece ışık",
    "Işık ve ısı enerjisi",
    "Sadece ısı enerjisi", 
    "Sadece radyasyon"
  ],
  "answer": 1,
  "explanation": "Güneş'te hidrojen çekirdeği birleşerek helyuma dönüşür ve bu süreçte devasa miktarda ışık ve ısı enerjisi açığa çıkar."
}`;
}

/**
 * Soru üretme endpoint'i
 * POST /generate-questions
 */
app.post('/generate-questions', async (req, res) => {
  try {
    const { grade, unit, topic, questionCount = 5 } = req.body;

    // Gerekli alanları kontrol et
    if (!grade || !unit || !topic) {
      return res.status(400).json({
        success: false,
        error: 'Eksik bilgi: grade, unit ve topic zorunludur'
      });
    }

    console.log(`🤖 AI Soru İsteği: ${grade} - ${unit} - ${topic} (${questionCount} soru)`);

    // Gemini modelini başlat
    const model = genAI.getGenerativeModel({
      model: "models/gemini-1.5-flash"
    });

    // Prompt'u oluştur
    const prompt = generatePrompt(grade, unit, topic, questionCount);

    // Gemini API'ye istek gönder
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    console.log('📝 Gemini Ham Cevap:', text);

    // JSON parse et - güvenli şekilde
    let questions;
    try {
      // JSON bloğunu temizle
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('JSON formatı bulunamadı');
      }
      
      questions = JSON.parse(jsonMatch[0]);
      
      // Soru formatını kontrol et
      if (!questions.questions || !Array.isArray(questions.questions)) {
        throw new Error('Geçersiz soru formatı');
      }

      // Her soruyu kontrol et
      const validQuestions = questions.questions.filter(q => {
        return q.question && 
               q.options && 
               Array.isArray(q.options) && 
               q.options.length === 4 &&
               typeof q.answer === 'number' && 
               q.answer >= 0 && 
               q.answer <= 3 &&
               q.explanation;
      });

      if (validQuestions.length === 0) {
        throw new Error('Geçerli soru bulunamadı');
      }

      // Sorulara AI etiketi ekle
      const finalQuestions = validQuestions.map(q => ({
        ...q,
        isAI: true,
        grade,
        unit,
        topic,
        emoji: '🤖'
      }));

      console.log(`✅ ${finalQuestions.length} soru başarıyla üretildi`);
      console.log('Questions generated successfully');

      return res.json({
        success: true,
        questions: finalQuestions,
        count: finalQuestions.length,
        message: `${finalQuestions.length} yapay zeka sorusu üretildi`
      });

    } catch (parseError) {
      console.error('❌ JSON Parse Hatası:', parseError.message);
      return res.status(500).json({
        success: false,
        error: 'AI cevabı işlenemedi',
        details: parseError.message
      });
    }

  } catch (error) {
    console.error('❌ API Hatası:', error.message);
    
    // Gemini API hatası
    if (error.message.includes('API')) {
      return res.status(503).json({
        success: false,
        error: 'AI servisi şu anda kullanılamıyor',
        details: 'Lütfen daha sonra tekrar deneyin'
      });
    }

    return res.status(500).json({
      success: false,
      error: 'Sunucu hatası',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Beklenmedik bir hata oluştu'
    });
  }
});

/**
 * Health check endpoint'i
 */
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'Fen Bilimleri Quiz API',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

/**
 * 404 handler
 */
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint bulunamadı',
    available: ['POST /generate-questions', 'GET /health']
  });
});

/**
 * Global error handler
 */
app.use((error, req, res, next) => {
  console.error('❌ Global Error:', error);
  res.status(500).json({
    success: false,
    error: 'Sunucu iç hatası',
    details: process.env.NODE_ENV === 'development' ? error.message : undefined
  });
});

// Server'ı başlat
app.listen(PORT, () => {
  console.log(`🚀 Fen Bilimleri Quiz API çalışıyor: http://localhost:${PORT}`);
  console.log(`📊 Health Check: http://localhost:${PORT}/health`);
  console.log(`🤖 AI Endpoint: http://localhost:${PORT}/generate-questions`);
  console.log(`🔧 Environment: ${process.env.NODE_ENV}`);
});
