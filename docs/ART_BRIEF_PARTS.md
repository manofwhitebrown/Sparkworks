# Art and Sound Brief: the 31 Parts

Owner: AI-3. Readers: AI-6 (icons, tile look, spark motion) and AI-8 (sound).
Round 5. Palette and tag colors are from `docs/CONTRACT.md` section 10; nothing here adds a color.

## How to read this

Each part has ONE line of **look** (silhouette, motion cue, what the spark looks like when it leaves) and ONE line of **sound** (WebAudio only: oscillator shape, rough pitch, envelope feel).

### Shape language (the icon family)
All icons: one stroke weight, rounded ends, drawn in the tag color on the dark tile. The silhouette tells the family before the color does (never rely on color alone).

| tag | color | silhouette family | motion cue when the spark enters |
|-----|-------|-------------------|----------------------------------|
| add | `spark` amber | plus / vertical stack of bars | the symbol pulses outward once |
| mult | `accent` teal | cross / x / stacked rings | rings expand from the center |
| route | `textDim` grey | arrow / chevron / rail | the arrow slides one step toward the exit |
| split | `rare` blue | fork / Y shape | the shape opens like a fan |
| state | `legendary` violet | dial, gauge, notch marks | a notch or tick advances |
| boost | `good` green | cell with a plus terminal | a soft halo breathes on the neighbours |
| risk | `bad` red | dice facet / jagged edge | a quick flicker (2 frames), then settles |
| economy | `#FFD166` gold | coin / round disc | a small coin hops up and fades |

### Rarity treatment (tile, not icon)
- **common**: plain enamel tile, thin border in `common`.
- **rare**: border in `rare`, a small corner notch (second shape cue).
- **legendary**: border in `legendary`, double border, slow shimmer (medium and high tier only). Its spark exit has a longer afterglow than other parts.

### Sound rules for AI-8
- Pitch rises with the pass step (`playPass(step)`); part sounds sit on top of that melody and must stay in the same scale.
- Families share a timbre so players learn by ear: add = bright triangle, mult = soft saw with a low swell, route = short filtered click, split = two-note chime, state = muted bell/tick, boost = warm sine pad, risk = noise burst + pitch wobble, economy = high metallic ping.
- Each part sound is at most 150 ms (legendary up to 400 ms). Few parts may fire in the same 50 ms: the loudest wins.

## Parts

| id | rarity | tag | Look (for AI-6) | Sound (for AI-8) |
|----|--------|-----|-----------------|------------------|
| `coil` | common | add | Three amber loops stacked like a spring; the spark leaves slightly brighter and a bit thicker. | Short bright triangle blip, one note. |
| `dynamo` | common | add | Amber ring with spokes, one spoke per part on the board lighting up; spark leaves with small amber sparkles. | Triangle blip repeated quickly, faster when more parts are on the board. |
| `ember` | common | add, state | Small amber coal with a violet notch row; glow grows with spark number; spark leaves with a few drifting embers. | Soft triangle with a crackle tick; pitch up a little for each later spark. |
| `amplifier` | common | mult | Teal triangle (speaker cone) with two arcs; arcs expand outward; spark leaves visibly larger. | Saw note with a short low swell, pitch fixed. |
| `compounder` | rare | mult | Teal spiral of growing rings; rings brighten with the size of the number; spark leaves with a wide halo. | Saw swell that climbs longer for bigger numbers. |
| `overdrive` | legendary | mult | Teal double-ring turbine with a hot white center, slow shimmer; spark 1 leaves as a white-hot comet with a long tail. | Deep saw drop then rising sweep, 400 ms, a touch of distortion. Quiet (no sound) for later sparks. |
| `bend` | common | route | Grey right-angle rail with a chevron pointing to the exit side; the spark visibly rounds the corner. | Short click, tiny pitch slide. |
| `switch` | common | route | Grey rail junction with a small lever; lever flips to the chosen side; spark leaves straight or turned. | Two clicks: one low (even, straight), one high (odd, turn). |
| `reverser` | rare | route | Grey U-turn arrow in a notched ring; ring ticks off once per use; spark makes a tight U-turn. | Short rewind blip (pitch slides down), then click. |
| `splitter` | common | split | Blue Y fork pointing to the rotation; the fork opens; two sparks leave, copy dimmer and smaller. | Two-note chime (a fifth apart). |
| `triplet` | rare | split | Blue three-pronged fork, middle stub straight; three sparks leave in a fan, copies half as bright. | Three-note chime, fast arpeggio. |
| `capacitor` | common | state | Violet two-plate gauge; the gap fills with violet light when charged; spark leaves dimmed on charge, brighter on release. | Charge: low muted bell. Release: higher bell plus soft pop. |
| `counter` | common | state | Violet dial with three tick marks; one mark lights per spark; on the big hit the dial flashes. | Tick each pass, bigger bell plus mult swell on the big hit. |
| `anvil` | common | add, state | Amber block with violet notches counting passes; block dents slightly (scale down 4%) each pass. | Metal clink, pitch deeper each pass (heavier). |
| `flywheel` | rare | mult, state | Teal wheel with violet ticks that spins faster each pass; spark leaves with a swirl in its trail. | Whirr: saw swell with rising pitch each pass. |
| `battery` | common | boost | Green cell with a plus terminal; a soft green halo breathes over the 4 neighbours. Does not touch the spark. | No pass sound. When a boosted neighbour fires, add a warm sine pad underneath it. |
| `gambler` | common | risk | Red die with 3 pips; the pips scramble for 2 frames, then settle on the result; spark leaves flickering. | Noise burst, then a pitch that rises on a good roll and falls on a bad one. |
| `fuse` | rare | risk | Red fuse cord with a spark running along it; burns down on use; after use the tile is charred (dim and grey, no glow). | Hiss, then a loud pop (150 ms). Silent after it is spent. |
| `rectifier` | common | add, mult | Amber/teal half-and-half diode (triangle and bar); the lit half shows which rule fired (odd = amber, even = teal). | Odd: bright triangle blip. Even: soft saw. |
| `tollgate` | common | economy | Gold barrier arm over a road; arm lifts as the spark crosses; a gold coin hops up. Spark number unchanged. | Metallic ping, one per coin (up to 3 quick pings). |
| `prism` | legendary | split | Blue-white crystal with three facets, slow shimmer; spark enters and leaves as three equal beams. | Three-note bright chime, 400 ms, with a shimmering tail. |
| `turnstile` | rare | route | Grey three-armed gate; one arm lights per spark (DOWN, straight, UP), then it rotates. | Ratchet click; pitch low / mid / high for the three roads. |
| `echo` | rare | add, state | Amber ripple rings with a violet center, rings repeat once; spark leaves with a faint trailing double. | Triangle blip followed by a quieter delayed copy. |
| `mint` | common | economy, add | Gold coin press; a coin stamps and drops; spark leaves slightly dimmer (it paid coins). | Stamp thud then a metallic ping. |
| `spring` | common | add, route | Amber coil bent into an elbow pointing to the exit side; compresses (scale 90%) then releases; spark bounces out turned. | Boing: triangle with a quick upward pitch bend. |
| `sideamp` | common | mult | Teal vertical double-arrow with rings; rings fire only when the spark moves up or down; sideways = tile stays dark. | Saw swell, only on a vertical pass; no sound sideways. |
| `bouncer` | common | route, risk | Grey rail forked up and down with a red ball; ball bounces to the chosen side. | Rubbery pop; pitch high for UP, low for DOWN. |
| `workbench` | common | economy | Gold bench with a hammer; hammer taps once, coins hop up (once per Fire only), then the tile rests. | Wooden tap plus a ping for each coin. |
| `jackpot` | legendary | risk | Red/gold slot-style reels (no brand marks), slow shimmer; on a win the reels flash gold and the spark explodes into a bright burst; on a loss it dims a little. | Win: rising fanfare ping, 400 ms. Loss: short soft descending blip. |
| `finisher` | rare | mult | Teal gate arch drawn at the right edge; only lights when placed in the last column; otherwise the tile shows a dim "last column" tag. | Teal saw swell with a bright end note (it is the last thing before the vault). |
| `starter` | common | add | Amber starting block with a small flag-like notch; lights only in the first column; otherwise dim. | Short bright triangle blip, a little lower than Coil (opening note). |

## Notes for later (not required now)
- `portal` (not built): two matching violet-ringed discs; spark shrinks into one and grows out of the other. Sound: low whoosh in, high whoosh out.
- Colorblind mode: keep the silhouettes and rarity corner notches; they already carry the meaning without color.
