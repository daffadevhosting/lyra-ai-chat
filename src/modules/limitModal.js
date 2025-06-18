export function showLimitModal() {
  const modal = document.getElementById('loginModal');
  if (modal) modal.classList.remove('hidden');
}

export function hideLimitModal() {
  const modal = document.getElementById('loginModal');
  if (modal) modal.classList.add('hidden');
}
