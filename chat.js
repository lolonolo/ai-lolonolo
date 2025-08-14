export default async function handler(request, response) {
  // Sadece POST isteklerini kabul et
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // Frontend'den gelen soruyu al
    const { prompt } = await request.body;

    if (!prompt) {
      return response.status(400).json({ error: 'Prompt is required' });
    }

    // Vercel'in kasasından gizli API anahtarını al
    const apiKey = process.env.DEEPSEEK_API_KEY;

    // DeepSeek API'ye istek gönder
    const apiResponse = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { content: 'You are a helpful assistant.', role: 'system' },
          { content: prompt, role: 'user' },
        ],
        stream: false, // Cevabı tek parça halinde almak için
      }),
    });

    if (!apiResponse.ok) {
      // API'den hata dönerse
      const errorData = await apiResponse.json();
      console.error('DeepSeek API Error:', errorData);
      return response.status(apiResponse.status).json({ error: 'Failed to get response from AI' });
    }

    const data = await apiResponse.json();
    const aiMessage = data.choices[0].message.content;

    // Gelen cevabı frontend'e geri gönder
    return response.status(200).json({ reply: aiMessage });

  } catch (error) {
    console.error('Internal Server Error:', error);
    return response.status(500).json({ error: 'Internal Server Error' });
  }
}