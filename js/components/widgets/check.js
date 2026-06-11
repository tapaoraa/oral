// Widget "check" : pastilles à 3 états (neutre → validé → rejeté).

import { el } from '../../core/dom.js';
import { saveItemScore } from '../../core/store.js';
import { setScore, updateTotalBar } from '../scoring.js';

export function renderCheckWidget(item, scoreNode, initStates) {
  const itemId  = item.id;
  const itemPts = item.pts ?? 10;

  const wrap = el('div', { className: 'pill-wrap' });

  item.config.pills.forEach((p, pi) => {
    const btn = el('button', {
      type: 'button',
      className: 'pill',
      textContent: p.label,
      dataset: { pts: p.pts },
    });
    if (initStates[pi] === 'active')   btn.classList.add('active');
    if (initStates[pi] === 'rejected') btn.classList.add('rejected');

    btn.addEventListener('click', () => {
      if (!btn.classList.contains('active') && !btn.classList.contains('rejected')) {
        btn.classList.add('active');
      } else if (btn.classList.contains('active')) {
        btn.classList.remove('active');
        btn.classList.add('rejected');
      } else {
        btn.classList.remove('rejected');
      }
      const pills = [...wrap.querySelectorAll('.pill')];
      const total = pills.reduce((s, b) => s + (b.classList.contains('active') ? Number(b.dataset.pts) : 0), 0);
      const anyTouched = pills.some(b => b.classList.contains('active') || b.classList.contains('rejected'));
      setScore(scoreNode, total, itemPts, !anyTouched);
      const states = pills.map(b =>
        b.classList.contains('active') ? 'active' : b.classList.contains('rejected') ? 'rejected' : 'none');
      saveItemScore(itemId, { type: 'check', states });
      updateTotalBar();
    });

    wrap.appendChild(btn);
  });

  // Restauration de l'état initial
  const initTotal = [...wrap.querySelectorAll('.pill.active')].reduce((s, b) => s + Number(b.dataset.pts), 0);
  const initTouched = wrap.querySelectorAll('.pill.active, .pill.rejected').length > 0;
  if (initTouched) setScore(scoreNode, initTotal, itemPts, false);

  return el('div', { className: 'widget-scroll widget-pad' }, wrap);
}
