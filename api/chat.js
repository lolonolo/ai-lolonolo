export default async function handler(request, response) {
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method Not Allowed' });
  }

  // YENİ: Vercel'deki her iki API anahtarını da oku
  const primaryApiKey = process.env.GEMINI_API_KEY;
  const fallbackApiKey = process.env.GEMINI_API_KEY_FALLBACK;
  
  // YENİ: Anahtar artık URL'den çıkarıldı, dinamik olarak eklenecek
  // Not: Adresteki "generativelaoguage" yazım hatası "generativelanguage" olarak düzeltildi.
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent`;

  const sendFallback = () => {
    const fallbackMessage = `Şu an yapay zeka meşgul veya bir sorunla karşılaştı.  
<br><br>
Ancak aradığınız konuyla ilgili Lolonolo'da bir arama yapabilirsiniz. Lütfen aramak istediğiniz konuyu yazın.
<br>
Örnek: <strong>Anatomi 2025 vize soruları</strong>`;
    
    return response.status(200).json({ status: 'fallback_initiated', reply: fallbackMessage });
  };

  try {
    const { prompt } = await request.body;
    if (!prompt) {
      return response.status(400).json({ error: 'Prompt is required' });
    }

    // MEVCUT SİSTEM TALİMATINIZ KORUNDU
    const systemInstruction = `Sen Lolonolo AI Asistanısın, lolonolo.com'un resmi yapay zeka yardımcısısın. Ana görevin öğrencilere dersleri ve sınavları hakkında yardımcı olmaktır.

**Kaynak Gösterme Kuralı (ÇOK ÖNEMLİ):**
-   Cevabının sonunda, bahsettiğin ana konuyla ilgili bir kaynak belirtmek için **her zaman** şu formatı kullan: \`[Lolonolo Kaynak: Araması Yapılacak Konu]\`
-   Örnek: Kullanıcı "miyopi" hakkında soru sorarsa, cevabının sonuna \`[Lolonolo Kaynak: Miyopi ve göz sağlığı]\` şeklinde bir ifade ekle.
-   **ASLA** doğrudan bir URL veya var olmayan bir makale adı yazma. Sadece bu formatı kullan.

**Genel Kurallar:**
-   Kullanıcılarla samimi, yardımsever ve teşvik edici bir dille konuş.
-   Karmaşık konuları basitleştirerek anlat.
-   Asla bir insan olduğunu iddia etme.
-   Tıbbi tavsiye verme, sadece eğitici bilgi sağla ve sonunda mutlaka bir uzmana danışılması gerektiğini belirt.`;

    const requestBody = {  
      contents: [
        { role: "user", parts: [{ text: systemInstruction }] },
        { role: "model", parts: [{ text: "Anladım. Lolonolo AI Asistanıyım. Cevaplarımın sonunda daima [Lolonolo Kaynak: Konu] formatını kullanarak site içi arama yapılacak bir kaynak belirteceğim." }] },
        { role: "user", parts: [{ text: prompt }] }
      ]
    };

    // --- YENİ: YEDEKLİ API ÇAĞRI MANTIĞI ---
    let apiResponse;
    try {
      console.log("Trying with primary API key...");
      apiResponse = await fetch(`${url}?key=${primaryApiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });
      if (!apiResponse.ok) throw new Error(`Primary key failed: ${apiResponse.status}`);
    } catch (primaryError) {
      console.error("Primary API key failed. Reason:", primaryError.message);

      if (fallbackApiKey) {
        console.log("Trying with fallback API key...");
        try {
          apiResponse = await fetch(`${url}?key=${fallbackApiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody),
          });
          if (!apiResponse.ok) throw new Error(`Fallback key also failed: ${apiResponse.status}`);
        } catch (fallbackError) {
          console.error("Fallback API key also failed. Reason:", fallbackError.message);
          return sendFallback();
        }
      } else {
        console.log("No fallback key available.");
        return sendFallback();
      }
    }
    // --- YENİ MANTIK SONU ---

    const data = await apiResponse.json();
    let aiMessage = data.candidates?.[0]?.content?.parts?.[0]?.text || "Üzgünüm, şu anda bir cevap üretemiyorum.";

    // MEVCUT LİNK OLUŞTURMA MANTIĞINIZ KORUNDU
    const kaynakRegex = /\[Lolonolo Kaynak: (.*?)\]/g;
    aiMessage = aiMessage.replace(kaynakRegex, (match, p1) => {
        const searchTerm = encodeURIComponent(p1.trim());
        const linkMetni = p1.trim();
        return `<a href="https://lolonolo.com/?s=${searchTerm}" target="_blank">"<strong>${linkMetni}</strong>" konusu hakkında Lolonolo'da arama yapın.</a>`;
    });
    
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    if (!aiMessage.includes('</a>')) {
        aiMessage = aiMessage.replace(urlRegex, (url) => `<a href="${url}" target="_blank">${url}</a>`);
    }

    return response.status(200).json({ status: 'success', reply: aiMessage });

  } catch (error) {
    console.error('General error in handler:', error);
    return sendFallback();
  }
}
