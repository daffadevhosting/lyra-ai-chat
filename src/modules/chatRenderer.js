export function appendMessage({ sender, text, html, replyTo = null, product = null }) {
  const chatBox = document.getElementById("chatBox");
  const div = document.createElement("div");
  div.className = `flex flex-col ${sender === 'user' ? 'items-end' : 'items-start'}`;
  if (replyTo) {
    const reply = document.createElement("div");
    reply.className = `text-sm text-gray-400 mb-1 italic`;
    reply.textContent = `➤ ${replyTo}`;
    div.appendChild(reply);
  }

function safeRenderHTML(rawHtml) {
  const allowedTags = ['DIV', 'P', 'A', 'BUTTON', 'H3', 'H4', 'H5', 'IMG', 'SPAN', 'UL', 'LI', 'STRONG', 'BR'];
  const wrapper = document.createElement('div');
  wrapper.innerHTML = rawHtml;

  // Remove tag yang gak valid
  [...wrapper.querySelectorAll('*')].forEach(el => {
    if (!allowedTags.includes(el.tagName)) el.remove();
  });

  return wrapper.innerHTML;
}
const bubble = document.createElement('div');
const isWideContent = html && (html.includes('add-to-cart-btn') || html.includes('<div class="card">'));
bubble.className = `
  relative
  ${isWideContent ? 'w-full max-w-none' : 'max-w-xs'} 
  px-4 py-2 rounded-2xl whitespace-pre-line
  ${sender === 'user'
    ? 'bg-purple-600 text-white self-end rounded-br-none'
    : 'bg-gray-700 text-white self-start rounded-bl-none'}
`;
  if (sender === 'lyra') {
    bubble.classList.add('bubble-pop');
  }
  if (html) {
    bubble.innerHTML = safeRenderHTML(html);
  } else if (text) {
    bubble.textContent = text;
  }
  
bubble.classList.add('opacity-0');
setTimeout(() => {
  bubble.classList.remove('opacity-0');
  bubble.classList.add('animate-fade-in');
}, 50);

  const time = document.createElement("div");
  time.className = "text-xs text-gray-400 mt-1 px-1";
  time.textContent = formatTime();

  div.appendChild(bubble);
  div.appendChild(time);


  if (product) {
    const card = document.createElement("div");
    card.className = `mt-2 rounded-xl overflow-hidden bg-[#2e2e3e] border border-gray-600`;
    card.innerHTML = `
      <img src="${product.img}" class="w-full h-32 object-cover" />
      <div class="p-3">
        <div class="font-bold">${product.name}</div>
        <div class="text-sm text-gray-300">${product.price}</div>
        <div class="flex items-center gap-1.5 justify-between mt-2">
          <button onclick="alert('under Maintenance! proses pembelian tersedia di katalog, silahkan ketik - minta katalog dong.')" class="cursor-pointer text-sm add-to-cart-btn flex inline-block px-3 py-1 bg-green-500 text-white rounded-lg">Beli Sekarang</button>
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-share2-icon lucide-share-2">
            <circle cx="18" cy="5" r="3"/>
            <circle cx="6" cy="12" r="3"/>
            <circle cx="18" cy="19" r="3"/>
            <line x1="8.59" x2="15.42" y1="13.51" y2="17.49"/>
            <line x1="15.41" x2="8.59" y1="6.51" y2="10.49"/>
          </svg>
        </div>
      </div>
    `;
    div.appendChild(card);
  }

  chatBox.appendChild(div);
if (sender === 'lyra') {
  const audio = new Audio('/chat-up.mp3');
  audio.volume = 0.3;
  audio.play().catch(() => {});
}
  chatBox.scrollTop = chatBox.scrollHeight;
}

function formatTime() {
  const now = new Date();
  return now.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  });
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

export function showTypingHeader() {
  const el = document.getElementById('typingStatus');
  if (el) el.classList.remove('hidden');
}

export function hideTypingHeader() {
  const el = document.getElementById('typingStatus');
  if (el) el.classList.add('hidden');
}
