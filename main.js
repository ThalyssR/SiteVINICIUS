/* Sem rastreamento ou envio automático de dados. */
(() => {
  'use strict';
  const menuButton = document.querySelector('.menu-toggle');
  const navigation = document.getElementById('navigation');
  const mobile = window.matchMedia('(max-width: 899px)');

  function closeMenu(restoreFocus = false) {
    menuButton.setAttribute('aria-expanded', 'false');
    navigation.dataset.open = 'false';
    menuButton.querySelector('.menu-label').textContent = 'Menu';
    if (restoreFocus) menuButton.focus();
  }

  menuButton.addEventListener('click', () => {
    const open = menuButton.getAttribute('aria-expanded') !== 'true';
    menuButton.setAttribute('aria-expanded', String(open));
    navigation.dataset.open = String(open);
    menuButton.querySelector('.menu-label').textContent = open ? 'Fechar' : 'Menu';
  });
  navigation.addEventListener('click', (event) => {
    if (event.target.closest('a')) closeMenu();
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && menuButton.getAttribute('aria-expanded') === 'true') closeMenu(true);
  });
  document.addEventListener('click', (event) => {
    if (!event.target.closest('.site-header') && menuButton.getAttribute('aria-expanded') === 'true') closeMenu();
  });
  mobile.addEventListener('change', () => closeMenu());
  menuButton.hidden = false;
  document.documentElement.classList.add('js');

  document.getElementById('year').textContent = String(new Date().getFullYear());
  const progressBar = document.getElementById('scrollBar');
  let progressScheduled = false;
  function renderProgress() {
    const available = document.documentElement.scrollHeight - window.innerHeight;
    const progress = available > 0 ? Math.min(1, Math.max(0, window.scrollY / available)) : 0;
    progressBar.style.transform = 'scaleX(' + progress + ')';
    progressScheduled = false;
  }
  function scheduleProgress() {
    if (progressScheduled) return;
    progressScheduled = true;
    window.requestAnimationFrame(renderProgress);
  }
  window.addEventListener('scroll', scheduleProgress, { passive: true });
  window.addEventListener('resize', scheduleProgress);
  window.addEventListener('load', renderProgress);
  renderProgress();

  const form = document.getElementById('contactForm');
  const name = document.getElementById('nome');
  const email = document.getElementById('email');
  const message = document.getElementById('msg');
  const result = document.getElementById('messageResult');
  const preview = document.getElementById('messagePreview');
  const status = document.getElementById('copyStatus');
  const copyButton = document.getElementById('copyMessage');

  function invalidatePreview() {
    result.hidden = true;
    preview.value = '';
    status.textContent = '';
    name.setCustomValidity('');
    message.setCustomValidity('');
    scheduleProgress();
  }
  form.addEventListener('input', invalidatePreview);
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    name.setCustomValidity(name.value.trim() ? '' : 'Digite seu nome.');
    message.setCustomValidity(message.value.trim() ? '' : 'Escreva sua mensagem.');
    if (!form.reportValidity()) return;
    const parts = ['Olá, Fincredi! Meu nome é ' + name.value.trim() + '.', '', message.value.trim()];
    if (email.value.trim()) parts.push('', 'Meu e-mail para contato: ' + email.value.trim());
    preview.value = parts.join('\n');
    status.textContent = '';
    result.hidden = false;
    document.getElementById('resultTitle').focus({ preventScroll: true });
    result.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'center' });
    scheduleProgress();
  });
  copyButton.addEventListener('click', async () => {
    copyButton.disabled = true;
    try {
      if (!navigator.clipboard || !window.isSecureContext) throw new Error('Clipboard indisponível');
      await navigator.clipboard.writeText(preview.value);
      status.textContent = 'Mensagem copiada. Abra o Instagram e cole na conversa com a Fincredi.';
    } catch (_) {
      preview.focus();
      preview.select();
      preview.setSelectionRange(0, preview.value.length);
      status.textContent = 'Selecionei o texto. Use Copiar no seu dispositivo ou Ctrl+C (⌘C no Mac) e cole no Instagram.';
    } finally {
      copyButton.disabled = false;
    }
  });
  document.querySelectorAll('[data-topic]').forEach((link) => {
    link.addEventListener('click', () => {
      // Preserva uma mensagem que o visitante já tenha começado a escrever.
      if (!message.value.trim()) {
        message.value = link.dataset.topic;
        invalidatePreview();
      }
    });
  });
  form.hidden = false;
})();
