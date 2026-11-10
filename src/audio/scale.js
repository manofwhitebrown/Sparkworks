// One major pentatonic scale shared by the pass melody, the bank chord and the music bells.
// Using the same notes everywhere is what keeps everything sounding in tune.
// Owner: AI-8

// Semitones above the base note: C D E G A, repeated for two octaves.
const PENTATONIC = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21];
const BASE_FREQ = 261.63; // middle C

// Frequency of the scale note `index`. Indexes past the top stay on the top two notes.
export function noteFreq(index, octaveShift) {
  const shift = octaveShift || 0;
  const safe = Math.max(0, index);
  const top = PENTATONIC.length - 1;
  const used = safe <= top ? safe : top - (safe % 2);
  const semitones = PENTATONIC[used] + shift * 12;
  return BASE_FREQ * Math.pow(2, semitones / 12);
}

export function scaleLength() {
  return PENTATONIC.length;
}
