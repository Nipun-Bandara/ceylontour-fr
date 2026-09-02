# feat/f1-home

**What this branch did:** replaced the placeholder home page with the real
landing page, and added the information page behind the second button. This
was the last core feature, and F1 says to build it last — it is the easiest
thing to polish and the least important to get right early.

1. **The one sentence** is the heading: "Find places to visit in Sri Lanka
   that are good for you and good for the country." No "index", no "model", no
   "XAI", no "SHAP", nothing about weights or forecasts. Someone who has never
   heard any of those words can read the page and know what the system is for.
2. **Two buttons**, stacked on a phone and side by side from `sm` up.
   *Find a Sustainable Destination* goes to `/recommend`,
   *Explore Tourism Sustainability* goes to `/about`.
3. **A three-item strip** — what we score, why we explain it, where the data
   comes from — in the same plain language.
4. **`/about`** describes the five factors in plain words, names the four data
   sources with links, and has a section admitting what we do not know.
5. **Both pages are server components with no interactive parts**, so neither
   ships any JavaScript of its own. There are no images at all, no video and no
   animation library — the whole thing is text and CSS. That is the simplest
   way to meet the two-second budget rather than something to tune afterwards.

**Two judgement calls worth knowing about.**

- **The weights are described in words, not numbers.** `/about` says the
  natural surroundings count for most and facilities for least, but does not
  print 0.30 and 0.10. Those live in the backend's config and are version
  tracked there; putting the numbers on a static page would create a second
  copy that could quietly fall out of step with the one actually doing the
  scoring. The page says instead that the exact balance is recorded alongside
  every result, which is what `index_version` is for.
- **The "running on sample data" line was kept**, cut down to one small muted
  sentence and rendered only when `NEXT_PUBLIC_USE_MOCKS=true`. It disappears
  completely in a real deployment. It is there so nobody demonstrates sample
  numbers believing they are live ones — which matters more the closer the demo
  gets. Everything else from the old placeholder page, including the pressure
  band swatches, is gone.

**Verified** against the production build, serving mocks with no backend.
Both buttons navigate: the primary lands on `/recommend` with the form
rendered, the secondary lands on `/about`, and `/about`'s own call to action
comes back to `/recommend`. The heading is a single sentence, and a scan of
every word rendered on both pages finds none of XAI, SHAP, index, model,
algorithm, LightGBM, TreeSHAP, regressor or inference. At 375px neither page
scrolls sideways and both buttons are 48 and 50 pixels tall, comfortably above
a thumb-sized target. `/about` renders five factors, three sections and four
sources, each source linking out with `rel="noreferrer"`. No console errors on
either page. `tsc --noEmit`, `npm run lint` and `npm run build` pass, and both
pages prerender statically at 178 bytes of their own.

**On the two-second criterion, honestly:** measured locally the page reaches
DOMContentLoaded in 33ms and fires `load` at 56ms, with eight requests and zero
images. Those numbers are a floor, not a real-world result — everything is
coming off localhost. What actually decides it on a normal connection is the
payload, which is 3 KB of HTML and about 99 KB of gzipped JavaScript and CSS.
Almost all of that is the shared React bundle rather than anything this page
brings, and neither page adds an image, a font file or a third request. That is
comfortably inside two seconds on a normal connection, but it has not been
measured on one, and it should be checked again on the deployed build over a
real network before the box is ticked.

**Still open:**

- **F1's acceptance criteria are about the deployed build**, and this was
  tested locally. The load-time check needs redoing once the site is deployed.
- **The data sources on `/about` describe what the system is being built to
  use**, as declared in `plan.md`. Nothing is wired to SLTDA, Open-Meteo or
  OpenAQ yet — the app is still running on `lib/mocks.ts`. The page does not
  claim otherwise, and the sample-data notice on the home page covers the gap,
  but it is worth re-reading `/about` once the real sources are connected to
  make sure it is still accurate.
- **There is no navigation link to `/about` outside the home page.** The header
  wordmark returns you home and the button is there, which is enough for now.
  Adding a header link was not asked for and would touch every page.
