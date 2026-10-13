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
  date: "2026-12-31T16:00:00+05:30",
  dateLabel: "Thursday, 31 December 2026",
  city: "Kochi, Kerala",

  events: {
    mass: {
      title: "Holy Mass",
      start: "2026-12-31T16:00:00+05:30",
      end: "2026-12-31T17:15:00+05:30",
      timeLabel: "4:00 PM",
      venue: "Santa Cruz Cathedral Basilica",
      address: "K.B. Jacob Road, Fort Kochi, Kochi, Kerala 682001",
      mapQuery: "Santa Cruz Cathedral Basilica, Fort Kochi, Kerala",
      note: "Kindly be seated by 3:45 PM",
    },
    reception: {
      title: "Wedding Reception",
      start: "2026-12-31T18:30:00+05:30",
      end: "2027-01-01T00:30:00+05:30",
      timeLabel: "6:30 PM",
      venue: "Grand Hyatt Kochi Bolgatty",
      address: "Bolgatty Island, Mulavukad, Kochi, Kerala 682504",
      mapQuery: "Grand Hyatt Kochi Bolgatty, Kerala",
      note: "Dinner, dancing & a New Year's Eve countdown",
    },
  },

  rsvp: {
    deadlineLabel: "30 November 2026",
    /*
     * Where RSVPs go — the first one that is set is used:
     *  1. endpoint: a Google Apps Script web-app URL (see README) or a
     *     Formspree URL like "https://formspree.io/f/xxxxxx".
     *  2. whatsapp: a phone number with country code, digits only,
     *     e.g. "919876543210" — opens WhatsApp with the reply filled in.
     *  3. email: opens the guest's mail app with the reply filled in.
     * With none set, replies are only saved in the guest's browser
     * (handy while designing).
     */
    endpoint: "",
    whatsapp: "",
    email: "",
  },

  music: {
    src: "assets/audio/canon-in-d.mp3",
    title: "Canon in D · Pachelbel",
    volume: 0.6,
  },
};
