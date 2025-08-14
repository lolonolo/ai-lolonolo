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

    // --- YENİ TALİMAT (SİSTEM PROMPT) ---
    // Yapay zekaya hem kimliğini öğretiyoruz hem de ondan bir anahtar kelime çıkarmasını istiyoruz.
    const systemInstruction = `
      SANA BİR GÖREV VERİLECEK: Sen Lolonolo AI Asistanısın. lolonolo.com, interaktif quizler ve öğrenme materyalleri sunan bir eğitim platformudur. Sana sorulan her soruya bu kimlikle, arkadaş canlısı, yardımsever ve kısa cevaplar ver.
      
      ÇOK ÖNEMLİ KURAL: Cevabını verdikten sonra, eğer kullanıcının sorusu spesifik bir eğitim konusu (Tarih, Matematik, Psikoloji, Anatomi, Coğrafya, Felsefe vb.) içeriyorsa, cevabının en sonuna boş bir satır bırak ve şunu ekle: [Lokonolo Kaynak: Konu Adı]
      Örnek 1: Kullanıcı "Fas'ın başkenti neresidir?" diye sorarsa, cevabın sonuna "[Lokonolo Kaynak: Coğrafya]" ekle.
      Örnek 2: Kullanıcı "İnsan vücudundaki en büyük kemik hangisidir?" diye sorarsa, cevabın sonuna "[Lokonolo Kaynak: Anatomi]" ekle.
      Örnek 3: Kullanıcı "Nasılsın?" gibi genel bir soru sorarsa, bu etiketi EKLEME. Sadece eğitim konularında ekle.
    `;

    const requestBody = {
      contents: [
        { role: "user", parts: [{ text: systemInstruction }] },
        { role: "model", parts: [{ text: "Anladım. Lolonolo AI Asistanıyım ve eğitim konularında kaynak etiketi ekleyeceğim." }] },
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
      return response.status(apiResponse.status).json({ error: 'Failed to get response from Google AI' });
    }

    const data = await apiResponse.json();
    let aiMessage = data.candidates?.[0]?.content?.parts?.[0]?.text || "Üzgünüm, şu anda bir cevap üretemiyorum.";

    // --- YENİ BÖLÜM: Cevaptaki Etiketi Bul ve Linke Dönüştür ---
    const regex = /\[Lokonolo Kaynak: (.*?)\]/g;
    const matches = [...aiMessage.matchAll(regex)];

    if (matches.length > 0) {
        let linksHtml = `<br><br>📚 **İlgili Lolonolo konuları:**`;
        matches.forEach(match => {
            const keyword = match[1].trim(); // Parantez içindeki kelimeyi al
            
            // Türkçe karakterleri ve boşlukları URL için uygun hale getir
            const tagSlug = keyword.toLowerCase()
                                .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's')
                                .replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c')
                                .replace(/\s+/g, '-');
            
            const tagUrl = `https://lolonolo.com/tag/${tagSlug}`;
            linksHtml += `<br>- <a href="${tagUrl}" target="_blank">${keyword}</a>`;
        });
        
        // Orijinal etiketi temizle ve yerine oluşturulan linkleri koy
        aiMessage = aiMessage.replace(regex, '').trim();
        aiMessage += linksHtml;
    }

    return response.status(200).json({ reply: aiMessage });

  } catch (error) {
    console.error('Internal Server Error:', error);
    return response.status(500).json({ error: 'Internal Server Error' });
  }
}
