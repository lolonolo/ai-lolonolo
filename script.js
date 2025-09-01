// DOM Elementlerini Seçme
const chatWindow = document.getElementById('chat-window');
const promptInput = document.getElementById('prompt-input');
const askButton = document.getElementById('ask-button');
const newChatBtn = document.getElementById('new-chat-btn');
const historyList = document.getElementById('history-list');
const noHistoryMsg = document.getElementById('no-history-msg');
const archiveChatBtn = document.getElementById('archive-chat-btn');

// Genel Durum Değişkenleri
let currentChatId = null;
let messages = [];
let inFallbackMode = false;

// Statik ve Hazır Cevaplar Veritabanı
const cannedResponses = {
    // Standart Selamlaşma ve Sorular
    'merhaba': 'Merhaba! Ben Lolonolo AI. Size nasıl yardımcı olabilirim?',
    'selam': 'Selam! Ben Lolonolo AI. Size nasıl yardımcı olabilirim?',
    'selamun aleyküm': 'Aleykümselam! Lolonolo AI olarak buradayım, hangi konuda bilgi istersiniz?',
    'sa': 'Aleykümselam! Nasıl yardımcı olabilirim?',
    'nasılsın': 'Teşekkür ederim! Ben bir yapay zeka olduğum için her zaman öğrenmeye ve yardıma hazırım. Sizin için ne yapabilirim?',
    'nasılsın?': 'Teşekkür ederim! Ben bir yapay zeka olduğum için her zaman öğrenmeye ve yardıma hazırım. Sizin için ne yapabilirim?',
    'iyi misin': 'Harikayım ve yardıma hazırım! Hangi konuda bilgi almak istersiniz?',
    'iyi misin?': 'Harikayım ve yardıma hazırım! Hangi konuda bilgi almak istersiniz?',
    'sen kimsin': 'Ben Lolonolo\'nun resmi yapay zeka asistanıyım. Amacım derslerinizde ve projelerinizde size yardımcı olmak.',
    'sen kimsin?': 'Ben Lolonolo\'nun resmi yapay zeka asistanıyım. Amacım derslerinizde ve projelerinizde size yardımcı olmak.',
    'ne işe yararsın': 'Öğrencilere dersleri ve sınavları hakkında yardımcı olmak için buradayım. Konu özetleri, soru-cevap ve kaynak önerileri sunabilirim.',
    'ne işe yararsın?': 'Öğrencilere dersleri ve sınavları hakkında yardımcı olmak için buradayım. Konu özetleri, soru-cevap ve kaynak önerileri sunabilirim.',
    'kaç yaşındasın': 'Ben bir yapay zeka olduğum için yaşım yok, ama sürekli olarak güncellenen bilgilere sahibim.',
    'kaç yaşındasın?': 'Ben bir yapay zeka olduğum için yaşım yok, ama sürekli olarak güncellenen bilgilere sahibim.',

    // Teşekkür ve Kapanış
    'teşekkürler': 'Rica ederim! Yardımcı olabileceğim başka bir konu var mı?',
    'teşekkür ederim': 'Rica ederim! Başka bir sorunuz olursa çekinmeyin.',
    'sağ ol': 'Ne demek! Her zaman yardımcı olmaya hazırım.',
    'eyvallah': 'Rica ederim, başka bir isteğiniz var mıydı?',
    'görüşürüz': 'Görüşmek üzere, iyi çalışmalar dilerim!',
    'bay bay': 'Hoşça kalın, iyi günler!',

    // Lolonolo Tanımları
    'lolonolo nedir': "Lolonolo, özellikle açıköğretim (AUZEF, AÖF) ve mesleki yeterlilik sınavlarına hazırlanan öğrenciler için tasarlanmış bir Öğrenme Yönetim Sistemi (ÖYS) ve dijital eğitim platformudur. Amacım, kullanıcılara ders özetleri, deneme sınavları ve on binlerce çıkmış sınav sorusu sunarak sınav hazırlık süreçlerini kolaylaştırmak ve başarılarını artırmaktır. Beni, derslerinizde size yardımcı olan kişisel bir dijital çalışma arkadaşı olarak düşünebilirsiniz.",
    'lolonolo nedir?': "Lolonolo, özellikle açıköretim (AUZEF, AÖF) ve mesleki yeterlilik sınavlarına hazırlanan öğrenciler için tasarlanmış bir Öğrenme Yönetim Sistemi (ÖYS) ve dijital eğitim platformudur. Amacım, kullanıcılara ders özetleri, deneme sınavları ve on binlerce çıkmış sınav sorusu sunarak sınav hazırlık süreçlerini kolaylaştırmak ve başarılarını artırmaktır. Beni, derslerinizde size yardımcı olan kişisel bir dijital çalışma arkadaşı olarak düşünebilirsiniz.",
    'lolonolo.com nedir': "lolonolo.com, Lolonolo Öğrenme Yönetim Sistemi'nin resmi internet sitesi ve tüm içeriğin merkezi platformudur. Bu site üzerinden ders notlarına, soru bankalarına, online deneme sınavlarına ve blog yazılarına ulaşabilirsiniz. Kısacası lolonolo.com, sınavlara hazırlık için ihtiyaç duyduğunuz tüm materyallere tek bir adresten erişebileceğiniz dijital bir kütüphane ve çalışma alanıdır.",
    'lolonolo.com nedir?': "lolonolo.com, Lolonolo Öğrenme Yönetim Sistemi'nin resmi internet sitesi ve tüm içeriğin merkezi platformudur. Bu site üzerinden ders notlarına, soru bankalarına, online deneme sınavlarına ve blog yazılarına ulaşabilirsiniz. Kısacası lolonolo.com, sınavlara hazırlık için ihtiyaç duyduğunuz tüm materyallere tek bir adresten erişebileceğiniz dijital bir kütüphane ve çalışma alanıdır.",
    'lolonolo kimdir': "Lolonolo, belirli bir kişi değil, öğrencilerin sınav yolculuğunda onlara rehberlik etmek için oluşturulmuş bir eğitim markası ve platformudur. Beni bir 'dijital öğrenme asistanı' veya 'sınav koçu' olarak görebilirsiniz. Misyonum, karmaşık konuları anlaşılır özetlerle basitleştirmek ve binlerce pratik soruyla sizi gerçek sınavlara en iyi şekilde hazırlamaktır.",
    'lolonolo kimdir?': "Lolonolo, belirli bir kişi değil, öğrencilerin sınav yolculuğunda onlara rehberlik etmek için oluşturulmuş bir eğitim markası ve platformudur. Beni bir 'dijital öğrenme asistanı' veya 'sınav koçu' olarak görebilirsiniz. Misyonum, karmaşık konuları anlaşılır özetlerle basitleştirmek ve binlerce pratik soruyla sizi gerçek sınavlara en iyi şekilde hazırlamaktır.",

    // Tahmini Sorular
    'hangi dersler var': "Anatomi, Fizyoloji, Tarih gibi AUZEF ve AÖF fakültelerine ait birçok dersin içeriğine sahibiz. Aradığınız spesifik bir ders varsa, lolonolo.com içerisindeki arama çubuğunu kullanabilir veya 'Dersler' menüsünü inceleyebilirsiniz.",
    'hangi dersler var?': "Anatomi, Fizyoloji, Tarih gibi AUZEF ve AÖF fakültelerine ait birçok dersin içeriğine sahibiz. Aradığınız spesifik bir ders varsa, lolonolo.com içerisindeki arama çubuğunu kullanabilir veya 'Dersler' menüsünü inceleyebilirsiniz.",
    'sadece auzef mi var': "Ağırlıklı olarak İstanbul Üniversitesi AUZEF ve Anadolu Üniversitesi AÖF derslerine odaklanmış durumdayız. Zamanla yeni bölüm ve dersler eklemeye devam ediyoruz! Gelişmeler için sitemizi takip edebilirsiniz.",
    'sadece auzef mi var?': "Ağırlıklı olarak İstanbul Üniversitesi AUZEF ve Anadolu Üniversitesi AÖF derslerine odaklanmış durumdayız. Zamanla yeni bölüm ve dersler eklemeye devam ediyoruz! Gelişmeler için sitemizi takip edebilirsiniz.",
    'çıkmış sorular var mı': "Evet, hem de binlercesi! Lolonolo platformunun en güçlü yanlarından biri, geçmiş yıllara ait güncel ve kapsamlı çıkmış sınav soruları arşivine sahip olmasıdır.",
    'çıkmış sorular var mı?': "Evet, hem de binlercesi! Lolonolo platformunun en güçlü yanlarından biri, geçmiş yıllara ait güncel ve kapsamlı çıkmış sınav soruları arşivine sahip olmasıdır.",
    'ücretli mi': "Lolonolo.com'daki ders notları ve blog yazıları gibi birçok içeriğe ücretsiz erişebilirsiniz. Soru bankaları, deneme sınavları gibi gelişmiş özellikler için ise cüzi bir ücretle Premium üyelik sunuyoruz. Detayları sitemizdeki 'Üyelik Paketleri' sayfasında bulabilirsiniz.",
    'ücretli mi?': "Lolonolo.com'daki ders notları ve blog yazıları gibi birçok içeriğe ücretsiz erişebilirsiniz. Soru bankaları, deneme sınavları gibi gelişmiş özellikler için ise cüzi bir ücretle Premium üyelik sunuyoruz. Detayları sitemizdeki 'Üyelik Paketleri' sayfasında bulabilirsiniz.",
    'mobil uygulama var mı': "Evet! Lolonolo mobil uygulaması Google Play Store'da mevcut. Uygulamayı indirerek tüm içeriklere telefonunuzdan veya tabletinizden rahatça ulaşabilirsiniz.",
    'mobil uygulama var mı?': "Evet! Lolonolo mobil uygulaması Google Play Store'da mevcut. Uygulamayı indirerek tüm içeriklere telefonunuzdan veya tabletinizden rahatça ulaşabilirsiniz.",
    'neler yapabilirsin': "Size dersler hakkında genel bilgi verebilir, Lolonolo.com'daki içerikleri (ders notları, sorular vb.) nasıl bulacağınız konusunda yol gösterebilir ve sınav hazırlığıyla ilgili sık sorulan soruları yanıtlayabilirim.",
    'neler yapabilirsin?': "Size dersler hakkında genel bilgi verebilir, Lolonolo.com'daki içerikleri (ders notları, sorular vb.) nasıl bulacağınız konusunda yol gösterebilir ve sınav hazırlığıyla ilgili sık sorulan soruları yanıtlayabilirim.",
    'sınavlar ne zaman': "Sınav tarihleri fakültenizin akademik takvimine göre değişir. En doğru ve güncel bilgi için her zaman okulunuzun (AUZEF, AÖF vb.) resmi duyurularını kontrol etmenizi öneririm. Lolonolo Blog'da da önemli tarihleri sık sık paylaşıyoruz.",
    'sınavlar ne zaman?': "Sınav tarihleri fakültenizin akademik takvimine göre değişir. En doğru ve güncel bilgi için her zaman okulunuzun (AUZEF, AÖF vb.) resmi duyurularını kontrol etmenizi öneririm. Lolonolo Blog'da da önemli tarihleri sık sık paylaşıyoruz.",
    'nasıl iletişim kurabilirim': "Bizimle lolonolo@lolonolo.com e-posta adresi üzerinden veya sitemizdeki sosyal medya linklerine tıklayarak direkt olarak iletişime geçebilirsiniz. Size yardımcı olmaktan mutluluk duyarız.",
    'nasıl iletişim kurabilirim?': "Bizimle lolonolo@lolonolo.com e-posta adresi üzerinden veya sitemizdeki sosyal medya linklerine tıklayarak direkt olarak iletişime geçebilirsiniz. Size yardımcı olmaktan mutluluk duyarız.",

    // Statik Ders Arama Linkleri
    'anatomi': 'Harika! Aradığın <strong>Anatomi</strong> dersi ile ilgili tüm içeriklere (notlar, sorular, denemeler) buradan ulaşabilirsin: <a href="https://lolonolo.com/?s=anatomi" target="_blank">Anatomi Ders İçeriklerini Gör</a>',
    'fizyoloji': 'Harika! Aradığın <strong>Fizyoloji</strong> dersi ile ilgili tüm içeriklere (notlar, sorular, denemeler) buradan ulaşabilirsin: <a href="https://lolonolo.com/?s=fizyoloji" target="_blank">Fizyoloji Ders İçeriklerini Gör</a>',
    'hukukun temel kavramları': 'Harika! Aradığın <strong>Hukukun Temel Kavramları</strong> dersi ile ilgili tüm içeriklere buradan ulaşabilirsin: <a href="https://lolonolo.com/?s=hukukun+temel+kavramları" target="_blank">Hukuk Ders İçeriklerini Gör</a>',
    'tarih': 'Harika! Aradığın <strong>Tarih</strong> dersi ile ilgili tüm içeriklere (notlar, sorular, denemeler) buradan ulaşabilirsin: <a href="https://lolonolo.com/?s=tarih" target="_blank">Tarih Ders İçeriklerini Gör</a>',
    'iktisada giriş': 'Harika! Aradığın <strong>İktisada Giriş</strong> dersi ile ilgili tüm içeriklere buradan ulaşabilirsin: <a href="https://lolonolo.com/?s=iktisada+giriş" target="_blank">İktisat Ders İçeriklerini Gör</a>'
};

/**
 * Tarayıcının yerel depolamasından (localStorage) sohbet geçmişini alır.
 * @returns {object} Sohbet geçmişi nesnesi.
 */
const getChatHistory = () => {
    const history = localStorage.getItem('lolonoloAiChatHistory');
    return history ? JSON.parse(history) : {};
};

/**
 * Mevcut sohbeti ve mesajları yerel depolamaya kaydeder.
 */
const saveChatHistory = () => {
    if (!currentChatId || messages.length === 0) return;
    const history = getChatHistory();
    const userMessage = messages.find(m => m.sender === 'user');
    const title = history[currentChatId]?.title || (userMessage ? userMessage.content.substring(0, 30) + '...' : 'Yeni Sohbet');
    history[currentChatId] = { id: currentChatId, title: title, timestamp: Date.now(), messages: messages };
    localStorage.setItem('lolonoloAiChatHistory', JSON.stringify(history));
    renderHistorySidebar();
};

/**
 * Kenar çubuğundaki sohbet geçmişini güncelleyerek yeniden oluşturur.
 */
const renderHistorySidebar = () => {
    const history = getChatHistory();
    const sortedHistory = Object.values(history).sort((a, b) => b.timestamp - a.timestamp);
    historyList.innerHTML = '';

    if (sortedHistory.length > 0) {
        noHistoryMsg.style.display = 'none';
        sortedHistory.forEach(chat => {
            const li = document.createElement('li');
            li.className = 'history-item';
            if (chat.id === currentChatId) li.classList.add('active');

            const titleSpan = document.createElement('span');
            titleSpan.className = 'history-title';
            titleSpan.textContent = chat.title;
            li.appendChild(titleSpan);

            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-btn';
            deleteBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>';
            deleteBtn.addEventListener('click', (event) => {
                event.stopPropagation();
                deleteChat(chat.id);
            });
            li.appendChild(deleteBtn);

            li.addEventListener('click', () => loadChat(chat.id));
            historyList.appendChild(li);
        });
    } else {
        noHistoryMsg.style.display = 'block';
    }
};

/**
 * Belirtilen sohbeti yerel depolamadan siler.
 * @param {string} chatId Silinecek sohbetin ID'si.
 */
const deleteChat = (chatId) => {
    if (!confirm("Bu sohbeti tarayıcı geçmişinizden kalıcı olarak silmek istediğinizden emin misiniz?")) return;

    const history = getChatHistory();
    delete history[chatId];
    localStorage.setItem('lolonoloAiChatHistory', JSON.stringify(history));

    if (currentChatId === chatId) {
        startNewChat();
    } else {
        renderHistorySidebar();
    }
};

/**
 * Geçmişten seçilen bir sohbeti yükler ve ekranda gösterir.
 * @param {string} chatId Yüklenecek sohbetin ID'si.
 */
const loadChat = (chatId) => {
    const history = getChatHistory();
    const chat = history[chatId];
    if (!chat) return;
    
    currentChatId = chatId;
    messages = chat.messages;
    inFallbackMode = false;
    chatWindow.innerHTML = '';
    messages.forEach(message => renderMessage(message.content, message.sender));
    renderHistorySidebar();
};

/**
 * Sohbet ekranına tek bir mesajı ekler.
 * @param {string} htmlContent Mesajın içeriği (HTML formatında olabilir).
 * @param {string} sender Mesajı gönderen ('user' veya 'assistant').
 * @returns {HTMLElement} Oluşturulan mesaj elementi.
 */
const renderMessage = (htmlContent, sender) => {
    const wrapper = document.createElement('div');
    wrapper.classList.add('message-wrapper', sender);
    
    if (sender === 'assistant') {
        const avatar = document.createElement('div');
        avatar.classList.add('avatar');
        avatar.textContent = 'LN';
        wrapper.appendChild(avatar);
    }
    
    const messageElement = document.createElement('div');
    messageElement.classList.add('message');
    messageElement.innerHTML = htmlContent;
    wrapper.appendChild(messageElement);
    
    chatWindow.appendChild(wrapper);
    chatWindow.scrollTop = chatWindow.scrollHeight;
    return messageElement;
};

/**
 * Hem ekrana hem de mesajlar dizisine yeni bir mesaj ekler.
 * @param {string} htmlContent Mesajın içeriği.
 * @param {string} sender Mesajı gönderen.
 * @returns {HTMLElement} Oluşturulan mesaj elementi.
 */
const addMessage = (htmlContent, sender) => {
    const messageElement = renderMessage(htmlContent, sender);
    messages.push({ sender, content: htmlContent });
    return messageElement;
};

/**
 * Yeni ve temiz bir sohbet başlatır.
 */
const startNewChat = () => {
    currentChatId = `chat_${Date.now()}`;
    messages = [];
    chatWindow.innerHTML = '';
    inFallbackMode = false;
    promptInput.placeholder = 'Bir mesaj yaz...';
    addMessage('Merhaba! Ben Lolonolo AI. Size nasıl yardımcı olabilirim?', 'assistant');
    renderHistorySidebar();
};

/**
 * Mevcut sohbeti, onay alarak sunucuya arşivlenmek üzere gönderir.
 */
const archiveCurrentChat = async () => {
    if (!confirm("Bu sohbet, hizmet kalitesini artırmak amacıyla, kişisel bilgilerinizden arındırılarak kalıcı olarak saklanacaktır. Onaylıyor musunuz?")) return;

    if (!currentChatId || messages.length < 2) {
        alert("Arşivlenecek bir sohbet bulunamadı. Lütfen en az bir mesaj gönderin.");
        return;
    }

    const history = getChatHistory();
    const title = history[currentChatId]?.title || 'Arşivlenmiş Sohbet';
    const chatToArchive = { id: currentChatId, title, timestamp: Date.now(), messages };

    const originalButtonHTML = archiveChatBtn.innerHTML;
    archiveChatBtn.textContent = 'Kaydediliyor...';
    archiveChatBtn.disabled = true;

    try {
        const response = await fetch('/api/archive', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(chatToArchive),
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Arşivleme başarısız oldu.');
        archiveChatBtn.textContent = 'Başarıyla Arşivlendi!';
    } catch (error) {
        console.error("Archive error:", error);
        archiveChatBtn.textContent = 'Hata Oluştu';
        alert(`Sohbet arşivlenirken bir hata oluştu: ${error.message}`);
    } finally {
        setTimeout(() => {
            archiveChatBtn.innerHTML = originalButtonHTML;
            archiveChatBtn.disabled = false;
        }, 2000);
    }
};

/**
 * Kullanıcının girdiği mesajı işleyen ana fonksiyon.
 */
const sendMessage = async () => {
    const prompt = promptInput.value.trim();
    if (!prompt) return;

    addMessage(prompt, 'user');
    saveChatHistory();
    const normalizedPrompt = prompt.toLowerCase().trim();
    promptInput.value = '';
    promptInput.style.height = 'auto';

    // 1. Öncelik: Dinamik Ders Adı Arama
    const triggerPhrase = "ders adı";
    if (normalizedPrompt.startsWith(triggerPhrase)) {
        let courseName = normalizedPrompt.substring(triggerPhrase.length).trim();
        if (!courseName) {
            addMessage("Harika, hangi dersi aradığını yazarsan sana özel bir arama linki oluşturabilirim. <br>Örnek: <strong>ders adı anatomi</strong>", 'assistant');
        } else {
            const searchUrl = `https://lolonolo.com/?s=${encodeURIComponent(courseName)}`;
            const displayCourseName = courseName.charAt(0).toUpperCase() + courseName.slice(1);
            const responseMessage = `Elbette! Aradığın <strong>${displayCourseName}</strong> dersi için tüm içerikleri bu linkte bulabilirsin: <a href="${searchUrl}" target="_blank">${displayCourseName} Arama Sonucunu Gör</a>`;
            addMessage(responseMessage, 'assistant');
        }
        saveChatHistory();
        return;
    }

    // 2. Öncelik: Statik Hazır Cevaplar
    if (cannedResponses[normalizedPrompt]) {
        setTimeout(() => {
            const response = cannedResponses[normalizedPrompt];
            addMessage(response, 'assistant');
            saveChatHistory();
        }, 500);
        return;
    }

    askButton.disabled = true;

    // 3. Öncelik: Fallback Modu (Site İçi Arama)
    if (inFallbackMode) {
        const searchUrl = `https://lolonolo.com/?s=${encodeURIComponent(prompt)}`;
        const searchMessage = `Aradığınız konu için Lolonolo'daki sonuçları burada bulabilirsiniz: <a href="${searchUrl}" target="_blank">${prompt}</a>`;
        addMessage(searchMessage, 'assistant');
        saveChatHistory();
        askButton.disabled = false;
        promptInput.focus();
        return;
    }

    // 4. Öncelik: API'ye (Yapay Zeka Sunucusuna) Sor
    const responseElement = addMessage('...', 'assistant');
    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: prompt }),
        });
        if (!response.ok) throw new Error('Network response was not ok.');
        const data = await response.json();
        if (data.status === 'fallback_initiated') {
            inFallbackMode = true;
            promptInput.placeholder = 'Aramak istediğiniz konuyu yazın...';
        }
        responseElement.innerHTML = data.reply;
        messages[messages.length - 1].content = data.reply;
    } catch (error) {
        inFallbackMode = true;
        promptInput.placeholder = 'Aramak istediğiniz konuyu yazın...';
        const errorMessage = `Şu an yapay zeka meşgul veya bir sorunla karşılaştı.<br><br>Ancak aradığınız konuyla ilgili Lolonolo'da bir arama yapabilirsiniz. Lütfen aramak istediğiniz konuyu yazın.<br>Örnek: <strong>Anatomi 2025 vize soruları</strong>`;
        responseElement.innerHTML = errorMessage;
        messages[messages.length - 1].content = errorMessage;
    } finally {
        saveChatHistory();
        askButton.disabled = false;
        promptInput.focus();
    }
};

/**
 * Uygulamayı başlatan ana fonksiyon.
 */
const initializeApp = () => {
    renderHistorySidebar();
    const history = getChatHistory();
    const sortedHistory = Object.values(history).sort((a, b) => b.timestamp - a.timestamp);
    if (sortedHistory.length > 0) {
        loadChat(sortedHistory[0].id);
    } else {
        startNewChat();
    }
};

// Olay Dinleyicilerini (Event Listeners) Ekleme
newChatBtn.addEventListener('click', startNewChat);
archiveChatBtn.addEventListener('click', archiveCurrentChat);
askButton.addEventListener('click', sendMessage);

promptInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        sendMessage();
    }
});

promptInput.addEventListener('input', () => {
    promptInput.style.height = 'auto';
    promptInput.style.height = `${promptInput.scrollHeight}px`;
});

// Uygulamayı Başlat
initializeApp();
