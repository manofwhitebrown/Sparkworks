// The SHOP tab: free reroll, free offers, and picking the offers yourself. Owner: AI-2

import { allPartIds, getPart } from '../engine/parts/index.js';
import * as sc from './shopCheats.js';
import { button, row, section, makeSelect, el } from './menuUi.js';

const SLOTS = 4;

function slotChoices() {
  const list = [{ value: '', label: '(none)' }];
  const ids = allPartIds();
  for (let i = 0; i < ids.length; i++) {
    list.push({ value: ids[i], label: getPart(ids[i]).name });
  }
  return list;
}

export function buildShopTab(env) {
  const box = document.createElement('div');
  box.appendChild(section('Offers', [row([
    button('Free reroll', function () { env.doRun('reroll', sc.freeReroll); }),
    button('All prices 0', function () { env.doRun('prices', sc.zeroOfferPrices); })
  ])]));

  const selects = [];
  const picks = [];
  for (let i = 0; i < SLOTS; i++) {
    const select = makeSelect(slotChoices());
    selects.push(select);
    picks.push(row([select]));
  }
  const apply = button('Set these as the offers', function () {
    const ids = [];
    for (let j = 0; j < selects.length; j++) {
      if (selects[j].value) {
        ids.push(selects[j].value);
      }
    }
    env.doRun('offers', function (r) { return sc.forceOffers(r, ids); });
  }, { go: true });
  box.appendChild(section('Force offers (up to 4)', picks.concat([el('p', 'ckx-note', 'Normal prices apply.'), row([apply])])));
  return box;
}
