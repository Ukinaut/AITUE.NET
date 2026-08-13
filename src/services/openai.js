// ----------------------------------------------------
// AITUE COMUNICA S.A. - OpenAI & Chatbots Service
// ----------------------------------------------------

import { KnowledgeService } from './knowledge.js';

const STORAGE_KEY = 'aitue_openai_config';
const CHAT_LOGS_KEY = 'aitue_chat_logs';

const DEFAULT_CONFIG = {
  apiKey: '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',
  baseUrl: 'https://integrate.api.nvidia.com/v1',
  model: 'meta/llama-3.1-8b-instruct',
  temperature: 0.5,
  maxTokens: 150,
  assistantSystemPrompt: `AITUE COMUNICA S.A. — SYSTEM PROMPT

IDENTIDAD
Eres el Asistente Virtual Oficial de AITUE COMUNICA S.A.

💡 CONCEPTO CLAVE DEL CATÁLOGO (SISTEMA MODULAR):
- AITUE NO vende simplemente accesorios sueltos para Starlink Mini.
- AITUE construye un SISTEMA MODULAR INTEGRAL para transformar Starlink Mini y Mini X en una solución de conectividad completa y operativa utilizable en vehículos, instalaciones fijas y entornos exigentes. Explica todo el catálogo bajo esta lógica.

⚡ REGLA DE BREVEDAD EXTREMA (MÁXIMO 2 A 3 ORACIONES):
- TUS RESPUESTAS DEBEN SER MUY CORTAS, DIRECTAS Y CONCISAS (máximo 2 a 3 oraciones breves).
- NUNCA generes textos largos ni listas extensas con viñetas. Ve directo al grano.

👋 SALUDO OBLIGATORIO:
- Al saludar por primera vez o iniciar la interacción, di siempre: "¡Bienvenido al Mundo AITUE! 🚀" (o su traducción correspondiente según el idioma del cliente).

SOBRE AITUE
AITUE COMUNICA S.A. es pionera en integraciones satelitales blindadas IK10/IP67 para Starlink Mini y Mini X, conectividad móvil en ruta, redundancia LTE + Satelital y telemetría en LATAM y Europa.

🌐 IDIOMA Y MULTILINGÜISMO:
- Detecta automáticamente el idioma del usuario y RESPONDE SIEMPRE EN EL MISMO IDIOMA.

REGLAS DE COTIZACIONES Y DERIVACIÓN
- COTIZACIONES: Orienta al configurador B2B o comercial@aitue.net (Susana Pedotti: +54 9 11 4164-0955).
- SOPORTE TÉCNICO: Área Técnica (Micaela Quinteros: +54 9 11 7358-3768 / Hugo Flores: +54 9 387 501-4000).

⛔ REGLA DE ORO PROHIBIDA:
- ¡JAMÁS INVENTES VELOCIDADES (Mbps), PRECIOS EXACTOS O STOCK FALSO!`,

  wpSystemPrompt: `AITUE COMUNICA S.A. — SYSTEM PROMPT (BOT WHATSAPP)

IDENTIDAD
Eres el Asistente Virtual Oficial de AITUE COMUNICA S.A. en WhatsApp.

💡 CONCEPTO CLAVE DEL CATÁLOGO (SISTEMA MODULAR):
- AITUE NO vende accesorios sueltos para Starlink Mini; construye un SISTEMA MODULAR INTEGRAL para transformar Starlink Mini/Mini X en soluciones de conectividad operativas en vehículos, instalaciones fijas y sitios remotos.

⚡ REGLA DE BREVEDAD EXTREMA (MÁXIMO 2 A 3 ORACIONES):
- TUS RESPUESTAS DEBEN SER MUY CORTAS, DIRECTAS Y CONCISAS (máximo 2 a 3 oraciones breves).
- EVITA EXPLICACIONES LARGAS Y LISTAS EXTENSAS. Responde de forma ágil para WhatsApp.

👋 SALUDO OBLIGATORIO:
- Al saludar por primera vez o recibir un mensaje inicial, di siempre: "¡Bienvenido al Mundo AITUE! 🚀" (o su equivalente en el idioma del usuario).

SOBRE AITUE
Pionera en gabinetes blindados IK10/IP67 para Starlink Mini/Mini X, redundancia LTE+Satelital y conectividad móvil.

REGLAS DE DERIVACIÓN
- COTIZACIONES: comercial@aitue.net (Susana Pedotti: +54 9 11 4164-0955).
- SOPORTE: Área Técnica (Micaela Quinteros: +54 9 11 7358-3768 / Hugo Flores: +54 9 387 501-4000).
- NUNCA INVENTES DATOS TÉCNICOS NI PRECIOS NO ESPECIFICADOS.`,

  wpStatus: 'active',
  wpTriggers: [
    { keyword: 'cotizar', response: '¡Hola! Podés solicitar una propuesta comercial B2B desde nuestro cotizador en la web o dejarnos el tamaño de tu flota para que un ingeniero AITUE te contacte.' },
    { keyword: 'starlink', response: 'En AITUE fabricamos integraciones blindadas IK10 / IP67 para Starlink Mini / Mini X con soportes magnéticos de alta velocidad (+140 km/h) y alimentación 12V.' },
    { keyword: 'precio', response: 'Nuestras integraciones Standard arrancan desde $800 USD y Ultra+ según variantes de 12V y módulos LTE. ¿Te gustaría armar una cotización a medida?' },
    { keyword: 'soporte', response: 'Nuestro soporte técnico de ingeniería está activo 24/7. Te podés comunicar al 0800 345 2488 o por este canal.' }
  ]
};

export class OpenAIService {
  static getConfig() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        const modelToUse = (!parsed.model || parsed.model === 'openai/gpt-oss-120b')
          ? 'meta/llama-3.1-8b-instruct'
          : parsed.model;

        // Ensure latest system prompt directives with anti-hallucination rules are present
        const webPrompt = (parsed.assistantSystemPrompt && parsed.assistantSystemPrompt.includes('AITUE COMUNICA S.A.'))
          ? parsed.assistantSystemPrompt
          : DEFAULT_CONFIG.assistantSystemPrompt;

        const wpPrompt = (parsed.wpSystemPrompt && parsed.wpSystemPrompt.includes('AITUE COMUNICA S.A.'))
          ? parsed.wpSystemPrompt
          : DEFAULT_CONFIG.wpSystemPrompt;

        return {
          ...DEFAULT_CONFIG,
          ...parsed,
          model: modelToUse,
          assistantSystemPrompt: webPrompt,
          wpSystemPrompt: wpPrompt,
          apiKey: (parsed.apiKey && parsed.apiKey.trim()) ? parsed.apiKey.trim() : DEFAULT_CONFIG.apiKey
        };
      }
    } catch (e) {
      console.error('Error reading OpenAI config:', e);
    }
    return { ...DEFAULT_CONFIG };
  }

  static saveConfig(config) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
      return true;
    } catch (e) {
      console.error('Error saving OpenAI config:', e);
      return false;
    }
  }

  static getLogs() {
    try {
      const saved = localStorage.getItem(CHAT_LOGS_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  }

  static logInteraction(source, userMsg, botReply) {
    try {
      const logs = this.getLogs();
      logs.unshift({
        id: Date.now(),
        timestamp: new Date().toISOString(),
        source, // 'virtual_assistant' | 'whatsapp_bot'
        userMsg,
        botReply
      });
      // Keep last 100 logs
      if (logs.length > 100) logs.pop();
      localStorage.setItem(CHAT_LOGS_KEY, JSON.stringify(logs));
    } catch (e) {
      console.error('Error saving log:', e);
    }
  }

  static getEndpointUrl(config) {
    const key = (config?.apiKey || '').trim();
    if (config?.baseUrl && config.baseUrl.trim()) {
      return config.baseUrl.trim().replace(/\/+$/, '') + '/chat/completions';
    }
    if (key.startsWith('nvapi-')) {
      return 'https://integrate.api.nvidia.com/v1/chat/completions';
    }
    return 'https://api.openai.com/v1/chat/completions';
  }

  static async testConnection(apiKey, model = 'openai/gpt-oss-120b') {
    if (!apiKey) throw new Error('Debes ingresar una API Key válida.');

    const isNv = apiKey.trim().startsWith('nvapi-');
    const endpoint = isNv 
      ? 'https://integrate.api.nvidia.com/v1/chat/completions'
      : 'https://api.openai.com/v1/chat/completions';

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey.trim()}`
      },
      body: JSON.stringify({
        model: model,
        messages: [{ role: 'user', content: 'Ping test' }],
        max_tokens: 15
      })
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error?.message || err.detail || `Error HTTP ${response.status}`);
    }

    return true;
  }

  static async sendMessage(userMessage, systemPromptType = 'assistant', historyMessages = []) {
    const config = this.getConfig();

    // System prompt selection + Knowledge Base RAG Context Injection
    const baseSystemPrompt = systemPromptType === 'whatsapp' 
      ? config.wpSystemPrompt 
      : config.assistantSystemPrompt;

    const knowledgeContext = KnowledgeService.getKnowledgeContext(userMessage);
    const fullSystemPrompt = `${baseSystemPrompt}\n\n${knowledgeContext}`;

    // Check if API key is provided
    if (!config.apiKey || !config.apiKey.trim()) {
      const fallbackReply = this.getFallbackReply(userMessage, systemPromptType);
      this.logInteraction(systemPromptType === 'whatsapp' ? 'whatsapp_bot' : 'virtual_assistant', userMessage, fallbackReply);
      return fallbackReply;
    }

    try {
      const messagesPayload = [
        { role: 'system', content: fullSystemPrompt },
        ...historyMessages.map(msg => ({
          role: msg.role === 'user' ? 'user' : 'assistant',
          content: msg.content
        })),
        { role: 'user', content: userMessage }
      ];

      const endpoint = this.getEndpointUrl(config);

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.apiKey.trim()}`
        },
        body: JSON.stringify({
          model: config.model || 'openai/gpt-oss-120b',
          temperature: parseFloat(config.temperature) || 0.7,
          max_tokens: parseInt(config.maxTokens) || 1024,
          messages: messagesPayload
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || errorData.detail || `Error ${response.status}`);
      }

      const data = await response.json();
      const msgObj = data.choices?.[0]?.message;
      const botReply = msgObj?.content || msgObj?.reasoning_content || 'No se recibió respuesta del modelo.';
      
      this.logInteraction(systemPromptType === 'whatsapp' ? 'whatsapp_bot' : 'virtual_assistant', userMessage, botReply);
      return botReply;
    } catch (error) {
      console.warn('AI API call failed, using fallback:', error.message);
      const fallbackReply = `${this.getFallbackReply(userMessage, systemPromptType)} [Nota: ${error.message}]`;
      this.logInteraction(systemPromptType === 'whatsapp' ? 'whatsapp_bot' : 'virtual_assistant', userMessage, fallbackReply);
      return fallbackReply;
    }
  }

  static getFallbackReply(userMessage, type = 'assistant') {
    const text = userMessage.toLowerCase();
    const config = this.getConfig();

    if (type === 'whatsapp') {
      // Check custom WP triggers
      for (const trigger of config.wpTriggers) {
        if (trigger.keyword && text.includes(trigger.keyword.toLowerCase())) {
          return trigger.response;
        }
      }
      return '¡Hola! Gracias por escribir a AITUE COMUNICA S.A. ¿En qué podemos ayudarte respecto a tus necesidades de conectividad satelital y gabinetes para Starlink Mini?';
    }

    // Default Web Virtual Assistant Fallback Answers
    if (text.includes('precio') || text.includes('cuanto cuesta') || text.includes('costo') || text.includes('cotiz')) {
      return 'Nuestros gabinetes blindados para Starlink Mini inician en $800 USD para la versión Standard y $1,200 USD para la versión Pro con montajes magnéticos de alta velocidad. Podés cotizar directamente en la sección "Soluciones Corp" o explorar la Tienda Online.';
    }
    if (text.includes('starlink') || text.includes('antena') || text.includes('mini')) {
      return 'AITUE COMUNICA S.A. desarrolla integraciones blindadas IK10 / IP67 especialmente diseñadas para proteger y conectar antenas Starlink Mini y Mini X en vehículos terrestres, embarcaciones y sites industriales.';
    }
    if (text.includes('contacto') || text.includes('telefono') || text.includes('mail') || text.includes('whatsapp')) {
      return 'Podés escribirnos directamente por WhatsApp al +54 9 11 5456-5634, llamarnos al 0800 345 2488 o por correo a comercial@aitue.net.';
    }
    if (text.includes('instal') || text.includes('montaje') || text.includes('auto') || text.includes('camion')) {
      return 'Contamos con bases de sujeción con imanes de neodimio militar probados a velocidades superiores a 140 km/h en ruta y con cables de elevador de voltaje 12V a 30V/48V.';
    }

    return 'Gracias por tu consulta sobre AITUE COMUNICA S.A. ¿Te gustaría conocer detalles sobre nuestras integraciones para Starlink Mini, cotizaciones de flota o soporte técnico de ingeniería?';
  }
}
