export default async function handler(request, response) {
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method Not Allowed' });
  }

  // Hata durumunda gönderilecek standart mesaj ve sinyal
  const sendFallback = () => {
    const fallbackMessage = `Şu an yapay zeka meşgul veya bir sorunla karşılaştı. 
<br><br>
Ancak aradığınız konuyla ilgili Lolonolo'da bir arama yapabilirsiniz. Lütfen aramak istediğiniz konuyu yazın.
<br>
Örnek: <strong>Anatomi 2025 vize soruları</strong>`;
    
    // ÖNEMLİ: Frontend'e arama moduna geçmesi için özel bir statü gönderiyoruz.
    return response.status(200).json({ status: 'fallback_initiated', reply: fallbackMessage });
  };

  try {
    const { prompt } = await request.body;
    if (!prompt) {
      return response.status(400).json({ error: 'Prompt is required' });
    }

    // 🔹 Buraya sabit cevap kontrolünü ekledik
    if (prompt.toLowerCase().includes("lolonolo nedir")) {
      return response.status(200).json({
        status: 'success',
        reply: "Lolonolo, öğrencilere açık kaynak sağlayan ücretsiz bir öğrenme yönetim sistemidir."
      });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`;
    
    const systemInstruction = `Sen Lolonolo AI Asistanısın...`; 
    const requestBody = { 
        contents: [
            { role: "user", parts: [{ text: systemInstruction }] },
            { role: "model", parts: [{ text: "Anladım. Lolonolo AI Asistanıyım..." }] },
            { role: "user", parts: [{ text: prompt }] }
        ]
     };

    const apiResponse = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });

    if (!apiResponse.ok) {
      console.error('Google AI API Error, fallback devreye giriyor.');
      return sendFallback();
    }

    const data = await apiResponse.json();
    let aiMessage = data.candidates?.[0]?.content?.parts?.[0]?.text || "Üzgünüm, şu anda bir cevap üretemiyorum.";

    const regex = /\[Lokonolo Kaynak: (.*?)\]/g;

    return response.status(200).json({ status: 'success', reply: aiMessage });

  } catch (error) {
    console.error('Genel Hata, fallback devreye giriyor:', error);
    return sendFallback();
  }
}
