// The six How to Play cards: a title, two short sentences and a little picture made of tokens.
// Plain words for kids (see docs/manager/BEGINNER_REVIEW.md). No DOM here.
// A token is { text, kind }: kind is 'spark', 'part', 'arrow', 'vault', 'lost' or 'note'.
// Owner: AI-7

function t(text, kind) { return { text: text, kind: kind }; }

export const HOWTO_CARDS = [
  {
    title: 'Sparks run to the vault',
    text: 'Press FIRE. Sparks walk right and drop into the vault on the right edge. All the numbers in the vault add up.',
    rows: [[t('Spark 1', 'spark'), t('\u2192', 'arrow'), t('\u2192', 'arrow'), t('Vault', 'vault')]]
  },
  {
    title: 'Parts change the spark',
    text: 'A part changes the number of every spark that touches it. Some add. Some multiply.',
    rows: [[t('1', 'spark'), t('\u2192', 'arrow'), t('+2', 'part'), t('\u2192', 'arrow'), t('3', 'spark')]]
  },
  {
    title: 'Order matters',
    text: 'Add then multiply is not the same as multiply then add. Swap two parts and watch the number.',
    rows: [
      [t('1', 'spark'), t('+2', 'part'), t('x3', 'part'), t('= 9', 'vault')],
      [t('1', 'spark'), t('x3', 'part'), t('+2', 'part'), t('= 5', 'note')]
    ]
  },
  {
    title: 'Steer with Bend and friends',
    text: 'Some parts turn the spark up or down. Use ALL of the board, not just one row.',
    rows: [
      [t('Spark', 'spark'), t('\u2192', 'arrow'), t('Bend', 'part'), t('\u2193', 'arrow')],
      [t('', 'note'), t('', 'note'), t('Part', 'part'), t('\u2192 Vault', 'vault')]
    ]
  },
  {
    title: 'Only the right edge counts',
    text: 'A spark that leaves by the top, bottom or left edge is lost. Only the right edge drops into the vault.',
    rows: [
      [t('\u2191 lost', 'lost'), t('\u2193 lost', 'lost'), t('\u2190 lost', 'lost'), t('\u2192 Vault', 'vault')]
    ]
  },
  {
    title: 'Buy 3 the same to level up',
    text: 'Three of the same part make one stronger part. Beat 8 shifts to win the run.',
    rows: [[t('Coil', 'part'), t('Coil', 'part'), t('Coil', 'part'), t('\u2192', 'arrow'), t('Coil Lv 2', 'vault')]]
  }
];

// "Card 2 of 6", for the little counter and the screen reader.
export function cardCounter(index, total) {
  return 'Card ' + (index + 1) + ' of ' + total;
}

// Which card is in view, from how far the row has scrolled.
export function cardIndexFromScroll(scrollLeft, cardWidth, total) {
  if (!(cardWidth > 0)) return 0;
  const index = Math.round(scrollLeft / cardWidth);
  if (index < 0) return 0;
  return index > total - 1 ? total - 1 : index;
}
