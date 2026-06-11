// Modal Réglages : ouverture/fermeture + onglets.

import { $, setFlex, setVisible } from '../../core/dom.js';
import { emit } from '../../core/bus.js';
import { saveGrille } from '../../core/store.js';
import { renderSettings, initConfigTab } from './config.js';
import { renderElevesSettingsList, initElevesTab } from './eleves.js';
import { initBackupTab } from './backup.js';

const TABS = ['grille', 'eleves', 'sauvegarde'];

function switchTab(active) {
  TABS.forEach(t => {
    $('tab-' + t).classList.toggle('active', t === active);
    setFlex('tab-content-' + t, t === active);
  });
  setVisible('grille-actions',   active === 'grille');
  setVisible('modal-addcat-row', active === 'grille');
}

export function openModal() {
  renderSettings();
  $('textarea-eleves').value = '';
  renderElevesSettingsList();
  $('modal-settings').classList.remove('hidden');
}

export function closeModal() {
  saveGrille();
  $('modal-settings').classList.add('hidden');
  emit('render:grille');
}

export function initSettingsModal() {
  TABS.forEach(t => $('tab-' + t).addEventListener('click', () => switchTab(t)));
  $('btn-settings').addEventListener('click', openModal);
  $('btn-close-modal').addEventListener('click', closeModal);

  initConfigTab();
  initElevesTab();
  initBackupTab();
}
