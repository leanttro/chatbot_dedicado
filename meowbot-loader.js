// 🚨 ATENÇÃO: A URL do seu novo Backend já está configurada abaixo. 🚨
const MEOWBOT_API_URL_BASE = "https://chatbot-dedicado.onrender.com"; 
const SEU_GITHUB_PAGES_BASE = "https://leanttro.github.io/chatbot1_grafica/"; 

(function() {
    console.log("[Leanttro] Iniciando injeção do MeowBot...");
    
    // Armazena a base do GitHub no corpo para o JS saber onde pegar a imagem
    document.body.setAttribute('data-github-base', SEU_GITHUB_PAGES_BASE);
    
    // --- 1. VESTINDO O ROBÔ (CSS) ---
    const cssLink = document.createElement('link');
    cssLink.rel = 'stylesheet';
    cssLink.href = SEU_GITHUB_PAGES_BASE + 'chatbot.css'; 
    document.head.appendChild(cssLink);
    
    // --- 2. MONTANDO O CORPO DO ROBÔ (HTML) ---
    const chatbotHtml = `
        <div class="floating-chatbot">
            <div id="chatbotButtonContainer">
                <div class="chatbot-minimized-icon" id="minimizedIcon" aria-label="Abrir Chatbot">
                     <img src="${SEU_GITHUB_PAGES_BASE}leanttro.png" alt="Bot" style="width: 100%; height: 100%; border-radius: 50%;">
                </div>
                <div class="chatbot-preview-button" id="chatbotButton" aria-label="Abrir MeowBot">
                    <button class="preview-close" id="previewClose" aria-label="Minimizar Preview"><i class="fas fa-times"></i></button>
                    <div class="preview-header">
                        <div class="preview-avatar">
                            <img src="${SEU_GITHUB_PAGES_BASE}leanttro.png" alt="Bot" style="width: 100%; height: 100%; border-radius: 50%;">
                        </div>
                        <div class="preview-info">
                            <strong>Meow<span>Bot</span></strong>
                            <span>Assistente Virtual</span>
                        </div>
                    </div>
                    <div class="preview-message-bubble">
                        <span id="preview-message-text">Miau! 🐱 Posso ajudar com seu pedido?</span>
                    </div>
                </div>
            </div>
            <div class="chatbot-window" id="chatbotWindow">
                <div class="chatbot-header" style="background: linear-gradient(135deg, #4A00E0, #8E2DE2);">
                    <div class="chatbot-header-avatar">
                        <img src="${SEU_GITHUB_PAGES_BASE}leanttro.png" alt="Bot" style="width: 100%; height: 100%; border-radius: 50%;">
                    </div>
                    <div class="chatbot-header-info">
                        <h3>Meow<span>Bot</span></h3>
                        <p>Assistente de IA</p>
                    </div>
                    <button class="chatbot-close" id="chatbotClose" aria-label="Fechar chat"><i class="fas fa-times"></i></button>
                </div>
                <div class="chatbot-messages" id="chatbotMessages"></div>
                <div class="chatbot-input-area">
                    <input type="text" class="chatbot-input" id="chatbotInput" placeholder="Digite sua mensagem..." autocomplete="off">
                    <button class="chatbot-send" id="chatbotSend" aria-label="Enviar mensagem">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 256 256"><path d="M232,128a8,8,0,0,1-8.53,8l-176,48A8,8,0,0,1,32,176V136H160a8,8,0,0,0,0-16H32V80a8,8,0,0,1,15.47-4l176,48A8,8,0,0,1,232,128Z"></path></svg>
                    </button>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', chatbotHtml);
    
    // --- 3. DANDO ACESSÓRIOS AO ROBÔ (ÍCONES) ---
    const faLink = document.createElement('link');
    faLink.rel = 'stylesheet';
    faLink.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css';
    document.head.appendChild(faLink);
    
    // --- 4. LIGANDO O CÉREBRO DO ROBÔ (JAVASCRIPT) ---
    const jsScript = document.createElement('script');
    jsScript.src = SEU_GITHUB_PAGES_BASE + 'meowbot-loader.js'; 
    document.body.appendChild(jsScript);

    // CRÍTICO: Passa a URL correta diretamente para o ambiente global ANTES que o meowbot-loader.js se inicialize
    // O meowbot-loader.js deve ser editado para USAR window.MEOWBOT_API_URL + '/api/chat'
    window.MEOWBOT_API_URL = MEOWBOT_API_URL_BASE; 
    
    // CRÍTICO: Tenta re-inicializar com a URL correta se a injeção for tardia
    const checkInit = setInterval(() => {
        if (window.MEOWBOT_API_URL && window.MEOWBOT_API_URL !== "https://meowbot-api.onrender.com" && window.handleSendMessage) {
            clearInterval(checkInit);
            console.log("✅ [MeowBot] Inicialização de URL concluída.");
        }
    }, 100);

})();