const ALLOWED_HTML_TAGS = [
  'DIV', 'P', 'A', 'BUTTON', 'H3', 'H4', 'H5', 'IMG', 'SPAN', 'UL', 'LI', 'STRONG', 'BR',
];

function safeRenderHTML(rawHtml) {
  const wrapper = document.createElement('div');
  wrapper.innerHTML = rawHtml;

  [...wrapper.querySelectorAll('*')].forEach(el => {
    if (!ALLOWED_HTML_TAGS.includes(el.tagName)) el.remove();
  });

  return wrapper.innerHTML;
}

function formatTime() {
  const now = new Date();
  return now.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function createReplyElement(replyTo) {
  const reply = document.createElement('div');
  reply.className = 'text-sm text-gray-400 mb-1 italic';
  reply.textContent = `➤ ${replyTo}`;
  return reply;
}

function createTimeElement() {
  const time = document.createElement('div');
  time.className = 'text-xs text-gray-400 mt-1 px-1';
  time.textContent = formatTime();
  return time;
}

function createProductCard(product) {
  const card = document.createElement('div');
  card.className = 'mt-2 rounded-xl overflow-hidden bg-[#2e2e3e] border border-gray-600';
  card.innerHTML = `
    <img src="${product.img}" class="w-full h-32 object-cover" />
    <div class="p-3">
      <div class="font-bold">${product.name}</div>
      <div class="text-sm text-gray-300">${product.price}</div>
      <div class="flex items-center gap-1.5 justify-between mt-2">
        <button
          onclick="alert('under Maintenance! proses pembelian tersedia di katalog, silahkan ketik - minta katalog dong.')"
          class="cursor-pointer text-sm add-to-cart-btn flex inline-block px-3 py-1 bg-green-500 text-white rounded-lg"
        >
          Beli Sekarang
        </button>
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
          class="lucide lucide-share2-icon lucide-share-2">
          <circle cx="18" cy="5" r="3" />
          <circle cx="6" cy="12" r="3" />
          <circle cx="18" cy="19" r="3" />
          <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
          <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
        </svg>
      </div>
    </div>
  `;
  return card;
}

function createVoiceBubble(voice) {
  const voiceBubble = document.createElement('div');
  voiceBubble.classList.add("voice-note");
  voiceBubble.className = `flex items-center gap text-sm text-gray-300`;
  voiceBubble.innerHTML = `
    <svg class="play-voice cursor-pointer h-4 w-14" xmlns="http://www.w3.org/2000/svg" width="24" height="24"
      viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
      stroke-linejoin="round" class="lucide lucide-play-icon lucide-play">
      <polygon points="6 3 20 12 6 21 6 3" />
    </svg>
    <svg class="h-4 w-4" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
      class="lucide lucide-audio-lines-icon lucide-audio-lines">
      <path d="M2 10v3" />
      <path d="M6 6v11" />
      <path d="M10 3v18" />
      <path d="M14 8v7" />
      <path d="M18 5v13" />
      <path d="M22 10v3" />
    </svg>
    <span class="italic flex">
      Lyra mengirim voice note...
      </svg>
    </span>
  `;

  // Add click handler to play voice note
  voiceBubble.querySelector('.play-voice')?.addEventListener('click', () => {
    const utter = new SpeechSynthesisUtterance(voice);
    utter.lang = 'id-ID';

    const voiceNoteStatus = document.getElementById('voiceNoteStatus');
    const clockStatus = document.getElementById('clockStatus');

    if (voiceNoteStatus) {
      voiceNoteStatus.textContent = 'Lyra sedang berbicara...';
      voiceNoteStatus.classList.remove('hidden');
    }
    if (clockStatus) clockStatus.classList.add('hidden');
    navigator.vibrate?.(100);

    utter.onend = () => {
      if (voiceNoteStatus) voiceNoteStatus.classList.add('hidden');
      if (clockStatus) clockStatus.classList.remove('hidden');
    };

    speechSynthesis.speak(utter);
  });

  return voiceBubble;
}

function buildBubble({ sender, voice, voiceOnly, text, html }) {
  const bubble = document.createElement('div');
  const isWideContent =
    html && (html.includes('add-to-cart-btn') || html.includes('<div class="card">'));

  bubble.className = `
    relative
    ${isWideContent ? 'w-full max-w-none' : 'max-w-xs'}
    px-4 py-2 rounded-2xl whitespace-pre-line
    ${
      sender === 'user'
        ? 'bg-purple-600 text-white self-end rounded-br-none'
        : 'bg-gray-700 text-white self-start rounded-bl-none'
    }
  `.replace(/\s+/g, ' ').trim();

  if (sender === 'lyra') {
    bubble.classList.add('bubble-pop');
  }

  if (voiceOnly && voice) {
    bubble.classList.add('voice-note');
    const voiceContent = createVoiceBubble(voice);
    bubble.appendChild(voiceContent);
  } else if (voiceOnly && !voice) {
    bubble.textContent = '🚫 Kamu belum login! 🔐';
  } else if (html) {
    bubble.innerHTML = safeRenderHTML(html);
  } else if (text) {
    bubble.textContent = text;
  }

  bubble.classList.add('opacity-0');
  setTimeout(() => {
    bubble.classList.remove('opacity-0');
    bubble.classList.add('animate-fade-in');
  }, 50);

  return bubble;
}

export function appendMessage({
  sender,
  voice,
  voiceOnly,
  text,
  html,
  replyTo = null,
  product = null,
}) {
  const chatBox = document.getElementById('chatBox');
  if (!chatBox) return;

  const container = document.createElement('div');
  container.className = `flex flex-col ${sender === 'user' ? 'items-end' : 'items-start'}`;

  if (replyTo) {
    const reply = createReplyElement(replyTo);
    container.appendChild(reply);
  }

  const bubble = buildBubble({ sender, voice, voiceOnly, text, html });
  container.appendChild(bubble);

  container.appendChild(createTimeElement());

  if (product) {
    const card = createProductCard(product);
    container.appendChild(card);
  }

  chatBox.appendChild(container);

  if (sender === 'lyra') {
    // Play sound for messages from lyra
    const audio = new Audio('/chat-up.mp3');
    audio.volume = 0.3;
    audio.play().catch(() => {});
  }

  chatBox.scrollTop = chatBox.scrollHeight;
}

export function showTypingBubble() {
  const chatBox = document.getElementById('chatBox');
  if (!chatBox || document.getElementById('typingBubble')) return;

  const typingDiv = document.createElement('div');
  typingDiv.id = 'typingBubble';
  typingDiv.className = 'self-start bg-gray-700 px-4 py-2 rounded-2xl max-w-max';

  typingDiv.innerHTML = `
    <div class="flex gap-1 typing-bubble">
      <span></span><span></span><span></span>
    </div>
  `;

  chatBox.appendChild(typingDiv);
  chatBox.scrollTop = chatBox.scrollHeight;
}

export function removeTypingBubble() {
  document.getElementById('typingBubble')?.remove();
}

/**
 * Updates the voice note header visibility and text
 * @param {'berbicara' | 'voice' | 'mengetik'} status
 */
export function showVoiceNoteHeader(status = 'berbicara') {
  const vn = document.getElementById('voiceNoteStatus');
  if (!vn) return;
  vn.textContent =
    status === 'voice' ? 'Lyra sedang berbicara...' : 'Lyra sedang mengetik...';
  vn.classList.remove('hidden');
}

export function hideVoiceNoteHeader() {
  const vn = document.getElementById('voiceNoteStatus');
  if (vn) vn.classList.add('hidden');
}

/**
 * Updates the typing header visibility and text
 * @param {'mengetik' | 'voice'} status
 */
export function showTypingHeader(status = 'mengetik') {
  const typing = document.getElementById('typingStatus');
  const clockStatus = document.getElementById('lyraClock');
  if (!typing) return;
  typing.textContent =
    status === 'voice' ? 'Lyra sedang merekam...' : 'Lyra sedang mengetik...';
  typing.classList.remove('hidden');
  if (clockStatus) clockStatus.classList.add('hidden');
}

export function hideTypingHeader() {
  const typing = document.getElementById('typingStatus');
  const clockStatus = document.getElementById('lyraClock');
  if (typing) typing.classList.add('hidden');
  if (clockStatus) clockStatus.classList.remove('hidden');
}