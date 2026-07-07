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
// Password Toggle Visibility Helper
// ------------------------------------------------------------------
function setupPasswordToggle(inputId, toggleId) {
  const input = document.getElementById(inputId);
  const toggle = document.getElementById(toggleId);
  if (!input || !toggle) return;
  
  const openIcon = toggle.querySelector('.eye-open-icon');
  const closedIcon = toggle.querySelector('.eye-closed-icon');
  
  toggle.addEventListener('click', () => {
    if (input.type === 'password') {
      input.type = 'text';
      openIcon.classList.add('hidden');
      closedIcon.classList.remove('hidden');
    } else {
      input.type = 'password';
      openIcon.classList.remove('hidden');
      closedIcon.classList.add('hidden');
    }
  });
}

// ------------------------------------------------------------------
// Page Load Session Checker
// ------------------------------------------------------------------
window.addEventListener('load', () => {
  setupFloatingLabels();
  setupPasswordToggle('login-password-input', 'login-password-toggle');
  lucide.createIcons();
  
  const token = localStorage.getItem('access_token');
  if (token) {
    const payload = parseJwt(token);
    if (payload) {
      const now = Math.floor(Date.now() / 1000);
      if (payload.exp && payload.exp >= now) {
        // Active valid session -> Redirect to Dashboard
        window.location.href = '/dashboard';
        return;
      }
    }
    // Invalid or expired token -> Clean it up
    localStorage.clear();
  }
});

// ------------------------------------------------------------------
// Submit Form to Auth Login Endpoint
// ------------------------------------------------------------------
const loginForm = document.getElementById('login-form');
const loginEmailInput = document.getElementById('login-email-input');
const loginPasswordInput = document.getElementById('login-password-input');
const loginErrorAlert = document.getElementById('login-error-alert');
const loginSubmitBtn = document.getElementById('login-submit-btn');

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  loginErrorAlert.classList.add('hidden');
  
  loginSubmitBtn.disabled = true;
  loginSubmitBtn.innerHTML = '<div class="spinner"></div>';
  
  const email = loginEmailInput.value.trim();
  const password = loginPasswordInput.value;
  
  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Authentication failed');
    }
    
    localStorage.setItem('access_token', data.access_token);
    localStorage.setItem('user_email', data.user.email);
    
    window.location.href = '/dashboard';
  } catch (err) {
    loginErrorAlert.classList.remove('hidden');
    loginErrorAlert.querySelector('.error-text').textContent = err.message;
  } finally {
    loginSubmitBtn.disabled = false;
    loginSubmitBtn.innerHTML = '<span>Authenticate Vault</span>';
  }
});
