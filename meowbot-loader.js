// ======================================================================
// MEOWBOT LOADER V2 (AUTO-CONTIDO)
// URL da API chumbada para eliminar erros de injeção.
// ======================================================================

(function() {
    console.log("🚀 [MeowBot V2] Iniciando carregamento...");

    // --- CONFIGURAÇÃO ---
    const API_URL = "https://chatbot-dedicado.onrender.com/api/chat"; // URL COMPLETA
    // Tenta descobrir a base do GitHub automaticamente se não estiver definida
    const GITHUB_BASE = document.body.getAttribute('data-github-base') || "https://leanttro.github.io/chatbot1_grafica/";

    // --- VARIÁVEIS DE ESTADO ---
    let conversationHistory = [];
    let currentLeadId = null;
    let leadData = {};
    let isProcessing = false;

    // --- ELEMENTOS DOM (Serão capturados após a injeção do HTML) ---
    let chatbotWindow, chatbotInput, chatbotSend, chatbotMessages, chatbotButton, minimizedIcon;

    // --- FUNÇÕES AUXILIARES ---
    function getCurrentTime() {
        return new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    }

    function addMessage(text, isUser = false) {
        if (!chatbotMessages) return;
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${isUser ? 'user' : 'bot'}`;
        let formattedText = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>');
        
        conversationHistory.push({ role: isUser ? 'user' : 'model', text: text });

        const avatarHtml = isUser
            ? '<i class="fas fa-user"></i>'
            : `<img src="${GITHUB_BASE}leanttro.png" alt="Bot" style="width: 100%; height: 100%; border-radius: 50%;">`;

        messageDiv.innerHTML = `
            <div class="message-avatar">${avatarHtml}</div>
            <div class="message-content">
                <div class="message-bubble">${formattedText}</div>
                <div class="message-time">${getCurrentTime()}</div>
            </div>
        `;
        chatbotMessages.appendChild(messageDiv);
        chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
    }

    // --- FUNÇÃO PRINCIPAL DE CHAT ---
    async function handleSendMessage() {
        if (!chatbotInput || !chatbotSend || isProcessing) return;
        const text = chatbotInput.value.trim();
        if (text === '') return;

        addMessage(text, true);
        chatbotInput.value = '';
        isProcessing = true;
        chatbotInput.disabled = true;
        chatbotSend.disabled = true;

        // Typing indicator simplificado
        const typingDiv = document.createElement('div');
        typingDiv.className = 'message bot';
        typingDiv.id = 'typing';
        typingDiv.innerHTML = `<div class="message-bubble">...</div>`;
        chatbotMessages.appendChild(typingDiv);
        chatbotMessages.scrollTop = chatbotMessages.scrollHeight;

        try {
            console.log("📡 [MeowBot] Enviando mensagem para:", API_URL);
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ conversationHistory, leadData, leadId: currentLeadId })
            });

            if (!response.ok) throw new Error(`Erro HTTP: ${response.status}`);
            const data = await response.json();
            
            leadData = data.leadData || leadData;
            currentLeadId = data.leadId || currentLeadId;
            
            document.getElementById('typing')?.remove();
            addMessage(data.botResponse, false);

        } catch (error) {
            console.error("🔴 [MeowBot] Erro:", error);
            document.getElementById('typing')?.remove();
            addMessage("Miau! Tive um problema de conexão. Tente novamente.", false);
        } finally {
            isProcessing = false;
            chatbotInput.disabled = false;
            chatbotSend.disabled = false;
            chatbotInput.focus();
        }
    }

    // --- FUNÇÃO DE INICIALIZAÇÃO (Chamada após o HTML existir) ---
    function initBot() {
        console.log("⚙️ [MeowBot] Inicializando elementos...");
        chatbotWindow = document.getElementById('chatbotWindow');
        chatbotInput = document.getElementById('chatbotInput');
        chatbotSend = document.getElementById('chatbotSend');
        chatbotMessages = document.getElementById('chatbotMessages');
        chatbotButton = document.getElementById('chatbotButton');
        minimizedIcon = document.getElementById('minimizedIcon');

        if (!chatbotWindow || !chatbotInput || !chatbotSend) {
            console.error("🔴 [MeowBot] Elementos do HTML não encontrados! O HTML foi injetado?");
            return;
        }

        // Event Listeners
        const toggle = () => chatbotWindow.classList.toggle('active');
        document.getElementById('chatbotClose')?.addEventListener('click', toggle);
        chatbotButton?.addEventListener('click', toggle);
        minimizedIcon?.addEventListener('click', toggle);
        document.getElementById('previewClose')?.addEventListener('click', (e) => {
            e.stopPropagation();
            chatbotButton.classList.add('minimized');
            minimizedIcon.classList.add('minimized');
        });

        chatbotSend.addEventListener('click', handleSendMessage);
        chatbotInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') handleSendMessage(); });

        // Mensagem inicial
        setTimeout(() => {
            if (chatbotMessages.children.length === 0) {
                addMessage("Miau! 🐱 Sou o **MeowBot**. Como posso ajudar?", false);
            }
        }, 500);

        console.log("✅ [MeowBot] Pronto e operante!");
    }

    // Tenta inicializar a cada 100ms até encontrar o HTML
    const checkHTML = setInterval(() => {
        if (document.getElementById('chatbotWindow')) {
            clearInterval(checkHTML);
            initBot();
        }
    }, 100);

})();