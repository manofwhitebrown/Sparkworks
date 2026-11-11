// Workshop screen: spend Spark Dust on permanent upgrades.
// Owner: AI-5
import { go, getMeta, saveCurrentMeta } from '../ui.js';
import { makeButton } from '../components/button.js';
import { showToast } from '../components/toast.js';
import { playSfx } from '../../audio/sfx.js';
import { formatNumber } from '../../core/format.js';
import { WORKSHOP_UPGRADES } from '../../data/workshop.js';
import { upgradeCost, upgradeLevel, buyUpgrade } from '../../meta/workshop.js';
import { el, makeHeader, makePips, makeScreen, makeIntro } from '../../meta/screenKit.js';

const REFUSALS = { poor: 'Not enough Spark Dust yet.', maxed: 'Already at the top level.', unknown: 'That upgrade is gone.' };

let list = null;
let dustPill = null;

function makeCard(meta, upgrade) {
  const level = upgradeLevel(meta, upgrade.id);
  const cost = upgradeCost(meta, upgrade.id);
  const card = el('div', 'metaCard');
  const info = el('div', 'grow');
  info.appendChild(el('div', 'metaName', upgrade.name));
  info.appendChild(el('div', 'dim', upgrade.description));
  info.appendChild(makePips(level, upgrade.maxLevel));
  if (level >= upgrade.maxLevel) card.classList.add('isDone');
  card.appendChild(info);
  const buy = el('div', 'metaCenter');
  const label = cost === null ? 'Maxed' : 'Buy';
  const button = makeButton(label, function () { onBuy(upgrade); }, {
    kind: 'primary', small: true, disabled: cost === null || meta.dust < cost
  });
  if (cost !== null) buy.appendChild(el('div', 'pill dust num', formatNumber(cost)));
  buy.appendChild(button);
  card.appendChild(buy);
  return card;
}

function onBuy(upgrade) {
  const meta = getMeta();
  const result = buyUpgrade(meta, upgrade.id);
  if (!result.ok) {
    showToast(REFUSALS[result.reason] || 'Cannot buy that.');
    return;
  }
  saveCurrentMeta();
  playSfx('buy');
  showToast(upgrade.name + ' is now level ' + upgradeLevel(meta, upgrade.id));
  render();
}

function render() {
  const meta = getMeta();
  dustPill.textContent = formatNumber(meta.dust);
  list.replaceChildren();
  for (let i = 0; i < WORKSHOP_UPGRADES.length; i++) {
    list.appendChild(makeCard(meta, WORKSHOP_UPGRADES[i]));
  }
}

export function mount(root, params) {
  const screen = makeScreen(root);
  screen.appendChild(makeHeader('Workshop', function () { saveCurrentMeta(); go('home'); }));
  const hero = el('div', 'metaHero');
  hero.appendChild(el('div', 'metaLabel', 'Spark Dust'));
  dustPill = el('div', 'metaHeroNum isHero', '');
  hero.appendChild(dustPill);
  hero.appendChild(el('div', 'dim', 'Earn it at the end of every run. Upgrades last forever.'));
  screen.appendChild(hero);
  const intro = makeIntro(getMeta(), 'workshop', 'Spend Spark Dust here to get stronger for every run.', saveCurrentMeta);
  if (intro) screen.appendChild(intro);
  screen.appendChild(el('div', 'metaLabel metaGroup', 'Upgrades'));
  list = el('div', 'metaList');
  screen.appendChild(list);
  render();
}

export function unmount() {
  list = null;
  dustPill = null;
}
