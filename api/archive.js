import { kv } from '@vercel/kv';

export default async function handler(request, response) {
  // Sadece POST metotlarına izin ver
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // Vercel, body'yi zaten JSON olarak ayrıştırır. Doğrudan kullanabiliriz.
    const chat = request.body;

    // Gelen verinin geçerli olup olmadığını kontrol et
    if (!chat || !chat.id || !chat.messages) {
      return response.status(400).json({ error: 'Geçersiz sohbet verisi gönderildi.' });
    }

    // Sohbeti, kendi ID'si ile Vercel KV'ye kaydet
    await kv.set(chat.id, chat);

    // Başarı durumunda JSON cevabı gönder
    return response.status(200).json({ status: 'success', message: `Sohbet ${chat.id} arşivlendi.` });

  } catch (error) {
    console.error('Sohbet arşivlenirken hata:', error);
    // Hata durumunda bile her zaman JSON formatında bir cevap gönder
    return response.status(500).json({ error: 'Sohbet arşivlenemedi.', details: error.message });
  }
}