// Vercel'in sunucusuz fonksiyonları için standart başlangıç
export default async function handler(request, response) {
  // Sadece POST metoduyla gelen istekleri kabul et
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // index.html'den gönderilen soruyu al
    const { prompt } = await request.body;

    // Eğer soru boşsa hata döndür
    if (!prompt) {
      return response.status(400).json({ error: 'Prompt is required' });
    }

    // Vercel'in kasasından Google AI (Gemini) anahtarını al
    const apiKey = process.env.GEMINI_API_KEY;
    
    // Google Gemini API'sinin adresi
    // Hızlı ve verimli 'flash' modelini kullanıyoruz
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`;

    // Google'ın istediği formatta istek gövdesini oluştur
    const requestBody = {
      contents: [
        // Bu ilk iki bölüm, yapay zekanın kişiliğini ve bağlamını tanımlar
        {
          role: "user",
          parts: [
            { text: "SANA BİR GÖREV VERİLECEK: Sen Lolonolo AI Asistanısın. lolonolo.com, interaktif quizler ve öğrenme materyalleri sunan bir eğitim platformudur. Sana sorulan her soruya bu kimlikle, arkadaş canlısı, yardımsever ve kısa cevaplar ver." }
          ]
        },
        {
          role: "model",
          parts: [
            { text: "Anladım. Ben artık Lolonolo.com sitesinin yardımsever AI Asistanıyım. Kullanıcılara quizler ve öğrenme konularında yardımcı olacağım." }
          ]
        },
        // Bu son bölüm, gerçek kullanıcının o anki sorusudur
        {
          role: "user",
          parts: [
            { text: prompt }
          ]
        }
      ]
    };

    // Google Gemini API'ye isteği gönder
    const apiResponse = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    // Eğer Google'dan gelen cevapta bir hata varsa
    if (!apiResponse.ok) {
      const errorData = await apiResponse.json();
      console.error('Google AI API Error:', errorData);
      return response.status(apiResponse.status).json({ error: 'Failed to get response from Google AI' });
    }

    const data = await apiResponse.json();
    
    // Google'dan gelen cevabın içindeki metni al
    // Bazen cevap gelmeyebilir, bu durumu kontrol et
    const aiMessage = data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts[0] ? data.candidates[0].content.parts[0].text : "Üzgünüm, şu anda bir cevap üretemiyorum.";


    // Cevabı index.html'e geri gönder
    return response.status(200).json({ reply: aiMessage });

  } catch (error) {
    console.error('Internal Server Error:', error);
    return response.status(500).json({ error: 'Internal Server Error' });
  }
}
