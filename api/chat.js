export default async function handler(request, response) {
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method Not Allowed' });
  }

  const { prompt } = await request.body;
  if (!prompt) {
    return response.status(400).json({ error: 'Prompt is required' });
  }

  // --- HATA DURUMUNDA ÇALIŞACAK YEDEK PLAN ---
  const fallbackResponse = () => {
    // Kullanıcının sorusunu URL uyumlu hale getir (örn: "genel kimya" -> "genel+kimya")
    const searchQuery = encodeURIComponent(prompt);
    // Lolonolo için bir arama URL'i oluştur. WordPress'te standart arama ?s= ile çalışır.
    const searchUrl = `https://lolonolo.com/?s=${searchQuery}`;

    const fallbackMessage = `
      Şu an yapay zeka meşgul veya bir sorunla karşılaştı. 
      <br><br>
      Ancak aradığınız konuyla ilgili Lolonolo'da bir arama yapabilirsiniz.
      <br><br>
      👉 **<a href="${searchUrl}" target="_blank">'${prompt}' için Lolonolo'da ara</a>**
    `;
    // Hata yerine bu kibar mesajı ve linki gönderiyoruz.
    return response.status(200).json({ reply: fallbackMessage });
  };

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`;

    const systemInstruction = `Sen Lolonolo AI Asistanısın... (Talimat metniniz)`; // Talimat metniniz burada kalabilir.

    const requestBody = { /* ... önceki requestBody ... */ };
    
    // Öncekiyle aynı requestBody'i buraya kopyalayabilirsiniz, sadelik için kısalttım.
    // ÖNEMLİ: Yukarıdaki systemInstruction ve requestBody kısımlarını bir önceki koddan alın.
    // Buraya sadece ana mantığı göstermek için kısalttım.
    // Gerçek kodunuzda bu bölümlerin tam olması gerekir.
    
    const apiResponse = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody), // requestBody'nin tam halini kullandığınızdan emin olun
    });

    if (!apiResponse.ok) {
      // Hata varsa, fallbackResponse fonksiyonunu çağır
      console.error('Google AI API Error, fallback devreye giriyor.');
      return fallbackResponse();
    }

    const data = await apiResponse.json();
    let aiMessage = data.candidates?.[0]?.content?.parts?.[0]?.text || "Üzgünüm, şu anda bir cevap üretemiyorum.";

    // ... Etiket bulma ve linke dönüştürme mantığı burada kalacak ...
    
    return response.status(200).json({ reply: aiMessage });

  } catch (error) {
    // Herhangi bir ağ hatası veya başka bir sorunda da fallbackResponse fonksiyonunu çağır
    console.error('Genel Hata, fallback devreye giriyor:', error);
    return fallbackResponse();
  }
}
