# George & Tess — Wedding Invitation 💜

A dreamy, classic western wedding invitation website in lavender & glass.
Thursday, **31 December 2026** · Holy Mass at **4:00 PM** · Reception from **6:30 PM** · St. George Basilica, Angamaly, Kerala.

It is a static site (plain HTML, CSS and JavaScript with no build step), so you can host it anywhere.

## What's inside

| Feature | How it works |
| --- | --- |
| **Tap to open** | The opening film (a lavender envelope with a gold wax seal) waits on its first frame. One tap starts the music and plays it, and the invitation fades in as the envelope opens to white. |
| **Background music** | *My Love*, the couple's chosen song, loops softly in the background. It starts with the tap (as browsers require) and fades in. The floating disc button pauses or plays it. Music pauses when the tab is hidden. |
| **Hero film** | The couple walking hand in hand through a lavender field at sunset as the flowers sway in the wind. It is slowed to 60% speed with motion interpolation, so it stays smooth, and its end crossfades into its start, so the loop never jumps. There is a landscape cut for desktop and a portrait cut for phones, with an MP4 + WebM fallback. |
| **Parallax couple scene** | A pinned section where the couple's photos float in, drift and fade out as you scroll, with “chapter” captions. |
| **Scroll animations** | Fade, blur and slide reveals, parallax florals and backgrounds, a hero that dissolves on scroll, a progress bar and a section-aware glass dock. |
| **Glass UI** | Frosted `backdrop-filter` cards, dock, music player, tabs and form, in a lavender, lilac and champagne-gold palette. |
| **Countdown** | Live days / hours / minutes / seconds to 31 Dec 2026, 4:00 PM IST. |
| **Calendar** | A one-tap `.ics` file (both events, with a reminder 1 day before) plus a Google Calendar link. |
| **Location** | Map tabs for the church and the reception, with “Directions” links. |
| **RSVP** | Just the guest's full name and number of guests, with a heart-burst confirmation. The browser remembers the reply so a returning guest can resend it. |
| **Personal links** | `index.html?to=Anna%20%26%20Family` shows “Dear Anna & Family” on the opening screen and pre-fills the RSVP name. |
| **Extras** | Falling petals, sparkle cursor (desktop), share button, social preview image, `prefers-reduced-motion` support. |

## Edit the details

Most details live in **`assets/js/config.js`**: names, date, venues, times, the RSVP deadline, the hashtag and the music.
Elements tagged `data-field="…"` in `index.html` are filled from it automatically.
Longer text (such as the order of the evening) is written directly in `index.html`.

> Venues come from the couple's earlier invitation: St. George Basilica, Angamaly (Holy Mass, 4:00 PM) and the Parish Hall
> (Reception, 6:30 PM — please confirm this time). The order of the evening is a placeholder to personalise.

### Make RSVPs reach you

In `config.js` → `rsvp`, set **one** of these:

1. **`endpoint`**: replies are saved straight into a Google Sheet. Follow the steps at the top of
   [`docs/rsvp-google-sheets.gs`](docs/rsvp-google-sheets.gs) (it takes about 2 minutes). A Formspree URL also works.
2. **`whatsapp`**: your number with country code, digits only (e.g. `"919876543210"`). Each guest's reply opens WhatsApp, pre-written for them to send.
3. **`email`**: opens the guest's mail app with the reply pre-written.

If none is set, WhatsApp opens with the reply pre-written and the guest chooses George or Tess to send it to.
The confirmation screen only says the reply has arrived when it was delivered through `endpoint`.

### Swap in your real photos

Replace the files in `assets/img/` and keep the same names, or change the paths in `index.html`.
To use a different clip for the hero film (it is slowed and looped automatically):

```bash
sh tools/make_hero_loop.sh my-clip.mp4        # optional 2nd argument: speed, default 0.6
```

`tools/make_hero_video.py` renders the earlier slideshow-style film from stills, if you ever want it back.

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

- **Images**: AI-generated in Figma (gemini-3.1-flash-image), plus the couple's own photos. The **hero film** is an AI-generated clip supplied by the couple (Adobe Firefly), slowed and looped with `tools/make_hero_loop.sh`.
- **Music**: *My Love*, supplied by the couple (`assets/audio/my-love.mp3`, trimmed and loudness-matched for background play).
  `tools/compose_canon.py` can still render the earlier harp/piano *Canon in D* arrangement if you prefer it.
- **Fonts**: Great Vibes, Cormorant Garamond and Cinzel (SIL Open Font License), self-hosted as Latin subsets.
