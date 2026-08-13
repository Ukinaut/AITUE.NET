// ----------------------------------------------------
// AITUE COMUNICA S.A. - Knowledge Base & Training DB
// ----------------------------------------------------

const KNOWLEDGE_STORAGE_KEY = 'aitue_knowledge_base';

const DEFAULT_KNOWLEDGE = [
  {
    id: 'kb_0',
    category: 'Protocolos de Atención',
    title: 'Manual de Identidad, Directivas y Protocolos AITUE COMUNICA S.A.',
    content: `IDENTIDAD: Asistente Virtual Oficial de AITUE COMUNICA S.A. ("Si ves el cielo, estamos").
SOBRE AITUE: Soluciones 360° desarrolladas para proteger, integrar y adaptar equipos Starlink Mini y Mini X en estructuras permanentes, vehículos en movimiento y operaciones de campo en LATAM (Argentina, Brasil, Colombia, Chile, Perú) y Europa (España, Comunidad Valenciana).
COTIZACIONES: comercial@aitue.net (Susana Pedotti: +54 9 11 4164-0955).
SOPORTE TÉCNICO: Área Técnica (Micaela Quinteros: +54 9 11 7358-3768 / Hugo Flores: +54 9 387 501-4000).
CANALES OFICIALES: 0800 345 2488 | +54 11 5272 2340 | aitue.net | shop.aitue.net | @aituecomunica.`,
    updatedAt: new Date().toISOString()
  },
  {
    id: 'kb_1',
    category: 'Empresa & Visión',
    title: 'Identidad Corporativa y El Problema que Resolvemos',
    content: 'AITUE COMUNICA S.A. ofrece soluciones profesionales de protección 360°, integración hermética, movilidad vehicular y confiabilidad operativa para Starlink Mini y Mini X. Protege los equipos contra polvo, agua, viento, vibraciones intensas y temperatura extrema sin necesidad de abrir el gabinete en cada uso.',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'kb_2',
    category: 'Línea Standard',
    title: 'Aitue Standard - Protección Fija y Semifija',
    content: '• Medidas: 32 cm largo × 28 cm ancho × 5.5 cm alto.\n• Material: Plástico ABS inyectado reforzado con matriz propia, cordón de sellado EPDM y 4 bulones de acero inoxidable.\n• Conectividad: Conector hermético externo e interno. Alojamiento preciso para Starlink Mini y Mini X.\n• Aplicación: Techos de fibra, motorhomes, casillas, trailers, viviendas rurales, soportes de pared o mástil, y vehículos donde se requiera protección fija y permanente.',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'kb_3',
    category: 'Línea Pro',
    title: 'Aitue Pro - Fijación Magnética de Grado Industrial',
    content: '• Medidas: 41 cm largo × 29 cm ancho × 6 cm alto.\n• Fijación: 4 imanes de neodimio de grado industrial con recubrimiento de goma antideslizante (+50 kg de fuerza por imán, total sistema +200 kg de sujeción).\n• Uso: Instalación rápida y desmontable sobre superficies metálicas (techos y capots de vehículos) sin perforaciones permanentes. Ideal para camionetas operativas, minería, petróleo, agro, transporte, turismo, prensa y emergencias.',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'kb_4',
    category: 'Línea Ultra+',
    title: 'Aitue Ultra+ - Plataforma Industrial Corporativa (Satelital + LTE)',
    content: '• Especificaciones: Medidas 34.3 × 28.2 × 4.5 cm, Peso 675 gr, Material PC/ABS anti-UV, Grado IP67/IP68, Rango térmico -40 °C a +80 °C.\n• Válvula Hidrofóbica: Membrana ePTFE de grado automotriz (>0.3 Bar WEP) para ecualización continua de presión y escape de aire caliente bloqueando ingreso de agua.\n• Módulos Configurables: Satelital (Mini/Nano) + Dual LTE Cat 4 (hasta 150/50 Mbps), GPS/Trackeo (CamBus), Video Streaming HD 1080p, Telemetría activa (medición temp/humedad/voltaje) y administración de red Appcontrol.',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'kb_5',
    category: 'Alimentación DBP',
    title: 'Aitue DBP - Direct Battery Power (Alimentación 12V/24V a 30V)',
    content: '• Función: Alimentación directa a batería para Starlink Mini y Mini X en vehículos sin toma de 12V o encendedor.\n• Especificaciones: Convierte entrada de 12V/24V (12-30 VDC) a salida estabilizada constante de 30V (30-45W típico, pico 60W).\n• Control ACC/Contacto: Cable verde se conecta a la fusilera/señal de contacto del vehículo, encendiendo el equipo automáticamente con el auto y previniendo consumo de batería al apagarlo.\n• Instalación: Conexión directa a bornes (+/-), auto-instalable.',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'kb_6',
    category: 'Visión de Producto & Catálogo',
    title: 'Lógica de Catálogo: Sistema Modular Integral AITUE',
    content: 'AITUE no vende simplemente accesorios sueltos para Starlink Mini. AITUE construye un sistema modular integral diseñado para transformar Starlink Mini y Mini X en una solución completa y robusta de conectividad operativa utilizable en vehículos en ruta, instalaciones fijas y entornos exigentes.',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'kb_7',
    category: 'Contacto & Soporte',
    title: 'Canales Comerciales, Técnicos y Redes AITUE',
    content: '• Área Comercial: Susana Pedotti (+54 9 11 4164-0955 / comercial@aitue.net).\n• Teléfonos de Atención: 0800 345 2488 / +54 11 5272 2340.\n• Área Técnica: Micaela Quinteros (+54 9 11 7358-3768) / Hugo Flores (+54 9 387 501-4000).\n• Sitios Web & Redes: aitue.net | shop.aitue.net | Instagram: @aituecomunica.',
    updatedAt: new Date().toISOString()
  }
];

export class KnowledgeService {
  static getArticles() {
    try {
      const saved = localStorage.getItem(KNOWLEDGE_STORAGE_KEY);
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Error loading Knowledge Base:', e);
    }
    const initial = [...DEFAULT_KNOWLEDGE];
    this.saveArticles(initial);
    return initial;
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

  static updateArticle(article) {
    const articles = this.getArticles();
    const index = articles.findIndex(a => a.id === article.id);
    if (index !== -1) {
      articles[index] = {
        ...articles[index],
        category: article.category || articles[index].category,
        title: article.title || articles[index].title,
        content: article.content || articles[index].content,
        updatedAt: new Date().toISOString()
      };
      this.saveArticles(articles);
      return articles[index];
    }
    return null;
  }

  static deleteArticle(id) {
    let articles = this.getArticles();
    articles = articles.filter(a => a.id !== id);
    this.saveArticles(articles);
    return articles;
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
