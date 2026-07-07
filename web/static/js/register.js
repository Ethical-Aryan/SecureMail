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
// Password Strength Meter
// ------------------------------------------------------------------
const registerPasswordInput = document.getElementById('register-password-input');

function setupPasswordStrength() {
  if (!registerPasswordInput) return;
  
  registerPasswordInput.addEventListener('input', () => {
    const val = registerPasswordInput.value;
    const box = document.getElementById('password-strength-box');
    if (!val) {
      box.classList.add('hidden');
      return;
    }
    box.classList.remove('hidden');
    
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
    let color = '#ef4444'; // Red
    
    if (score === 2) {
      label = 'Medium';
      color = '#eab308'; // Yellow
    } else if (score === 3) {
      label = 'Strong';
      color = '#10b981'; // Green
    } else if (score === 4) {
      label = 'Very Strong';
      color = '#059669'; // Dark Green
    }
    
    const labelEl = document.getElementById('strength-label');
    labelEl.textContent = label;
    labelEl.style.color = color;
    
    segments.forEach((seg, idx) => {
      if (idx < score) {
        seg.style.backgroundColor = color;
        seg.style.borderColor = color;
      } else {
        seg.style.backgroundColor = 'transparent';
        seg.style.borderColor = '#E5E0D9';
      }
    });
  });
}

// ------------------------------------------------------------------
// Page Initialization
// ------------------------------------------------------------------
window.addEventListener('load', () => {
  setupFloatingLabels();
  setupPasswordToggle('register-password-input', 'register-password-toggle');
  setupPasswordStrength();
  lucide.createIcons();
});

// ------------------------------------------------------------------
// Form Submissions (API integrations)
// ------------------------------------------------------------------
const registerForm = document.getElementById('register-form');
const registerEmailInput = document.getElementById('register-email-input');
const registerConfirmInput = document.getElementById('register-confirm-input');
const registerErrorAlert = document.getElementById('register-error-alert');
const registerSuccessAlert = document.getElementById('register-success-alert');
const registerSubmitBtn = document.getElementById('register-submit-btn');

registerForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  registerErrorAlert.classList.add('hidden');
  registerSuccessAlert.classList.add('hidden');
  
  const email = registerEmailInput.value.trim();
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
  
  registerSubmitBtn.disabled = true;
  registerSubmitBtn.innerHTML = '<div class="spinner"></div>';
  
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
      window.location.href = '/login';
    }, 1500);
  } catch (err) {
    registerErrorAlert.classList.remove('hidden');
    registerErrorAlert.querySelector('.error-text').textContent = err.message;
  } finally {
    registerSubmitBtn.disabled = false;
    registerSubmitBtn.innerHTML = '<span>Register Secure Identity</span>';
  }
});
