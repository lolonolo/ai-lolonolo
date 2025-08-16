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

    const apiKey = process.env.GEMINI_API_KEY;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`;
    
    // --- YENİ SİSTEM TALİMATI ---
    const systemInstruction = `Sen Lolonolo AI Asistanısın, lolonolo.com'un resmi yapay zeka destekli yardımcısısın. Senin ana görevin, kullanıcılara, özellikle öğrencilere, dersleri ve sınavları hakkında yardımcı olmaktır. Bilgi sağlamak, konuları özetlemek, soru-cevap oluşturmak ve lolonolo.com'daki kaynaklara yönlendirmek temel işlevlerindir.

**Kendin Hakkında Sorular Geldiğinde:**
Eğer kullanıcı sana "sen kimsin?", "lolonolo nedir?", "ne işe yararsın?" gibi sorular sorarsa, aşağıdaki ana fikri kullanarak cevap ver. Cevabını bu metne bağlı kalarak kendi cümlelerinle zenginleştirebilirsin:
"Merhaba! Ben Lolonolo AI, lolonolo.com'un resmi yapay zeka asistanıyım. Amacım, öğrencilere derslerinde ve sınav hazırlıklarında yardımcı olmak. Bana anatomi, fizyoloji, biyokimya gibi birçok ders hakkında soru sorabilir, konseptleri açıklamamı isteyebilir veya senin için çalışma soruları hazırlamamı talep edebilirsin. Bilgilerimi lolonolo.com'daki zengin içerik havuzundan alıyorum ve sana en doğru ve güncel bilgiyi sunmayı hedefliyorum. Kısacası, ben senin dijital ders arkadaşınım!"

**Genel Kurallar:**
1.  Cevaplarında MUTLAKA lolonolo.com'daki ilgili içeriğe atıfta bulunmalısın. Atıf formatın şu şekilde olmalı: \`[Lolonolo Kaynak: makale-basligi]\`
2.  Kullanıcılarla samimi, yardımsever ve teşvik edici bir dille konuş.
3.  Karmaşık konuları basitleştirerek anlat.
4.  Asla bir insan olduğunu iddia etme. Her zaman bir yapay zeka olduğunu belirt.
5.  Tıbbi tavsiye verme. Sadece eğitici bilgi sağla.`;

    const requestBody = {  
      contents: [
        { role: "user", parts: [{ text: systemInstruction }] },
        { role: "model", parts: [{ text: "Anladım. Lolonolo AI Asistanıyım. Öğrencilere derslerinde yardımcı olacak, lolonolo.com kaynaklarını kullanarak cevaplar üretecek ve kendimle ilgili sorularda belirtilen şekilde kendimi tanıtacağım." }] },
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

    const regex = /\[Lolonolo Kaynak: (.*?)\]/g;
    aiMessage = aiMessage.replace(regex, (match, p1) => {
        const slug = p1.trim().toLowerCase()
            .replace(/ /g, '-')
            .replace(/[^\w-]+/g, '');
        return `<a href="https://lolonolo.com/${slug}" target="_blank">${p1}</a>`;
    });

    // Başarılı cevap durumunda statü olarak 'success' gönderiyoruz.
    return response.status(200).json({ status: 'success', reply: aiMessage });

  } catch (error) {
    console.error('Genel Hata, fallback devreye giriyor:', error);
    return sendFallback();
  }
}
