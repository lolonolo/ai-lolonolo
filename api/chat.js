export default async function handler(request, response) {
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { prompt } = await request.body;
    if (!prompt) {
      return response.status(400).json({ error: 'Prompt is required' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`;

    // --- YENİ, DAHA NET TALİMAT (SYSTEM PROMPT) ---
    // Yapay zekaya görevini ve uyması gereken formatı daha katı bir şekilde anlatıyoruz.
    const systemInstruction = `
      [GÖREV]
      Sen Lolonolo AI Asistanısın. lolonolo.com, interaktif quizler ve öğrenme materyalleri sunan bir eğitim platformudur. Kullanıcının sorusuna arkadaş canlısı, yardımsever ve kısa bir cevap ver. Lolonolo sitesinin içeriği hakkında hiçbir bilgin olmadığını unutma, bu konuda yorum yapma.

      [ÇIKTI FORMATI]
      Cevabını verdikten sonra, eğer kullanıcının sorduğu soru veya bahsettiği konu spesifik bir eğitim alanı (örneğin: Tarih, Kimya, Felsefe, Anatomi, Coğrafya, Psikoloji, Hukuk vb.) içeriyorsa, cevabının en sonuna KESİNLİKLE şu etiketi ekle:
      [Lokonolo Kaynak: Konu Adı]

      Eğer konu "nasılsın, kimsin" gibi genel bir sohbet ise veya bir eğitim alanı değilse, bu etiketi KESİNLİKLE ekleme.
    `;

    const requestBody = {
      contents: [
        { role: "user", parts: [{ text: systemInstruction }] },
        { role: "model", parts: [{ text: "Anladım. Görevime ve çıktı formatı kuralına uyacağım." }] },
        { role: "user", parts: [{ text: prompt }] }
      ]
    };

    const apiResponse = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });

    if (!apiResponse.ok) {
      const errorData = await apiResponse.json();
      console.error('Google AI API Error:', errorData);
      return response.status(apiResponse.status).json({ error: `Google API Hatası: ${errorData.error?.message || 'Bilinmeyen Hata'}` });
    }

    const data = await apiResponse.json();
    let aiMessage = data.candidates?.[0]?.content?.parts?.[0]?.text || "Üzgünüm, şu anda bir cevap üretemiyorum.";

    // --- Cevaptaki Etiketi Bul ve Linke Dönüştür (Bu kısım aynı kaldı) ---
    const regex = /\[Lokonolo Kaynak: (.*?)\]/g;
    const matches = [...aiMessage.matchAll(regex)];

    if (matches.length > 0) {
        let linksHtml = `<br><br>📚 **İlgili Lolonolo konuları:**`;
        matches.forEach(match => {
            const keyword = match[1].trim();
            const tagSlug = keyword.toLowerCase()
                                .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's')
                                .replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c')
                                .replace(/\s+/g, '-');
            const tagUrl = `https://lolonolo.com/tag/${tagSlug}`;
            linksHtml += `<br>- <a href="${tagUrl}" target="_blank">${keyword}</a>`;
        });
        
        aiMessage = aiMessage.replace(regex, '').trim();
        aiMessage += linksHtml;
    }

    return response.status(200).json({ reply: aiMessage });

  } catch (error) {
    console.error('Internal Server Error:', error);
    return response.status(500).json({ error: 'Internal Server Error' });
  }
}
