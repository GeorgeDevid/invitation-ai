/*
 * ─────────────────────────────────────────────────────────────
 *  George & Tess — wedding details
 *  Edit this file to change names, times, venues, RSVP delivery
 *  and music. Text marked with data-field="…" in index.html is
 *  filled from here automatically.
 * ─────────────────────────────────────────────────────────────
 */
window.WEDDING = {
  groom: "George",
  bride: "Tess",
  monogram: "G&T",
  hashtag: "#GeorgeAndTessForever",

  // The countdown targets this moment (ISO 8601 with the venue's UTC offset).
  // Changing a time? Update events.*.start/end/timeLabel below and this date; the
  // schedule list and the <meta> descriptions in index.html are written out by hand.
  date: "2026-12-31T16:00:00+05:30",
  dateLabel: "Thursday, 31 December 2026",
  city: "Angamaly, Kerala",

  events: {
    mass: {
      title: "Holy Mass",
      start: "2026-12-31T16:00:00+05:30",
      end: "2026-12-31T17:15:00+05:30",
      timeLabel: "4:00 PM",
      venue: "St. George Basilica",
      address: "Angamaly, Ernakulam, Kerala 683572",
      mapQuery: "St. George Syro-Malabar Basilica, Angamaly, Kerala",
      note: "Kindly be seated by 3:45 PM",
    },
    reception: {
      title: "Wedding Reception",
      start: "2026-12-31T18:30:00+05:30",
      end: "2026-12-31T22:00:00+05:30",
      timeLabel: "6:30 PM",
      venue: "Parish Hall, St. George Basilica",
      address: "Angamaly, Ernakulam, Kerala 683572",
      mapQuery: "St. George Syro-Malabar Basilica, Angamaly, Kerala",
      note: "Dinner, toasts & celebration with family and friends",
    },
  },

  rsvp: {
    deadlineLabel: "15 December 2026",
    /*
     * Where RSVPs go — the first one that is set is used:
     *  1. endpoint: the Google Sheet's Apps Script web-app URL, ending in /exec
     *     (setup steps in docs/rsvp-google-sheets.gs), or a Formspree URL.
     *  2. whatsapp: a phone number with country code, digits only,
     *     e.g. "919876543210" — opens WhatsApp to you with the reply filled in.
     *  3. email: opens the guest's mail app with the reply filled in.
     * With none set, WhatsApp opens with the reply filled in and the guest
     * picks George or Tess to send it to.
     */
    endpoint: "https://script.google.com/macros/s/AKfycbytQTTKffRHRKgu87lVI-Uc2iYXmQfLgQ2JFm-UMqiWfGxE_N2Pd7-QHPVhknpiaA/exec",
    whatsapp: "",
    email: "",
  },

  music: {
    src: "assets/audio/my-love-from-36s.mp3",
    title: "My Love",
    volume: 0.6,
  },
};
