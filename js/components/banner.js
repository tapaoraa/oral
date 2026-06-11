// Bandeau élève : navigation précédent/suivant, total, conseils, statut.

import { $ } from '../core/dom.js';
import { emit, on } from '../core/bus.js';
import { state, selectedEleve, saveEleves, STATUS_CYCLE, STATUS_COLOR, STATUS_LABEL } from '../core/store.js';

let conseilsVisible = false;

export function updateBanner() {
  const banner = $('eleve-banner');
  if (!state.elevesList.length || state.selectedEleveIdx === null) {
    banner.classList.add('hidden');
    updateConseilsUI();
    return;
  }
  const e = state.elevesList[state.selectedEleveIdx];
  $('eleve-banner-name').innerHTML = `<strong>${e.nom}</strong>${e.prenom ? ' ' + e.prenom : ''}`;
  $('btn-prev-eleve').disabled = state.selectedEleveIdx === 0;
  $('btn-next-eleve').disabled = state.selectedEleveIdx === state.elevesList.length - 1;
  banner.classList.remove('hidden');
  updateBannerStatusDot();
  updateConseilsUI();
}

export function updateBannerStatusDot() {
  const eleve = selectedEleve();
  if (!eleve) return;
  const dot = document.querySelector('#banner-status-dot span');
  if (dot) dot.style.background = STATUS_COLOR[eleve.status || 'none'];
}

function updateConseilsUI() {
  const show = conseilsVisible && selectedEleve() !== null;
  const section  = $('conseils-section');
  const textarea = $('conseils-textarea');
  section.classList.toggle('hidden', !show);
  $('btn-toggle-conseils').style.color = conseilsVisible ? '#1e3a5f' : '';
  if (show) {
    textarea.value = selectedEleve().conseils || '';
    textarea.style.height = 'auto';
    textarea.style.height = Math.max(textarea.scrollHeight, 56) + 'px';
  }
}

export function initBanner() {
  $('btn-prev-eleve').addEventListener('click', () => {
    if (state.selectedEleveIdx > 0) emit('eleve:select', state.selectedEleveIdx - 1);
  });
  $('btn-next-eleve').addEventListener('click', () => {
    if (state.selectedEleveIdx < state.elevesList.length - 1) emit('eleve:select', state.selectedEleveIdx + 1);
  });

  $('banner-status-dot').addEventListener('click', () => {
    const eleve = selectedEleve();
    if (!eleve) return;
    const next = STATUS_CYCLE[(STATUS_CYCLE.indexOf(eleve.status || 'none') + 1) % STATUS_CYCLE.length];
    eleve.status = next;
    $('banner-status-dot').title = STATUS_LABEL[next];
    saveEleves();
    updateBannerStatusDot();
    emit('render:sidebar');
  });

  const textarea = $('conseils-textarea');
  textarea.addEventListener('input', () => {
    const eleve = selectedEleve();
    if (eleve) {
      eleve.conseils = textarea.value;
      saveEleves();
    }
    textarea.style.height = 'auto';
    textarea.style.height = Math.max(textarea.scrollHeight, 56) + 'px';
  });

  $('btn-toggle-conseils').addEventListener('click', () => {
    conseilsVisible = !conseilsVisible;
    updateConseilsUI();
  });

  on('render:banner', updateBanner);
}
