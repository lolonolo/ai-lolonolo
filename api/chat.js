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

    // Vercel'in kasasından yeni Google AI (Gemini) anahtarını al
    const apiKey = process.env.GEMINI_API_KEY;
    
    // Google Gemini API'sinin adresi
    // Hızlı ve verimli 'flash' modelini kullanıyoruz
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`;

    // Google'ın istediği formatta istek gövdesini oluştur
    const requestBody = {
      contents: [
        {
          parts: [
            {
              text: prompt,
            },
          ],
        },
      ],
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
    const aiMessage = data.candidates[0].content.parts[0].text;

    // Cevabı index.html'e geri gönder
    return response.status(200).json({ reply: aiMessage });

  } catch (error) {
    console.error('Internal Server Error:', error);
    return response.status(500).json({ error: 'Internal Server Error' });
  }
}
