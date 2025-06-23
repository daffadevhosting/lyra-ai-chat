
// htmlRenderer.js

/**
 * Sanitize HTML to avoid arbitrary tag injection
 */
export function safeRenderHTML(rawHtml) {
  const allowedTags = ['DIV', 'P', 'A', 'BUTTON', 'H3', 'H4', 'H5', 'SPAN', 'UL', 'LI', 'STRONG', 'BR'];
  const wrapper = document.createElement('div');
  wrapper.innerHTML = rawHtml;

  [...wrapper.querySelectorAll('*')].forEach(el => {
    if (!allowedTags.includes(el.tagName)) el.remove();
  });

  return wrapper.innerHTML;
}

export function attachProductModalTriggers(PRODUCT_LIST, openProductModal) {
  setTimeout(() => {
    document.querySelectorAll('.open-product-image').forEach(link => {
      link.onclick = (e) => {
        e.preventDefault();
        const slug = link.dataset.slug;
        const product = PRODUCT_LIST.find(p => p.slug === slug);
        if (product) openProductModal(product);
      };
    });
  }, 100);
}
