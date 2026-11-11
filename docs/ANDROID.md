# Android guide

How the Android build works, how to get an APK on your phone, and how to set up signing.

## What builds when

| You do this | GitHub builds | Where you get it |
|---|---|---|
| Push to `main` | **Debug APK** | Repo > **Actions** > the run > **Artifacts** > `sparkworks-debug-apk` |
| Push a tag like `v1.0.0` | **Signed release APK** | Same Artifacts spot, and attached to the repo's **Releases** page |
| Push to `main` | The web game goes to GitHub Pages (also needs the one-time Pages setup below) | `https://manofwhitebrown.github.io/Sparkworks/` |

The debug app is called **Sparkworks (debug)** and installs next to the release app, so you can have both.
They are separate installs, so each has its own save.

## One-time GitHub Pages setup

Repo > **Settings** > **Pages** > **Build and deployment** > **Source** = **GitHub Actions**. After that every push to `main`
publishes the game at `https://manofwhitebrown.github.io/Sparkworks/`.

## Install on your phone

1. Download the APK from the Actions run (Artifacts are zipped, so unzip first) or from Releases.
2. Open it on the phone. Android asks to allow installs from that app (Chrome, Files, etc.). Allow it.
3. Tap Install.

## One-time signing setup (needed for release APKs)

A release APK must be signed with a key only you own. Android also refuses to update an app if the key changes,
so **keep the keystore file and its passwords somewhere safe (password manager plus a backup). If you lose it you can
never update the installed app.**

### 1. Make the keystore (on your computer, once)

You need Java installed (`keytool` comes with it).

```bash
keytool -genkeypair -v -storetype PKCS12 \
  -keystore sparkworks-release.keystore \
  -alias sparkworks -keyalg RSA -keysize 2048 -validity 10000
```

It asks for a password (use the same one for the key when asked) and some name fields. Remember:
- the **keystore password**
- the **alias** (`sparkworks` above)
- the **key password**

### 2. Turn it into text for GitHub

```bash
# macOS / Linux
base64 -i sparkworks-release.keystore | tr -d '\n' > keystore.b64.txt
# Windows PowerShell
[Convert]::ToBase64String([IO.File]::ReadAllBytes("sparkworks-release.keystore")) | Out-File keystore.b64.txt -NoNewline
```

### 3. Add four secrets to GitHub

Repo > **Settings** > **Secrets and variables** > **Actions** > **New repository secret**:

| Secret name | Value |
|---|---|
| `ANDROID_KEYSTORE_BASE64` | the whole contents of `keystore.b64.txt` |
| `ANDROID_KEYSTORE_PASSWORD` | your keystore password |
| `ANDROID_KEY_ALIAS` | `sparkworks` (or whatever you chose) |
| `ANDROID_KEY_PASSWORD` | your key password |

Then delete `keystore.b64.txt`. Never commit the `.keystore` file (the `.gitignore` already blocks it).

### 4. Release

```bash
git tag v1.0.0
git push origin v1.0.0
```

The version name comes from the tag. The version code is the workflow run number, so it always goes up.
If a secret is missing the job stops early with a message pointing back to this guide.

## Building on your own computer (optional)

Needs Node 22, Java 21 and Android Studio (for the SDK).

```bash
npm ci
npm run android:sync          # builds the web game and copies it into android/
cd android
./gradlew assembleDebug       # APK: app/build/outputs/apk/debug/
```

For a signed local release, create `android/keystore.properties` (git-ignored):

```
storeFile=/full/path/to/sparkworks-release.keystore
storePassword=...
keyAlias=sparkworks
keyPassword=...
```

then `./gradlew assembleRelease`. `npm run android:open` opens the project in Android Studio.

## Changing the icon or splash screen

The icon is ONE design: a spark steered along a path over the board grid (the ring is the source, the bright
spark is the vault). It is drawn in code by `assets/make_icons.py`, so every size matches.

```bash
pip install pillow numpy
python3 assets/make_icons.py    # redraws assets/*.png, the favicon, the web icons and the splash
npm run android:icons           # writes android/app/src/main/res/... and then makes the adaptive layers sharp
```

What it makes:
- **Android**: legacy icon, round icon, adaptive icon (foreground and background drawn at the real 72 dp window size in every
  density, so it is sharp), a **monochrome layer** for Android 13 "themed icons", and the splash screens.
- **Web**: `public/favicon.svg` (hand-written vector, same design), `favicon.ico` (16, 32, 48), `favicon-32.png`, `apple-touch-icon.png`,
  `icon-192.png`, `icon-512.png` and `manifest.webmanifest`. `index.html` links them.
- Everything that matters stays inside Android's safe zone, so no launcher shape (circle, squircle, square) cuts the spark.

Your own art instead: replace `assets/icon-only.png` (1024), `icon-foreground.png` + `icon-background.png` (1024; keep the picture
inside the middle 60%), `splash.png` and `splash-dark.png` (2732), then run `npm run android:icons`. The last step of that command
rewrites the adaptive layers from the same files and adds a monochrome layer drawn by `make_icons.py`.

## Reminders (notifications)

The app sends one local notification every day at 10:00 ("Today's contract is ready"). It never fires between 22:00 and 08:00.
It comes from the `@capacitor/local-notifications` plugin, so there is nothing to set up: `npx cap sync android` (run by CI) wires it in.
On Android 13 and newer the player is asked for permission the first time a reminder is scheduled. In a browser nothing happens.
The notification icon is `android/app/src/main/res/drawable/ic_stat_spark.xml`.

## Notes

- Screen edges: the game uses `viewport-fit=cover` and Capacitor's `SystemBars` plugin (`insetsHandling: native`),
  so the header and bottom tabs sit clear of the status bar, camera cutout and gesture bar.
- The app is locked to portrait.
- Web assets inside `android/app/src/main/assets/public` are generated by `cap sync` and are git-ignored.
