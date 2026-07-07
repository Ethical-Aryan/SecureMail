// ------------------------------------------------------------------
// Sidebar Navigation Items
// ------------------------------------------------------------------
const NAV_ITEMS = [
  { id: 'inbox', label: 'Inbox', icon: 'inbox' },
  { id: 'starred', label: 'Starred', icon: 'star' },
  { id: 'sent', label: 'Sent', icon: 'send' },
  { id: 'drafts', label: 'Drafts', icon: 'file-text' },
  { id: 'vault', label: 'Secure Vault', icon: 'shield-check' },
  { id: 'trash', label: 'Trash', icon: 'trash-2' },
];

const FILTERS = ['All', 'Unread', 'Encrypted', 'Starred', 'Attachments'];

function folderEmptyState(folder) {
  switch (folder) {
    case 'starred': return { icon: 'star', title: 'No starred emails yet', subtitle: 'Star important messages to find them quickly later.' };
    case 'sent': return { icon: 'send', title: 'No sent mail in this view', subtitle: 'Emails you send will appear here.' };
    case 'drafts': return { icon: 'file-text', title: 'No drafts saved', subtitle: 'SecureMail autosaves as you type, so you will never lose a message in progress.' };
    case 'vault': return { icon: 'shield-check', title: 'Your Secure Vault is empty', subtitle: 'Move sensitive emails here for an extra layer of protection.' };
    case 'trash': return { icon: 'trash-2', title: 'Trash is empty', subtitle: 'Deleted emails are permanently removed after 30 days.' };
    default: return { icon: 'inbox', title: 'Nothing here yet', subtitle: 'Your inbox is clear.' };
  }
}

// ------------------------------------------------------------------
// Application State
// ------------------------------------------------------------------
let emails = [];
let activeFolder = 'inbox';
let activeFilter = 'All';
let selectedIds = [];
let decryptedEmailIds = [];
let activeEmailId = null;
let toastTimeout = null;

// ------------------------------------------------------------------
// DOM Elements
// ------------------------------------------------------------------
const sidebarNav = document.getElementById('sidebar-nav');
const sidebarComposeBtn = document.getElementById('sidebar-compose-btn');

const topbarAvatarBtn = document.getElementById('topbar-avatar-btn');
const profileDropdown = document.getElementById('profile-dropdown');
const profileSettingsBtn = document.getElementById('profile-settings-btn');
const profileLogoutBtn = document.getElementById('profile-logout-btn');

const inboxScreen = document.getElementById('inbox-screen');
const inboxUnreadCount = document.getElementById('inbox-unread-count');
const inboxFilters = document.getElementById('inbox-filters');
const inboxEmailList = document.getElementById('inbox-email-list');
const inboxEmptyState = document.getElementById('inbox-empty-state');
const searchMailInput = document.getElementById('search-mail-input');

const bulkActionsPanel = document.getElementById('bulk-actions-panel');
const bulkSelectionCount = document.getElementById('bulk-selection-count');
const bulkReadBtn = document.getElementById('bulk-read-btn');
const bulkArchiveBtn = document.getElementById('bulk-archive-btn');
const bulkDeleteBtn = document.getElementById('bulk-delete-btn');
const bulkClearBtn = document.getElementById('bulk-clear-btn');

const readScreen = document.getElementById('read-screen');
const readBackBtn = document.getElementById('read-back-btn');
const readStarBtn = document.getElementById('read-star-btn');
const readArchiveBtn = document.getElementById('read-archive-btn');
const readDeleteBtn = document.getElementById('read-delete-btn');
const readEmailSubject = document.getElementById('read-email-subject');
const readSenderAvatar = document.getElementById('read-sender-avatar');
const readSenderName = document.getElementById('read-sender-name');
const readSenderEmail = document.getElementById('read-sender-email');
const readEmailTime = document.getElementById('read-email-time');
const readEmailBody = document.getElementById('read-email-body');

const decryptPromptCard = document.getElementById('decrypt-prompt-card');
const decryptPasskeyInput = document.getElementById('decrypt-passkey-input');
const decryptErrorText = document.getElementById('decrypt-error-text');
const decryptSubmitBtn = document.getElementById('decrypt-submit-btn');
const decryptIconRing = document.getElementById('decrypt-icon-ring');
const decryptedContentPanel = document.getElementById('decrypted-content-panel');
const readAttachmentCard = document.getElementById('read-attachment-card');
const readAttachmentName = document.getElementById('read-attachment-name');
const readAttachmentSize = document.getElementById('read-attachment-size');

const composePanel = document.getElementById('compose-panel');
const composeCloseBtn = document.getElementById('compose-close-btn');
const composeToInput = document.getElementById('compose-to-input');
const composeCcToggle = document.getElementById('compose-cc-toggle');
const composeCcRow = document.getElementById('compose-cc-row');
const composeCcInput = document.getElementById('compose-cc-input');
const composeSubjectInput = document.getElementById('compose-subject-input');
const composeBodyTextarea = document.getElementById('compose-body-textarea');
const composeAttachmentBar = document.getElementById('compose-attachment-bar');
const composeRemoveAttachmentBtn = document.getElementById('compose-remove-attachment-btn');
const composeEncryptionToggle = document.getElementById('compose-encryption-toggle');
const composeEncryptionToggleLabel = document.getElementById('compose-encryption-toggle-label');
const composeEncryptionKeyBlock = document.getElementById('compose-encryption-key-block');
const generatedPasskeyDisplay = document.getElementById('generated-passkey-display');
const generateNewKeyBtn = document.getElementById('generate-new-key-btn');
const composeSendBtn = document.getElementById('compose-send-btn');

const toastAlert = document.getElementById('toast-alert');
const toastText = document.getElementById('toast-text');

// ------------------------------------------------------------------
// Helper / State Functions
// ------------------------------------------------------------------
function showToast(message) {
  toastText.textContent = message;
  toastAlert.classList.remove('hidden');
  if (toastTimeout) clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    toastAlert.classList.add('hidden');
  }, 3000);
}

function generateRandomPasskey() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const seg = () => Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `${seg()}-${seg()}`;
}

// ------------------------------------------------------------------
// JWT Decoder Utility
// ------------------------------------------------------------------
function parseJwt(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

// ------------------------------------------------------------------
// API Communication Handlers
// ------------------------------------------------------------------
async function fetchEmailsFromServer() {
  const token = localStorage.getItem('access_token');
  try {
    const response = await fetch('/api/emails', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) throw new Error("Could not fetch messages");
    emails = await response.json();
  } catch (err) {
    showToast("Error retrieving emails from vault");
    console.error(err);
  }
}

async function updateStorageIndicator() {
  const token = localStorage.getItem('access_token');
  try {
    const response = await fetch('/api/storage', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (response.ok) {
      const data = await response.json();
      document.getElementById('storage-text-display').textContent = `${data.gb_used} GB / ${data.quota_gb} GB`;
      document.getElementById('storage-bar-display').style.width = `${data.percent_used}%`;
    }
  } catch (err) {
    console.error(err);
  }
}

async function updateEmailOnServer(id, payload) {
  const token = localStorage.getItem('access_token');
  try {
    const response = await fetch(`/api/emails/${id}`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` 
      },
      body: JSON.stringify(payload)
    });
    return response.ok;
  } catch (err) {
    console.error(err);
    return false;
  }
}

async function deleteEmailPermanently(id) {
  const token = localStorage.getItem('access_token');
  try {
    const response = await fetch(`/api/emails/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return response.ok;
  } catch (err) {
    console.error(err);
    return false;
  }
}

// ------------------------------------------------------------------
// Dashboard Loader
// ------------------------------------------------------------------
async function loadDashboard(email) {
  // Format initials
  const parts = email.split('@')[0].split('.');
  const initials = parts.map(p => p[0]).join('').substring(0, 2).toUpperCase() || 'US';
  const name = parts.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');

  document.getElementById('user-avatar-initials').textContent = initials;
  topbarAvatarBtn.textContent = initials;
  document.getElementById('user-display-name').textContent = name;
  document.getElementById('user-display-email').textContent = email;

  // Retrieve data
  await fetchEmailsFromServer();
  await updateStorageIndicator();

  renderSidebar();
  renderFilters();
  renderEmails();
}

// ------------------------------------------------------------------
// Floating Input Labels
// ------------------------------------------------------------------
function setupFloatingLabels() {
  const inputs = document.querySelectorAll('.field-input');
  inputs.forEach(input => {
    const label = input.nextElementSibling;
    if (!label || !label.classList.contains('field-label')) return;
    
    const checkValue = () => {
      if (input.value.length > 0) {
        label.classList.add('floated');
      } else {
        label.classList.remove('floated');
      }
    };
    
    input.addEventListener('focus', () => label.classList.add('floated'));
    input.addEventListener('blur', checkValue);
    input.addEventListener('input', checkValue);
    checkValue();
  });
}

// ------------------------------------------------------------------
// Render View Assemblies
// ------------------------------------------------------------------

function renderSidebar() {
  sidebarNav.innerHTML = '';
  const inboxUnread = emails.filter(e => e.unread && e.folder === 'inbox').length;
  
  NAV_ITEMS.forEach(item => {
    const isAct = item.id === activeFolder;
    const itemDiv = document.createElement('div');
    itemDiv.className = `nav-item ${isAct ? 'active' : ''}`;
    itemDiv.innerHTML = `
      <i data-lucide="${item.icon}" class="w-[17px] h-[17px]"></i>
      <span class="flex-1">${item.label}</span>
    `;
    
    if (item.id === 'inbox' && inboxUnread > 0) {
      const badge = document.createElement('span');
      badge.className = `text-[11.5px] font-bold py-0.5 px-2 rounded-full ${isAct ? 'bg-[#F2EDFF] text-brand' : 'bg-white text-brand'}`;
      badge.textContent = inboxUnread;
      itemDiv.appendChild(badge);
    }
    
    itemDiv.addEventListener('click', () => {
      activeFolder = item.id;
      activeEmailId = null;
      selectedIds = [];
      readScreen.classList.add('hidden');
      inboxScreen.classList.remove('hidden');
      renderSidebar();
      renderFilters();
      renderEmails();
      updateBulkActionsHeader();
    });
    
    sidebarNav.appendChild(itemDiv);
  });
  
  lucide.createIcons();
}

function renderFilters() {
  inboxFilters.innerHTML = '';
  
  if (['inbox', 'starred', 'vault', 'trash'].includes(activeFolder)) {
    inboxFilters.classList.remove('hidden');
  } else {
    inboxFilters.classList.add('hidden');
    return;
  }
  
  FILTERS.forEach(f => {
    const isAct = activeFilter === f;
    const btn = document.createElement('button');
    btn.className = 'btn';
    btn.style.padding = '7px 14px';
    btn.style.borderRadius = '999px';
    btn.style.fontSize = '13px';
    btn.style.fontWeight = '600';
    
    if (isAct) {
      btn.style.background = '#6B4EFF';
      btn.style.color = '#fff';
      btn.style.border = 'none';
    } else {
      btn.style.background = 'transparent';
      btn.style.color = '#6A6A6A';
      btn.style.border = '1.5px solid #E5E0D9';
    }
    
    btn.textContent = f;
    btn.addEventListener('click', () => {
      activeFilter = f;
      renderFilters();
      renderEmails();
    });
    
    inboxFilters.appendChild(btn);
  });
}

function renderEmails() {
  inboxEmailList.innerHTML = '';
  
  let folderList = emails.filter(e => {
    if (activeFolder === 'starred') return e.starred && e.folder !== 'trash';
    if (activeFolder === 'vault') return e.folder === 'vault';
    if (activeFolder === 'trash') return e.folder === 'trash';
    return e.folder === activeFolder;
  });
  
  let filtered = folderList.filter(e => {
    if (activeFilter === 'Unread') return e.unread;
    if (activeFilter === 'Encrypted') return e.locked;
    if (activeFilter === 'Starred') return e.starred;
    if (activeFilter === 'Attachments') return !!e.attachment;
    return true;
  });
  
  const query = searchMailInput.value.toLowerCase().trim();
  if (query.length > 0) {
    filtered = filtered.filter(e => 
      e.sender.toLowerCase().includes(query) || 
      e.subject.toLowerCase().includes(query) || 
      e.preview.toLowerCase().includes(query)
    );
  }
  
  const unreadCount = folderList.filter(e => e.unread).length;
  if (activeFolder === 'inbox') {
    inboxUnreadCount.textContent = `${unreadCount} unread messages`;
  } else {
    inboxUnreadCount.textContent = `${filtered.length} messages`;
  }
  
  if (filtered.length === 0) {
    inboxEmptyState.classList.remove('hidden');
    inboxEmailList.classList.add('hidden');
    
    const stateData = folderEmptyState(activeFolder);
    inboxEmptyState.innerHTML = `
      <div class="anim-fadeIn flex flex-col items-center justify-center py-24 px-6 text-center">
        <div class="w-18 h-18 rounded-full bg-[#F2EDFF] flex items-center justify-center mb-5 text-brand">
          <i data-lucide="${stateData.icon}" class="w-[30px] h-[30px]"></i>
        </div>
        <h3 class="text-[17px] font-semibold mb-1.5 text-charcoal">${stateData.title}</h3>
        <p class="text-sm text-mediumGray max-w-[320px]">${stateData.subtitle}</p>
      </div>
    `;
    lucide.createIcons();
    return;
  }
  
  inboxEmptyState.classList.add('hidden');
  inboxEmailList.classList.remove('hidden');
  
  filtered.forEach(email => {
    const isSelected = selectedIds.includes(email.id);
    const itemRow = document.createElement('div');
    itemRow.className = 'email-row flex items-center gap-3.5 px-5 py-4 border-b border-[#F0EAE0] cursor-pointer transition duration-150';
    
    itemRow.innerHTML = `
      <button class="chk-box-btn flex-shrink-0 flex items-center justify-center">
        <span class="chk ${isSelected ? 'checked' : ''}">
          ${isSelected ? '<i data-lucide="check" class="text-white w-3 h-3 stroke-[3px]"></i>' : ''}
        </span>
      </button>
      
      <button class="star-btn flex-shrink-0 flex items-center justify-center p-0.5">
        <i data-lucide="star" class="w-[17px] h-[17px]" style="color: ${email.starred ? '#FFB648' : '#D8CFC2'}; fill: ${email.starred ? '#FFB648' : 'none'};"></i>
      </button>
      
      <div class="w-9.5 h-9.5 rounded-full bg-[#F2EDFF] text-brand flex items-center justify-center font-bold text-[13px] flex-shrink-0 select-none">
        ${email.initials}
      </div>
      
      <div class="flex-shrink-0 w-2 flex items-center justify-center">
        ${email.unread ? '<span class="w-[7px] h-[7px] rounded-full bg-brand"></span>' : ''}
      </div>
      
      <div class="flex-1 min-w-0 pr-4">
        <div class="flex items-baseline gap-2 mb-0.5">
          <span class="text-[14.5px] ${email.unread ? 'font-bold' : 'font-medium'} text-charcoal truncate max-w-[160px]">${email.sender}</span>
          ${email.locked ? `
            <span class="badge badge-encrypted flex-shrink-0">
              <i data-lucide="lock" class="w-2.5 h-2.5"></i>
              <span>Encrypted</span>
            </span>
          ` : ''}
        </div>
        <div class="text-[13.5px] text-mediumGray truncate">
          <span class="${email.unread ? 'font-semibold text-charcoal' : 'text-mediumGray'}">${email.subject}</span>
          <span class="text-mediumGray opacity-85"> — ${email.preview}</span>
        </div>
      </div>
      
      <div class="flex items-center gap-2.5 flex-shrink-0">
        ${email.attachment ? '<i data-lucide="paperclip" class="w-[15px] h-[15px] text-mediumGray"></i>' : ''}
        <span class="text-[12.5px] text-mediumGray min-w-[64px] text-right font-medium">${email.time}</span>
      </div>
    `;
    
    itemRow.addEventListener('click', () => {
      openEmailDetails(email.id);
    });
    
    itemRow.querySelector('.chk-box-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      toggleSelectEmail(email.id);
    });
    
    itemRow.querySelector('.star-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      toggleStarEmail(email.id);
    });
    
    inboxEmailList.appendChild(itemRow);
  });
  
  lucide.createIcons();
}

function updateBulkActionsHeader() {
  if (selectedIds.length > 0) {
    bulkActionsPanel.classList.remove('hidden');
    bulkSelectionCount.textContent = `${selectedIds.length} selected`;
  } else {
    bulkActionsPanel.classList.add('hidden');
  }
}

function toggleSelectEmail(id) {
  const index = selectedIds.indexOf(id);
  if (index === -1) {
    selectedIds.push(id);
  } else {
    selectedIds.splice(index, 1);
  }
  renderEmails();
  updateBulkActionsHeader();
}

async function toggleStarEmail(id) {
  const email = emails.find(e => e.id === id);
  if (email) {
    const nextVal = !email.starred;
    email.starred = nextVal;
    renderEmails();
    if (activeFolder === 'starred') renderSidebar();
    
    const ok = await updateEmailOnServer(id, { is_starred: nextVal });
    if (!ok) {
      email.starred = !nextVal;
      renderEmails();
      showToast("Could not update star status");
    }
  }
}

// ------------------------------------------------------------------
// Read / Decrypt Panel Modules
// ------------------------------------------------------------------

async function openEmailDetails(id) {
  const email = emails.find(e => e.id === id);
  if (!email) return;
  
  activeEmailId = id;
  
  if (email.unread) {
    email.unread = false;
    renderSidebar();
    renderEmails();
    updateEmailOnServer(id, { is_read: true });
  }
  
  inboxScreen.classList.add('hidden');
  readScreen.classList.remove('hidden');
  
  readEmailSubject.textContent = email.subject;
  readSenderAvatar.textContent = email.initials;
  readSenderName.textContent = email.sender;
  readSenderEmail.textContent = email.senderEmail;
  readEmailTime.textContent = email.time;
  
  const starIcon = readStarBtn.querySelector('i');
  if (email.starred) {
    starIcon.style.color = '#FFB648';
    starIcon.style.fill = '#FFB648';
  } else {
    starIcon.style.color = '#6A6A6A';
    starIcon.style.fill = 'none';
  }
  
  const isDecrypted = decryptedEmailIds.includes(id);
  
  if (email.locked && !isDecrypted) {
    decryptPromptCard.classList.remove('hidden');
    decryptedContentPanel.classList.add('hidden');
    decryptPasskeyInput.value = '';
    decryptErrorText.classList.add('hidden');
    decryptPasskeyInput.classList.remove('error');
    decryptIconRing.className = 'w-16 h-16 rounded-full bg-[#F2EDFF] flex items-center justify-center mb-5';
    decryptIconRing.innerHTML = '<i data-lucide="lock" class="text-brand w-[26px] h-[26px]"></i>';
    lucide.createIcons();
    decryptPasskeyInput.focus();
  } else {
    showDecryptedContent(email);
  }
}

function showDecryptedContent(email) {
  decryptPromptCard.classList.add('hidden');
  decryptedContentPanel.classList.remove('hidden');
  
  readEmailBody.innerHTML = email.body.map(p => `<p class="mb-4 text-[#232323] leading-relaxed">${p}</p>`).join('');
  
  if (email.attachment) {
    readAttachmentCard.classList.remove('hidden');
    readAttachmentName.textContent = email.attachment.name;
    readAttachmentSize.textContent = email.attachment.size;
  } else {
    readAttachmentCard.classList.add('hidden');
  }
  
  lucide.createIcons();
}

async function submitDecryptionPasskey() {
  const email = emails.find(e => e.id === activeEmailId);
  if (!email) return;
  
  const pass = decryptPasskeyInput.value.trim();
  if (pass.length === 0) return;
  
  const token = localStorage.getItem('access_token');
  try {
    decryptIconRing.className = 'w-16 h-16 rounded-full bg-[#F2EDFF] flex items-center justify-center mb-5 anim-pulseRing';
    decryptIconRing.innerHTML = '<i data-lucide="loader-2" class="text-brand w-[26px] h-[26px] anim-spin"></i>';
    lucide.createIcons();
    
    decryptErrorText.classList.add('hidden');
    decryptPasskeyInput.classList.remove('error');
    
    const response = await fetch(`/api/emails/${activeEmailId}/decrypt`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ passkey: pass })
    });
    
    if (response.ok) {
      const data = await response.json();
      email.body = data.body;
      email.attachment = data.attachment;
      
      decryptedEmailIds.push(activeEmailId);
      showDecryptedContent(email);
      showToast("Vault Decrypted & Integrity Verified");
    } else {
      throw new Error("Incorrect passkey");
    }
  } catch (err) {
    decryptPromptCard.classList.remove('anim-scaleIn');
    decryptPromptCard.classList.add('anim-shake');
    decryptPasskeyInput.classList.add('error');
    decryptErrorText.classList.remove('hidden');
    
    decryptIconRing.className = 'w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-5';
    decryptIconRing.innerHTML = '<i data-lucide="lock" class="text-red-500 w-[26px] h-[26px]"></i>';
    lucide.createIcons();
    
    setTimeout(() => {
      decryptPromptCard.classList.remove('anim-shake');
    }, 450);
  }
}

// ------------------------------------------------------------------
// Compose Panel Controllers
// ------------------------------------------------------------------

function openCompose() {
  composePanel.classList.remove('hidden');
  composeToInput.value = '';
  composeCcInput.value = '';
  composeCcRow.classList.add('hidden');
  composeCcToggle.textContent = 'Cc/Bcc';
  composeSubjectInput.value = '';
  composeBodyTextarea.value = '';
  
  composeEncryptionToggle.classList.remove('on');
  composeEncryptionToggle.setAttribute('aria-pressed', 'false');
  composeEncryptionToggleLabel.className = 'text-[12.5px] font-semibold text-mediumGray select-none';
  composeEncryptionKeyBlock.classList.add('hidden');
  
  composeAttachmentBar.classList.remove('hidden');
  
  setupFloatingLabels();
  composeToInput.focus();
}

async function handleComposeSend() {
  const to = composeToInput.value.trim();
  const subject = composeSubjectInput.value.trim() || '(No Subject)';
  const bodyText = composeBodyTextarea.value.trim();
  const isEncrypted = composeEncryptionToggle.classList.contains('on');
  const passkey = isEncrypted ? generatedPasskeyDisplay.textContent : null;
  
  if (!to) {
    showToast("Recipient email is required");
    return;
  }
  
  composeSendBtn.disabled = true;
  composeSendBtn.innerHTML = '<div class="spinner"></div>';
  
  const token = localStorage.getItem('access_token');
  const hasAttachment = !composeAttachmentBar.classList.contains('hidden');
  
  try {
    const response = await fetch('/api/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        recipient_email: to,
        subject: subject,
        body: bodyText,
        is_encrypted: isEncrypted,
        passkey: passkey,
        attachment_name: hasAttachment ? "Q3_Proposal.pdf" : null,
        attachment_size: hasAttachment ? "480 KB" : null
      })
    });
    
    if (!response.ok) {
      const errData = await response.json();
      throw new Error(errData.error || "Transmission failed");
    }
    
    showToast(isEncrypted ? `Secure Encrypted Transmission Sent` : `Message Sent Successfully`);
    
    // Close compose
    composePanel.classList.add('hidden');
    
    // Reload state
    await fetchEmailsFromServer();
    await updateStorageIndicator();
    
    if (activeFolder === 'sent') {
      renderEmails();
    }
    renderSidebar();
  } catch (err) {
    showToast(err.message);
  } finally {
    composeSendBtn.disabled = false;
    composeSendBtn.innerHTML = '<i data-lucide="send" class="w-4 h-4"></i><span>Send</span>';
  }
}

// ------------------------------------------------------------------
// Bulk Action Controllers
// ------------------------------------------------------------------
async function handleBulkAction(action) {
  if (selectedIds.length === 0) return;
  
  const promises = selectedIds.map(id => {
    if (action === 'read') {
      return updateEmailOnServer(id, { is_read: true });
    } else if (action === 'archive') {
      return updateEmailOnServer(id, { folder: 'vault' });
    } else if (action === 'delete') {
      return updateEmailOnServer(id, { folder: 'trash' });
    }
    return Promise.resolve(true);
  });
  
  await Promise.all(promises);
  showToast(`Bulk action completed: ${action}`);
  
  selectedIds = [];
  await fetchEmailsFromServer();
  await updateStorageIndicator();
  
  renderSidebar();
  renderEmails();
  updateBulkActionsHeader();
}

// ------------------------------------------------------------------
// Global Event Bindings
// ------------------------------------------------------------------

// Topbar Avatar clicks
topbarAvatarBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  profileDropdown.classList.toggle('hidden');
});

document.addEventListener('click', () => {
  profileDropdown.classList.add('hidden');
});

profileSettingsBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  profileDropdown.classList.add('hidden');
  showToast("Settings Panel is restricted in prototype mode");
});

profileLogoutBtn.addEventListener('click', () => {
  localStorage.clear();
  window.location.href = '/login';
});

searchMailInput.addEventListener('input', () => {
  renderEmails();
});

// Sidebar compose click
sidebarComposeBtn.addEventListener('click', () => {
  openCompose();
});

// Read screen toolbar events
readBackBtn.addEventListener('click', () => {
  readScreen.classList.add('hidden');
  inboxScreen.classList.remove('hidden');
  activeEmailId = null;
  renderEmails();
});

readStarBtn.addEventListener('click', () => {
  if (activeEmailId) {
    toggleStarEmail(activeEmailId);
    openEmailDetails(activeEmailId);
  }
});

readArchiveBtn.addEventListener('click', async () => {
  if (activeEmailId) {
    const ok = await updateEmailOnServer(activeEmailId, { folder: 'vault' });
    if (ok) {
      showToast("Email moved to Secure Vault");
      await fetchEmailsFromServer();
      readBackBtn.click();
      renderSidebar();
    } else {
      showToast("Error archiving email");
    }
  }
});

readDeleteBtn.addEventListener('click', async () => {
  if (activeEmailId) {
    const email = emails.find(e => e.id === activeEmailId);
    if (email) {
      let ok = false;
      if (email.folder === 'trash') {
        ok = await deleteEmailPermanently(activeEmailId);
        if (ok) showToast("Email permanently deleted");
      } else {
        ok = await updateEmailOnServer(activeEmailId, { folder: 'trash' });
        if (ok) showToast("Email moved to Trash");
      }
      
      if (ok) {
        await fetchEmailsFromServer();
        await updateStorageIndicator();
        readBackBtn.click();
        renderSidebar();
      } else {
        showToast("Error deleting email");
      }
    }
  }
});

// Passkey verification events
decryptPasskeyInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') submitDecryptionPasskey();
});

decryptSubmitBtn.addEventListener('click', () => {
  submitDecryptionPasskey();
});

// Bulk Action Button Events
bulkClearBtn.addEventListener('click', () => {
  selectedIds = [];
  renderEmails();
  updateBulkActionsHeader();
});

bulkReadBtn.addEventListener('click', () => handleBulkAction('read'));
bulkArchiveBtn.addEventListener('click', () => handleBulkAction('archive'));
bulkDeleteBtn.addEventListener('click', () => handleBulkAction('delete'));

// Compose actions events
composeCloseBtn.addEventListener('click', () => {
  composePanel.classList.add('hidden');
});

composeCcToggle.addEventListener('click', () => {
  const isHidden = composeCcRow.classList.contains('hidden');
  if (isHidden) {
    composeCcRow.classList.remove('hidden');
    composeCcToggle.textContent = 'Hide';
  } else {
    composeCcRow.classList.add('hidden');
    composeCcToggle.textContent = 'Cc/Bcc';
  }
});

composeRemoveAttachmentBtn.addEventListener('click', () => {
  composeAttachmentBar.classList.add('hidden');
});

composeEncryptionToggle.addEventListener('click', () => {
  const isOn = composeEncryptionToggle.classList.toggle('on');
  composeEncryptionToggle.setAttribute('aria-pressed', isOn ? 'true' : 'false');
  
  if (isOn) {
    composeEncryptionToggleLabel.className = 'text-[12.5px] font-semibold text-brand select-none';
    composeEncryptionKeyBlock.classList.remove('hidden');
    generatedPasskeyDisplay.textContent = generateRandomPasskey();
  } else {
    composeEncryptionToggleLabel.className = 'text-[12.5px] font-semibold text-mediumGray select-none';
    composeEncryptionKeyBlock.classList.add('hidden');
  }
});

generateNewKeyBtn.addEventListener('click', () => {
  generatedPasskeyDisplay.textContent = generateRandomPasskey();
});

composeSendBtn.addEventListener('click', () => {
  handleComposeSend();
});

// Page Session Verification
window.addEventListener('load', () => {
  const token = localStorage.getItem('access_token');
  if (!token) {
    window.location.href = '/login';
    return;
  }
  
  const payload = parseJwt(token);
  if (!payload) {
    localStorage.clear();
    window.location.href = '/login';
    return;
  }
  
  const now = Math.floor(Date.now() / 1000);
  if (payload.exp && payload.exp < now) {
    localStorage.clear();
    window.location.href = '/login';
    return;
  }
  
  const email = payload.email || localStorage.getItem('user_email') || 'arjun.mehta@securemail.app';
  setupFloatingLabels();
  loadDashboard(email);
  
  // Mobile drawer trigger hook
  const drawer = document.getElementById('sidebar-drawer');
  const overlay = document.getElementById('sidebar-overlay');
  const toggle = document.getElementById('mobile-sidebar-toggle');
  
  if (toggle && drawer && overlay) {
    const closeDrawer = () => {
      drawer.classList.remove('mobile-open');
      overlay.classList.remove('active');
    };
    
    toggle.addEventListener('click', () => {
      drawer.classList.toggle('mobile-open');
      overlay.classList.toggle('active');
    });
    
    overlay.addEventListener('click', closeDrawer);
    
    document.getElementById('sidebar-compose-btn').addEventListener('click', closeDrawer);
    document.getElementById('sidebar-nav').addEventListener('click', closeDrawer);
  }
  
  lucide.createIcons();
});
