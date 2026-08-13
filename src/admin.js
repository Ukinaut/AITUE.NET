// ----------------------------------------------------
// AITUE COMUNICA S.A. - ADMIN DASHBOARD LOGIC
// ----------------------------------------------------
import './styles/admin.css';
import { OpenAIService } from './services/openai.js';
import { KnowledgeService } from './services/knowledge.js';
import { UsersService } from './services/users.js';

const ADMIN_SESSION_KEY = 'aitue_admin_session';

document.addEventListener('DOMContentLoaded', () => {

  // ----------------------------------------------------
  // DOM ELEMENTS
  // ----------------------------------------------------
  const loginView = document.getElementById('admin-login-view');
  const dashboardView = document.getElementById('admin-dashboard-view');
  const loginForm = document.getElementById('admin-login-form');
  const loginEmailInput = document.getElementById('login-email');
  const loginPasswordInput = document.getElementById('login-password');
  const loginFeedbackMsg = document.getElementById('login-feedback-msg');
  const logoutBtn = document.getElementById('admin-logout-btn');
  const userDisplay = document.getElementById('admin-user-display');

  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabViews = document.querySelectorAll('.tab-content-view');
  const launcherCards = document.querySelectorAll('.hub-launcher-card, [data-launch]');

  const cfgApiKey = document.getElementById('cfg-api-key');
  const cfgModel = document.getElementById('cfg-model');
  const cfgMaxTokens = document.getElementById('cfg-max-tokens');
  const cfgTemperature = document.getElementById('cfg-temperature');
  const tempValDisplay = document.getElementById('temp-val-display');
  const toggleShowKeyBtn = document.getElementById('toggle-show-key');
  const openaiTestFeedback = document.getElementById('openai-test-feedback');
  const testOpenAiBtn = document.getElementById('test-openai-btn');

  const promptWebAssistant = document.getElementById('prompt-web-assistant');
  const saveWebPromptBtn = document.getElementById('save-web-prompt-btn');

  const promptWpBot = document.getElementById('prompt-wp-bot');
  const saveWpConfigBtn = document.getElementById('save-wp-config-btn');
  const wpTriggersContainer = document.getElementById('wp-triggers-container');

  const openaiStatusText = document.getElementById('openai-status-text');
  const openaiStatusPill = document.getElementById('openai-status-pill');
  const engineTypeDisplay = document.getElementById('engine-type-display');

  // Knowledge Base DOM
  const addKbForm = document.getElementById('add-kb-form');
  const kbCategory = document.getElementById('kb-category');
  const kbTitle = document.getElementById('kb-title');
  const kbContent = document.getElementById('kb-content');
  const kbCardsContainer = document.getElementById('kb-cards-container');
  const kbSearchInput = document.getElementById('kb-search-input');

  // WhatsApp QR Pairing DOM
  const canvas = document.getElementById('wp-qr-canvas');
  const qrOverlayStatus = document.getElementById('qr-overlay-status');
  const connectedPhoneDisplay = document.getElementById('connected-phone-display');
  const regenerateQrBtn = document.getElementById('regenerate-qr-btn');
  const simScanQrBtn = document.getElementById('sim-scan-qr-btn');
  const disconnectWpBtn = document.getElementById('disconnect-wp-btn');
  const openCodePairBtn = document.getElementById('open-code-pair-btn');
  const numericPairBox = document.getElementById('numeric-pair-box');
  const teamPhoneSelect = document.getElementById('team-phone-select');
  const generateNumCodeBtn = document.getElementById('generate-num-code-btn');
  const codeOutputDisplay = document.getElementById('code-output-display');
  const pairingCodeStr = document.getElementById('pairing-code-str');
  const confirmNumPairBtn = document.getElementById('confirm-num-pair-btn');
  const qrStatusLabel = document.getElementById('qr-status-label');
  const wpQrStatusPill = document.getElementById('wp-qr-status-pill');
  const wpQrStatusText = document.getElementById('wp-qr-status-text');
  const simWpNumberTag = document.getElementById('sim-wp-number-tag');

  // Users DOM
  const addUserForm = document.getElementById('add-user-form');
  const usrName = document.getElementById('usr-name');
  const usrPhone = document.getElementById('usr-phone');
  const usrEmail = document.getElementById('usr-email');
  const usrArea = document.getElementById('usr-area');
  const usrRole = document.getElementById('usr-role');
  const usersTableBody = document.getElementById('users-table-body');

  // Simulators DOM
  const webSimForm = document.getElementById('web-sim-form');
  const webSimInput = document.getElementById('web-sim-input');
  const webSimMessages = document.getElementById('web-sim-messages');
  const clearWebSimBtn = document.getElementById('clear-web-sim-btn');

  const wpSimForm = document.getElementById('wp-sim-form');
  const wpSimInput = document.getElementById('wp-sim-input');
  const wpSimMessages = document.getElementById('wp-sim-messages');
  const clearWpSimBtn = document.getElementById('clear-wp-sim-btn');

  // Analytics DOM
  const metricTotalChats = document.getElementById('metric-total-chats');
  const metricTotalTokens = document.getElementById('metric-total-tokens');
  const metricTopSource = document.getElementById('metric-top-source');
  const logsTableBody = document.getElementById('logs-table-body');
  const clearLogsBtn = document.getElementById('clear-logs-btn');

  let isWpConnected = false;
  let activeConnectedPhone = '+54 9 11 5456-5634';

  // ----------------------------------------------------
  // 1. CENTRALIZED TAB SWITCHING FUNCTION
  // ----------------------------------------------------
  function switchToTab(targetTabId) {
    if (!targetTabId) return;

    tabBtns.forEach(b => {
      if (b.getAttribute('data-tab') === targetTabId) {
        b.classList.add('active');
      } else {
        b.classList.remove('active');
      }
    });

    tabViews.forEach(v => {
      if (v.id === targetTabId) {
        v.classList.add('active');
      } else {
        v.classList.remove('active');
      }
    });

    if (targetTabId === 'tab-analytics') {
      renderAnalyticsAndLogs();
    } else if (targetTabId === 'tab-knowledge') {
      renderKnowledgeCards();
    } else if (targetTabId === 'tab-users') {
      renderUsersTable();
    }
  }

  // Attach tab button listeners
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetTabId = btn.getAttribute('data-tab');
      switchToTab(targetTabId);
    });
  });

  // Attach launcher cards listeners (Command Center launcher cards)
  launcherCards.forEach(card => {
    card.addEventListener('click', (e) => {
      e.preventDefault();
      const targetTab = card.getAttribute('data-launch') || card.closest('[data-launch]')?.getAttribute('data-launch');
      if (targetTab) {
        switchToTab(targetTab);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  });

  // ----------------------------------------------------
  // 2. SESSION & LOGIN MANAGEMENT
  // ----------------------------------------------------
  function checkSession() {
    const session = sessionStorage.getItem(ADMIN_SESSION_KEY);
    if (session) {
      const userData = JSON.parse(session);
      if (userDisplay) userDisplay.textContent = userData.email || 'admin@aitue.net';
      if (loginView) loginView.style.display = 'none';
      if (dashboardView) dashboardView.style.display = 'flex';
      initDashboardData();
    } else {
      if (loginView) loginView.style.display = 'flex';
      if (dashboardView) dashboardView.style.display = 'none';
    }
  }

  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = loginEmailInput.value.trim();
      const password = loginPasswordInput.value.trim();

      if (email && password.length >= 4) {
        showLoginMsg('¡Acceso concedido! Cargando panel de control...', 'success');
        setTimeout(() => {
          sessionStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify({ email, loggedInAt: new Date() }));
          checkSession();
        }, 500);
      } else {
        showLoginMsg('Credenciales inválidas. Ingrese un usuario y contraseña válidos.', 'error');
      }
    });
  }

  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      sessionStorage.removeItem(ADMIN_SESSION_KEY);
      checkSession();
    });
  }

  function showLoginMsg(msg, type) {
    if (!loginFeedbackMsg) return;
    loginFeedbackMsg.textContent = msg;
    loginFeedbackMsg.className = `login-msg ${type}`;
  }

  // ----------------------------------------------------
  // 3. DASHBOARD DATA & OPENAI FORM
  // ----------------------------------------------------
  const cfgWhisperKey = document.getElementById('cfg-whisper-key');

  function initDashboardData() {
    const config = OpenAIService.getConfig();
    if (cfgApiKey) cfgApiKey.value = config.apiKey || '';
    if (cfgWhisperKey) cfgWhisperKey.value = config.whisperApiKey || localStorage.getItem('aitue_whisper_key') || '';
    if (cfgModel) cfgModel.value = config.model || 'openai/gpt-oss-120b';
    if (cfgMaxTokens) cfgMaxTokens.value = config.maxTokens || 1024;
    if (cfgTemperature) cfgTemperature.value = config.temperature || 0.7;
    if (tempValDisplay) tempValDisplay.textContent = config.temperature || 0.7;

    if (promptWebAssistant) promptWebAssistant.value = config.assistantSystemPrompt || '';
    if (promptWpBot) promptWpBot.value = config.wpSystemPrompt || '';

    updateSystemBadges(config);
    renderWpTriggers(config.wpTriggers || []);
    renderKnowledgeCards();
    renderUsersTable();
    initWpQrCode();

    // Sync whisper key, system prompt and RAG knowledge base to wp-server backend
    syncServerKnowledgeAndPrompt();
  }

  function syncServerKnowledgeAndPrompt() {
    const config = OpenAIService.getConfig();
    const wpPrompt = promptWpBot ? promptWpBot.value.trim() : (config.wpSystemPrompt || '');
    const articles = KnowledgeService.getArticles();
    const savedWhisperKey = config.whisperApiKey || localStorage.getItem('aitue_whisper_key');
    const selectedModel = cfgModel ? cfgModel.value : (config.model || 'meta/llama-3.3-70b-instruct');

    if (savedWhisperKey) {
      fetch('http://localhost:3001/api/config/whisper-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ whisperKey: savedWhisperKey })
      }).catch(() => {});
    }

    if (selectedModel) {
      fetch('http://localhost:3001/api/config/model', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: selectedModel })
      }).catch(() => {});
    }

    if (wpPrompt) {
      fetch('http://localhost:3001/api/config/system-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: wpPrompt })
      }).catch(() => {});
    }

    if (articles && Array.isArray(articles)) {
      fetch('http://localhost:3001/api/config/knowledge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ articles })
      }).catch(() => {});
    }
  }

  function updateSystemBadges(config) {
    if (config.apiKey && config.apiKey.trim()) {
      if (openaiStatusText) openaiStatusText.textContent = `OpenAI: Configurado (${config.model})`;
      if (openaiStatusPill) openaiStatusPill.className = 'status-badge-pill active';
      if (engineTypeDisplay) {
        engineTypeDisplay.textContent = `OpenAI ${config.model}`;
        engineTypeDisplay.style.color = '#00f5d4';
      }
    } else {
      if (openaiStatusText) openaiStatusText.textContent = 'OpenAI: Sin API Key (Motor Local)';
      if (openaiStatusPill) openaiStatusPill.className = 'status-badge-pill inactive';
      if (engineTypeDisplay) {
        engineTypeDisplay.textContent = 'Motor de Fallback Local AITUE';
        engineTypeDisplay.style.color = '#ffb703';
      }
    }
  }

  if (toggleShowKeyBtn && cfgApiKey) {
    toggleShowKeyBtn.addEventListener('click', () => {
      if (cfgApiKey.type === 'password') {
        cfgApiKey.type = 'text';
        toggleShowKeyBtn.textContent = 'Ocultar';
      } else {
        cfgApiKey.type = 'password';
        toggleShowKeyBtn.textContent = 'Mostrar';
      }
    });
  }

  if (cfgTemperature && tempValDisplay) {
    cfgTemperature.addEventListener('input', () => {
      tempValDisplay.textContent = cfgTemperature.value;
    });
  }

  const openAiConfigForm = document.getElementById('openai-config-form');
  if (openAiConfigForm) {
    openAiConfigForm.addEventListener('submit', async () => {
      const config = OpenAIService.getConfig();
      config.apiKey = cfgApiKey.value.trim();
      const whisperKey = cfgWhisperKey ? cfgWhisperKey.value.trim() : '';
      config.whisperApiKey = whisperKey;
      localStorage.setItem('aitue_whisper_key', whisperKey);
      config.model = cfgModel.value;
      config.maxTokens = parseInt(cfgMaxTokens.value) || 500;
      config.temperature = parseFloat(cfgTemperature.value) || 0.7;

      if (OpenAIService.saveConfig(config)) {
        // Send whisper key to wp-server
        try {
          await fetch('http://localhost:3001/api/config/whisper-key', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ whisperKey })
          });
        } catch (e) {}

        showTestMsg('Configuración guardada correctamente.', 'success');
        updateSystemBadges(config);
      } else {
        showTestMsg('Error al guardar en el almacenamiento local.', 'error');
      }
    });
  }

  if (testOpenAiBtn) {
    testOpenAiBtn.addEventListener('click', async () => {
      const key = cfgApiKey ? cfgApiKey.value.trim() : '';
      const model = cfgModel ? cfgModel.value : 'gpt-4o-mini';

      if (!key) {
        showTestMsg('Debes ingresar una API Key para probar la conexión.', 'error');
        return;
      }

      testOpenAiBtn.disabled = true;
      testOpenAiBtn.textContent = '⚡ Conectando...';

      try {
        await OpenAIService.testConnection(key, model);
        showTestMsg(`¡Conexión exitosa con OpenAI (${model})! API Key verificada.`, 'success');
      } catch (err) {
        showTestMsg(`Error de conexión: ${err.message}`, 'error');
      } finally {
        testOpenAiBtn.disabled = false;
        testOpenAiBtn.textContent = '⚡ Probar Conexión OpenAI';
      }
    });
  }

  function showTestMsg(msg, type) {
    if (!openaiTestFeedback) return;
    openaiTestFeedback.textContent = msg;
    openaiTestFeedback.className = `login-msg ${type}`;
  }

  if (saveWebPromptBtn && promptWebAssistant) {
    saveWebPromptBtn.addEventListener('click', () => {
      const config = OpenAIService.getConfig();
      config.assistantSystemPrompt = promptWebAssistant.value;
      if (OpenAIService.saveConfig(config)) {
        alert('Prompt del Asistente Virtual Web guardado con éxito.');
      }
    });
  }

  // ----------------------------------------------------
  // 4. KNOWLEDGE BASE (RAG / AI TRAINING)
  // ----------------------------------------------------
  if (addKbForm) {
    addKbForm.addEventListener('submit', () => {
      const title = kbTitle.value.trim();
      const content = kbContent.value.trim();
      const category = kbCategory.value;

      if (!title || !content) return;

      KnowledgeService.addArticle({ title, content, category });
      kbTitle.value = '';
      kbContent.value = '';
      renderKnowledgeCards();
      syncServerKnowledgeAndPrompt();
      alert('¡Pauta de conocimiento agregada! La IA utilizará esta información para responder.');
    });
  }

  if (kbSearchInput) {
    kbSearchInput.addEventListener('input', () => {
      renderKnowledgeCards(kbSearchInput.value.trim());
    });
  }

  function renderKnowledgeCards(searchFilter = '') {
    if (!kbCardsContainer) return;
    const articles = KnowledgeService.getArticles();

    const filtered = searchFilter 
      ? articles.filter(a => a.title.toLowerCase().includes(searchFilter.toLowerCase()) || a.content.toLowerCase().includes(searchFilter.toLowerCase()))
      : articles;

    if (!filtered.length) {
      kbCardsContainer.innerHTML = '<div style="grid-column: span 2; text-align:center; color:#64748b; padding:2rem;">No se encontraron pautas de conocimiento.</div>';
      return;
    }

    kbCardsContainer.innerHTML = '';
    filtered.forEach(art => {
      const card = document.createElement('div');
      card.style.cssText = 'background:rgba(7,22,47,0.85); border:1px solid rgba(89,168,255,0.25); border-radius:12px; padding:1.2rem; display:flex; flex-direction:column; gap:0.6rem; position:relative;';
      
      const timeStr = new Date(art.updatedAt).toLocaleDateString();

      card.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <span style="font-family:'Share Tech Mono', monospace; font-size:0.68rem; color:#00f5d4; background:rgba(0,245,212,0.1); border:1px solid rgba(0,245,212,0.3); padding:2px 8px; border-radius:4px; text-transform:uppercase;">
            ${art.category}
          </span>
          <div style="display:flex; gap:6px;">
            <button type="button" class="btn-admin-ghost edit-kb-btn" data-id="${art.id}" style="padding:4px 10px; font-size:0.7rem; color:#00f5d4; border-color:rgba(0,245,212,0.4); cursor:pointer; font-weight:bold;">✏️ Editar</button>
            <button type="button" class="btn-admin-ghost delete-kb-btn" data-id="${art.id}" style="padding:4px 10px; font-size:0.7rem; color:#ff4d6d; border-color:rgba(255,77,109,0.4); cursor:pointer; font-weight:bold;">🗑️ Eliminar</button>
          </div>
        </div>
        <h4 style="font-family:'Outfit', sans-serif; font-size:1rem; color:#ffffff; margin:0;">${art.title}</h4>
        <p style="font-size:0.82rem; color:#cbd5e1; line-height:1.4; white-space:pre-line; margin:0; flex:1;">${art.content}</p>
        <span style="font-family:'Share Tech Mono', monospace; font-size:0.62rem; color:#64748b;">Actualizado: ${timeStr}</span>
      `;
      kbCardsContainer.appendChild(card);
    });

    // Delete handlers
    kbCardsContainer.querySelectorAll('.delete-kb-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const id = btn.getAttribute('data-id');
        if (confirm('¿Deseás eliminar esta pauta de conocimiento de la IA?')) {
          KnowledgeService.deleteArticle(id);
          renderKnowledgeCards(kbSearchInput ? kbSearchInput.value.trim() : '');
          syncServerKnowledgeAndPrompt();
        }
      });
    });

    // Edit handlers
    kbCardsContainer.querySelectorAll('.edit-kb-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const id = btn.getAttribute('data-id');
        const articles = KnowledgeService.getArticles();
        const art = articles.find(a => a.id === id);
        if (!art) return;

        const editModal = document.getElementById('edit-kb-modal');
        const editId = document.getElementById('edit-kb-id');
        const editCat = document.getElementById('edit-kb-category');
        const editTitle = document.getElementById('edit-kb-title');
        const editContent = document.getElementById('edit-kb-content');

        if (editModal && editId && editCat && editTitle && editContent) {
          editId.value = art.id;
          editCat.value = art.category || 'General';
          editTitle.value = art.title || '';
          editContent.value = art.content || '';
          editModal.style.display = 'flex';
        }
      });
    });
  }

  // Edit Modal Event Handlers
  const editKbModal = document.getElementById('edit-kb-modal');
  const editKbForm = document.getElementById('edit-kb-form');
  const saveEditKbBtn = document.getElementById('save-edit-kb-btn');
  const cancelEditKbBtn = document.getElementById('cancel-edit-kb-btn');
  const closeEditKbModalX = document.getElementById('close-edit-kb-modal-x');

  function hideEditKbModal() {
    if (editKbModal) editKbModal.style.display = 'none';
  }

  if (cancelEditKbBtn) cancelEditKbBtn.addEventListener('click', hideEditKbModal);
  if (closeEditKbModalX) closeEditKbModalX.addEventListener('click', hideEditKbModal);

  function executeSaveArticle() {
    const id = document.getElementById('edit-kb-id')?.value;
    const category = document.getElementById('edit-kb-category')?.value.trim();
    const title = document.getElementById('edit-kb-title')?.value.trim();
    const content = document.getElementById('edit-kb-content')?.value.trim();

    if (!id || !title || !content) {
      alert('Por favor completa los campos de Título y Contenido.');
      return;
    }

    KnowledgeService.updateArticle({ id, category, title, content });
    hideEditKbModal();
    renderKnowledgeCards(kbSearchInput ? kbSearchInput.value.trim() : '');
    syncServerKnowledgeAndPrompt();
    alert('¡Pauta de conocimiento actualizada correctamente!');
  }

  if (saveEditKbBtn) {
    saveEditKbBtn.addEventListener('click', (e) => {
      e.preventDefault();
      executeSaveArticle();
    });
  }

  if (editKbForm) {
    editKbForm.addEventListener('submit', (e) => {
      e.preventDefault();
      executeSaveArticle();
    });
  }

  // ----------------------------------------------------
  // 5. WHATSAPP QR & NUMERIC PAIRING MODULE
  // ----------------------------------------------------
  const wpQrImg = document.getElementById('wp-qr-img');
  const qrBoxWrap = document.getElementById('qr-box-wrap');

  function initWpQrCode() {
    pollBaileysStatus();
    setInterval(pollBaileysStatus, 3000);
  }

  async function pollBaileysStatus() {
    try {
      const res = await fetch('http://localhost:3001/api/whatsapp/status');
      if (!res.ok) return;
      const data = await res.json();

      if (data.status === 'CONNECTED') {
        isWpConnected = true;
        activeConnectedPhone = data.connectedPhone || '+54 9 11 5456-5634';
        updateWpStatusUI();
      } else if (data.status === 'SCAN_QR' && data.qrDataUrl) {
        if (!isWpConnected) {
          if (wpQrImg) wpQrImg.src = data.qrDataUrl;
          if (qrStatusLabel) qrStatusLabel.textContent = 'ESTADO: CÓDIGO QR REAL LISTO PARA ESCANEAR EN WHATSAPP';
        }
      }
    } catch (err) {
      // Baileys server offline, fallback to simulation mode
    }
  }

  if (qrBoxWrap) {
    qrBoxWrap.addEventListener('click', () => {
      if (!isWpConnected && simScanQrBtn) {
        simScanQrBtn.click();
      }
    });
  }

  function updateWpStatusUI() {
    if (isWpConnected) {
      if (qrOverlayStatus) qrOverlayStatus.style.display = 'flex';
      if (connectedPhoneDisplay) connectedPhoneDisplay.textContent = activeConnectedPhone;
      if (qrStatusLabel) qrStatusLabel.textContent = `ESTADO: VINCULADO Y OPERANDO (${activeConnectedPhone})`;
      if (wpQrStatusPill) wpQrStatusPill.className = 'status-badge-pill active';
      if (wpQrStatusText) wpQrStatusText.textContent = `Bot WP: Vinculado (${activeConnectedPhone})`;
      if (simWpNumberTag) simWpNumberTag.textContent = `${activeConnectedPhone} // ONLINE`;
    } else {
      if (qrOverlayStatus) qrOverlayStatus.style.display = 'none';
      if (qrStatusLabel) qrStatusLabel.textContent = 'ESTADO: CÓDIGO QR REAL LISTO PARA ESCANEAR EN WHATSAPP';
      if (wpQrStatusPill) wpQrStatusPill.className = 'status-badge-pill inactive';
      if (wpQrStatusText) wpQrStatusText.textContent = 'Bot WP: Esperando QR';
      if (simWpNumberTag) simWpNumberTag.textContent = 'DESCONECTADO // ESPERANDO VINCULACIÓN';
    }
  }

  if (simScanQrBtn) {
    simScanQrBtn.addEventListener('click', () => {
      simScanQrBtn.disabled = true;
      simScanQrBtn.textContent = '⚡ Vinculando...';
      setTimeout(() => {
        isWpConnected = true;
        activeConnectedPhone = '+54 9 11 5456-5634';
        updateWpStatusUI();
        simScanQrBtn.disabled = false;
        simScanQrBtn.textContent = '⚡ Vincular Instancia Con 1 Clic (Simulación Activa)';
        alert('¡WhatsApp vinculado exitosamente a la línea de pruebas AITUE!');
      }, 500);
    });
  }

  if (openCodePairBtn && numericPairBox) {
    openCodePairBtn.addEventListener('click', () => {
      if (numericPairBox.style.display === 'none') {
        numericPairBox.style.display = 'block';
      } else {
        numericPairBox.style.display = 'none';
      }
    });
  }

  if (generateNumCodeBtn && teamPhoneSelect && pairingCodeStr && codeOutputDisplay) {
    generateNumCodeBtn.addEventListener('click', () => {
      const randomCode = Math.floor(1000 + Math.random() * 9000) + '-' + Math.random().toString(36).substring(2, 6).toUpperCase();
      pairingCodeStr.textContent = randomCode;
      codeOutputDisplay.style.display = 'flex';
    });
  }

  if (confirmNumPairBtn && teamPhoneSelect && numericPairBox) {
    confirmNumPairBtn.addEventListener('click', () => {
      activeConnectedPhone = teamPhoneSelect.value;
      isWpConnected = true;
      updateWpStatusUI();
      numericPairBox.style.display = 'none';
      alert(`¡Dispositivo vinculado exitosamente a ${activeConnectedPhone}!`);
    });
  }

  if (disconnectWpBtn) {
    disconnectWpBtn.addEventListener('click', () => {
      if (confirm('¿Deseás desconectar la instancia de WhatsApp de AITUE?')) {
        isWpConnected = false;
        drawCanvasQr();
        updateWpStatusUI();
      }
    });
  }

  if (regenerateQrBtn) {
    regenerateQrBtn.addEventListener('click', () => {
      isWpConnected = false;
      drawCanvasQr();
      updateWpStatusUI();
      alert('Nuevo código QR generado. Escanealo con la cámara de tu teléfono.');
    });
  }

  function renderWpTriggers(triggers) {
    if (!wpTriggersContainer) return;
    wpTriggersContainer.innerHTML = '';
    triggers.forEach((tr, index) => {
      const item = document.createElement('div');
      item.style.cssText = 'background:rgba(7,22,47,0.7); border:1px solid rgba(89,168,255,0.2); padding:0.8rem; border-radius:8px; display:flex; flex-direction:column; gap:0.4rem;';
      item.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <span style="font-family:'Share Tech Mono', monospace; font-size:0.75rem; color:#59A8FF;">REGLA #${index + 1} - PALABRA CLAVE:</span>
          <button type="button" class="btn-admin-ghost remove-tr-btn" data-index="${index}" style="padding:2px 6px; font-size:0.65rem; color:#ff4d6d;">Eliminar</button>
        </div>
        <input type="text" class="admin-input tr-keyword" value="${tr.keyword}" placeholder="Ej. cotizar" style="padding:0.4rem 0.8rem; font-size:0.8rem;" />
        <textarea class="admin-textarea tr-response" rows="2" placeholder="Respuesta automática..." style="padding:0.4rem 0.8rem; font-size:0.8rem;">${tr.response}</textarea>
      `;
      wpTriggersContainer.appendChild(item);
    });

    wpTriggersContainer.querySelectorAll('.remove-tr-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.getAttribute('data-index'));
        triggers.splice(idx, 1);
        renderWpTriggers(triggers);
      });
    });
  }

  if (saveWpConfigBtn && promptWpBot && wpTriggersContainer) {
    saveWpConfigBtn.addEventListener('click', () => {
      const config = OpenAIService.getConfig();
      config.wpSystemPrompt = promptWpBot.value;

      const updatedTriggers = [];
      const keywords = wpTriggersContainer.querySelectorAll('.tr-keyword');
      const responses = wpTriggersContainer.querySelectorAll('.tr-response');

      keywords.forEach((kw, i) => {
        if (kw.value.trim()) {
          updatedTriggers.push({
            keyword: kw.value.trim(),
            response: responses[i].value.trim()
          });
        }
      });

      config.wpTriggers = updatedTriggers;
      if (OpenAIService.saveConfig(config)) {
        syncServerKnowledgeAndPrompt();
        alert('Configuración, prompt del sistema y reglas del Bot de WhatsApp guardadas con éxito.');
      }
    });
  }

  const sendTeamIntroBtn = document.getElementById('send-team-intro-btn');

  if (sendTeamIntroBtn) {
    sendTeamIntroBtn.addEventListener('click', async () => {
      sendTeamIntroBtn.disabled = true;
      sendTeamIntroBtn.textContent = '⚡ Enviando Presentación...';

      try {
        const res = await fetch('http://localhost:3001/api/whatsapp/send-team-intro', { method: 'POST' });
        const data = await res.json();
        
        let report = '📲 MENSAJE DE PRESENTACIÓN Y MODELO DE APRENDIZAJE ENVIADO:\n\n';
        data.results.forEach(r => {
          report += `• ${r.name}: ${r.status}\n`;
        });
        report += `\n💬 CONTENIDO DEL MENSAJE:\n\n${data.message}`;

        alert(report);
      } catch (err) {
        alert('Mensaje preparado para el equipo de pruebas:\n\n' +
          '🤖 ¡Hola! Soy AITUE Bot IA, el Asistente Virtual Oficial de AITUE COMUNICA S.A.\n\n' +
          'Te contacto directamente porque formás parte de nuestro Equipo de Pruebas y Entrenadores de IA. ' +
          'Voy a interactuar contigo para aprender cómo responder e interactuar adecuadamente con nuestros clientes, ' +
          'resolver dudas de conectividad satelital Starlink Mini y gabinetes solares, o derivar las consultas al Área Técnica o Comercial.\n\n' +
          'Integrantes notificados:\n- Micaela Quinteros (+54 9 11 7358-3768)\n- Susana Pedotti (+54 9 11 4164-0955)\n- Alejandro Muñoz (+54 9 11 6230-0000)\n- Hugo Flores (+54 9 387 501-4000)');
      } finally {
        sendTeamIntroBtn.disabled = false;
        sendTeamIntroBtn.textContent = '📢 Enviar Mensaje de Presentación por WhatsApp';
      }
    });
  }

  function renderUsersTable() {
    if (!usersTableBody) return;
    const users = UsersService.getUsers();

    if (!users.length) {
      usersTableBody.innerHTML = '<tr><td colspan="7" style="text-align:center; color:#64748b; padding:2rem;">No hay usuarios registrados.</td></tr>';
      return;
    }

    usersTableBody.innerHTML = '';
    users.forEach(u => {
      const tr = document.createElement('tr');
      const roleBadge = u.role === 'Super Admin' 
        ? '<span style="color:#d946ef; font-weight:700;">Super Admin</span>'
        : u.role === 'Entrenador IA'
        ? '<span style="color:#00f5d4; font-weight:600;">🧠 Entrenador IA</span>'
        : '<span style="color:#59a8ff;">Operador Ventas</span>';

      tr.innerHTML = `
        <td style="font-weight:700; color:#ffffff;">${u.name}</td>
        <td style="font-family:'Share Tech Mono', monospace; font-size:0.8rem; color:#00f5d4;">${u.phone || '-'}</td>
        <td style="font-family:'Share Tech Mono', monospace; font-size:0.8rem; color:#94a3b8;">${u.email}</td>
        <td style="font-size:0.8rem; color:#cbd5e1;">${u.area || 'General'}</td>
        <td>${roleBadge}</td>
        <td><span style="color:#00f5d4; font-size:0.75rem;">● ${u.status || 'Activo'}</span></td>
        <td>
          <button class="btn-admin-ghost delete-usr-btn" data-id="${u.id}" style="padding:2px 6px; font-size:0.65rem; color:#ff4d6d;">Eliminar</button>
        </td>
      `;
      usersTableBody.appendChild(tr);
    });

    usersTableBody.querySelectorAll('.delete-usr-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        if (confirm('¿Deseás revocar el acceso a este administrador?')) {
          UsersService.deleteUser(id);
          renderUsersTable();
        }
      });
    });
  }

  // ----------------------------------------------------
  // 7. SIMULATORS (WEB & WHATSAPP)
  // ----------------------------------------------------
  const historyWeb = [];

  if (webSimForm) {
    webSimForm.addEventListener('submit', async () => {
      const text = webSimInput.value.trim();
      if (!text) return;

      webSimInput.value = '';
      appendSimMsg(webSimMessages, 'user', text);
      historyWeb.push({ role: 'user', content: text });

      const typingMsg = appendSimMsg(webSimMessages, 'bot', 'Procesando consulta con memoria RAG + OpenAI...');

      const reply = await OpenAIService.sendMessage(text, 'assistant', historyWeb);
      typingMsg.innerHTML = `${reply} <span class="sim-msg-meta">${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} // OpenAI + Knowledge Base</span>`;
      historyWeb.push({ role: 'assistant', content: reply });
    });
  }

  if (clearWebSimBtn) {
    clearWebSimBtn.addEventListener('click', () => {
      webSimMessages.innerHTML = `
        <div class="sim-msg bot">
          ¡Hola! Soy el asistente virtual configurado para la web de AITUE. Escribí una consulta para probar cómo responderé a los usuarios.
          <span class="sim-msg-meta">Sistema // Listo</span>
        </div>`;
      historyWeb.length = 0;
    });
  }

  const historyWp = [];

  if (wpSimForm) {
    wpSimForm.addEventListener('submit', async () => {
      const text = wpSimInput.value.trim();
      if (!text) return;

      wpSimInput.value = '';
      appendSimMsg(wpSimMessages, 'user', text);
      historyWp.push({ role: 'user', content: text });

      const typingMsg = appendSimMsg(wpSimMessages, 'bot', 'Procesando mensaje de WhatsApp...');

      const reply = await OpenAIService.sendMessage(text, 'whatsapp', historyWp);
      typingMsg.innerHTML = `${reply} <span class="sim-msg-meta">${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} // WhatsApp Auto</span>`;
      historyWp.push({ role: 'assistant', content: reply });
    });
  }

  if (clearWpSimBtn) {
    clearWpSimBtn.addEventListener('click', () => {
      wpSimMessages.innerHTML = `
        <div class="sim-msg bot" style="border-color: rgba(16, 185, 129, 0.3);">
          ¡Hola! Gracias por escribir a AITUE COMUNICA S.A. ¿En qué podemos ayudarte respecto a tus necesidades de conectividad satelital?
          <span class="sim-msg-meta">WhatsApp Bot // Auto</span>
        </div>`;
      historyWp.length = 0;
    });
  }

  function appendSimMsg(container, sender, text) {
    if (!container) return null;
    const msgDiv = document.createElement('div');
    msgDiv.className = `sim-msg ${sender}`;
    msgDiv.innerHTML = `${text} <span class="sim-msg-meta">${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>`;
    container.appendChild(msgDiv);
    container.scrollTop = container.scrollHeight;
    return msgDiv;
  }

  // ----------------------------------------------------
  // 8. ANALYTICS & LOGS TABLE RENDERER (REAL-TIME SERVER POLLING)
  // ----------------------------------------------------
  async function renderAnalyticsAndLogs() {
    if (!metricTotalChats || !logsTableBody) return;
    
    let serverLogs = [];
    try {
      const res = await fetch('http://localhost:3001/api/whatsapp/logs');
      if (res.ok) {
        serverLogs = await res.json();
      }
    } catch (e) {
      // server offline or unreachable
    }

    const localLogs = OpenAIService.getLogs();
    
    // Merge serverLogs & localLogs, deduplicating by key
    const combinedMap = new Map();
    serverLogs.forEach(l => combinedMap.set(`${l.timestamp}-${l.userMsg}`, l));
    localLogs.forEach(l => {
      const key = `${l.timestamp}-${l.userMsg}`;
      if (!combinedMap.has(key)) combinedMap.set(key, l);
    });

    const logs = Array.from(combinedMap.values()).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    metricTotalChats.textContent = logs.length;
    if (metricTotalTokens) metricTotalTokens.textContent = (logs.length * 150).toLocaleString();

    const webCount = logs.filter(l => l.source === 'virtual_assistant').length;
    const wpCount = logs.filter(l => l.source === 'whatsapp_bot').length;
    if (metricTopSource) metricTopSource.textContent = wpCount >= webCount ? 'WhatsApp Bot' : 'Asistente Web';

    if (!logs.length) {
      logsTableBody.innerHTML = '<tr><td colspan="4" style="text-align:center; color:#64748b; padding:2rem;">No hay registros de chats recientes.</td></tr>';
      return;
    }

    logsTableBody.innerHTML = '';
    logs.forEach(log => {
      const tr = document.createElement('tr');
      const timeStr = new Date(log.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' });
      const userDisplayStr = log.userPhone ? ` <span style="opacity:0.75; font-size:0.68rem; color:#94a3b8;">(${log.userPhone})</span>` : '';
      const sourceBadge = log.source === 'whatsapp_bot' 
        ? `<span style="color:#00f5d4; font-family:'Share Tech Mono', monospace; font-size:0.75rem;">💬 WhatsApp Bot${userDisplayStr}</span>` 
        : '<span style="color:#59A8FF; font-family:\'Share Tech Mono\', monospace; font-size:0.75rem;">🤖 Asistente Web</span>';

      tr.innerHTML = `
        <td style="font-family:'Share Tech Mono', monospace; font-size:0.75rem; color:#94a3b8; white-space:nowrap;">${timeStr}</td>
        <td>${sourceBadge}</td>
        <td style="max-width:260px; font-weight:600;">${log.userMsg}</td>
        <td style="max-width:380px; color:#cbd5e1;">${log.botReply}</td>
      `;
      logsTableBody.appendChild(tr);
    });
  }

  if (clearLogsBtn) {
    clearLogsBtn.addEventListener('click', async () => {
      localStorage.removeItem('aitue_chat_logs');
      try {
        await fetch('http://localhost:3001/api/whatsapp/logs', { method: 'DELETE' });
      } catch (e) {}
      renderAnalyticsAndLogs();
    });
  }

  // Auto poll logs in real time every 3 seconds
  setInterval(() => {
    renderAnalyticsAndLogs();
  }, 3000);

  // ----------------------------------------------------
  // INITIALIZE SESSION & DASHBOARD
  // ----------------------------------------------------
  checkSession();

});
