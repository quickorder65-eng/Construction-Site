'use strict';

function trackEvent(eventName, eventData) {
  console.log('Analytics event:', eventName, eventData);
}

function getUtmParams() {
  const params = new URLSearchParams(window.location.search);
  return {
    utmSource:   params.get('utm_source')   || '',
    utmMedium:   params.get('utm_medium')   || '',
    utmCampaign: params.get('utm_campaign') || ''
  };
}

const utmParams = getUtmParams();

let leadData = {
  name:         '',
  phone:        '',
  source:       '',
  objectType:   '',
  area:         '',
  repairType:   '',
  workPriority: '',
  startTime:    '',
  message:      '',
  pageUrl:      window.location.href,
  createdAt:    '',
  utmSource:    utmParams.utmSource,
  utmMedium:    utmParams.utmMedium,
  utmCampaign:  utmParams.utmCampaign
};

async function sendLeadToCRM(data) {
  data.createdAt = new Date().toISOString();
  data.pageUrl   = window.location.href;

  console.log('=== LEAD ===', JSON.stringify(data, null, 2));
  trackEvent('estimate_request_submit', data);

  const isLocal = window.location.protocol === 'file:' ||
                  window.location.hostname === 'localhost' ||
                  window.location.hostname === '127.0.0.1';

  if (isLocal) {
    console.log('Demo mode: running locally, skipping API call.');
    return;
  }

  try {
    const response = await fetch('/api/save-lead', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const result = await response.json();
    console.log('CRM response:', result);
  } catch (error) {
    console.error('CRM error:', error);
  }
}

function formatLeadMessage(data) {
  return `Жаңа смета өтінімі — Velora Build
Аты: ${data.name}
Телефон: ${data.phone}
Дереккөз: ${data.source}
Нысан: ${data.objectType}
Аудан: ${data.area}
Жөндеу форматы: ${data.repairType}
Жұмыс басымдығы: ${data.workPriority}
Басталу: ${data.startTime}
Пікір: ${data.message || '—'}
UTM: ${data.utmSource} / ${data.utmMedium} / ${data.utmCampaign}
Уақыт: ${data.createdAt}`;
}

const TOTAL_STEPS = 5;
let currentStep = 1;

const quizAnswers = {
  objectType:   '',
  area:         '',
  repairType:   '',
  workPriority: '',
  startTime:    ''
};

function selectOption(btn, step) {
  const siblings = btn.parentElement.querySelectorAll('.quiz__option');
  siblings.forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');

  const field = btn.dataset.field;
  const value = btn.dataset.value;
  quizAnswers[field] = value;
  leadData[field] = value;

  trackEvent('quiz_step_' + step, { step, field, value });

  setTimeout(() => {
    if (step < TOTAL_STEPS) {
      goToStep(step + 1);
    } else {
      trackEvent('quiz_complete', quizAnswers);
      showSummary();
    }
  }, 260);
}

function goToStep(stepNum) {
  document.querySelectorAll('.quiz__step').forEach(s => s.classList.remove('active'));
  const target = document.getElementById('quizStep' + stepNum);
  if (target) target.classList.add('active');
  currentStep = stepNum;
  updateProgress(stepNum, TOTAL_STEPS);
}

function updateProgress(current, total) {
  const pct   = Math.round((current / total) * 100);
  const fill  = document.getElementById('quizProgressFill');
  const label = document.getElementById('quizProgressLabel');
  if (fill)  fill.style.width = pct + '%';
  if (label) label.textContent = 'Қадам ' + current + ' / ' + total;
}

function showSummary() {
  document.querySelectorAll('.quiz__step').forEach(s => s.classList.remove('active'));
  const summary = document.getElementById('quizSummary');
  if (summary) summary.classList.add('active');

  const container = document.getElementById('summaryAnswers');
  if (container) {
    const labels = {
      objectType:   quizAnswers.objectType   || '—',
      area:         quizAnswers.area         || '—',
      repairType:   quizAnswers.repairType   || '—',
      workPriority: quizAnswers.workPriority || '—',
      startTime:    quizAnswers.startTime    || '—'
    };
    container.innerHTML = Object.values(labels)
      .filter(v => v !== '—')
      .map(v => `<span class="summary__tag">${v}</span>`)
      .join('');
  }

  const progressWrap = document.querySelector('.quiz__progress-wrap');
  if (progressWrap) progressWrap.style.display = 'none';
}

function showQuizForm() {
  document.querySelectorAll('.quiz__step').forEach(s => s.classList.remove('active'));
  const formStep = document.getElementById('quizFormStep');
  if (formStep) formStep.classList.add('active');
}

function submitQuizForm(event) {
  event.preventDefault();

  const nameInput    = document.getElementById('quizName');
  const phoneInput   = document.getElementById('quizPhone');
  const commentInput = document.getElementById('quizComment');
  const nameErr      = document.getElementById('quizNameError');
  const phoneErr     = document.getElementById('quizPhoneError');

  let valid = true;

  if (!nameInput.value.trim()) {
    nameInput.classList.add('error');
    nameErr.classList.add('visible');
    valid = false;
  } else {
    nameInput.classList.remove('error');
    nameErr.classList.remove('visible');
  }

  const digits = phoneInput.value.replace(/\D/g, '');
  if (digits.length < 10) {
    phoneInput.classList.add('error');
    phoneErr.classList.add('visible');
    valid = false;
  } else {
    phoneInput.classList.remove('error');
    phoneErr.classList.remove('visible');
  }

  if (!valid) return;

  const lead = Object.assign({}, leadData, {
    name:         nameInput.value.trim(),
    phone:        phoneInput.value.trim(),
    source:       'quiz_estimate_request',
    objectType:   quizAnswers.objectType,
    area:         quizAnswers.area,
    repairType:   quizAnswers.repairType,
    workPriority: quizAnswers.workPriority,
    startTime:    quizAnswers.startTime,
    message:      commentInput ? commentInput.value.trim() : ''
  });

  sendLeadToCRM(lead);

  document.querySelectorAll('.quiz__step').forEach(s => s.classList.remove('active'));
  const success = document.getElementById('quizSuccess');
  if (success) success.classList.add('active');
}

function submitFinalForm(event) {
  event.preventDefault();

  const nameInput  = document.getElementById('ctaName');
  const phoneInput = document.getElementById('ctaPhone');
  const nameErr    = document.getElementById('ctaNameError');
  const phoneErr   = document.getElementById('ctaPhoneError');

  let valid = true;

  if (!nameInput.value.trim()) {
    nameInput.classList.add('error');
    nameErr.classList.add('visible');
    valid = false;
  } else {
    nameInput.classList.remove('error');
    nameErr.classList.remove('visible');
  }

  const digits = phoneInput.value.replace(/\D/g, '');
  if (digits.length < 10) {
    phoneInput.classList.add('error');
    phoneErr.classList.add('visible');
    valid = false;
  } else {
    phoneInput.classList.remove('error');
    phoneErr.classList.remove('visible');
  }

  if (!valid) return;

  const lead = Object.assign({}, leadData, {
    name:   nameInput.value.trim(),
    phone:  phoneInput.value.trim(),
    source: 'final_estimate_request'
  });

  sendLeadToCRM(lead);

  const form    = document.getElementById('finalCtaForm');
  const success = document.getElementById('finalFormSuccess');
  if (form)    form.style.display = 'none';
  if (success) success.style.display = 'block';

  setTimeout(() => {
    if (form)    form.style.display = '';
    if (success) success.style.display = 'none';
    nameInput.value  = '';
    phoneInput.value = '';
  }, 8000);
}

let chatOpen    = false;
let chatGreeted = false;

function toggleChat() {
  chatOpen ? closeChat() : openChat();
}

function openChat() {
  const win = document.getElementById('chatWindow');
  if (win) {
    win.style.display = 'flex';
    win.style.animation = 'none';
    void win.offsetWidth;
    win.style.animation = 'slideUp .22s ease';
  }
  chatOpen = true;
  trackEvent('bot_open', {});

  if (!chatGreeted) {
    chatGreeted = true;
    setTimeout(() => {
      addBotMessage('Сәлеметсіз бе! Жөндеу бойынша бағыт алуға көмектесемін: құны, мерзімдер, смета, кезеңдер және WhatsApp-тағы өтінім.');
    }, 100);
  }
}

function closeChat() {
  const win = document.getElementById('chatWindow');
  if (win) win.style.display = 'none';
  chatOpen = false;
}

function addBotMessage(text) {
  const container = document.getElementById('chatMessages');
  if (!container) return;
  const msg = document.createElement('div');
  msg.className = 'chat-msg chat-msg--bot';
  msg.textContent = text;
  container.appendChild(msg);
  container.scrollTop = container.scrollHeight;
}

function addUserMessage(text) {
  const container = document.getElementById('chatMessages');
  if (!container) return;
  const msg = document.createElement('div');
  msg.className = 'chat-msg chat-msg--user';
  msg.textContent = text;
  container.appendChild(msg);
  container.scrollTop = container.scrollHeight;
}

function addBotLink(text, href) {
  const container = document.getElementById('chatMessages');
  if (!container) return;
  const msg = document.createElement('div');
  msg.className = 'chat-msg chat-msg--bot';
  msg.innerHTML = text + (href ? ` <a href="${href}" style="color:var(--clr-accent);text-decoration:underline;display:block;margin-top:8px;" target="_blank" onclick="trackEvent('whatsapp_click',{location:'chat'})">${href.startsWith('https://wa.me') ? '→ Написать в WhatsApp' : '→ Подробнее'}</a>` : '');
  container.appendChild(msg);
  container.scrollTop = container.scrollHeight;
}

const chatResponses = {
  calc: {
    user: 'Құнын есептеу',
    bot:  'Тамаша! Қысқа квизден өтіңіз — 5 сұрақ — нысаныңыз бойынша бюджеттің алдын ала ауқымын дайындаймыз.',
    link: '#quiz'
  },
  estimate_q: {
    user: 'Сметаға не кіреді?',
    bot:  'Сметаға әдетте кіреді: бұзу, қара жұмыстар, электрика, сантехника, таза материалдар, шебер жұмысы, жеткізу және күтпеген шығындар. Нақты құрам нысанға және таңдалған пакетке байланысты.'
  },
  timeline: {
    user: 'Жөндеу мерзімдері қандай?',
    bot:  'Мерзім нысанның ауданына, жай-күйіне және жөндеу түріне байланысты. Бағдарлық: кішкентай пәтер — ~35 жұмыс күні, орташа 60 м² — ~55 күн, үлкен 90 м² — ~75 күн.'
  },
  price_factors: {
    user: 'Бағаны не арттырады?',
    bot:  'Бюджет жиі мыналардан өседі: коммуникациялардың жасырын жай-күйі, қосымша бұзу, барысындағы өзгерістер, қымбат материалдарды таңдау. Жөндеу басталмас бұрын ықтимал тәуекелдерді көрсетеміз.'
  },
  cases_q: {
    user: 'Жұмыстарды қарау',
    bot:  'Сайттың «Нысандар» бөлімінде дайын нысандардың фото мен плейсхолдерлерін қарауға болады.',
    link: '#cases'
  }
};

function chatQuickReply(key) {
  const resp = chatResponses[key];
  if (!resp) return;

  trackEvent('bot_quick_reply_click', { key });
  addUserMessage(resp.user);

  setTimeout(() => {
    if (resp.link) {
      addBotLink(resp.bot, resp.link);
    } else {
      addBotMessage(resp.bot);
    }
  }, 550);
}

function toggleMobileNav() {
  const nav     = document.getElementById('mobileNav');
  const overlay = document.getElementById('mobileNavOverlay');
  const burger  = document.getElementById('burgerBtn');
  nav.classList.toggle('open');
  overlay.classList.toggle('show');
  burger.classList.toggle('open');
  document.body.style.overflow = nav.classList.contains('open') ? 'hidden' : '';
}

function closeMobileNav() {
  const nav     = document.getElementById('mobileNav');
  const overlay = document.getElementById('mobileNavOverlay');
  const burger  = document.getElementById('burgerBtn');
  nav.classList.remove('open');
  overlay.classList.remove('show');
  burger.classList.remove('open');
  document.body.style.overflow = '';
}

function toggleFaq(item) {
  const isOpen = item.classList.contains('open');
  document.querySelectorAll('.faq-item.open').forEach(el => el.classList.remove('open'));
  if (!isOpen) item.classList.add('open');
}

(function initHeaderScroll() {
  const header = document.getElementById('header');
  if (!header) return;
  window.addEventListener('scroll', () => {
    header.classList.toggle('scrolled', window.scrollY > 60);
  }, { passive: true });
})();

document.addEventListener('DOMContentLoaded', () => {
  trackEvent('page_view', {
    url:      window.location.href,
    referrer: document.referrer,
    utm:      utmParams
  });
  trackEvent('quiz_start', {});

  if ('IntersectionObserver' in window) {
    const pkgObs = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          trackEvent('package_card_view', { visible: true });
          pkgObs.unobserve(entry.target);
        }
      });
    }, { threshold: .5 });
    document.querySelectorAll('.package-card').forEach(c => pkgObs.observe(c));
  }

  if ('IntersectionObserver' in window) {
    const videos = document.querySelectorAll('video.lazy-video');
    if (videos.length) {
      const obs = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          const v = entry.target;
          if (entry.isIntersecting) {
            v.play().catch(() => {});
          } else {
            v.pause();
          }
        });
      }, { threshold: 0.35 });
      videos.forEach(v => obs.observe(v));
    }
  }
});

document.addEventListener('click', (e) => {
  const anchor = e.target.closest('a[href^="#"]');
  if (!anchor) return;
  const id = anchor.getAttribute('href').slice(1);
  if (!id) return;
  const target = document.getElementById(id);
  if (!target) return;
  e.preventDefault();
  target.scrollIntoView({ behavior: 'smooth', block: 'start' });
});

document.addEventListener('input', (e) => {
  if (e.target.type !== 'tel') return;
  let val = e.target.value.replace(/\D/g, '');
  if (val.startsWith('8')) val = '7' + val.slice(1);
  if (val.length > 11) val = val.slice(0, 11);
  if (val.length > 0) {
    let f = '+' + val[0];
    if (val.length > 1)  f += ' (' + val.slice(1, 4);
    if (val.length > 4)  f += ') ' + val.slice(4, 7);
    if (val.length > 7)  f += '-' + val.slice(7, 9);
    if (val.length > 9)  f += '-' + val.slice(9, 11);
    if (val.length >= 2 && val.length <= 3) f += ')';
    e.target.value = f;
  }
});
