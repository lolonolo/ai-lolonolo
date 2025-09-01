const chatWindow = document.getElementById('chat-window');
const promptInput = document.getElementById('prompt-input');
const askButton = document.getElementById('ask-button');
const newChatBtn = document.getElementById('new-chat-btn');
const historyList = document.getElementById('history-list');
const noHistoryMsg = document.getElementById('no-history-msg');
const archiveChatBtn = document.getElementById('archive-chat-btn');

let currentChatId = null;
let messages = [];
let inFallbackMode = false;

const cannedResponses = {
    'merhaba': 'Merhaba! Ben Lolonolo AI. Size nasıl yardımcı olabilirim?', 'selam': 'Selam! Ben Lolonolo AI. Size nasıl yardımcı olabilirim?', 'selamun aleyküm': 'Aleykümselam! Lolonolo AI olarak buradayım, hangi konuda bilgi istersiniz?', 'sa': 'Aleykümselam! Nasıl yardımcı olabilirim?', 'nasılsın': 'Teşekkür ederim! Ben bir yapay zeka olduğum için her zaman öğrenmeye ve yardıma hazırım. Sizin için ne yapabilirim?', 'nasılsın?': 'Teşekkür ederim! Ben bir yapay zeka olduğum için her zaman öğrenmeye ve yardıma hazırım. Sizin için ne yapabilirim?', 'iyi misin': 'Harikayım ve yardıma hazırım! Hangi konuda bilgi almak istersiniz?', 'iyi misin?': 'Harikayım ve yardıma hazırım! Hangi konuda bilgi almak istersiniz?', 'sen kimsin': 'Ben Lolonolo\'nun resmi yapay zeka asistanıyım. Amacım derslerinizde ve projelerinizde size yardımcı olmak.', 'sen kimsin?': 'Ben Lolonolo\'nun resmi yapay zeka asistanıyım. Amacım derslerinizde ve projelerinizde size yardımcı olmak.', 'ne işe yararsın': 'Öğrencilere dersleri ve sınavları hakkında yardımcı olmak için buradayım. Konu özetleri, soru-cevap ve kaynak önerileri sunabilirim.', 'ne işe yararsın?': 'Öğrencilere dersleri ve sınavları hakkında yardımcı olmak için buradayım. Konu özetleri, soru-cevap ve kaynak önerileri sunabilirim.', 'teşekkürler': 'Rica ederim! Yardımcı olabileceğim başka bir konu var mı?', 'teşekkür ederim': 'Rica ederim! Başka bir sorunuz olursa çekinmeyin.', 'sağ ol': 'Ne demek! Her zaman yardımcı olmaya hazırım.', 'eyvallah': 'Rica ederim, başka bir isteğiniz var mıydı?', 'görüşürüz': 'Görüşmek üzere, iyi çalışmalar dilerim!', 'bay bay': 'Hoşça kalın, iyi günler!', 'kaç yaşındasın': 'Ben bir yapay zeka olduğum için yaşım yok, ama sürekli olarak güncellenen bilgilere sahibim.', 'kaç yaşındasın?': 'Ben bir yapay zeka olduğum için yaşım yok, ama sürekli olarak güncellenen bilgilere sahibim.'
};

const deleteChat = (chatId) => {
    const consent = confirm("Bu sohbeti tarayıcı geçmişinizden kalıcı olarak silmek istediğinizden emin misiniz?");
    if (!consent) return;

    const history = getChatHistory();
    delete history[chatId];
    localStorage.setItem('lolonoloAiChatHistory', JSON.stringify(history));

    if (currentChatId === chatId) {
        startNewChat();
    } else {
        renderHistorySidebar();
    }
};

const archiveCurrentChat = async () => {
    const consent = confirm("Bu sohbet, hizmet kalitesini artırmak amacıyla, kişisel bilgilerinizden arındırılarak kalıcı olarak saklanacaktır. Onaylıyor musunuz?");
    if (!consent) return;

    if (!currentChatId || messages.length === 0) {
        alert("Arşivlenecek bir sohbet bulunamadı. Lütfen en az bir mesaj gönderin.");
        return;
    }

    const history = getChatHistory();
    const title = history[currentChatId]?.title || (messages.find(m => m.sender === 'user')?.content.substring(0, 30) + '...' || 'Yeni Sohbet');

    const chatToArchive = {
        id: currentChatId,
        title: title,
        timestamp: Date.now(),
        messages: messages
    };

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

        if (!response.ok) {
            throw new Error(result.error || 'Arşivleme başarısız oldu.');
        }
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

const getChatHistory = () => {
    const history = localStorage.getItem('lolonoloAiChatHistory');
    return history ? JSON.parse(history) : {};
};

const saveChatHistory = () => {
    if (!currentChatId || messages.length === 0) return;
    const history = getChatHistory();
    const userMessage = messages.find(m => m.sender === 'user');
    const title = history[currentChatId]?.title || (userMessage ? userMessage.content.substring(0, 30) + '...' : 'Yeni Sohbet');
    history[currentChatId] = { id: currentChatId, title: title, timestamp: Date.now(), messages: messages };
    localStorage.setItem('lolonoloAiChatHistory', JSON.stringify(history));
    renderHistorySidebar();
};

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

            li.addEventListener('click', () => loadChat(chat.id));

            li.appendChild(deleteBtn);
            historyList.appendChild(li);
        });
    } else {
        noHistoryMsg.style.display = 'block';
    }
};

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

const addMessage = (htmlContent, sender) => {
    const messageElement = renderMessage(htmlContent, sender);
    messages.push({ sender, content: htmlContent });
    return messageElement;
};

const sendMessage = async () => {
    const prompt = promptInput.value.trim();
    if (!prompt) return;
    addMessage(prompt, 'user');
    saveChatHistory();
    const normalizedPrompt = prompt.toLowerCase().trim();
    promptInput.value = '';
    promptInput.style.height = 'auto';
    if (cannedResponses[normalizedPrompt]) {
        setTimeout(() => {
            const response = cannedResponses[normalizedPrompt];
            addMessage(response, 'assistant');
            saveChatHistory();
        }, 500);
        return;
    }
    askButton.disabled = true;
    if (inFallbackMode) {
        const searchQuery = encodeURIComponent(prompt);
        const searchUrl = `https://lolonolo.com/?s=${searchQuery}`;
        const searchMessage = `Aradığınız konu için Lolonolo'daki sonuçları burada bulabilirsiniz: <a href="${searchUrl}" target="_blank">${prompt}</a>`;
        addMessage(searchMessage, 'assistant');
        saveChatHistory();
        askButton.disabled = false;
        promptInput.focus();
        promptInput.placeholder = 'Aramak istediğiniz konuyu yazın...';
        return;
    }
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

const startNewChat = () => {
    currentChatId = `chat_${Date.now()}`;
    messages = [];
    chatWindow.innerHTML = '';
    inFallbackMode = false;
    promptInput.placeholder = 'Bir mesaj yaz...';
    addMessage('Merhaba! Ben Lolonolo AI. Size nasıl yardımcı olabilirim?', 'assistant');
    renderHistorySidebar();
};

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

initializeApp();
