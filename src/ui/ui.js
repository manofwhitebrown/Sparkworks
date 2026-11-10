// STUB: owned by AI-7. The owner will replace this whole file.
import * as home from './screens/home.js';
import * as run from './screens/run.js';
import * as shop from './screens/shop.js';
import * as results from './screens/results.js';
import * as workshop from './screens/workshop.js';
import * as patentBook from './screens/patentBook.js';
import * as daily from './screens/daily.js';
import * as settings from './screens/settings.js';

const SCREENS = { home, run, shop, results, workshop, patentBook, daily, settings };
let current = null;

export function go(screenName, params) {
  const root = document.getElementById('app');
  if (current) current.unmount();
  root.innerHTML = '';
  current = SCREENS[screenName] || SCREENS.home;
  current.mount(root, params);
}

export function startApp() {
  go('home');
}
