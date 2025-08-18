import { kv } from '@vercel/kv';

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method Not Allowed' });
  }

  const apiProviders = [
    {
      name: 'Gemini Primary',
      apiKey: process.env.GEMINI_API_KEY,
      url: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent',
      buildRequestBody: (prompt, systemInstruction) => ({
        contents: [
          { role: "user", parts: [{ text: systemInstruction }] },
          { role: "model", parts: [{ text: "Anladım. Lolonolo AI Asistanıyım..." }] },
          { role: "user", parts: [{ text: prompt }] }
        ]
      }),
      parseResponse: (data) => data.candidates?.[0]?.content?.parts?.[0]?.text
    },
    {
      name: 'Gemini Fallback',
      apiKey: process.env.GEMINI_API_KEY_FALLBACK,
      url: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent',
      buildRequestBody: (prompt, systemInstruction) => ({
        contents: [
          { role: "user", parts: [{ text: systemInstruction }] },
          { role: "model", parts: [{ text: "Anladım. Lolonolo AI Asistanıyım..." }] },
          { role: "user", parts: [{ text: prompt }] }
        ]
      }),
      parseResponse: (data) => data.candidates?.[0]?.content?.parts?.[0]?.text
    },
    {
      name: 'OpenAI',
      apiKey: process.env.OPENAI_API_KEY,
      url: 'https://api.openai.com/v1/chat/completions',
      buildRequestBody: (prompt, systemInstruction) => ({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: "system", content: systemInstruction },
          { role: "user", content: prompt }
        ]
      }),
      parseResponse: (data) => data.choices?.[0]?.message?.content
    },
    // YENİ EKLENEN SAĞLAYICI: DeepSeek
    {
      name: 'DeepSeek',
      apiKey: process.env.DEEPSEEK_API_KEY,
      url: 'https://api.deepseek.com/chat/completions',
      buildRequestBody: (prompt, systemInstruction) => ({
        model: 'deepseek-chat',
        messages: [
          { role: "system", content: systemInstruction },
          { role: "user", content: prompt }
        ]
      }),
      parseResponse: (data) => data.choices?.[0]?.message?.content
    }
  ];

  const sendSearchFallback = () => {
    const fallbackMessage = `Şu an yapay zeka meşgul veya bir sorunla karşılaştı.<br><br>Ancak aradığınız konuyla ilgili Lolonolo'da bir arama yapabilirsiniz. Lütfen aramak istediğiniz konuyu yazın.<br>Örnek: <strong>Anatomi 2025 vize soruları</strong>`;
    return response.status(200).json({ status: 'fallback_initiated', reply: fallbackMessage });
  };

  try {
    const { prompt } = request.body;
    if (!prompt) {
      return response.status(400).json({ error: 'Prompt is required' });
    }

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

    let finalAiMessage = null;

    for (const provider of apiProviders) {
      if (!provider.apiKey) {
        console.log(`Skipping ${provider.name}, API key not found.`);
        continue;
      }
      
      try {
        console.log(`Trying with provider: ${provider.name}`);

        const requestBody = provider.buildRequestBody(prompt, systemInstruction);
        let headers = { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${provider.apiKey}` // OpenAI ve DeepSeek için ortak
        };

        // Gemini için özel URL yapısı, Authorization başlığına ihtiyaç duymaz
        let finalUrl = provider.url;
        if (provider.name.includes('Gemini')) {
          finalUrl = `${provider.url}?key=${provider.apiKey}`;
          delete headers.Authorization; // Gemini için bu başlığı kaldır
        }
        
        const apiResponse = await fetch(finalUrl, {
          method: 'POST',
          headers: headers,
          body: JSON.stringify(requestBody),
        });

        if (!apiResponse.ok) {
          const errorBody = await apiResponse.text();
          throw new Error(`Request failed with status ${apiResponse.status}: ${errorBody}`);
        }

        const data = await apiResponse.json();
        const parsedMessage = provider.parseResponse(data);

        if (parsedMessage) {
          finalAiMessage = parsedMessage; 
          console.log(`Success with ${provider.name}!`);
          break;
        } else {
          throw new Error("Parsed message is empty.");
        }

      } catch (error) {
        console.error(`${provider.name} failed:`, error.message);
      }
    }

    if (!finalAiMessage) {
      console.error("All API providers failed.");
      return sendSearchFallback();
    }

    let aiMessage = finalAiMessage;
    const kaynakRegex = /\[Lolonolo Kaynak: (.*?)\]/g;
    aiMessage = aiMessage.replace(kaynakRegex, (match, p1) => {
        const searchTerm = encodeURIComponent(p1.trim());
        const linkMetni = p1.trim();
        return `<a href="https://lolonolo.com/?s=${searchTerm}" target="_blank">"<strong>${linkMetni}</strong>" konusu hakkında Lolonolo'da arama yapın.</a>`;
    });

    return response.status(200).json({ status: 'success', reply: aiMessage });

  } catch (error) {
    console.error('General error in handler:', error);
    return sendSearchFallback();
  }
}
