// Helpers DOM partagés.

export function $(id) {
  return document.getElementById(id);
}

// Création d'élément déclarative :
//   el('button', { className: 'btn', onclick: fn, dataset: {...}, style: '...' }, 'Texte', node…)
export function el(tag, props = {}, ...children) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(props)) {
    if (value == null) continue;
    if (key === 'dataset') Object.assign(node.dataset, value);
    else if (key === 'style' && typeof value === 'string') node.style.cssText = value;
    else if (key.startsWith('on') && typeof value === 'function') node.addEventListener(key.slice(2), value);
    else if (key in node) node[key] = value;
    else node.setAttribute(key, value);
  }
  for (const child of children) {
    if (child == null) continue;
    node.appendChild(typeof child === 'string' ? document.createTextNode(child) : child);
  }
  return node;
}

export function setFlex(id, show) {
  const node = $(id);
  node.classList.toggle('hidden', !show);
  node.classList.toggle('flex', show);
}

export function setVisible(id, show) {
  $(id).classList.toggle('hidden', !show);
}

// ── Icônes SVG (trait, style Feather) ───────────────────────
const ICON_PATHS = {
  pencil: '<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>',
  trash: '<polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>',
  check: '<polyline points="20 6 9 17 4 12"/>',
  x: '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>',
  plus: '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>',
};

export function svgIcon(name, size = 18, strokeWidth = 2) {
  return `<svg xmlns="http://www.w3.org/2000/svg" style="width:${size}px;height:${size}px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round">${ICON_PATHS[name]}</svg>`;
}
