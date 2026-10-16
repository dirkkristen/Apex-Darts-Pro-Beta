# Apex Darts Pro v1.70 BETA

**A GitHub-ready Android (Cordova) project, designed to build on GitHub Actions without installing Android development tools on your computer.**

> **Safety first:** This beta has the application ID `com.apex.dartspro.beta`. It installs alongside the existing `com.apex.dartspro` application. Do not uninstall your older app until you have deliberately transferred or backed up any important player data.

## What is implemented

- Redesign: responsive dark/cyan/gold interface, improved mode explorer, setup screens, match scoreboard, animated splash, refined SVG dartboard, number-pad scoring, bigger touch controls.
- **14 playable modes:** X01 (101, 301, 501, 701, 1001), Circuit, XLD, Cricket, Killer, Shanghai, Round the Clock, Neon Sniper, Count-Up, Bob's 27, Halve-It, Apex Bingo, Apex Gauntlet, 121 Checkout.
- **X01:** Double In, Double Out, bust reset, best of 1/3/5/7 legs, per-dart scoring, live checkout suggestions that account for darts remaining; many setup shots when a finish is impossible.
- **Speech:** Native Android TTS advanced plugin with voice selection when the phone supports it; British English default; alternative locales; speed setting; optional detailed referee and quiet modes; speech is queued/prioritised. Browser Web Speech fallback.
- **Personal records:** Profile statistics, number of darts, X01 three-dart averages, accuracy and victories; local profile management and pronunciation overrides; text backup and restore.
- **Online-friendly rooms:** 10-character room codes, Firebase anonymous authentication, atomic room creation, host/guest turn locking, state synchronization, once-only remote undo, match completion and mutual rematch consent. Online mode is for trusted friends, not a cheat-proof tournament engine.
- **Other:** Circuit quick actions, tap-outside-for-miss, optional screen-on and shot clock, party reminders, responsive portrait/landscape design.
- Automated unit tests for core darts rules and checkout calculations.

## Not included in this beta

- A packaged **studio-recorded or paid neural announcer**. The included voice engine selects from installed Android voices; quality depends on those voices, particularly on older handsets. A premium offline voice pack or AI voice integration requires licensed recordings/assets or a hosted API and credentials.
- AI opponents, QR joining, spectator TV page, season-long tournaments, speech-to-score input, cloud account sync, a Google Play signed release, or a server-authoritative anti-cheat backend.
- Production Firebase rate limits, billing alerts, automated room expiry/cleanup, and real-device compatibility testing. These are important before any public launch.

## No-terminal build: GitHub Desktop (recommended)

1. Download the whole source ZIP and choose **Extract All** in Windows.
2. Install [GitHub Desktop](https://desktop.github.com/) and sign into GitHub.
3. Choose **File → Add Local Repository → Choose** and select the extracted `Apex-Darts-Pro` folder (the one containing `config.xml`).
4. If prompted that the folder is not yet a Git repository, click **Create a Repository Here**. On the Changes tab, type a commit summary such as `Initial Apex Darts Pro beta` and click **Commit to main** (or the equivalent button for the current branch).
5. Click **Publish repository**. Private is fine for testing.
6. On github.com open the repository, select **Actions**. If workflow execution is disabled, click **I understand my workflows, go ahead and enable them** (wording may vary).
7. Choose **Build Apex Darts Pro APK**. The first push usually starts a run automatically; otherwise click **Run workflow** and **Run workflow** again.
8. Wait for the run to turn **green**. Click it, scroll to **Artifacts**, and download `Apex-Darts-Pro-v1.70-Android`.
9. Extract that artifact ZIP. It contains `Apex-Darts-Pro-v1.70-debug.apk`.
10. Transfer the APK to your Galaxy phone by USB, Google Drive, or another trusted method. Open the APK. Android may ask you to permit **Install unknown apps** for the Files app you're using. Allow it for this installation if you trust this source, then optionally revoke the permission.
11. Look for **Apex Darts Pro Beta** in your app drawer. Launch, add players, choose 501 and test Double Out and the checkout advice.

No local Node.js, JDK, Gradle, npm, Cordova or Android Studio installation is required for the GitHub build. GitHub Actions handles the build on its Linux runner.

**Important:** Each GitHub Actions debug APK may be signed with a different temporary key. If a later beta APK cannot install over the previous beta, use **Player statistics → Backup / Restore** to copy your data first. You may then need to uninstall **the beta only** before installing the new one. Uninstalling erases beta-local data. A fixed production signing key is required for seamless updates.

## Updating the app after you make changes

Edit files in your extracted source folder. GitHub Desktop will show them under **Changes**. Enter a commit description and click **Commit to main**, followed by **Push origin**. A new APK build should start under GitHub → Actions. You do not need to edit `.github/workflows/build.yml` for normal UI or scoring changes.

## Online multiplayer: do NOT overwrite old Firebase rules

The app's `www/js/online.js` contains the web SDK configuration for the Firebase project you supplied earlier. The beta writes to **`betaRooms/`**, not `rooms/`, in order to avoid colliding with your existing app's rooms. Nevertheless, the beta needs appropriate Realtime Database rules, and the existing project's rules must be preserved.

**Safest approach for a novice: use a separate Firebase project for the beta.**

1. Visit [Firebase Console](https://console.firebase.google.com/) and create a NEW project (for example `apex-darts-pro-beta`).
2. Open **Build → Authentication → Sign-in method** and enable **Anonymous** sign-in.
3. Open **Build → Realtime Database** and create a database. Remember the `databaseURL` provided in the console.
4. In **Project settings → General → Your apps**, register a Web app and copy the Firebase configuration values.
5. In `www/js/online.js`, replace the values inside the object named `firebaseConfig` at the top of the file with the values from your NEW project, including its `databaseURL`.
6. In the NEW project's Realtime Database **Rules** tab, replace the initial rules with the contents of this source package's `firebase.rules.json` file and click **Publish**. This template is intended for a new, isolated beta project.
7. Commit and push the modified `online.js`. Download the new APK from GitHub Actions.
8. On both phones, install the beta, enable internet, create a named player on each device, then select **Host Online Match** on one and **Join Match** on the other. Share the 10-character invitation code.

**If you instead reuse your existing Firebase project:** first copy your current Realtime Database Security Rules to a safe backup. Merge ONLY the `betaRooms` section of `firebase.rules.json` into the existing `rules` object and **retain all existing paths**. Do not replace the whole rules document; doing so could disable or break online matches in v1.63.

The beta rules restrict room modification to authenticated participants, but no client-side architecture can fully prevent a malicious participant from fabricating scores. The beta is intended for friendly matches. Firebase also needs security monitoring, quotas, and room expiry before a production launch.

## Voice on Samsung phones

From **Settings → Installed voice**, select a British or other preferred English voice if your handset provides one. Try Samsung's and Google's speech services under Android Accessibility → Text-to-speech settings (the exact location depends on the One UI version). Some phones require downloading language packs. Use the **Test Voice** button and adjust speech rate. Native TTS plugin compatibility and voice quality must still be checked on an actual Galaxy S20/S26.

To correct a player's name, go to **Players**, tap the musical-note button beside the profile, and enter how the announcer should speak the name.

## Browser preview for code review

`www/index.html` can be previewed in a modern desktop browser. Local games should work; `cordova.js` and the packaged Firebase vendor scripts are normally provided during the APK build, so native hardware voice and online connectivity are not expected in the loose browser folder. Browser audio often requires first touching the page.

## Project map

```text
Apex-Darts-Pro/
  START-HERE.txt
  README.md
  config.xml
  icon.png
  firebase.rules.json
  .github/workflows/build.yml
  www/index.html
  www/css/styles.css
  www/js/app.js          # screens, input, settings and storage
  www/js/checkout.js     # legal multi-dart finishes and setup advice
  www/js/engine.js       # all game rules
  www/js/voice.js        # queued native/web TTS
  www/js/online.js       # Firebase rooms and state sync
  www/assets/icon.svg
  tests/engine.test.js
```

## Troubleshooting

- **The build is red:** On GitHub select Actions → failed workflow run → failing step, then copy the last 30–50 log lines to ChatGPT. Do not share account passwords, access tokens or Firebase private keys.
- **Online says Firebase permission denied:** Enable Anonymous Authentication, confirm the beta app has the correct Firebase config, and ensure the `betaRooms` rules are published to the corresponding database.
- **The S20 voice sounds mechanical:** Check installed Android speech engines/language packs, then choose an appropriate voice in the app's Settings. This version does not embed premium studio voices.
- **APK won't update:** Debug signing key mismatch; export your beta data, uninstall only the beta, then install the new APK.
- **Settings won't save or scores disappear:** Ensure storage is enabled for the app; do not clear the beta's app data. Back up player profiles regularly.
- **Board buttons are cramped:** Tap **NUMBER PAD** for large number buttons and leave the multiplier selector on SINGLE, DOUBLE or TRIPLE as needed.

## Validation

The JavaScript scoring engine was exercised using Node's built-in `node:test` and the app's home/setup/game screens were checked in Chromium. No APK signing or physical Galaxy test was possible in this environment; **the first successful GitHub workflow and on-device smoke test are still required**. Do not distribute it publicly until you have verified multiplayer, voice plugins, Android permission behavior and game rules on hardware.
