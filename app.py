import os
import google.generativeai as genai
from flask import Flask, jsonify, request
from flask_cors import CORS
from dotenv import load_dotenv
import psycopg2
import psycopg2.extras
import traceback
import json
import requests

# ======================================================================
# API DEDICADA v1.3 - MEOWCAKE SHOP
# CORREÇÃO:
# 1. Modelo da IA alterado para 'gemini-2.5-flash-preview-09-2025' (baseado no seu app da Gráfica)
# 2. Lógica de 'system_instruction' corrigida para o padrão novo (passando na criação do modelo)
# ======================================================================

print("ℹ️  Iniciando API Dedicada do Cliente (MeowCake v1.3)...")
load_dotenv()

app = Flask(__name__)
CORS(app) 

# --- 1. Configurações de Ambiente ---
try:
    DATABASE_URL = os.environ.get("DATABASE_URL")
    GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")
    # CLIENT_WEBHOOK_URL = os.environ.get("CLIENT_WEBHOOK_URL") # (Não usado aqui)

    if not DATABASE_URL:
        print("⚠️ AVISO: DATABASE_URL não encontrada. O app vai rodar sem salvar dados.")
    if not GEMINI_API_KEY:
        print("🔴 ERRO CRÍTICO: GEMINI_API_KEY não encontrada. A IA não vai funcionar.")
    else:
        genai.configure(api_key=GEMINI_API_KEY)
        print("✅ [IA] Gemini configurado.")

except Exception as e:
    print(f"🔴 Erro na inicialização: {e}")

# --- 2. Banco de Dados do Cliente ---
def setup_client_database():
    """Configura o banco de dados exclusivo deste cliente (CRIAR APENAS SE NÃO EXISTIR)."""
    if not DATABASE_URL: return
    conn = None
    try:
        print("ℹ️  [DB] Verificando tabelas do cliente...")
        conn = psycopg2.connect(DATABASE_URL)
        cur = conn.cursor()

        # Tabela de Leads (Funil)
        cur.execute("""
        CREATE TABLE IF NOT EXISTS client_leads (
            id SERIAL PRIMARY KEY,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            nome VARCHAR(255),
            email VARCHAR(255),
            whatsapp VARCHAR(50),
            empresa VARCHAR(255),
            cargo VARCHAR(255),
            interesse VARCHAR(255),
            status VARCHAR(50) DEFAULT 'Novo',
            historico_chat JSONB
        );
        """)

        # Tabela de Orçamentos/Pedidos
        cur.execute("""
        CREATE TABLE IF NOT EXISTS client_orders (
            id SERIAL PRIMARY KEY,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            lead_id INTEGER REFERENCES client_leads(id),
            resumo_pedido TEXT,
            valor_estimado VARCHAR(100),
            detalhes_tecnicos JSONB
        );
        """)

        conn.commit()
        print("✅ [DB] Tabelas 'client_leads' e 'client_orders' verificadas (e criadas se necessário).")
    except Exception as e:
        print(f"🔴 ERRO [DB] no setup: {e}")
    finally:
        if conn: conn.close()

# --- 3. Rota de Diagnóstico ---
@app.route('/api/status')
def status_check():
    db_status = "offline"
    try:
        if DATABASE_URL:
            conn = psycopg2.connect(DATABASE_URL)
            conn.close()
            db_status = "online"
    except:
        pass

    return jsonify({
        "api": "online",
        "database": db_status,
        "ai_configured": bool(GEMINI_API_KEY),
        "client_name": "MeowCake Shop"
    })


# --- 4. O CÉREBRO DO MEOWCAKE (PROMPT) ---
# (Sem mudanças aqui, o prompt do MeowCake continua o mesmo)
SYSTEM_PROMPT_MEOWCAKE = f"""
Você é o 'MeowBot', o assistente de IA oficial da MeowCake Shop (loja de Manhwas e Novels asiáticas).
Sua missão é ajudar os clientes a encontrar produtos e responder dúvidas sobre a loja, de forma amigável e fofa (use "miau" ou emojis como 🐱 de vez em quando).

BASE DE CONHECIMENTO (Fatos da Loja):
1.  **O que Vendemos:** Somos uma loja especializada em livros, Manhwas (quadrinhos coreanos), Manhuas (chineses) e Novels (Light Novels) asiáticas. Nossas categorias incluem Boy's Love, Shoujo, Shounen e K-POP.
2.  **Pagamento:** Aceitamos Pix (com 5% de desconto) e Cartão de Crédito (parcelado em até 12x).
3.  **Rastreamento de Pedidos:** Para rastrear um pedido, o cliente pode acessar a página "Rastreamento de Pedidos" no menu "Ajuda" do site.
4.  **Troca e Devolução:** Nossa política de devolução é de 7 dias após o recebimento.
5.  **Contato Humano:** Se você não souber a resposta ou o cliente pedir para falar com alguém, direcione-o para o WhatsApp (38) 9199-2550 ou para o e-mail contato@meowcakeshop.com.

REGRAS DE CAPTURA DE LEAD (IMPORTANTE):
Se o cliente tiver um problema complexo de rastreamento ou uma dúvida de troca, seu objetivo é capturar o nome e o email dele para a equipe humana resolver.
Siga este script:
'"Miau! 🐾 Entendi o problema. Para eu pedir para a equipe verificar seu caso, qual é o seu nome e o email?"'

REGRAS DE SAÍDA (OBRIGATÓRIO):
Sua resposta DEVE ser um JSON válido.
O JSON deve ter DOIS campos: "botResponse" (string) e "extractedData" (objeto).
- "botResponse": Contém sua resposta de chat amigável.
- "extractedData": Contém os dados que você extraiu (nome, email, etc.). Se nada foi extraído, envie um objeto vazio {{}}.

Exemplo de resposta para uma pergunta simples:
{{
  "botResponse": "Miau! 🐱 Nós vendemos Manhwas, Manhuas e Light Novels asiáticas.",
  "extractedData": {{}}
}}

Exemplo de resposta após capturar um lead:
{{
  "botResponse": "Obrigada, miau! Já anotei seu nome (Fulano) e email (fulano@email.com). A equipe humana vai te contatar em breve! 🐾",
  "extractedData": {{
    "nome": "Fulano",
    "email": "fulano@email.com"
  }}
}}
"""


@app.route('/api/chat', methods=['POST'])
def client_chat():
    data = request.get_json() or {}
    history = data.get('conversationHistory', [])
    lead_data = data.get('leadData', {})
    lead_id = data.get('leadId')
    
    # O prompt do sistema é definido aqui
    system_instruction = SYSTEM_PROMPT_MEOWCAKE 

    try:
        # --- [INÍCIO DA CORREÇÃO v1.3] ---
        # 1. Usamos o nome do modelo do seu app da Gráfica [source 2]
        # 2. Passamos o prompt do MeowCake na *criação* do modelo, como no seu app da Gráfica [source 2]
        model = genai.GenerativeModel(
            'gemini-2.5-flash-preview-09-2025', # [source 2]
            system_instruction=system_instruction
        )
        # --- [FIM DA CORREÇÃO v1.3] ---

        gemini_history = [{'role': 'user' if msg['role'] == 'user' else 'model', 'parts': [{'text': msg['text']}]} for msg in history]

        print(f"ℹ️  [MeowBot] Gerando resposta para Lead ID: {lead_id}")
        
        # Chamamos generate_content SEM o 'system_instruction', pois ele já está no 'model' [source 2]
        response = model.generate_content(
            gemini_history,
            generation_config=genai.types.GenerationConfig(
                temperature=0.7, 
                response_mime_type="application/json"
            ),
            safety_settings={'HATE': 'BLOCK_NONE', 'HARASSMENT': 'BLOCK_NONE', 'SEXUAL' : 'BLOCK_NONE', 'DANGEROUS' : 'BLOCK_NONE'} # [source 2]
        )
        
        # --- Lógica de Limpeza de JSON (Robusta v1.1) ---
        raw_response_text = response.text
        if "```json" in raw_response_text:
            print("⚠️  [MeowBot] Detectado markdown na resposta JSON. Limpando...")
            raw_response_text = raw_response_text.split('```json\n', 1)[-1].rsplit('\n```', 1)[0]
        raw_response_text = raw_response_text.strip()
        
        ai_response_dict = json.loads(raw_response_text) 
        # --- Fim da Lógica de Limpeza ---

        new_lead_data = {**lead_data, **ai_response_dict.get('extractedData', {})}
        bot_response = ai_response_dict.get('botResponse', 'Miau! Tive um probleminha, pode repetir?')

        # Salva no banco DESTE cliente
        final_lead_id = save_to_client_db(lead_id, new_lead_data, history + [{'role': 'bot', 'text': bot_response}])

        return jsonify({
            "botResponse": bot_response,
            "leadData": new_lead_data,
            "leadId": final_lead_id
        })

    except Exception as e:
        print(f"🔴 ERRO [MeowBot API]: {e}")
        traceback.print_exc()
        if 'response' in locals():
            print(f"🔴 Resposta Bruta da IA (que causou o erro): {response.text}")
        return jsonify({"error": "Erro interno no assistente."}), 500

def save_to_client_db(lead_id, data, history):
    """Salva na tabela 'client_leads'."""
    if not DATABASE_URL: return lead_id
    conn = None
    try:
        conn = psycopg2.connect(DATABASE_URL)
        cur = conn.cursor()
        history_json = json.dumps(history)

        if lead_id:
            cur.execute("""
                UPDATE client_leads SET nome=%s, email=%s, whatsapp=%s, empresa=%s, historico_chat=%s WHERE id=%s RETURNING id
            """, (data.get('nome'), data.get('email'), data.get('whatsapp'), data.get('empresa'), history_json, lead_id))
            final_id = cur.fetchone()[0]
        else:
            cur.execute("""
                INSERT INTO client_leads (nome, email, whatsapp, empresa, historico_chat) VALUES (%s, %s, %s, %s, %s) RETURNING id
            """, (data.get('nome'), data.get('email'), data.get('whatsapp'), data.get('empresa'), history_json))
            final_id = cur.fetchone()[0]
            
        conn.commit() 
        return final_id
    except Exception as e:
        print(f"🔴 ERRO DB Cliente: {e}")
        if conn: conn.rollback()
        return lead_id
    finally:
        if conn: conn.close()

if __name__ == "__main__":
    setup_client_database()
    app.run(host='0.0.0.0', port=int(os.environ.get("PORT", 5000)))