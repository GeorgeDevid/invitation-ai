# George & Tess — Wedding Invitation 💜

A dreamy, classic western wedding invitation website in lavender & glass.
Thursday, **31 December 2026** · Holy Mass at **4:00 PM** · Reception from **6:30 PM** · St. George Basilica, Angamaly, Kerala.

It is a static site (plain HTML, CSS and JavaScript with no build step), so you can host it anywhere.

## What's inside

| Feature | How it works |
| --- | --- |
| **Tap to open** | A 3D lavender envelope with a wax “G&T” seal. Tapping cracks the seal, opens the flap and slides out the letter before the invitation appears. |
| **Background music** | *Canon in D* (Pachelbel) arranged for harp, piano, violin & bass. It starts with the tap (as browsers require) and fades in. The floating disc button pauses or plays it. Music pauses when the tab is hidden. |
| **AI hero film** | A looping cinematic video built from the AI-generated stills, with slow camera moves, crossfades, bloom and drifting fireflies. There is a landscape cut for desktop and a portrait cut for phones, with an MP4 + WebM fallback. |
| **Parallax couple scene** | A pinned section where the couple's photos float in, drift and fade out as you scroll, with “chapter” captions. |
| **Scroll animations** | Fade, blur and slide reveals, parallax florals and backgrounds, a love-story timeline that draws as you read, a hero that dissolves on scroll, a progress bar and a section-aware glass dock. |
| **Glass UI** | Frosted `backdrop-filter` cards, dock, music player, tabs and form, in a lavender, lilac and champagne-gold palette. |
| **Countdown** | Live days / hours / minutes / seconds to 31 Dec 2026, 4:00 PM IST. |
| **Calendar** | A one-tap `.ics` file (both events, with a reminder 1 day before) plus a Google Calendar link. |
| **Location** | Map tabs for the church and the reception, with “Directions” links. |
| **RSVP** | Accept/decline, guest count, events, meal choice and wishes, with a heart-burst confirmation. The browser remembers the reply. |
| **Personal links** | `index.html?to=Anna%20%26%20Family` shows “Dear Anna & Family” on the envelope and pre-fills the RSVP name. |
| **Extras** | Falling petals, sparkle cursor (desktop), gallery lightbox (swipe/keys), share button, social preview image, `prefers-reduced-motion` support. |

## Edit the details

Most details live in **`assets/js/config.js`**: names, date, venues, times, the RSVP deadline, the hashtag and the music.
Elements tagged `data-field="…"` in `index.html` are filled from it automatically.
Longer text (the love story, bios, order of the evening, dress code) is written directly in `index.html`.

> Venues come from the couple's earlier invitation: St. George Basilica, Angamaly (Holy Mass, 4:00 PM) and the Parish Hall
> (Reception, 6:30 PM — please confirm this time). The love story, bios and order of the evening are placeholders to personalise.

### Make RSVPs reach you

In `config.js` → `rsvp`, set **one** of these:

1. **`endpoint`**: replies are saved straight into a Google Sheet. Follow the steps at the top of
   [`docs/rsvp-google-sheets.gs`](docs/rsvp-google-sheets.gs) (it takes about 2 minutes). A Formspree URL also works.
2. **`whatsapp`**: your number with country code, digits only (e.g. `"919876543210"`). Each guest's reply opens WhatsApp, pre-written for them to send.
3. **`email`**: opens the guest's mail app with the reply pre-written.

If none is set, replies are only stored in the guest's own browser, which is useful while designing.

### Swap in your real photos

Replace the files in `assets/img/` and keep the same names, or change the paths in `index.html`.
To re-render the hero film from the new photos:

```bash
python3 tools/make_hero_video.py assets/img assets/video/hero-desktop.mp4 desktop
python3 tools/make_hero_video.py assets/img assets/video/hero-mobile.mp4 mobile
ffmpeg -i assets/video/hero-desktop.mp4 -c:v libvpx-vp9 -crf 36 -b:v 0 -an assets/video/hero-desktop.webm
ffmpeg -i assets/video/hero-mobile.mp4  -c:v libvpx-vp9 -crf 36 -b:v 0 -an assets/video/hero-mobile.webm
ffmpeg -i assets/video/hero-desktop.mp4 -frames:v 1 assets/img/hero-desktop-poster.webp
ffmpeg -i assets/video/hero-mobile.mp4  -frames:v 1 assets/img/hero-mobile-poster.webp
```

## Preview locally

```bash
python3 -m http.server 8000
# open http://localhost:8000
```

## Live site

**https://george-and-tess-wedding-m73p.vercel.app** (Vercel project `george-and-tess-wedding-m73p`).

Vercel's GitHub app is installed on a different GitHub account, so this deployment does not use a Git connection.
Instead it was created with the two files in [`deploy/vercel/`](deploy/vercel). At build time `build.sh` downloads this
public repo (branch `claude/hopeful-franklin-9yhtqq`) and publishes only `index.html` and `assets/`. All images, video
and music are served from Vercel's CDN.

**To update the live site:** push your changes to this branch, then in Vercel open the project → *Deployments* →
latest production deployment → **⋯ → Redeploy**. The build fetches the newest commit automatically.

> That Vercel project is also Git-linked to `GeorgeDevidJohn/george-and-tess-wedding`. A push to *that* repo would
> redeploy the older invitation over this one. Disconnect it under *Settings → Git* if you no longer use it.

Guests can be sent personal links such as
`https://george-and-tess-wedding-m73p.vercel.app/?to=Uncle%20Joseph%20%26%20Family`.

### Other hosts

Any static host works: GitHub Pages (deploy from this branch, folder `/`), or Netlify/Vercel with no build command
and `/` as the output directory. If the address changes, update `og:url` and `og:image` in `index.html` so WhatsApp
shows the preview card.

## Check the live site

In GitHub, open **Actions → Check live invitation → Run workflow**. It loads the published site from the public internet
(no Vercel login), confirms every file matches the repo, checks caching and video streaming, and smoke-tests the
invitation in a phone-sized and a desktop browser. Screenshots are attached to the run.

## Credits

- **Images**: AI-generated in Figma (gemini-3.1-flash-image). The **hero film** is rendered from those images with `tools/make_hero_video.py`.
- **Music**: Johann Pachelbel, *Canon in D* (public domain). Rendered with `tools/compose_canon.py` using
  [Salamander Grand Piano](https://github.com/Tonejs/audio) samples by Alexander Holm (CC BY 3.0) and
  [VSCO 2 Community Edition](https://github.com/nbrosowsky/tonejs-instruments) harp, violin and contrabass samples (CC0).
- **Fonts**: Great Vibes, Cormorant Garamond and Cinzel (SIL Open Font License), self-hosted as Latin subsets.
