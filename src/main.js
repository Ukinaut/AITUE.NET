// Import Styles
import './styles/main.css';
import './styles/components.css';
import './styles/ecommerce.css';

// ----------------------------------------------------
// 1. DYNAMIC TOP NAV INDICATOR & SCROLL SPY
// ----------------------------------------------------
const header = document.querySelector('.hud-header');
const navWrap = document.querySelector('.hud-nav-wrap');
const navLinks = document.querySelectorAll('.hud-nav-link');
const indicator = document.querySelector('.nav-indicator');
const sections = document.querySelectorAll('section[id], footer[id]');

function updateIndicator(element) {
  if (element && indicator) {
    indicator.style.left = `${element.offsetLeft}px`;
    indicator.style.width = `${element.offsetWidth}px`;
  }
}

// Initial positioning on load
window.addEventListener('load', () => {
  const activeLink = document.querySelector('.hud-nav-link.active');
  if (activeLink) {
    updateIndicator(activeLink);
  }
});

// Resize indicator on window resize
window.addEventListener('resize', () => {
  const activeLink = document.querySelector('.hud-nav-link.active');
  if (activeLink) {
    updateIndicator(activeLink);
  }
});

// ----------------------------------------------------
// 1.2 DYNAMIC 3D ROTATING LOGO SEQUENCE (3 IMAGES)
// ----------------------------------------------------
function initRotatingLogo() {
  const logoImgs = document.querySelectorAll('.logo-spinner .logo-img');
  if (logoImgs.length <= 1) return;

  let currentIndex = 0;

  function scheduleNext() {
    const currentImgSrc = logoImgs[currentIndex].getAttribute('src') || '';
    // Logos 4 and 5 pass faster (2000ms), while 1, 2, 3 remain for 5500ms
    const isFastLogo = currentImgSrc.includes('Log-win-nav4') || currentImgSrc.includes('Log-win-nav5');
    const delay = isFastLogo ? 2000 : 5500;

    setTimeout(() => {
      const prevIndex = currentIndex;
      currentIndex = (currentIndex + 1) % logoImgs.length;

      // Transition out previous logo with 3D exit flip
      logoImgs[prevIndex].classList.remove('active');
      logoImgs[prevIndex].classList.add('exit');

      setTimeout(() => {
        logoImgs[prevIndex].classList.remove('exit');
      }, 800);

      // Transition in new logo with 3D enter flip
      logoImgs[currentIndex].classList.add('active');

      scheduleNext();
    }, delay);
  }

  scheduleNext();
}

initRotatingLogo();

navLinks.forEach(link => {
  // Hover effect: slide indicator to hovered link
  link.addEventListener('mouseenter', () => {
    updateIndicator(link);
  });

  // Click behavior: smooth scroll to target section
  link.addEventListener('click', (e) => {
    e.preventDefault();
    const targetId = link.getAttribute('data-target');
    const targetSection = document.getElementById(targetId);

    if (targetSection) {
      const headerOffset = 75;
      const elementPosition = targetSection.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }

    navLinks.forEach(l => l.classList.remove('active'));
    link.classList.add('active');
    updateIndicator(link);
  });
});

// Reset indicator to active link when mouse leaves nav
if (navWrap) {
  navWrap.addEventListener('mouseleave', () => {
    const activeLink = document.querySelector('.hud-nav-link.active');
    if (activeLink) {
      updateIndicator(activeLink);
    }
  });
}

// Scroll Spy: Update active link as page is scrolled
window.addEventListener('scroll', () => {
  // Header Shrunk state
  if (header) {
    if (window.scrollY > 40) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  }

  let currentSectionId = '';
  const scrollPosition = window.scrollY + 120; // offset for nav height

  sections.forEach(section => {
    const sectionTop = section.offsetTop;
    const sectionHeight = section.offsetHeight;

    if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
      currentSectionId = section.getAttribute('id');
    }
  });

  if (currentSectionId) {
    const matchingLink = document.querySelector(`.hud-nav-link[data-target="${currentSectionId}"]`);
    if (matchingLink && !matchingLink.classList.contains('active')) {
      navLinks.forEach(l => l.classList.remove('active'));
      matchingLink.classList.add('active');
      updateIndicator(matchingLink);
    }
  }
});

// ----------------------------------------------------
// 2. MAGNETIC GLOW CARD MOUSE-TRACKING EFFECT
// ----------------------------------------------------
document.addEventListener('mousemove', (e) => {
  const cards = document.querySelectorAll('.glow-card');
  cards.forEach(card => {
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    card.style.setProperty('--mouse-x', `${x}px`);
    card.style.setProperty('--mouse-y', `${y}px`);
  });
});

// ----------------------------------------------------
// 3. CANVAS 3D PARALLAX ORBITAL SYSTEM (HERO)
// ----------------------------------------------------
const canvas = document.getElementById('stars-canvas');
if (canvas) {
  const ctx = canvas.getContext('2d');
  let width = canvas.width = canvas.offsetWidth;
  let height = canvas.height = canvas.offsetHeight;

  let mouseX = 0;
  let mouseY = 0;
  let targetTiltX = 0;
  let targetTiltY = 0;
  let currentTiltX = 0;
  let currentTiltY = 0;

  window.addEventListener('mousemove', (e) => {
    mouseX = (e.clientX - window.innerWidth / 2) / (window.innerWidth / 2);
    mouseY = (e.clientY - window.innerHeight / 2) / (window.innerHeight / 2);
    
    targetTiltX = mouseX * 0.3;
    targetTiltY = mouseY * 0.12;
  });

  const resizeCanvas = () => {
    if (canvas.offsetWidth > 0) {
      width = canvas.width = canvas.offsetWidth;
      height = canvas.height = canvas.offsetHeight;
    }
  };
  window.addEventListener('resize', resizeCanvas);

  const orbitsCount = 4;
  const particlesPerOrbit = 8;
  const particles = [];

  class Satellite {
    constructor(orbitIndex, angle) {
      this.orbitIndex = orbitIndex;
      this.angle = angle;
      this.speed = 0.003 + (orbitIndex * 0.0015);
      this.size = Math.random() * 2 + 1.2;
      this.baseRadiusX = 100 + (orbitIndex * 40);
      this.baseRadiusY = 30 + (orbitIndex * 10);
      this.color = orbitIndex % 2 === 0 ? 'rgba(89, 168, 255, 0.7)' : 'rgba(217, 70, 239, 0.7)';
    }

    update() {
      this.angle += this.speed;
      if (this.angle > Math.PI * 2) this.angle -= Math.PI * 2;
    }

    draw(tiltX, tiltY) {
      const cos = Math.cos(this.angle);
      const sin = Math.sin(this.angle);
      
      const rx = this.baseRadiusX;
      const ry = this.baseRadiusY;

      let x = cos * rx;
      let y = sin * ry;

      const rotatedX = x * Math.cos(tiltX) - y * Math.sin(tiltX);
      const rotatedY = x * Math.sin(tiltX) + y * Math.cos(tiltX) + (cos * tiltY * 70);

      // Shift orbit center to center of canvas
      const centerX = width * 0.5;
      const centerY = height * 0.5;

      const finalX = centerX + rotatedX;
      const finalY = centerY + rotatedY;

      const depthScale = (sin + 1.5) / 2.5;
      const size = this.size * depthScale;

      if (depthScale > 0.4) {
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(finalX, finalY);
        ctx.strokeStyle = this.orbitIndex % 2 === 0 ? `rgba(89, 168, 255, ${depthScale * 0.03})` : `rgba(217, 70, 239, ${depthScale * 0.02})`;
        ctx.stroke();
      }

      ctx.beginPath();
      ctx.arc(finalX, finalY, size, 0, Math.PI * 2);
      ctx.fillStyle = this.color;
      ctx.fill();
    }
  }

  for (let o = 0; o < orbitsCount; o++) {
    for (let p = 0; p < particlesPerOrbit; p++) {
      const startAngle = (p / particlesPerOrbit) * Math.PI * 2;
      particles.push(new Satellite(o, startAngle));
    }
  }

  function drawOrbitsPath(tiltX, tiltY) {
    const centerX = width * 0.5;
    const centerY = height * 0.5;

    for (let o = 0; o < orbitsCount; o++) {
      const rx = 100 + (o * 40);
      const ry = 30 + (o * 10);

      ctx.beginPath();
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(tiltX);
      ctx.scale(1, ry / rx);
      ctx.arc(0, 0, rx, 0, Math.PI * 2);
      ctx.restore();
      
      ctx.strokeStyle = o % 2 === 0 ? 'rgba(89, 168, 255, 0.04)' : 'rgba(217, 70, 239, 0.02)';
      ctx.stroke();
    }

    // Core central node
    ctx.beginPath();
    ctx.arc(centerX, centerY, 20, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(12, 35, 74, 0.85)';
    ctx.strokeStyle = 'rgba(89, 168, 255, 0.25)';
    ctx.lineWidth = 1.5;
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(centerX, centerY, 5, 0, Math.PI * 2);
    ctx.fillStyle = '#59A8FF';
    ctx.fill();
  }

  function animate() {
    ctx.clearRect(0, 0, width, height);

    currentTiltX += (targetTiltX - currentTiltX) * 0.05;
    currentTiltY += (targetTiltY - currentTiltY) * 0.05;

    drawOrbitsPath(currentTiltX, currentTiltY);

    particles.forEach(satellite => {
      satellite.update();
      satellite.draw(currentTiltX, currentTiltY);
    });

    requestAnimationFrame(animate);
  }
  animate();
}

// ----------------------------------------------------
// 4. AITUE ULTRA+ CABINET INTERACTIVE HOTSPOTS
// ----------------------------------------------------
const hotspots = document.querySelectorAll('.hotspot');
const infoTitle = document.querySelector('.cabinet-info-title');
const infoDesc = document.getElementById('cabinet-info-desc');

const hotspotData = {
  1: {
    title: "SCAN: 001_DOME_SHIELD // PROTECCIÃ“N DE CÃšPULA",
    desc: "CÃºpula aerodinÃ¡mica de ingenierÃ­a aeroespacial. Fabricada con polÃ­meros especiales con bloqueo ultravioleta. Protege el terminal satelital de temperaturas extremas, lluvia Ã¡cida y golpes de piedras sin mermar la transferencia de datos."
  },
  2: {
    title: "SCAN: 002_ARMOR_360 // GABINETE BLINDADO IP67",
    desc: "Placa metÃ¡lica blindada con sellado hermÃ©tico contra partÃ­culas de polvo y agua. Capacidad de absorciÃ³n de impactos grado IK10 certificado. DiseÃ±ado para maquinaria de excavaciÃ³n minera pesada y transportes tÃ¡cticos."
  },
  3: {
    title: "SCAN: 003_POWER_UPS // FILTRADO Y ESTABILIZADOR",
    desc: "Aislador elÃ©ctrico y regulador de tensiÃ³n redundante. Asegura alimentaciÃ³n trifÃ¡sica o continua de 12V/24V, inmunizando la antena satelital contra caÃ­das de baterÃ­a al encender motores o sobretensiones de alternadores."
  },
  4: {
    title: "SCAN: 004_FIX_ING // INGENIERÃA DE MONTAJE MÃ“VIL",
    desc: "Soportes modulares intercambiables a demanda. Imanes de neodimio de grado militar que soportan rÃ¡fagas de viento superiores a 180 km/h o anclajes permanentes certificados sobre techos de embarcaciones y vehÃ­culos pesados."
  }
};

hotspots.forEach(spot => {
  spot.addEventListener('click', () => {
    const id = spot.getAttribute('data-id');
    const data = hotspotData[id];
    
    if (data) {
      infoTitle.textContent = data.title;
      infoDesc.textContent = data.desc;
      
      // Highlight selected hotspot
      hotspots.forEach(s => s.style.borderColor = 'var(--color-accent)');
      spot.style.borderColor = 'var(--color-cyber)';
    }
  });
});

// Auto-trigger first hotspot on load
if (hotspots.length > 0) {
  hotspots[0].click();
}

// ----------------------------------------------------
// 5. B2B CONFIGURATOR DRAWER MANAGER
// ----------------------------------------------------
const backdrop = document.getElementById('config-backdrop');
const drawer = document.getElementById('config-drawer');
const drawerCloseBtn = document.getElementById('drawer-close-btn');

const openConfiguratorBtns = document.querySelectorAll('.open-configurator');
const heroConfiguratorBtn = document.getElementById('hero-to-configurator');
const partnersCtaBtn = document.getElementById('cta-partners-distribuidor');

function openDrawer() {
  if (backdrop && drawer) {
    backdrop.classList.add('active');
    drawer.classList.add('active');
    document.body.style.overflow = 'hidden'; // block page scroll
  }
}

function closeDrawer() {
  if (backdrop && drawer) {
    backdrop.classList.remove('active');
    drawer.classList.remove('active');
    document.body.style.overflow = ''; // restore scroll
  }
}

// Attach open events
openConfiguratorBtns.forEach(btn => btn.addEventListener('click', openDrawer));
if (heroConfiguratorBtn) heroConfiguratorBtn.addEventListener('click', openDrawer);
if (drawerCloseBtn) drawerCloseBtn.addEventListener('click', closeDrawer);
if (backdrop) backdrop.addEventListener('click', closeDrawer);

// Partners special setup: prefill and open drawer form directly
if (partnersCtaBtn) {
  partnersCtaBtn.addEventListener('click', () => {
    openDrawer();
    
    // Prefill notes field
    const notesField = document.getElementById('quote-notes');
    if (notesField) {
      notesField.value = "InterÃ©s en unirme a la red de distribuidores de AITUE COMUNICA en mi paÃ­s/regiÃ³n.";
    }

    // Go straight to step/form transition if desired
    const configSteps = document.getElementById('drawer-steps-content');
    const b2bForm = document.getElementById('drawer-form-content');
    const backBtn = document.getElementById('config-back-action');
    const mainActionBtn = document.getElementById('config-main-action');

    if (configSteps && b2bForm) {
      configSteps.style.display = 'none';
      b2bForm.style.display = 'block';
      if (backBtn) backBtn.style.display = 'block';
      if (mainActionBtn) mainActionBtn.textContent = 'Enviar Solicitud âœ“';
      currentDrawerState = 'form';
    }
  });
}

// Option selection handler inside drawer
const optionCards = document.querySelectorAll('.option-card');
const drawerStepsContent = document.getElementById('drawer-steps-content');
const drawerFormContent = document.getElementById('drawer-form-content');
const configMainAction = document.getElementById('config-main-action');
const configBackAction = document.getElementById('config-back-action');
const totalPriceValue = document.getElementById('config-total-price');
const quoteForm = document.getElementById('b2b-quote-form');

optionCards.forEach(card => {
  card.addEventListener('click', () => {
    const step = card.getAttribute('data-step');
    
    if (step === "1" || step === "2") {
      document.querySelectorAll(`.option-card[data-step="${step}"]`).forEach(c => {
        c.classList.remove('selected');
      });
      card.classList.add('selected');
    } else if (step === "3") {
      card.classList.toggle('selected');
    }
    
    calculateTotal();
  });
});

function calculateTotal() {
  let total = 0;
  const selectedOptions = [];
  
  document.querySelectorAll('.option-card.selected').forEach(card => {
    const price = parseInt(card.getAttribute('data-price')) || 0;
    total += price;
    selectedOptions.push(card.getAttribute('data-name'));
  });
  
  if (totalPriceValue) {
    totalPriceValue.innerHTML = `$${total.toLocaleString()} <span>USD</span>`;
  }
  return { total, selectedOptions };
}

let currentDrawerState = 'steps';

if (configMainAction) {
  configMainAction.addEventListener('click', () => {
    if (currentDrawerState === 'steps') {
      drawerStepsContent.style.display = 'none';
      drawerFormContent.style.display = 'block';
      configBackAction.style.display = 'block';
      configMainAction.textContent = 'Enviar Solicitud âœ“';
      currentDrawerState = 'form';
    } else if (currentDrawerState === 'form') {
      if (quoteForm.checkValidity()) {
        submitDrawerLead();
      } else {
        quoteForm.reportValidity();
      }
    }
  });
}

if (configBackAction) {
  configBackAction.addEventListener('click', () => {
    if (currentDrawerState === 'form') {
      drawerStepsContent.style.display = 'flex';
      drawerFormContent.style.display = 'none';
      configBackAction.style.display = 'none';
      configMainAction.textContent = 'Solicitar Propuesta Comercial â†’';
      currentDrawerState = 'steps';
    }
  });
}

function submitDrawerLead() {
  const { total, selectedOptions } = calculateTotal();
  const name = document.getElementById('quote-name').value;
  const email = document.getElementById('quote-email').value;
  const company = document.getElementById('quote-company').value;
  const fleet = document.getElementById('quote-fleet').value;

  // Replace drawer body with success screen
  const drawerBody = document.querySelector('.drawer-body');
  if (drawerBody) {
    drawerBody.innerHTML = `
      <div class="config-success">
        <div class="success-icon">âœ“</div>
        <h3 style="font-family: var(--font-title); text-transform: uppercase; margin-bottom: 0.5rem;">Propuesta Solicitada</h3>
        <p style="color: var(--text-secondary); font-size: 0.85rem; line-height: 1.6; margin-bottom: 1.5rem;">
          Operador <strong>${name}</strong> registrado.<br>
          EstimaciÃ³n: <strong style="color: var(--color-cyber)">$${total.toLocaleString()} USD</strong> para <strong>${fleet}</strong> unidades.
        </p>
        
        <div style="background: rgba(1, 4, 13, 0.7); border: 1px solid rgba(89, 168, 255, 0.15); padding: 1rem; border-radius: 4px; text-align: left; width: 100%; font-family: var(--font-mono); font-size: 0.75rem; margin-bottom: 1.5rem;">
          <strong style="color: var(--color-accent); display: block; margin-bottom: 0.6rem;">TELEMETRÃA CONFIGURADA:</strong>
          <ul style="list-style: none; padding-left: 0; color: var(--text-secondary);">
            ${selectedOptions.map(opt => `<li style="margin-bottom: 0.3rem;">> ${opt}</li>`).join('')}
          </ul>
        </div>
        
        <p style="color: var(--text-muted); font-size: 0.8rem; line-height: 1.6;">
          Enviamos el dossier comercial de hardware a <strong>${email}</strong>. Un especialista de AITUE validarÃ¡ los requisitos de tu flota en breve.
        </p>
        <button class="btn btn-primary" id="drawer-success-reset" style="margin-top: 1.5rem; width: 100%;">Reiniciar OperaciÃ³n</button>
      </div>
    `;

    // Hide calculations buttons footer
    const drawerFooter = document.querySelector('.drawer-footer');
    if (drawerFooter) drawerFooter.style.display = 'none';

    document.getElementById('drawer-success-reset').addEventListener('click', () => {
      location.reload();
    });
  }
}

// ----------------------------------------------------
// 1.3 DYNAMIC 3D ROTATING WHATSAPP BUTTON SEQUENCE
// ----------------------------------------------------
function initRotatingWhatsapp() {
  const whatsappImgs = document.querySelectorAll('.whatsapp-spinner .logo-img');
  if (whatsappImgs.length <= 1) return;

  let currentIndex = 0;

  function scheduleNext() {
    setTimeout(() => {
      const prevIndex = currentIndex;
      currentIndex = (currentIndex + 1) % whatsappImgs.length;

      // Transition out previous logo with 3D exit flip
      whatsappImgs[prevIndex].classList.remove('active');
      whatsappImgs[prevIndex].classList.add('exit');

      setTimeout(() => {
        whatsappImgs[prevIndex].classList.remove('exit');
      }, 800);

      // Transition in new logo with 3D enter flip
      whatsappImgs[currentIndex].classList.add('active');

      // Dynamically update glow variables depending on active logo
      const parentBtn = document.getElementById('whatsapp-float-btn');
      if (parentBtn) {
        if (currentIndex === 0) {
          // WhatsApp Active Color Variables (Green Glow)
          parentBtn.style.setProperty('--whatsapp-active-color', 'rgba(37, 211, 102, 0.4)');
          parentBtn.style.setProperty('--whatsapp-glow-color', 'rgba(37, 211, 102, 0.2)');
          parentBtn.style.setProperty('--whatsapp-active-hover-color', 'rgba(37, 211, 102, 0.8)');
          parentBtn.style.setProperty('--whatsapp-glow-hover-color', 'rgba(37, 211, 102, 0.4)');
        } else {
          // AITUE Active Color Variables (Cyan Glow)
          parentBtn.style.setProperty('--whatsapp-active-color', 'rgba(89, 168, 255, 0.4)');
          parentBtn.style.setProperty('--whatsapp-glow-color', 'rgba(89, 168, 255, 0.2)');
          parentBtn.style.setProperty('--whatsapp-active-hover-color', 'rgba(89, 168, 255, 0.8)');
          parentBtn.style.setProperty('--whatsapp-glow-hover-color', 'rgba(89, 168, 255, 0.4)');
        }
      }

      scheduleNext();
    }, 4500);
  }

  scheduleNext();
}

initRotatingWhatsapp();

// Dynamic contrast logic for floating WhatsApp button
function updateWhatsappContrast() {
  const btn = document.getElementById('whatsapp-float-btn');
  const lightSections = document.querySelectorAll('.star-products-section');
  if (!btn || lightSections.length === 0) return;

  const btnRect = btn.getBoundingClientRect();
  let overlapsLight = false;

  lightSections.forEach(section => {
    const secRect = section.getBoundingClientRect();
    // Check if the button overlaps the vertical range of the light section
    if (btnRect.bottom > secRect.top && btnRect.top < secRect.bottom) {
      overlapsLight = true;
    }
  });

  if (overlapsLight) {
    btn.classList.add('contrast-light');
  } else {
    btn.classList.remove('contrast-light');
  }
}

window.addEventListener('scroll', updateWhatsappContrast);
window.addEventListener('resize', updateWhatsappContrast);
window.addEventListener('load', updateWhatsappContrast);
updateWhatsappContrast();

// Assistance Hub Menu Toggle Logic
const hubContainer = document.getElementById('assistance-hub');
const floatBtn = document.getElementById('whatsapp-float-btn');
if (floatBtn && hubContainer) {
  floatBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    hubContainer.classList.toggle('open');
  });
}

// Close menu when clicking outside
document.addEventListener('click', () => {
  if (hubContainer) {
    hubContainer.classList.remove('open');
  }
});

// Virtual Assistant Chat Interface Logic
function initAssistantChat() {
  const chatContainer = document.getElementById('assistant-chat');
  const chatCloseBtn = document.getElementById('chat-close-btn');
  const chatInput = document.getElementById('chat-input');
  const chatSendBtn = document.getElementById('chat-send-btn');
  const chatMessages = document.getElementById('chat-messages');
  const botTrigger = document.getElementById('bot-assistance-trigger');

  if (!chatContainer) return;

  // Open Chat from Assistance Menu
  if (botTrigger) {
    botTrigger.addEventListener('click', (e) => {
      e.stopPropagation();
      if (hubContainer) hubContainer.classList.remove('open');
      chatContainer.classList.add('active');
      chatInput.focus();
    });
  }

  // Close Chat
  if (chatCloseBtn) {
    chatCloseBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      chatContainer.classList.remove('active');
    });
  }

  // Prevent closing when clicking inside the chatbox
  chatContainer.addEventListener('click', (e) => {
    e.stopPropagation();
  });

  // Send message function
  function sendMessage() {
    const text = chatInput.value.trim();
    if (!text) return;

    // Add user message
    addMessage(text, 'user');
    chatInput.value = '';

    // Show typing indicator
    showTypingIndicator();

    // Scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;

    // Mock bot responses based on keywords
    setTimeout(() => {
      removeTypingIndicator();
      let reply = "Lo lamento, en este momento estoy operando en modo local fuera de lÃ­nea. PrÃ³ximamente se integrarÃ¡ mi panel con la API de OpenAI para brindarte respuestas inteligentes personalizadas sobre Starlink Mini e integraciones industriales.";
      
      const lower = text.toLowerCase();
      if (lower.includes('hola') || lower.includes('buen')) {
        reply = "Â¡Hola! Â¿CÃ³mo estÃ¡s? Soy el Asistente Virtual de AITUE COMUNICA. Â¿En quÃ© te puedo asesorar hoy sobre conectividad Starlink Mini e integraciones industriales?";
      } else if (lower.includes('starlink') || lower.includes('mini')) {
        reply = "Ofrecemos gabinetes blindados e integraciones redundantes personalizadas para Starlink Mini y Standard. Â¿Te interesarÃ­a cotizar un modelo Standard, Pro o Ultra+?";
      } else if (lower.includes('precio') || lower.includes('cuanto') || lower.includes('costo')) {
        reply = "Los precios base de integraciÃ³n son: Standard ($800 USD), Pro ($1200 USD) y Flagship Ultra+ ($1500 USD). Puedes ver los detalles usando el cotizador B2B de la pÃ¡gina web.";
      } else if (lower.includes('contacto') || lower.includes('telefono') || lower.includes('mail')) {
        reply = "Puedes llamarnos al 0800 345 2488 o enviarnos un email a comercial@aitue.net. Â¡TambiÃ©n puedes pulsar en 'Chat WhatsApp' en el menÃº de asistencia!";
      }

      addMessage(reply, 'bot');
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }, 1500);
  }

  function addMessage(text, sender) {
    const msgDiv = document.createElement('div');
    msgDiv.className = `chat-message ${sender}`;
    
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    msgDiv.innerHTML = `<p>${text}</p><span class="message-time">${timeStr}</span>`;
    chatMessages.appendChild(msgDiv);
  }

  let typingIndicator = null;

  function showTypingIndicator() {
    if (typingIndicator) return;
    typingIndicator = document.createElement('div');
    typingIndicator.className = 'typing-indicator';
    typingIndicator.innerHTML = `
      <div class="typing-dot"></div>
      <div class="typing-dot"></div>
      <div class="typing-dot"></div>
    `;
    chatMessages.appendChild(typingIndicator);
  }

  function removeTypingIndicator() {
    if (typingIndicator) {
      typingIndicator.remove();
      typingIndicator = null;
    }
  }

  // Event Listeners
  if (chatSendBtn) {
    chatSendBtn.addEventListener('click', sendMessage);
  }

  if (chatInput) {
    chatInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        sendMessage();
      }
    });
  }
}

// Call on initialize
initAssistantChat();

// Interactive Card Stack Cycling
function initCardStack() {
  const stack = document.getElementById('interactive-card-stack');
  const indexDisplay = document.getElementById('stack-index-display');
  if (!stack) return;

  let isCycling = false;

  stack.addEventListener('click', () => {
    if (isCycling) return;
    isCycling = true;

    // Find the current card at the top (data-index="1")
    const cards = Array.from(stack.querySelectorAll('.stack-card'));
    const topCard = cards.find(card => card.getAttribute('data-index') === '1');

    if (!topCard) {
      isCycling = false;
      return;
    }

    // Add slide-out class for animation
    topCard.classList.add('slide-out');

    setTimeout(() => {
      // Shift data-indexes to cycle the cards
      cards.forEach(card => {
        let currentIndex = parseInt(card.getAttribute('data-index'));
        let nextIndex = currentIndex - 1;
        if (nextIndex < 1) {
          nextIndex = cards.length;
        }
        card.setAttribute('data-index', nextIndex.toString());
      });

      // Remove slide-out from the old top card
      topCard.classList.remove('slide-out');

      // Update active classes and update stack index display
      cards.forEach(card => {
        if (card.getAttribute('data-index') === '1') {
          card.classList.add('active');
        } else {
          card.classList.remove('active');
        }
      });

      // Find new active card to update the HUD telemetry text
      const newActive = cards.find(card => card.getAttribute('data-index') === '1');
      if (indexDisplay && newActive) {
        // Find its original position order in the DOM
        const origPosition = cards.indexOf(newActive) + 1;
        const tagText = newActive.querySelector('.card-tag').textContent.replace('#', '').toUpperCase();
        indexDisplay.textContent = `${origPosition} / ${cards.length} [${tagText}]`;
      }

      isCycling = false;
    }, 600); // matches the 0.6s css transition duration
  });
}

// Initialize Card Stack
initCardStack();

// ----------------------------------------------------
// 10. PRODUCT GALLERY & LIGHTBOX INTERACTIVITY
// ----------------------------------------------------
function initProductGallery() {
  const standardImages = [
    { src: '/src/assets/standar-1.png', label: 'FOTO 1/3: VISTA FRONTAL CERRADA', title: 'Gabinete AITUE Standard - Vista Frontal' },
    { src: '/src/assets/standar-2.png', label: 'FOTO 2/3: DESPIECE / INTERIOR Y CABLEADO', title: 'Gabinete AITUE Standard - Vista Abierta' },
    { src: '/src/assets/standar-3.png', label: 'FOTO 3/3: PLACA INTERNA Y TAPA CUBIERTA', title: 'Gabinete AITUE Standard - Componentes' }
  ];

  const proImages = [
    { src: '/src/assets/pro-1.png', label: 'FOTO 1/3: BASES MAGNÃ‰TICAS 360Â°', title: 'Gabinete AITUE Pro - Soportes MagnÃ©ticos' },
    { src: '/src/assets/pro-2.png', label: 'FOTO 2/3: DESPIECE / BASE Y TORNILLERÃA', title: 'Gabinete AITUE Pro - Despiece Industrial' },
    { src: '/src/assets/pro-3.png', label: 'FOTO 3/3: MONTAJE INTERNO Y SOPORTES', title: 'Gabinete AITUE Pro - Estructura Interna' }
  ];

  function setupCardGallery(cardType, images, mainId, labelId, btnSelector, lightboxTriggerId) {
    const mainImg = document.getElementById(mainId);
    const labelSpan = document.getElementById(labelId);
    const thumbBtns = document.querySelectorAll(btnSelector);
    const openLightboxBtn = document.getElementById(lightboxTriggerId);

    let localIndex = 0;

    thumbBtns.forEach((btn, idx) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        thumbBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const src = btn.getAttribute('data-src');
        const label = btn.getAttribute('data-label');

        if (mainImg) {
          mainImg.style.opacity = '0';
          setTimeout(() => {
            mainImg.src = src;
            mainImg.style.opacity = '1';
          }, 150);
        }
        if (labelSpan) {
          labelSpan.textContent = label;
        }
        localIndex = idx;
      });
    });

    function launchLightbox() {
      openLightboxWithGallery(images, localIndex);
    }

    if (openLightboxBtn) {
      openLightboxBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        launchLightbox();
      });
    }

    if (mainImg) {
      mainImg.addEventListener('click', (e) => {
        e.stopPropagation();
        launchLightbox();
      });
    }
  }

  // Setup Standard Card Gallery
  setupCardGallery('standard', standardImages, 'standard-gallery-main', 'standard-gallery-label', '.product-thumb-btn:not(.pro-thumb)', 'open-lightbox-standard');

  // Setup Pro Card Gallery
  setupCardGallery('pro', proImages, 'pro-gallery-main', 'pro-gallery-label', '.pro-thumb', 'open-lightbox-pro');

  // Lightbox Shared Modal Logic
  let activeGalleryImages = [];
  let activeGalleryIndex = 0;

  const lightboxModal = document.getElementById('product-lightbox');
  const lightboxImg = document.getElementById('lightbox-img');
  const lightboxTitle = document.getElementById('lightbox-title');
  const lightboxCaption = document.getElementById('lightbox-caption');
  const lightboxCounter = document.getElementById('lightbox-counter');
  const lightboxCloseBtn = document.getElementById('lightbox-close-btn');
  const lightboxBackdrop = document.getElementById('lightbox-backdrop');
  const lightboxPrevBtn = document.getElementById('lightbox-prev-btn');
  const lightboxNextBtn = document.getElementById('lightbox-next-btn');

  function updateLightbox() {
    if (!activeGalleryImages.length) return;
    const currentData = activeGalleryImages[activeGalleryIndex];
    if (lightboxImg) lightboxImg.src = currentData.src;
    if (lightboxTitle) lightboxTitle.textContent = currentData.title;
    if (lightboxCaption) lightboxCaption.textContent = currentData.label;
    if (lightboxCounter) lightboxCounter.textContent = `${activeGalleryIndex + 1} / ${activeGalleryImages.length}`;
  }

  function openLightboxWithGallery(imagesList, initialIndex) {
    if (!lightboxModal) return;
    activeGalleryImages = imagesList;
    activeGalleryIndex = initialIndex || 0;
    updateLightbox();
    lightboxModal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    if (!lightboxModal) return;
    lightboxModal.classList.remove('active');
    document.body.style.overflow = '';
  }

  if (lightboxCloseBtn) lightboxCloseBtn.addEventListener('click', closeLightbox);
  if (lightboxBackdrop) lightboxBackdrop.addEventListener('click', closeLightbox);

  if (lightboxPrevBtn) {
    lightboxPrevBtn.addEventListener('click', () => {
      if (!activeGalleryImages.length) return;
      activeGalleryIndex = (activeGalleryIndex - 1 + activeGalleryImages.length) % activeGalleryImages.length;
      updateLightbox();
    });
  }

  if (lightboxNextBtn) {
    lightboxNextBtn.addEventListener('click', () => {
      if (!activeGalleryImages.length) return;
      activeGalleryIndex = (activeGalleryIndex + 1) % activeGalleryImages.length;
      updateLightbox();
    });
  }

  document.addEventListener('keydown', (e) => {
    if (!lightboxModal || !lightboxModal.classList.contains('active')) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft' && activeGalleryImages.length) {
      activeGalleryIndex = (activeGalleryIndex - 1 + activeGalleryImages.length) % activeGalleryImages.length;
      updateLightbox();
    }
    if (e.key === 'ArrowRight' && activeGalleryImages.length) {
      activeGalleryIndex = (activeGalleryIndex + 1) % activeGalleryImages.length;
      updateLightbox();
    }
  });
}

initProductGallery();

// ----------------------------------------------------
// 11. PRODUCT HOVER POPUP INTERACTIVITY (STANDARD & PRO)
// ----------------------------------------------------
function initHoverDetails() {
  function setupHoverPopover(cardId, hintId, popoverId, closeId, backdropId) {
    const cardContainer = document.getElementById(cardId);
    const hoverHint = document.getElementById(hintId);
    const popover = document.getElementById(popoverId);
    const closeBtn = document.getElementById(closeId);
    const backdrop = document.getElementById(backdropId);

    if (!cardContainer || !popover) return;

    let hoverTimer = null;

    function openPopover() {
      popover.classList.add('active');
      document.body.style.overflow = 'hidden';
      if (hoverHint) hoverHint.classList.remove('active-hover');
    }

    function closePopover() {
      popover.classList.remove('active');
      document.body.style.overflow = '';
    }

    cardContainer.addEventListener('mouseenter', () => {
      if (hoverHint) hoverHint.classList.add('active-hover');
      hoverTimer = setTimeout(() => {
        openPopover();
      }, 1400);
    });

    cardContainer.addEventListener('mouseleave', () => {
      if (hoverHint) hoverHint.classList.remove('active-hover');
      if (hoverTimer) {
        clearTimeout(hoverTimer);
        hoverTimer = null;
      }
    });

    if (hoverHint) {
      hoverHint.addEventListener('click', (e) => {
        e.stopPropagation();
        openPopover();
      });
    }

    if (closeBtn) closeBtn.addEventListener('click', closePopover);
    if (backdrop) backdrop.addEventListener('click', closePopover);

    document.addEventListener('keydown', (e) => {
      if (popover && popover.classList.contains('active') && e.key === 'Escape') {
        closePopover();
      }
    });
  }

  // Setup Standard Popover
  setupHoverPopover('card-standard-container', 'standard-hover-hint', 'standard-hover-popover', 'popover-close-standard', 'popover-backdrop-standard');

  // Setup Pro Popover
  setupHoverPopover('card-pro-container', 'pro-hover-hint', 'pro-hover-popover', 'popover-close-pro', 'popover-backdrop-pro');
}

initHoverDetails();

// ----------------------------------------------------
// 12. NETWORK CONSTELLATION BACKGROUND ANIMATION
// ----------------------------------------------------
function initNetworkConstellation() {
  const canvas = document.getElementById('products-network-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let width = (canvas.width = canvas.offsetWidth);
  let height = (canvas.height = canvas.offsetHeight);

  // Resize handler
  window.addEventListener('resize', () => {
    if (canvas.offsetWidth > 0) {
      width = canvas.width = canvas.offsetWidth;
      height = canvas.height = canvas.offsetHeight;
    }
  });

  const nodes = [];
  const maxNodes = 45;
  const connectionDistance = 140;

  // Pulse Rings Array
  const pulses = [];
  const maxPulses = 5;

  class Node {
    constructor() {
      this.x = Math.random() * width;
      this.y = Math.random() * height;
      this.vx = (Math.random() - 0.5) * 0.45;
      this.vy = (Math.random() - 0.5) * 0.45;
      this.radius = Math.random() * 2.5 + 1.5;
    }

    update() {
      this.x += this.vx;
      this.y += this.vy;

      // Bounce off walls
      if (this.x < 0 || this.x > width) this.vx *= -1;
      if (this.y < 0 || this.y > height) this.vy *= -1;
    }

    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fillStyle = '#59A8FF';
      ctx.shadowColor = '#59A8FF';
      ctx.shadowBlur = 8;
      ctx.fill();
      ctx.shadowBlur = 0; // reset
    }
  }

  class PulseRing {
    constructor(x, y) {
      this.x = x || Math.random() * width;
      this.y = y || Math.random() * height;
      this.radius = 1;
      this.maxRadius = Math.random() * 40 + 25;
      this.opacity = 1;
      this.speed = Math.random() * 0.3 + 0.2;
    }

    update() {
      this.radius += this.speed;
      this.opacity = 1 - this.radius / this.maxRadius;
    }

    draw() {
      ctx.strokeStyle = `rgba(89, 168, 255, ${this.opacity * 0.6})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.stroke();

      // Double ring effect
      if (this.radius > 10) {
        ctx.strokeStyle = `rgba(255, 255, 255, ${this.opacity * 0.35})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius - 8, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
  }

  // Populate Nodes
  for (let i = 0; i < maxNodes; i++) {
    nodes.push(new Node());
  }

  // Spawn periodic pulse rings
  setInterval(() => {
    if (pulses.length < maxPulses) {
      // Spawn near a random existing node or random coords
      if (nodes.length > 0 && Math.random() > 0.4) {
        const randomNode = nodes[Math.floor(Math.random() * nodes.length)];
        pulses.push(new PulseRing(randomNode.x, randomNode.y));
      } else {
        pulses.push(new PulseRing());
      }
    }
  }, 1800);

  function animate() {
    ctx.clearRect(0, 0, width, height);

    // Draw grid lines
    ctx.strokeStyle = 'rgba(89, 168, 255, 0.025)';
    ctx.lineWidth = 0.5;
    const gridSize = 80;
    for (let x = 0; x < width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Update and draw pulse rings
    for (let i = pulses.length - 1; i >= 0; i--) {
      const p = pulses[i];
      p.update();
      p.draw();
      if (p.radius >= p.maxRadius) {
        pulses.splice(i, 1);
      }
    }

    // Connect nodes
    for (let i = 0; i < nodes.length; i++) {
      const n1 = nodes[i];
      for (let j = i + 1; j < nodes.length; j++) {
        const n2 = nodes[j];
        const dx = n1.x - n2.x;
        const dy = n1.y - n2.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < connectionDistance) {
          const alpha = 1 - dist / connectionDistance;
          ctx.strokeStyle = `rgba(89, 168, 255, ${alpha * 0.15})`;
          ctx.lineWidth = alpha * 0.85;
          ctx.beginPath();
          ctx.moveTo(n1.x, n1.y);
          ctx.lineTo(n2.x, n2.y);
          ctx.stroke();
        }
      }
    }

    // Draw and update nodes
    nodes.forEach((node) => {
      node.update();
      node.draw();
    });

    requestAnimationFrame(animate);
  }

  animate();
}

initNetworkConstellation();

// Initial total calc
calculateTotal();

// ─────────────────────────────────────────────────────────────
// PRODUCT TABS — switching logic
// ─────────────────────────────────────────────────────────────
document.querySelectorAll('.prod-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    const target = tab.dataset.tab;
    document.querySelectorAll('.prod-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.prod-panel').forEach(p => p.classList.remove('active'));
    tab.classList.add('active');
    const panel = document.getElementById('panel-' + target);
    if (panel) panel.classList.add('active');
  });
});

// New product thumbnail handler (prod-thumb class)
document.querySelectorAll('.prod-thumb').forEach(btn => {
  btn.addEventListener('click', () => {
    const src = btn.dataset.src;
    const targetId = btn.dataset.target;
    const mainImg = document.getElementById(targetId);
    if (mainImg && src) {
      mainImg.style.opacity = '0';
      setTimeout(() => {
        mainImg.src = src;
        mainImg.style.opacity = '1';
      }, 200);
    }
    // Update active state within the same thumb row
    const row = btn.closest('.prod-thumb-row');
    if (row) {
      row.querySelectorAll('.prod-thumb').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    }
  });
});

// ─────────────────────────────────────────────────────────────
// TRUST STRIP — animated counter
// ─────────────────────────────────────────────────────────────
function animateCounter(el) {
  const target = parseInt(el.dataset.target, 10);
  const duration = 1200;
  const start = performance.now();
  function step(now) {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.round(eased * target);
    if (progress < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

const counterObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      animateCounter(entry.target);
      counterObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.5 });

document.querySelectorAll('.trust-num[data-target]').forEach(el => {
  counterObserver.observe(el);
});


// ─────────────────────────────────────────────────────────────
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
    }
  });
}, {
  threshold: 0.12,
  rootMargin: '0px 0px -40px 0px'
});

document.querySelectorAll('.reveal-item').forEach(el => {
  revealObserver.observe(el);
});

// ─────────────────────────────────────────────────────────────
// SCROLL INDICATOR CLICK — smooth scroll to next section
// ─────────────────────────────────────────────────────────────
const scrollIndicator = document.querySelector('.hero-scroll-indicator');
if (scrollIndicator) {
  scrollIndicator.addEventListener('click', () => {
    const productsSection = document.querySelector('.star-products-section');
    if (productsSection) {
      productsSection.scrollIntoView({ behavior: 'smooth' });
    }
  });
}


