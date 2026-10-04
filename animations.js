/* Fincredi — movimentos inspirados na referência, sem dependência de CDN.
   Este arquivo cuida apenas da apresentação; main.js mantém as interações. */
(() => {
  'use strict';

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (reducedMotion.matches || typeof Element.prototype.animate !== 'function') return;

  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  const active = new Set();
  const waiting = new Map();
  const removeListeners = [];
  let observer = null;
  let stopped = false;
  const ease = 'cubic-bezier(.16, 1, .3, 1)';
  const fadeUp = [
    { opacity: 0, transform: 'translateY(20px)' },
    { opacity: 1, transform: 'translateY(0)' }
  ];

  function listen(target, event, handler, options) {
    target.addEventListener(event, handler, options);
    removeListeners.push(() => target.removeEventListener(event, handler, options));
  }

  function animate(element, frames, settings = {}) {
    if (!element || stopped || reducedMotion.matches) return null;
    const animation = element.animate(frames, {
      duration: 800, easing: ease, fill: 'backwards', ...settings
    });
    active.add(animation);
    animation.addEventListener('finish', () => {
      active.delete(animation);
      // Retorna aos estilos originais ao terminar, liberando o efeito.
      animation.cancel();
    }, { once: true });
    animation.addEventListener('cancel', () => active.delete(animation), { once: true });
    return animation;
  }

  function queue(element, frames = fadeUp, settings = {}) {
    if (!element || !observer || !element.getClientRects().length) return;
    // Conteúdo acima da posição restaurada de rolagem já está disponível.
    if (element.getBoundingClientRect().bottom <= 0) return;
    const animation = animate(element, frames, settings);
    if (!animation) return;
    animation.pause();
    animation.currentTime = 0;
    waiting.set(element, animation);
    observer.observe(element);
  }

  function revealForFocus(target) {
    // Um link ou campo acessado pelo teclado nunca espera a animação.
    active.forEach(animation => {
      const element = animation.effect && animation.effect.target;
      if (element && (element === target || element.contains(target))) animation.cancel();
    });
    waiting.forEach((animation, element) => {
      if (element === target || element.contains(target)) {
        animation.cancel();
        observer.unobserve(element);
        waiting.delete(element);
      }
    });
  }

  function stop() {
    if (stopped) return;
    stopped = true;
    if (observer) observer.disconnect();
    waiting.clear();
    active.forEach(animation => animation.cancel());
    active.clear();
    removeListeners.splice(0).forEach(remove => remove());
  }

  try {
    // 1. Abertura em sequência, com as mesmas três linhas do título atual.
    const hero = document.getElementById('hero');
    const heroVisible = hero && hero.getBoundingClientRect().bottom > 0
      && hero.getBoundingClientRect().top < window.innerHeight;
    if (heroVisible) {
      animate(document.querySelector('.site-header .logo'), [
        { opacity: 0, transform: 'translateY(-6px)' },
        { opacity: 1, transform: 'translateY(0)' }
      ], { duration: 700 });
      animate(document.querySelector('.hero-eyebrow'), fadeUp, { duration: 650, delay: 80 });
      document.querySelectorAll('.hero-line-inner').forEach((line, index) => {
        animate(line, [
          { opacity: 0, transform: 'translateY(110%)' },
          { opacity: 1, transform: 'translateY(0)' }
        ], { duration: 1100, delay: 180 + index * 120 });
      });
      animate(document.querySelector('.hero-foot'), fadeUp, { duration: 850, delay: 620 });
      animate(document.querySelector('.hero-caption'), fadeUp, { duration: 700, delay: 950 });
    }

    // 2. Revelações únicas ao rolar: títulos por máscara e conteúdo em cascata.
    if ('IntersectionObserver' in window) {
      observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          const animation = waiting.get(entry.target);
          if (animation) {
            waiting.delete(entry.target);
            animation.play();
          }
          observer.unobserve(entry.target);
        });
      }, { threshold: 0.05, rootMargin: '0px 0px -32px 0px' });

      document.querySelectorAll('.section-head').forEach(head => {
        queue(head.querySelector('.section-label'), fadeUp, { duration: 650 });
        queue(head.querySelector('h2'), [
          { clipPath: 'inset(0 100% 0 0)' },
          { clipPath: 'inset(0 0% 0 0)' }
        ], { duration: 1000, delay: 80 });
      });
      document.querySelectorAll('.about-grid > *, .solution-intro > *').forEach((element, index) => {
        queue(element, fadeUp, { duration: 800, delay: (index % 2) * 100 });
      });
      document.querySelectorAll('.spec-row').forEach((row, index) => {
        queue(row, [
          { opacity: 0, transform: 'translateX(-14px)' },
          { opacity: 1, transform: 'translateX(0)' }
        ], { duration: 650, delay: index * 80 });
      });
      queue(document.querySelector('.instagram-card'), [
        { opacity: 0, transform: 'translateY(22px) scale(.98)' },
        { opacity: 1, transform: 'translateY(0) scale(1)' }
      ], { duration: 950 });
      queue(document.querySelector('.person-copy'), fadeUp, { duration: 850, delay: 120 });
      queue(document.querySelector('.contact-copy'), fadeUp, { duration: 850 });
      document.querySelectorAll('#contactForm .field, #contactForm .form-note, #contactForm > .btn').forEach((field, index) => {
        queue(field, fadeUp, { duration: 650, delay: Math.min(index * 60, 180) });
      });
      queue(document.querySelector('.footer-inner'), fadeUp, { duration: 750 });
    }
    listen(document, 'focusin', event => revealForFocus(event.target));

    // 3. Resposta magnética discreta, limitada a 5px × 3px e apenas com mouse.
    document.querySelectorAll('.btn').forEach(button => {
      let bounds = null;
      let frame = 0;
      let x = 0;
      let y = 0;
      button.dataset.magnetic = '';
      function reset() {
        if (frame) window.cancelAnimationFrame(frame);
        frame = 0;
        bounds = null;
        button.style.removeProperty('--magnetic-x');
        button.style.removeProperty('--magnetic-y');
      }
      function move(event) {
        if (!finePointer.matches || reducedMotion.matches || event.pointerType !== 'mouse'
          || button.matches(':focus-visible') || button.disabled) return;
        if (!bounds) bounds = button.getBoundingClientRect();
        x = Math.max(-5, Math.min(5, (event.clientX - bounds.left - bounds.width / 2) * .06));
        y = Math.max(-3, Math.min(3, (event.clientY - bounds.top - bounds.height / 2) * .1));
        if (frame) return;
        frame = window.requestAnimationFrame(() => {
          button.style.setProperty('--magnetic-x', x.toFixed(2) + 'px');
          button.style.setProperty('--magnetic-y', y.toFixed(2) + 'px');
          frame = 0;
        });
      }
      listen(button, 'pointermove', move, { passive: true });
      ['pointerleave', 'pointercancel', 'pointerdown', 'focus', 'blur'].forEach(event => listen(button, event, reset));
      listen(window, 'scroll', reset, { passive: true });
      listen(finePointer, 'change', reset);
      removeListeners.push(() => {
        reset();
        delete button.dataset.magnetic;
      });
    });

    // Preferência alterada, impressão e restauração da aba mostram tudo imediatamente.
    listen(reducedMotion, 'change', event => { if (event.matches) stop(); });
    listen(window, 'beforeprint', stop);
    listen(window, 'pagehide', stop);
  } catch (_) {
    // Falha em um recurso de movimento nunca deixa texto ou formulário oculto.
    stop();
  }
})();
