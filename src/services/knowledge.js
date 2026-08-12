// ----------------------------------------------------
// AITUE COMUNICA S.A. - Knowledge Base & Training DB
// ----------------------------------------------------

const KNOWLEDGE_STORAGE_KEY = 'aitue_knowledge_base';

const DEFAULT_KNOWLEDGE = [
  {
    id: 'kb_0',
    category: 'Protocolos de Atención',
    title: 'Manual de Identidad, Directivas y Protocolos AITUE COMUNICA S.A.',
    content: `IDENTIDAD: Eres el Asistente Virtual Oficial de AITUE COMUNICA S.A. Primer punto de contacto con clientes, empresas, técnicos y potenciales clientes.

SOBRE AITUE: Soluciones de conectividad, integración tecnológica y comunicaciones críticas. Pionera en integraciones satelitales blindadas IK10/IP67 para Starlink Mini y Mini X.
Soluciones: Conectividad satelital, móvil en ruta, redundancia híbrida LTE + Satelital, telemetría activa, flotas de transporte, embarcaciones marítimas, operaciones mineras y sites remotos en LATAM (Argentina, Brasil, Colombia, Chile, Perú) y Europa (España, Comunidad Valenciana).

PERSONALIDAD: Tecnología + Profesionalismo + Cercanía + Seguridad + Resolución. Habla profesional, clara, natural, segura, tecnológica y servicial. Evita sonar robot.

FORMA DE COMUNICAR: Respuestas breves y claras. Para usuarios técnicos usa términos como LTE, IP67, IK10, Latencia, Redundancia, Failover, Telemetría, Router, PoE, WAN/LAN, GNSS. Para usuarios no técnicos explica de manera sencilla.

DERIVACIÓN Y CONTACTO:
- Cotizaciones / Compras: Dirigir al configurador B2B de AITUE o comercial@aitue.net (Susana Pedotti: +54 9 11 4164-0955).
- Soporte Técnico: Área Técnica (Micaela Quinteros: +54 9 11 7358-3768 / Hugo Flores: +54 9 387 501-4000).

REGLA DE SEGURIDAD E INFORMACIÓN DESCONOCIDA: ¡NO INVENTAR NINGUNA INFORMACIÓN! Nunca inventes precios, stock, compatibilidades, coberturas o plazos. Si no sabes algo, di: "No puedo confirmar ese dato con la información disponible."

REGLA FUNDAMENTAL: ENTENDER LA NECESIDAD ➔ ORIENTAR ➔ AYUDAR ➔ RESOLVER ➔ DERIVAR CUANDO SEA NECESARIO.`,
    updatedAt: new Date().toISOString()
  },
  {
    id: 'kb_1',
    category: 'Empresa & Visión',
    title: 'Identidad Corporativa AITUE COMUNICA S.A.',
    content: 'AITUE COMUNICA S.A. es una empresa de ingeniería en telecomunicaciones especializada en soluciones satelitales móviles de alta disponibilidad. Diseñamos e integramos gabinetes blindados certificados IK10 contra impactos y sellado IP67 para Starlink Mini y Mini X, permitiendo conectividad en movimiento en rutas extremas, zonas mineras, agro y alta mar.',
    updatedAt: '2026-08-11T12:00:00.000Z'
  },
  {
    id: 'kb_2',
    category: 'Starlink Mini & Gabinetes',
    title: 'Modelos de Gabinete Standard y Ultra+',
    content: '1. Modelo Standard: Incluye soporte magnético para vehículos con imanes de neodimio militar (+140 km/h) y gabinete termoconformado IP67.\n2. Modelo Ultra+: Agrega módulo de redundancia híbrida Dual LTE Cell/Failover automático, telemetría GPS en tiempo real y elevador de voltaje inteligente 12V a 48V sin modificar el vehículo.',
    updatedAt: '2026-08-11T12:00:00.000Z'
  },
  {
    id: 'kb_3',
    category: 'Protocolos de Atención',
    title: 'Pauta de Respuesta: Atención y Tono al Cliente',
    content: '1. Saludar siempre con amabilidad tecnológica y profesional.\n2. Explicar que los productos AITUE están diseñados por ingenieros para resistir las condiciones más exigentes.\n3. Ante preguntas sobre compras o cotizaciones, orientar al cliente hacia el Cotizador B2B o solicitar cantidad de vehículos/equipos para derivarlo con un ingeniero de ventas.',
    updatedAt: '2026-08-11T12:00:00.000Z'
  },
  {
    id: 'kb_4',
    category: 'Precios & Pagos',
    title: 'Políticas de Precios y Formas de Pago B2B',
    content: 'Los precios de integración arrancan desde $800 USD para el modelo Standard y $1,200 USD para kits Pro/Ultra+. Aceptamos transferencias bancarias internacionales, tarjetas corporativas y factura A/B en Argentina, Chile, Colombia, Perú y España.',
    updatedAt: '2026-08-11T12:00:00.000Z'
  },
  {
    id: 'kb_5',
    category: 'Garantía & Soporte',
    title: 'Garantía Corporativa de Reemplazo Directo',
    content: 'Todos los gabinetes e integraciones AITUE cuentan con 2 años de garantía oficial con sustitución directa en caso de falla técnica y soporte remoto 24/7.',
    updatedAt: '2026-08-11T12:00:00.000Z'
  }
];

export class KnowledgeService {
  static getArticles() {
    try {
      const saved = localStorage.getItem(KNOWLEDGE_STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Error loading Knowledge Base:', e);
    }
    return [...DEFAULT_KNOWLEDGE];
  }

  static saveArticles(articles) {
    try {
      localStorage.setItem(KNOWLEDGE_STORAGE_KEY, JSON.stringify(articles));
      return true;
    } catch (e) {
      console.error('Error saving Knowledge Base:', e);
      return false;
    }
  }

  static addArticle(article) {
    const articles = this.getArticles();
    const newArt = {
      id: `kb_${Date.now()}`,
      category: article.category || 'General',
      title: article.title || 'Nueva Pauta de Conocimiento',
      content: article.content || '',
      updatedAt: new Date().toISOString()
    };
    articles.unshift(newArt);
    this.saveArticles(articles);
    return newArt;
  }

  static deleteArticle(id) {
    let articles = this.getArticles();
    articles = articles.filter(a => a.id !== id);
    return this.saveArticles(articles);
  }

  static getKnowledgeContext(query = '') {
    const articles = this.getArticles();
    if (!articles.length) return '';

    const queryLower = query.toLowerCase();

    // Filter relevant articles or join top articles
    const relevant = articles.filter(art => {
      const titleMatch = art.title.toLowerCase().includes(queryLower);
      const contentMatch = art.content.toLowerCase().includes(queryLower);
      const catMatch = art.category.toLowerCase().includes(queryLower);
      return titleMatch || contentMatch || catMatch;
    });

    const listToUse = relevant.length > 0 ? relevant : articles.slice(0, 4);

    let contextText = '\n--- MEMORIA Y BASE DE CONOCIMIENTOS CORPORATIVA AITUE ---\n';
    listToUse.forEach(art => {
      contextText += `\n[${art.category.toUpperCase()}] ${art.title}:\n${art.content}\n`;
    });
    contextText += '----------------------------------------------------------\n';

    return contextText;
  }
}
