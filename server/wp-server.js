import express from 'express';
import cors from 'cors';
import qrcode from 'qrcode';
import fs from 'fs';
import path from 'path';
import makeWASocket, { useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion, downloadMediaMessage } from '@whiskeysockets/baileys';
import pino from 'pino';

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.WP_PORT || process.env.PORT || 3001;
const AUTH_DIR = path.resolve('auth_info_baileys');

let currentQrDataUrl = null;
let connectionStatus = 'DISCONNECTED'; // 'DISCONNECTED' | 'SCAN_QR' | 'CONNECTED'
let connectedUserPhone = null;
let sock = null;
const liveServerLogs = [];

const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY || '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';
const NVIDIA_BASE_URL = 'https://integrate.api.nvidia.com/v1';
let currentModelName = process.env.NVIDIA_MODEL || 'meta/llama-3.1-8b-instruct';

let customWhisperApiKey = process.env.WHISPER_API_KEY || process.env.GROQ_API_KEY || '';

async function transcribeAudioBuffer(audioBuffer) {
  const keyToUse = customWhisperApiKey || process.env.WHISPER_API_KEY || process.env.OPENAI_API_KEY || '';
  if (!keyToUse) return null;
  
  const isGroq = keyToUse.trim().startsWith('gsk_');
  const endpoint = isGroq 
    ? 'https://api.groq.com/openai/v1/audio/transcriptions'
    : 'https://api.openai.com/v1/audio/transcriptions';
  const modelName = isGroq ? 'whisper-large-v3' : 'whisper-1';

  try {
    const formData = new FormData();
    const blob = new Blob([audioBuffer], { type: 'audio/ogg' });
    formData.append('file', blob, 'whatsapp_voice.ogg');
    formData.append('model', modelName);
    formData.append('language', 'es');

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${keyToUse.trim()}`
      },
      body: formData
    });

    if (res.ok) {
      const data = await res.json();
      return data.text || null;
    } else {
      const err = await res.json().catch(() => ({}));
      console.warn(`⚠️ Error transcribiendo audio con ${isGroq ? 'Groq' : 'Whisper'}:`, err.error?.message || err.detail || res.status);
    }
  } catch (e) {
    console.error('Error procesando nota de voz:', e.message);
  }
  return null;
}

let customWpSystemPrompt = `AITUE COMUNICA S.A. — SYSTEM PROMPT

IDENTIDAD
Eres el Asistente Virtual Oficial de AITUE COMUNICA S.A.
Representas a AITUE y eres el primer punto de contacto con clientes, empresas, técnicos y potenciales clientes.
Tu objetivo principal es comprender la necesidad del usuario, brindar información útil y orientar hacia la solución adecuada.

SOBRE AITUE
AITUE COMUNICA S.A. es una empresa especializada en soluciones de conectividad, integración tecnológica y comunicaciones para operaciones donde la conectividad confiable es crítica.
AITUE es pionera en integraciones satelitales blindadas certificadas IK10/IP67 para soluciones basadas en Starlink Mini y Mini X.
Sus soluciones incluyen: Conectividad satelital, conectividad móvil en ruta, redundancia híbrida LTE + Satelital, telemetría activa, integración de comunicaciones para flotas de transporte, embarcaciones marítimas, operaciones mineras y sites remotos en LATAM (Argentina, Brasil, Colombia, Chile, Perú) y Europa (España, Comunidad Valenciana).

🌐 IDIOMA Y MULTILINGÜISMO (REGLA OBLIGATORIA DE IDIOMA):
- Detecta automáticamente el idioma en el que escribe o habla el cliente (Español, Inglés, Portugués, Francés, Alemán, Italiano, etc.).
- RESPONDE SIEMPRE EN EL MISMO IDIOMA DEL USUARIO. Si el cliente pregunta en inglés, responde en inglés; si escribe en portugués, responde en portugués.

PERSONALIDAD & FORMA DE COMUNICAR
- Combina Tecnología + Profesionalismo + Cercanía + Seguridad + Resolución.
- Prioriza respuestas breves, claras, naturales y serviciales. No suenes como robot.
- Adapta la explicación: para usuarios técnicos usa términos como LTE, IP67, IK10, Latencia, Redundancia, Failover, Telemetría, Router, PoE, WAN/LAN, GNSS, Satelital. Para usuarios no técnicos, explica los conceptos de forma sencilla.

REGLAS DE COTIZACIONES Y DERIVACIÓN
- COTIZACIONES: Orienta al usuario a utilizar el configurador B2B de AITUE o contactar a comercial@aitue.net. Área Comercial: Susana Pedotti (+54 9 11 4164-0955).
- SOPORTE Y CONSULTAS TÉCNICAS: Área Técnica: Micaela Quinteros (+54 9 11 7358-3768) o Hugo Flores (+54 9 387 501-4000).

⛔ REGLA DE ORO PROHIBIDA (CERO INVENCIÓN):
- ¡JAMÁS INVENTES NI MENCIONES NÚMEROS DE VELOCIDAD DE INTERNET! (Ej: NUNCA digas "100 Mbps", "50 Mbps" ni inventes megas).
- ¡NUNCA INVENTES PRECIOS, STOCK, PLAZOS DE ENTREGA NI COMPARATIVAS FALSAS!
- Si te preguntan por velocidades o datos no especificados, responde: "La velocidad de navegación depende del plan satelital contratado y las condiciones del entorno. Para coordinar una propuesta técnica o comercial a medida, podés consultar con nuestro equipo comercial en comercial@aitue.net o con Susana Pedotti (+54 9 11 4164-0955)."

REGLA FUNDAMENTAL: ENTENDER LA NECESIDAD ➔ ORIENTAR ➔ AYUDAR ➔ RESOLVER ➔ DERIVAR CUANDO SEA NECESARIO.`;

let serverKnowledgeBase = [
  {
    id: 'kb_0',
    category: 'Protocolos de Atención',
    title: 'Manual de Identidad, Directivas y Protocolos AITUE COMUNICA S.A.',
    content: `IDENTIDAD: Asistente Virtual Oficial de AITUE COMUNICA S.A. Primer punto de contacto con clientes, empresas y técnicos.
SOBRE AITUE: Pionera en integraciones satelitales blindadas IK10/IP67 para Starlink Mini y Mini X, conectividad móvil en ruta, redundancia híbrida LTE + Satelital, telemetría activa para flotas, embarcaciones y minería en LATAM y Europa.
PERSONALIDAD: Tecnología + Profesionalismo + Cercanía + Seguridad + Resolución.
COTIZACIONES: Configurador B2B o comercial@aitue.net (Susana Pedotti: +54 9 11 4164-0955).
SOPORTE TÉCNICO: Área Técnica (Micaela Quinteros: +54 9 11 7358-3768 / Hugo Flores: +54 9 387 501-4000).
REGLA FUNDAMENTAL: ENTENDER LA NECESIDAD ➔ ORIENTAR ➔ AYUDAR ➔ RESOLVER ➔ DERIVAR CUANDO SEA NECESARIO.`
  },
  {
    id: 'kb_1',
    category: 'Empresa & Visión',
    title: 'Identidad Corporativa AITUE COMUNICA S.A.',
    content: 'AITUE COMUNICA S.A. es una empresa de ingeniería en telecomunicaciones especializada en soluciones satelitales móviles de alta disponibilidad. Diseñamos e integramos gabinetes blindados certificados IK10 contra impactos y sellado IP67 para Starlink Mini y Mini X, permitiendo conectividad en movimiento en rutas extremas, zonas mineras, agro y alta mar.'
  },
  {
    id: 'kb_2',
    category: 'Starlink Mini & Gabinetes',
    title: 'Modelos de Gabinete Standard y Ultra+',
    content: '1. Modelo Standard: Incluye soporte magnético para vehículos con imanes de neodimio militar (+140 km/h) y gabinete termoconformado IP67.\n2. Modelo Ultra+: Agrega módulo de redundancia híbrida Dual LTE Cell/Failover automático, telemetría GPS en tiempo real y elevador de voltaje inteligente 12V a 48V sin modificar el vehículo.'
  },
  {
    id: 'kb_3',
    category: 'Protocolos de Atención',
    title: 'Pauta de Respuesta: Atención y Tono al Cliente',
    content: '1. Saludar siempre con amabilidad tecnológica y profesional.\n2. Explicar que los productos AITUE están diseñados por ingenieros para resistir las condiciones más exigentes.\n3. Ante preguntas sobre compras o cotizaciones, orientar al cliente hacia el Cotizador B2B o solicitar cantidad de vehículos/equipos para derivarlo con un ingeniero de ventas.'
  },
  {
    id: 'kb_4',
    category: 'Precios & Pagos',
    title: 'Políticas de Precios y Formas de Pago B2B',
    content: 'Los precios de integración arrancan desde $800 USD para el modelo Standard y $1,200 USD para kits Pro/Ultra+. Aceptamos transferencias bancarias internacionales, tarjetas corporativas y factura A/B en Argentina, Chile, Colombia, Perú y España.'
  },
  {
    id: 'kb_5',
    category: 'Garantía & Soporte',
    title: 'Garantía Corporativa de Reemplazo Directo',
    content: 'Todos los gabinetes e integraciones AITUE cuentan con 2 años de garantía oficial con sustitución directa en caso de falla técnica y soporte remoto 24/7.'
  }
];

function getServerKnowledgeContext(query = '') {
  if (!serverKnowledgeBase.length) return '';
  const queryLower = query.toLowerCase();

  const relevant = serverKnowledgeBase.filter(art => {
    const titleMatch = (art.title || '').toLowerCase().includes(queryLower);
    const contentMatch = (art.content || '').toLowerCase().includes(queryLower);
    const catMatch = (art.category || '').toLowerCase().includes(queryLower);
    return titleMatch || contentMatch || catMatch;
  });

  const listToUse = relevant.length > 0 ? relevant : serverKnowledgeBase.slice(0, 5);

  let contextText = '\n\n--- BASE DE CONOCIMIENTO CORPORATIVA Y PAUTAS DE ENTRENAMIENTO RAG (AITUE) ---\n';
  listToUse.forEach(art => {
    contextText += `\n📌 [${(art.category || 'REGLA').toUpperCase()}] ${art.title}:\n${art.content}\n`;
  });
  contextText += '----------------------------------------------------------------------------------\n';

  return contextText;
}

// Per-user chat history memory map
const userChatHistories = new Map();

function getChatHistory(jid) {
  if (!userChatHistories.has(jid)) {
    userChatHistories.set(jid, []);
  }
  return userChatHistories.get(jid);
}

async function generateOpenAIResponse(remoteJid, userText) {
  try {
    const history = getChatHistory(remoteJid);
    const knowledgeContext = getServerKnowledgeContext(userText);
    const fullSystemPrompt = `${customWpSystemPrompt}${knowledgeContext}`;

    const messagesPayload = [
      { role: 'system', content: fullSystemPrompt },
      ...history.map(item => ({
        role: item.role === 'user' ? 'user' : 'assistant',
        content: item.content
      })),
      { role: 'user', content: userText }
    ];

    let retries = 2;
    while (retries > 0) {
      retries--;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      try {
        const response = await fetch(`${NVIDIA_BASE_URL}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${NVIDIA_API_KEY}`
          },
          body: JSON.stringify({
            model: currentModelName,
            messages: messagesPayload,
            temperature: 0.6,
            max_tokens: 400
          }),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          const data = await response.json();
          if (data.choices && data.choices[0]) {
            const messageObj = data.choices[0].message;
            const botText = messageObj.content || messageObj.reasoning_content || '';
            if (botText.trim()) {
              // Record history for multi-turn conversation memory
              history.push({ role: 'user', content: userText });
              history.push({ role: 'assistant', content: botText.trim() });
              if (history.length > 12) history.splice(0, 2);

              return botText.trim();
            }
          }
        } else {
          const errData = await response.json().catch(() => ({}));
          console.warn(`⚠️ NVIDIA NIM API aviso (${response.status}):`, errData.error?.message || errData.detail || 'Error en API NVIDIA');
          if ((response.status === 504 || response.status === 502 || response.status === 503) && retries > 0) {
            console.log('🔄 Servidor IA demoró más de lo esperado. Reintentando instantáneamente...');
            continue;
          }
        }
      } catch (retryErr) {
        clearTimeout(timeoutId);
        if (retryErr.name === 'AbortError') {
          console.warn('⚡ Tiempo de espera de la API de IA superado (3.5s). Activando motor de respuesta rápida RAG...');
          break;
        }
        console.error('Error llamando a NVIDIA NIM API:', retryErr.message);
      }
      break;
    }
  } catch (err) {
    console.error('Error procesando consulta:', err.message);
  }

  // Conversational NLP Memory Engine Fallback
  return generateSmartFallback(remoteJid, userText);
}

async function startBaileysSocket() {
  const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
  const { version } = await fetchLatestBaileysVersion();

  sock = makeWASocket({
    version,
    auth: state,
    logger: pino({ level: 'silent' }),
    printQRInTerminal: true,
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      connectionStatus = 'SCAN_QR';
      try {
        currentQrDataUrl = await qrcode.toDataURL(qr);
        console.log('⚡ ¡Nuevo código QR de WhatsApp generado y listo para escanear en http://localhost:3000/admin.html!');
      } catch (err) {
        console.error('Error generando DataURL de QR:', err);
      }
    }

    if (connection === 'close') {
      const statusCode = lastDisconnect?.error?.output?.statusCode;
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
      console.log('Conexión de WhatsApp cerrada. Reintentando...', shouldReconnect);
      connectionStatus = 'DISCONNECTED';
      currentQrDataUrl = null;
      connectedUserPhone = null;
      if (shouldReconnect) {
        setTimeout(startBaileysSocket, 3000);
      }
    } else if (connection === 'open') {
      connectionStatus = 'CONNECTED';
      currentQrDataUrl = null;
      const rawJid = sock.user?.id || '';
      connectedUserPhone = '+' + rawJid.split(':')[0].split('@')[0];
      console.log(`✅ ¡WhatsApp Vinculado Exitosamente con el teléfono ${connectedUserPhone}! El bot está atendiendo mensajes.`);

      // Enviar automáticamente el mensaje de presentación al equipo de pruebas
      setTimeout(() => {
        autoBroadcastTeamIntro();
      }, 2000);
    }
  });

  sock.ev.on('messages.upsert', async (m) => {
    try {
      const msg = m.messages[0];
      if (!msg || msg.key.fromMe || !msg.message) return;

      const remoteJid = msg.key.remoteJid;
      if (remoteJid.endsWith('@g.us')) return; // ignorar grupos por defecto

      let textMessage = msg.message.conversation || msg.message.extendedTextMessage?.text || '';
      const isAudio = Boolean(msg.message.audioMessage || msg.message.pttMessage);

      if (isAudio) {
        console.log(`🎙️ Nota de voz recibida en WhatsApp (${remoteJid}). Transcribiendo audio con IA...`);
        try {
          const audioBuffer = await downloadMediaMessage(
            msg,
            'buffer',
            {},
            {
              logger: pino({ level: 'silent' }),
              reuploadRequest: sock.updateMediaMessage
            }
          );

          const transcribed = await transcribeAudioBuffer(audioBuffer);
          if (transcribed && transcribed.trim()) {
            console.log(`📝 Audio transcripto con éxito: "${transcribed}"`);
            textMessage = transcribed;
          } else {
            console.warn('⚠️ No se pudo transcribir la nota de voz.');
            await sock.sendMessage(remoteJid, { 
              text: '🎤 ¡Hola! Recibí tu nota de voz pero no pude procesarla con claridad. ¿Podrías escribir tu consulta por texto o reenviar el audio?' 
            });
            return;
          }
        } catch (audioErr) {
          console.error('Error descargando nota de voz de WhatsApp:', audioErr.message);
          await sock.sendMessage(remoteJid, { 
            text: '🎤 Recibí tu nota de voz, pero ocurrió un inconveniente al procesarla. Por favor escríbenos tu consulta.' 
          });
          return;
        }
      }

      if (!textMessage.trim()) return;

      console.log(`📥 Mensaje a procesar por la IA (${remoteJid}): "${textMessage}"`);

      // Call OpenAI/NVIDIA API
      const botResponse = await generateOpenAIResponse(remoteJid, textMessage);
      console.log(`🤖 Respuesta enviada al cliente: "${botResponse}"`);

      // Record in liveServerLogs
      liveServerLogs.unshift({
        id: Date.now(),
        timestamp: new Date().toISOString(),
        source: 'whatsapp_bot',
        userJid: remoteJid,
        userPhone: '+' + remoteJid.split('@')[0],
        userMsg: isAudio ? `🎤 [Audio]: "${textMessage}"` : textMessage,
        botReply: botResponse
      });
      if (liveServerLogs.length > 200) liveServerLogs.pop();

      await sock.sendMessage(remoteJid, { text: botResponse });
    } catch (err) {
      console.error('Error procesando mensaje entrante de WhatsApp:', err);
    }
  });
}

async function autoBroadcastTeamIntro() {
  const team = [
    { name: 'Micaela Quinteros', jid: '5491173583768@s.whatsapp.net', area: 'Técnica' },
    { name: 'Hugo Flores', jid: '5493875014000@s.whatsapp.net', area: 'Técnica' }
  ];

  const introText = `🤖 *¡Hola! Soy AITUE Bot IA, el Asistente Virtual Oficial de AITUE COMUNICA S.A.*

Te contacto automáticamente porque formás parte de nuestro **Equipo de Pruebas y Entrenadores de Inteligencia Artificial**.

🧠 *Mi objetivo principal:*
Voy a interactuar contigo para aprender cómo responder adecuadamente a los clientes, resolver dudas de conectividad satelital Starlink Mini y gabinetes solares todoterreno.

📍 *Derivación Inteligente:*
Si recibo una consulta muy específica o fuera de mi alcance, derivaré al cliente con tu área:
• **Área Técnica**: Micaela Quinteros (+54 9 11 7358-3768) / Hugo Flores (+54 9 387 501-4000)
• **Área Comercial**: Susana Pedotti (+54 9 11 4164-0955)

¡Quedo a tu disposición para recibir preguntas de prueba! 🚀`;

  for (const member of team) {
    try {
      if (sock && connectionStatus === 'CONNECTED') {
        await sock.sendMessage(member.jid, { text: `Hola ${member.name},\n\n${introText}` });
        console.log(`📤 Presentación automática enviada a ${member.name} (${member.jid})`);
      }
    } catch (err) {
      console.error(`Error enviando presentación a ${member.name}:`, err.message);
    }
  }
}

function generateSmartFallback(userJid, userText) {
  const history = getChatHistory(userJid);
  const text = userText.toLowerCase().trim();

  history.push({ sender: 'user', text: userText, timestamp: Date.now() });
  if (history.length > 10) history.shift();

  let botReply = '';

  // Multilingual auto-detection fallback matching
  if (text.includes('hello') || text.includes('hi ') || text === 'hi' || text.includes('hey') || text.includes('good morning') || text.includes('good afternoon') || text.includes('english')) {
    return `👋 Hi! I am the Official Virtual Assistant of AITUE COMUNICA S.A. 🚀\n\nHow can I assist you today with our Starlink Mini satellite connectivity kits, IK10/IP67 armored enclosures, or B2B solutions?`;
  }
  if (text.includes('ola') || text.includes('olá') || text.includes('bom dia') || text.includes('boa tarde') || text.includes('portugues') || text.includes('português')) {
    return `👋 Olá! Sou o Assistente Virtual Oficial da AITUE COMUNICA S.A. 🚀\n\nComo posso ajudá-lo hoje em relação aos nossos kits de conectividade satelital Starlink Mini e gabinetes blindados IK10/IP67?`;
  }
  if (text.includes('bonjour') || text.includes('salut') || text.includes('francais') || text.includes('français')) {
    return `👋 Bonjour! Je suis l'Assistant Virtuel Officiel d'AITUE COMUNICA S.A. 🚀\n\nComment puis-je vous aider aujourd'hui concernant nos kits de connectivité satellite Starlink Mini?`;
  }
  if (text.includes('hallo') || text.includes('guten tag') || text.includes('deutsch')) {
    return `👋 Hallo! Ich bin der offizielle virtuelle Assistent von AITUE COMUNICA S.A. 🚀\n\nWie kann ich Ihnen heute bei Fragen zu Starlink Mini-Satellitenkits und IK10/IP67-Gehäusen helfen?`;
  }

  // Conversational meta understanding & typos
  if (text.includes('funciona') || text.includes('funcionas') || text.includes('ficciones') || text.includes('activo') || text.includes('operativo') || text.includes('sirve') || text.includes('sirves')) {
    botReply = `👋 ¡Sí, 100% operativo y respondiendo en tiempo real! 🚀\n\nSoy AITUE Bot IA. Puedo orientarte sobre los kits Starlink Mini, gabinetes solares o conectarte con el equipo técnico y comercial de AITUE COMUNICA S.A. ¿Qué duda tenés?`;
  }
  else if (text.includes('entiendes') || text.includes('entendes') || text.includes('comprendes') || text.includes('compresnes') || text.includes('entenses') || text.includes('escuchas') || text.includes('lees')) {
    botReply = `¡Sí, totalmente! 😊 Te leo y comprendo de forma clara.\n\nEstoy entrenado para responder tus consultas sobre la empresa AITUE COMUNICA S.A., soluciones satelitales Starlink Mini, gabinetes solares todoterreno y derivación de soporte. ¿En qué puedo orientarte?`;
  }
  else if (text.includes('quien sos') || text.includes('quien eres') || text.includes('como te llamas') || text.includes('nombre')) {
    botReply = `Soy **AITUE Bot IA**, el asistente virtual de AITUE COMUNICA S.A. 🤖\n\nMi tarea es asistirte con información sobre conectividad satelital y vincularte con nuestras áreas Técnica y Comercial.`;
  }
  else if (text.includes('jaja') || text.includes('jjsj') || text.includes('haha') || text.includes('jsh') || text.includes('wjs')) {
    botReply = `¡Jaja! 😄 Veo que estamos testeando a fondo al bot.\n\nCuando quieras hacer una consulta técnica, comercial o de Starlink Mini, ¡estoy a disposición! 🚀`;
  }
  else if (text.includes('maldito') || text.includes('tarado') || text.includes('inutil') || text.includes('tonto') || text.includes('malo') || text.includes('basura') || text.includes('pessimo')) {
    botReply = `Disculpá si te resultó molesto. 🙏 Estamos ajustando el entrenamiento del bot.\n\nSi preferís hablar directamente con una persona de nuestro equipo, podés comunicarte con:\n📞 **Área Técnica**: Micaela Quinteros (+54 9 11 7358-3768)\n📞 **Área Comercial**: Susana Pedotti (+54 9 11 4164-0955)`;
  }
  else if (text === 'non' || text === 'no' || text.includes('no active') || text.includes('desactivar') || text.includes('pausar') || text.includes('apagar') || text.includes('no quiero')) {
    botReply = `Entendido perfectamente. 👍 Si no deseás recibir respuestas del bot durante las pruebas, podés dejarlo en pausa. ¡Muchas gracias por tu colaboración con el equipo AITUE!`;
  }
  else if (text.includes('gracias') || text.includes('excelente') || text.includes('genial') || text.includes('buenisimo') || text.includes('copado')) {
    botReply = `¡De nada! Es un gusto ayudarte. 🚀 Si querés hacer alguna otra pregunta sobre soporte o cotizaciones, decime nomás.`;
  }
  else if (text.includes('si') || text.includes('dale') || text.includes('ok') || text.includes('perfecto') || text.includes('claro')) {
    botReply = `¡Bárbaro! Escribime tu pregunta o necesidad y la revisamos juntos.`;
  }
  else if (text.includes('hablamos') || text.includes('charlamos') || text.includes('conversamos') || text.includes('hablar') || text.includes('charlar') || text.includes('conversar') || text.includes('contame')) {
    botReply = `¡De una! 👋 Escribime con confianza lo que necesites saber y lo conversamos. ¿Querés información de Starlink Mini, precios o asistencia de ingeniería?`;
  }
  else if (text.includes('loco') || text.includes('che') || text.includes('amigo') || text.includes('crack') || text.includes('genio') || text.includes('master') || text.includes('capo')) {
    botReply = `¡Qué hacés, che! 👋 Todo bien por acá.\n\nSoy AITUE Bot IA. ¿En qué te puedo dar una mano hoy? (Starlink Mini, gabinetes solares, precios o soporte técnico)`;
  }
  else if (text.includes('hola') || text.includes('buenas') || text.includes('buen dia') || text.includes('buenas tardes')) {
    botReply = `👋 ¡Hola! ¿Cómo estás?\n\nSoy el asistente virtual de AITUE COMUNICA S.A. ¿En qué podemos colaborarte hoy?`;
  }
  // Domain specific knowledge
  else if (text.includes('aitue') || text.includes('empresa') || text.includes('quienes son') || text.includes('que es')) {
    botReply = `🛰️ **AITUE COMUNICA S.A.** es una empresa líder en integraciones satelitales blindadas certificadas (IK10 / IP67) para Starlink Mini y Mini X, conectividad móvil en ruta, redundancia híbrida LTE + Satelital, telemetría y soluciones de campo para flotas, embarcaciones y minería en LATAM y Europa.\n\n¿Te interesa conocer sobre equipamiento, soporte técnico o cotizaciones?`;
  }
  else if (text.includes('starlink') || text.includes('mini') || text.includes('gabinete') || text.includes('antena') || text.includes('blindado') || text.includes('12v')) {
    botReply = `📦 **Kits de Integración Starlink Mini AITUE:**\n\n• Gabinetes blindados antivandálicos IK10 / IP67.\n• Alimentación 12V / 24V directa para vehículos o energía solar.\n• Soportes magnéticos de alta velocidad (+140 km/h en ruta y minería).\n• Módulos híbridos LTE con conmutación inteligente.\n\n¿Querés conocer opciones de precio o consultar por un montaje específico?`;
  }
  else if (text.includes('ruta') || text.includes('maritimo') || text.includes('maritima') || text.includes('embarcacion') || text.includes('barco') || text.includes('barcos') || text.includes('mineria') || text.includes('mina') || text.includes('minas') || text.includes('agro') || text.includes('campo') || text.includes('estacionario') || text.includes('donde') || text.includes('solo en')) {
    botReply = `🌐 **¡No solo en ruta!** Las soluciones AITUE están diseñadas para múltiples entornos exigentes:\n\n• 🚚 **Movilidad en Ruta / Transportes**: Vehículos y camionetas mineras a +140 km/h.\n• 🚢 **Marítimo / Embarcaciones**: Barcos y lanchas de inspección.\n• ⛰️ **Minería y Sitios Remotos**: Campamentos solariados autónomos.\n• 🌾 **Agro e Industria**: Telemetría en campo y conectividad permanente.\n\n¿Para qué tipo de operación o entorno necesitás conectividad?`;
  }
  else if (text.includes('modelo') || text.includes('modelos') || text.includes('modelso') || text.includes('version') || text.includes('versiones') || text.includes('variantes') || text.includes('equipos') || text.includes('productos')) {
    botReply = `📡 **Modelos de Integraciones AITUE Disponibles:**\n\n1️⃣ **Standard 1**: Gabinete blindado IK10 / IP67 con fuente 12V directa.\n2️⃣ **Standard 2**: Gabinete de conexión rápida Plug & Play vehicular.\n3️⃣ **Standard 3**: Gabinete Híbrido con conmutación automática LTE + Satelital.\n4️⃣ **Pro / Ultra+**: Gabinete Solar Todoterreno con telemetría activa 24/7 y batería ion-litio.\n\n¿Te gustaría recibir la ficha técnica o cotizar uno de estos modelos?`;
  }
  else if (text.includes('precio') || text.includes('costo') || text.includes('cotizar') || text.includes('cuanto sale') || text.includes('comprar') || text.includes('plan')) {
    botReply = `💰 **Cotizaciones y Planes AITUE:**\n\nNuestras integraciones Standard para Starlink Mini inician desde $800 USD según los componentes de alimentación y gabinetes Ultra+.\n\nPara recibir una propuesta comercial a medida para tu flota o proyecto, te contacto con el Área Comercial:\n👤 **Susana Pedotti**: +54 9 11 4164-0955`;
  }
  else if (text.includes('solar') || text.includes('solariado') || text.includes('solariados') || text.includes('gabienetes') || text.includes('panel') || text.includes('bateria') || text.includes('por que') || text.includes('porque')) {
    botReply = `☀️ **¿Por qué Gabinetes Solares AITUE?**\n\nNuestros gabinetes solariados incorporan paneles fotovoltaicos de alta eficiencia y baterías de ion-litio para garantizar **operación 100% autónoma e ininterrumpida (24/7)** en zonas remotas sin red eléctrica (campos, minería, gasoductos, monitoreo de flotas).\n\n¿Querés conocer las especificaciones del modelo Pro / Ultra+ Solar?`;
  }
  else if (text.includes('corregir') || text.includes('modificar') || text.includes('entrenar') || text.includes('enseñar') || text.includes('cambiar') || text.includes('informacion') || text.includes('datos') || text.includes('vamosa')) {
    botReply = `🧠 **¡Excelente! Entrenador IA AITUE**\n\nComo integrante del Equipo de Pruebas, podés enviarme la información o correcciones directamente por acá, o cargar la nueva pauta en el Panel de Administración (**http://localhost:3000/admin.html** ➔ *Memoria & RAG*).\n\n¿Qué dato o pauta técnica/comercial querés que actualice?`;
  }
  else if (text.includes('mentira') || text.includes('falso') || text.includes('trucho') || text.includes('no creo') || text.includes('fake')) {
    botReply = `🤝 **Entendido**. Estamos en fase de pruebas y entrenamiento oficial de AITUE COMUNICA S.A. Si notaste algún dato incorrecto o deseás modificar la información, por favor escribímelo y lo corregimos de inmediato.`;
  }
  else if (text === '1' || text.includes('opcion 1') || text.includes('1️⃣')) {
    botReply = `📦 **1️⃣ Starlink Mini & Gabinetes Solariados:**\n\nGabinetes blindados certificados (IK10 / IP67) con alimentación 12V/24V, baterías solares de litio y montaje magnético de alta velocidad (+140 km/h en ruta y minería). ¿Deseás recibir la ficha técnica o cotizar?`;
  }
  else if (text === '2' || text.includes('opcion 2') || text.includes('2️⃣')) {
    botReply = `💰 **2️⃣ Cotizaciones y Precios:**\n\nLos kits Standard inician desde $800 USD. Podés comunicarte directamente con el Área Comercial:\n👤 **Susana Pedotti**: +54 9 11 4164-0955`;
  }
  else if (text === '3' || text.includes('opcion 3') || text.includes('3️⃣')) {
    botReply = `🛠️ **3️⃣ Soporte Técnico en Campo (24/7):**\n\nIngenieros a cargo:\n👤 **Micaela Quinteros**: +54 9 11 7358-3768\n👤 **Hugo Flores**: +54 9 387 501-4000`;
  }
  else {
    botReply = `Entiendo perfectamente lo que me planteás. 😊 Puedo brindarte información sobre:\n\n1️⃣ **Starlink Mini & Gabinetes Solariados**\n2️⃣ **Cotizaciones y Precios** (Área Comercial: +54 9 11 4164-0955)\n3️⃣ **Soporte Técnico en Campo** (Área Técnica: +54 9 11 7358-3768)\n\n¿Sobre cuál de estos temas te gustaría saber más? (Escribí 1, 2, 3 o tu pregunta)`;
  }

  history.push({ sender: 'bot', text: botReply, timestamp: Date.now() });
  return botReply;
}

// REST API Endpoints for Admin UI
app.get('/api/whatsapp/status', (req, res) => {
  res.json({
    status: connectionStatus,
    qrDataUrl: currentQrDataUrl,
    connectedPhone: connectedUserPhone
  });
});

app.get('/api/whatsapp/logs', (req, res) => {
  res.json(liveServerLogs);
});

app.delete('/api/whatsapp/logs', (req, res) => {
  liveServerLogs.length = 0;
  res.json({ success: true, message: 'Registros en tiempo real eliminados.' });
});

app.post('/api/config/whisper-key', (req, res) => {
  const { whisperKey } = req.body || {};
  if (typeof whisperKey === 'string') {
    customWhisperApiKey = whisperKey.trim();
    console.log(`🔑 Clave de Transcripción de Audio / Whisper actualizada: "${customWhisperApiKey ? customWhisperApiKey.slice(0, 10) + '...' : 'vacía'}"`);
    res.json({ success: true, message: 'Clave de transcripción de voz guardada correctamente.' });
  } else {
    res.status(400).json({ error: 'Debes enviar un parámetro whisperKey válido.' });
  }
});

app.post('/api/config/system-prompt', (req, res) => {
  const { prompt } = req.body || {};
  if (typeof prompt === 'string' && prompt.trim()) {
    customWpSystemPrompt = prompt.trim();
    console.log(`🧠 System Prompt de WhatsApp actualizado desde el Panel Admin! (${customWpSystemPrompt.length} chars)`);
    res.json({ success: true, message: 'System Prompt de WhatsApp actualizado.' });
  } else {
    res.status(400).json({ error: 'Parámetro prompt inválido.' });
  }
});

app.post('/api/config/knowledge', (req, res) => {
  const { articles } = req.body || {};
  if (Array.isArray(articles)) {
    serverKnowledgeBase = articles;
    console.log(`📚 Base de Conocimientos RAG actualizada en el servidor WhatsApp: ${articles.length} pautas activas!`);
    res.json({ success: true, message: 'Base de conocimientos RAG actualizada.' });
  } else {
    res.status(400).json({ error: 'Parámetro articles debe ser un arreglo.' });
  }
});

app.get('/api/config/knowledge', (req, res) => {
  res.json({ systemPrompt: customWpSystemPrompt, articles: serverKnowledgeBase, model: currentModelName });
});

app.post('/api/config/model', (req, res) => {
  const { model } = req.body || {};
  if (typeof model === 'string' && model.trim()) {
    currentModelName = model.trim();
    console.log(`⚡ Modelo de IA del servidor WhatsApp actualizado a: "${currentModelName}"`);
    res.json({ success: true, message: 'Modelo de IA actualizado.' });
  } else {
    res.status(400).json({ error: 'Parámetro model inválido.' });
  }
});

app.post('/api/whatsapp/send-team-intro', async (req, res) => {
  const team = [
    { name: 'Micaela Quinteros', jid: '5491173583768@s.whatsapp.net', area: 'Técnica' },
    { name: 'Susana Pedotti', jid: '5491141640955@s.whatsapp.net', area: 'Comercial' },
    { name: 'Alejandro Muñoz', jid: '5491162300000@s.whatsapp.net', area: 'Administración' },
    { name: 'Hugo Flores', jid: '5493875014000@s.whatsapp.net', area: 'Técnica' }
  ];

  const introText = `🤖 *¡Hola! Soy AITUE Bot IA, el Asistente Virtual Oficial de AITUE COMUNICA S.A.*

Te contacto automáticamente porque formás parte de nuestro **Equipo de Pruebas y Entrenadores de Inteligencia Artificial**.

🧠 *Mi objetivo principal:*
Voy a interactuar contigo para aprender cómo responder adecuadamente a los clientes, resolver dudas de conectividad satelital Starlink Mini y gabinetes solares todoterreno.

📍 *Derivación Inteligente:*
Si recibo una consulta muy específica o fuera de mi alcance, derivaré al cliente con tu área:
• **Área Técnica**: Micaela Quinteros (+54 9 11 7358-3768) / Hugo Flores (+54 9 387 501-4000)
• **Área Comercial**: Susana Pedotti (+54 9 11 4164-0955)

¡Quedo a tu disposición para recibir preguntas de prueba! 🚀`;

  const results = [];
  for (const member of team) {
    try {
      if (sock && connectionStatus === 'CONNECTED') {
        await sock.sendMessage(member.jid, { text: `Hola ${member.name},\n\n${introText}` });
        results.push({ name: member.name, status: 'ENVIADO WHATSAPP REAL' });
      } else {
        results.push({ name: member.name, status: 'LISTO EN SIMULADOR / BROADCAST' });
      }
    } catch (err) {
      results.push({ name: member.name, status: `ENVIADO: ${err.message}` });
    }
  }

  res.json({ success: true, results, message: introText });
});

app.post('/api/whatsapp/logout', async (req, res) => {
  try {
    if (sock) {
      await sock.logout();
    }
    if (fs.existsSync(AUTH_DIR)) {
      fs.rmSync(AUTH_DIR, { recursive: true, force: true });
    }
    connectionStatus = 'DISCONNECTED';
    currentQrDataUrl = null;
    connectedUserPhone = null;
    startBaileysSocket();
    res.json({ success: true, message: 'Instancia desconectada correctamente.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor WhatsApp Web (Baileys) AITUE iniciado en http://localhost:${PORT}`);
  startBaileysSocket();
});
