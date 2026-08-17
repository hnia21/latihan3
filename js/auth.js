(() => {
  'use strict';

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

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      err.hidden = true;
      if (!pw.value || pw.value.length < 4) {
        err.textContent = 'Kata sandi minimal 4 karakter.';
        err.hidden = false;
        return;
      }
      try {
        const { error } = await APP.sb.auth.signInWithPassword({
          email: email.value.trim(),
          password: pw.value
        });
        if (error) {
          err.textContent = error.message === 'Invalid login credentials'
            ? 'Kata sandi salah atau akun belum dibuat.' : error.message;
          err.hidden = false;
          return;
        }
        APP.state.loggedIn = true;
        APP.router();
      } catch (ex) {
        err.textContent = ex.message;
        err.hidden = false;
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
