(() => {
  'use strict';

  const ADMIN_EMAIL = 'admin@hnia.my.id';
  const MAX_ATTEMPTS = 5;
  const LOCKOUT_MS = 15 * 60 * 1000;

  let attempts = parseInt(localStorage.getItem('_login_attempts') || '0', 10);
  let lockUntil = parseInt(localStorage.getItem('_login_lock') || '0', 10);

  function isLocked() { return Date.now() < lockUntil; }
  function remainingLock() { return Math.ceil((lockUntil - Date.now()) / 1000); }
  function recordFail() {
    attempts++;
    localStorage.setItem('_login_attempts', attempts);
    if (attempts >= MAX_ATTEMPTS) {
      lockUntil = Date.now() + LOCKOUT_MS;
      localStorage.setItem('_login_lock', lockUntil);
    }
  }
  function resetAttempts() {
    attempts = 0;
    lockUntil = 0;
    localStorage.removeItem('_login_attempts');
    localStorage.removeItem('_login_lock');
  }

  function validatePassword(pw) {
    if (pw.length < 8) return 'Kata sandi minimal 8 karakter.';
    if (!/[a-zA-Z]/.test(pw)) return 'Kata sandi harus mengandung huruf.';
    if (!/[0-9]/.test(pw)) return 'Kata sandi harus mengandung angka.';
    return null;
  }

  async function checkAuth() {
    const { data: { session } } = await APP.sb.auth.getSession();
    APP.state.loggedIn = !!session;
  }

  function initLoginView(viewLogin) {
    viewLogin.innerHTML = ADMIN_VIEWS.login();

    const form  = APP.$(viewLogin, '[data-login-form]');
    const email = APP.$(viewLogin, '[data-email-input]');
    const pw    = APP.$(viewLogin, '[data-password-input]');
    const err   = APP.$(viewLogin, '[data-login-error]');
    const btn   = APP.$(viewLogin, '[data-login-submit]');

    email.value = ADMIN_EMAIL;

    function updateLockUI() {
      if (isLocked()) {
        err.textContent = 'Terlalu banyak percobaan gagal. Coba lagi dalam ' + remainingLock() + ' detik.';
        err.hidden = false;
        btn.disabled = true;
      }
    }
    updateLockUI();
    if (isLocked()) {
      var lockInterval = setInterval(() => {
        if (!isLocked()) {
          clearInterval(lockInterval);
          err.hidden = true;
          btn.disabled = false;
          attempts = 0;
          localStorage.removeItem('_login_attempts');
          localStorage.removeItem('_login_lock');
        } else {
          err.textContent = 'Terlalu banyak percobaan gagal. Coba lagi dalam ' + remainingLock() + ' detik.';
        }
      }, 1000);
    }

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      err.hidden = true;

      if (isLocked()) {
        err.textContent = 'Terlalu banyak percobaan gagal. Coba lagi dalam ' + remainingLock() + ' detik.';
        err.hidden = false;
        return;
      }

      const pwError = validatePassword(pw.value);
      if (pwError) { err.textContent = pwError; err.hidden = false; return; }

      btn.disabled = true;
      btn.textContent = 'Masuk...';
      try {
        const { error } = await APP.sb.auth.signInWithPassword({
          email: email.value.trim(),
          password: pw.value
        });
        if (error) {
          recordFail();
          var left = MAX_ATTEMPTS - attempts;
          if (error.message === 'Invalid login credentials') {
            err.textContent = left > 0
              ? 'Kata sandi salah atau akun belum dibuat. Sisa percobaan: ' + left
              : 'Terlalu banyak percobaan gagal. Akun terkunci 15 menit.';
          } else {
            err.textContent = error.message;
          }
          err.hidden = false;
          if (isLocked()) { updateLockUI(); }
          return;
        }
        resetAttempts();
        APP.state.loggedIn = true;
        APP.router();
      } catch (ex) {
        err.textContent = ex.message;
        err.hidden = false;
      } finally {
        btn.disabled = false;
        btn.textContent = 'Masuk';
      }
    });
  }

  function logout(container) {
    APP.$(container, '[data-logout]').addEventListener('click', async () => {
      await APP.sb.auth.signOut();
      APP.state.loggedIn = false;
      APP.router();
    });
  }

  window.Auth = { checkAuth, initLoginView, logout };
})();
