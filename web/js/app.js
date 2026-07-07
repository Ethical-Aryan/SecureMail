// Elements
const loginView = document.getElementById('login-view');
const registerView = document.getElementById('register-view');
const dashboardView = document.getElementById('dashboard-view');

const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');

const loginEmailInput = document.getElementById('login-email-input');
const loginPasswordInput = document.getElementById('login-password-input');
const registerEmailInput = document.getElementById('register-email-input');
const registerPasswordInput = document.getElementById('register-password-input');
const registerConfirmInput = document.getElementById('register-confirm-input');

const loginErrorAlert = document.getElementById('login-error-alert');
const registerErrorAlert = document.getElementById('register-error-alert');
const registerSuccessAlert = document.getElementById('register-success-alert');

const userEmailDisplay = document.getElementById('user-email-display');
const logoutBtn = document.getElementById('logout-btn');

// View Switchers
document.getElementById('to-register-btn').addEventListener('click', () => {
  loginView.classList.add('hidden');
  registerView.classList.remove('hidden');
  registerForm.reset();
  registerErrorAlert.classList.add('hidden');
  registerSuccessAlert.classList.add('hidden');
  resetPasswordStrength();
});

document.getElementById('to-login-btn').addEventListener('click', showLogin);

function showLogin() {
  registerView.classList.add('hidden');
  dashboardView.classList.add('hidden');
  loginView.classList.remove('hidden');
  loginForm.reset();
  loginErrorAlert.classList.add('hidden');
}

function showDashboard(email) {
  loginView.classList.add('hidden');
  registerView.classList.add('hidden');
  dashboardView.classList.remove('hidden');
  userEmailDisplay.textContent = email;
}

// Toggle Password Visibility
setupPasswordToggle('login-password-input', 'login-password-toggle');
setupPasswordToggle('register-password-input', 'register-password-toggle');

function setupPasswordToggle(inputId, toggleId) {
  const input = document.getElementById(inputId);
  const toggle = document.getElementById(toggleId);
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

// Password Strength Meter
registerPasswordInput.addEventListener('input', () => {
  const val = registerPasswordInput.value;
  const box = document.getElementById('password-strength-box');
  if (!val) {
    box.style.display = 'none';
    return;
  }
  box.style.display = 'block';
  
  let score = 0;
  if (val.length >= 8) score++;
  if (/[A-Z]/.test(val)) score++;
  if (/[0-9]/.test(val)) score++;
  if (/[^A-Za-z0-9]/.test(val)) score++;
  
  const segments = [
    document.getElementById('segment-1'),
    document.getElementById('segment-2'),
    document.getElementById('segment-3'),
    document.getElementById('segment-4')
  ];
  
  let label = 'Weak';
  let color = '#ef4444';
  if (score === 2) {
    label = 'Medium';
    color = '#eab308';
  } else if (score === 3) {
    label = 'Strong';
    color = '#10b981';
  } else if (score === 4) {
    label = 'Very Strong';
    color = '#059669';
  }
  
  const labelEl = document.getElementById('strength-label');
  labelEl.textContent = label;
  labelEl.style.color = color;
  
  segments.forEach((seg, idx) => {
    if (idx < score) {
      seg.style.backgroundColor = color;
    } else {
      seg.style.backgroundColor = 'transparent';
    }
  });
});

function resetPasswordStrength() {
  document.getElementById('password-strength-box').style.display = 'none';
  const segments = ['segment-1', 'segment-2', 'segment-3', 'segment-4'];
  segments.forEach(id => {
    document.getElementById(id).style.backgroundColor = 'transparent';
  });
}

// Custom JS JWT Decoder
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

// Handle Login Submit
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  loginErrorAlert.classList.add('hidden');
  
  const submitBtn = document.getElementById('login-submit-btn');
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<div class="spinner"></div>';
  
  const email = loginEmailInput.value;
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
    
    showDashboard(data.user.email);
  } catch (err) {
    loginErrorAlert.classList.remove('hidden');
    loginErrorAlert.querySelector('.error-text').textContent = err.message;
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = '<span>Authenticate Vault</span>';
  }
});

// Handle Register Submit
registerForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  registerErrorAlert.classList.add('hidden');
  registerSuccessAlert.classList.add('hidden');
  
  const email = registerEmailInput.value;
  const password = registerPasswordInput.value;
  const confirm = registerConfirmInput.value;
  
  if (password !== confirm) {
    registerErrorAlert.classList.remove('hidden');
    registerErrorAlert.querySelector('.error-text').textContent = 'Passwords do not match';
    return;
  }
  
  if (password.length < 8) {
    registerErrorAlert.classList.remove('hidden');
    registerErrorAlert.querySelector('.error-text').textContent = 'Password must be at least 8 characters long';
    return;
  }
  
  const submitBtn = document.getElementById('register-submit-btn');
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<div class="spinner"></div>';
  
  try {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Registration failed');
    }
    
    registerSuccessAlert.classList.remove('hidden');
    registerSuccessAlert.querySelector('.success-text').textContent = 'Vault key registered! Redirecting...';
    
    setTimeout(() => {
      showLogin();
    }, 1500);
  } catch (err) {
    registerErrorAlert.classList.remove('hidden');
    registerErrorAlert.querySelector('.error-text').textContent = err.message;
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = '<span>Register Secure Identity</span>';
  }
});

// Logout
logoutBtn.addEventListener('click', () => {
  localStorage.clear();
  showLogin();
});

// Page Load Session Check
window.addEventListener('load', () => {
  const token = localStorage.getItem('access_token');
  if (token) {
    const payload = parseJwt(token);
    if (payload) {
      // Check if expired
      const now = Math.floor(Date.now() / 1000);
      if (payload.exp && payload.exp < now) {
        localStorage.clear();
        showLogin();
      } else {
        const email = payload.email || localStorage.getItem('user_email') || 'user@securemail.com';
        showDashboard(email);
      }
    } else {
      localStorage.clear();
      showLogin();
    }
  } else {
    showLogin();
  }
});
