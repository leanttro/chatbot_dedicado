// MEOWBOT LOADER - Lógica de Chat Nível 1 (Q&A Simples e Captura de Lead)

// Este arquivo usa window.MEOWBOT_API_URL, injetada pelo comando F12.

// ======================================================================



// Variáveis de Configuração

// Puxa a URL injetada pelo comando F12 (que é a base do seu Render + /api/chat)

const API_ENDPOINT = window.MEOWBOT_API_URL || "https://chatbot-dedicado.onrender.com/api/chat";



// Variáveis de Estado

let conversationHistory = [];

let currentLeadId = null;

let leadData = {};

let isProcessing = false;



// IDs dos elementos (Assumindo que o HTML já foi injetado pelo snippet F12)

const chatbotWindow = document.getElementById('chatbotWindow');

const chatbotClose = document.getElementById('chatbotClose');

const chatbotInput = document.getElementById('chatbotInput');

const chatbotSend = document.getElementById('chatbotSend');

const chatbotMessages = document.getElementById('chatbotMessages');

const chatbotButton = document.getElementById('chatbotButton');

const minimizedIcon = document.getElementById('minimizedIcon');

const previewClose = document.getElementById('previewClose');

const previewMessageEl = document.getElementById('preview-message-text');





// --- FUNÇÕES AUXILIARES DE UI E FLUXO ---



function getCurrentTime() {

    const now = new Date();

    return now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

}



function addMessage(text, isUser = false) {

    const messageDiv = document.createElement('div');

    messageDiv.className = `message ${isUser ? 'user' : 'bot'}`;

    let formattedText = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    formattedText = formattedText.replace(/\n/g, '<br>');

   

    // CRÍTICO: Registra no histórico para enviar ao backend

    conversationHistory.push({

        role: isUser ? 'user' : 'model',

        text: text

    });

   

    const avatarImg = document.body.getAttribute('data-github-base') + 'leanttro.png';



    const avatarHtml = isUser

        ? '<i class="fas fa-user"></i>'

        : `<img src="${avatarImg}" alt="Bot Avatar" style="width: 100%; height: 100%; border-radius: 50%;">`;

   

    messageDiv.innerHTML = `

        <div class="message-avatar">

            ${avatarHtml}

        </div>

        <div class="message-content">

            <div class="message-bubble">${formattedText}</div>

            <div class="message-time">${getCurrentTime()}</div>

        </div>

    `;

    if (chatbotMessages) {

        chatbotMessages.appendChild(messageDiv);

        chatbotMessages.scrollTop = chatbotMessages.scrollHeight;

    }

}



function showTypingIndicator() {

    const typingDiv = document.createElement('div');

    typingDiv.className = 'message bot typing-message';

    typingDiv.id = 'typing-indicator';

    const avatarImg = document.body.getAttribute('data-github-base') + 'leanttro.png';



    typingDiv.innerHTML = `

        <div class="message-avatar">

             <img src="${avatarImg}" alt="Bot Avatar" style="width: 100%; height: 100%; border-radius: 50%;">

        </div>

        <div class="message-content">

            <div class="message-bubble">

                <div class="typing-indicator"><span></span><span></span><span></span></div>

            </div>

        </div>

    `;

    if (chatbotMessages) {

        chatbotMessages.appendChild(typingDiv);

        chatbotMessages.scrollTop = chatbotMessages.scrollHeight;

    }

}



function removeTypingIndicator() {

    const typingDiv = document.getElementById('typing-indicator');

    if (typingDiv && typingDiv.parentNode) {

        typingDiv.parentNode.removeChild(typingDiv);

    }

}



function startMeowChat() {

    conversationHistory = [];

    leadData = {};

    currentLeadId = null;

    addMessage("Miau! 🐱 Sou o **MeowBot**, seu assistente de pedidos. Como posso ajudar com os Manhwas ou com seu rastreio?", false);

}



function toggleChat() {

    if (!chatbotWindow) return;

    const isActive = chatbotWindow.classList.contains('active');

   

    if (isActive) {

        // Fechar chat

        chatbotWindow.classList.remove('active');

        if (chatbotButton) chatbotButton.classList.remove('active');

        if (minimizedIcon) minimizedIcon.classList.remove('active');

    } else {

        // Abrir chat

        chatbotWindow.classList.add('active');

        if (chatbotButton) chatbotButton.classList.add('active');

        if (minimizedIcon) minimizedIcon.classList.add('active');

       

        setTimeout(() => {

            if (chatbotMessages && chatbotMessages.children.length === 0) {

                startMeowChat();

            }

            if (chatbotInput) chatbotInput.focus();

        }, 300);

    }

}



// --- FUNÇÃO PRINCIPAL DE COMUNICAÇÃO COM A API ---

async function handleSendMessage() {

    if (!chatbotInput || !chatbotSend || isProcessing) return;



    const messageText = chatbotInput.value.trim();

    if (messageText === '') return;



    addMessage(messageText, true);

    chatbotInput.value = '';

   

    isProcessing = true;

    chatbotInput.disabled = true;

    chatbotSend.disabled = true;

    showTypingIndicator();



    try {

        const response = await fetch(API_ENDPOINT, {

            method: 'POST',

            headers: { 'Content-Type': 'application/json' },

            body: JSON.stringify({

                conversationHistory: conversationHistory,

                leadData: leadData,

                leadId: currentLeadId

            })

        });



        if (!response.ok) throw new Error('Falha na resposta da IA. (Verifique o log do Render)');

       

        const data = await response.json();

        const botReply = data.botResponse;

       

        // Atualiza o estado do lead e o ID retornado pelo banco de dados

        leadData = data.leadData || leadData;

        currentLeadId = data.leadId || currentLeadId;



        addMessage(botReply, false);



    } catch (error) {

        console.error('🔴 ERRO DE COMUNICAÇÃO DO MEOWBOT:', error);

        addMessage("Miau! Desculpe, estou com problemas para me conectar ao meu cérebro de IA no momento. Tente novamente mais tarde.", false);

    } finally {

        isProcessing = false;

        removeTypingIndicator();

        chatbotInput.disabled = false;

        chatbotSend.disabled = false;

        chatbotInput.focus();

    }

}





// =================================================================================

// --- ADICIONANDO LISTENERS AO DOM ---

// =================================================================================

setTimeout(() => {

    // Permite rodar no site do cliente ou no seu GitHub Pages

    if (window.location.host === 'meowcakeshop.com' || window.location.host.includes('leanttro.github.io')) {

        if (chatbotButton) chatbotButton.addEventListener('click', toggleChat);

        if (chatbotClose) chatbotClose.addEventListener('click', toggleChat);

        if (minimizedIcon) minimizedIcon.addEventListener('click', toggleChat);

        if (previewClose) previewClose.addEventListener('click', function(e) {

            e.stopPropagation();

            if (chatbotButton) chatbotButton.classList.add('minimized');

            if (minimizedIcon) minimizedIcon.classList.add('minimized');

        });

   

        if (chatbotSend) chatbotSend.addEventListener('click', handleSendMessage);

        if (chatbotInput) chatbotInput.addEventListener('keypress', (e) => {

            if (e.key === 'Enter') {

                e.preventDefault();

                handleSendMessage();

            }

        });

       

        // Expõe a função ao global para que o snippet F12 possa verificar se o JS carregou

        window.handleSendMessage = handleSendMessage;

    }

}, 500);