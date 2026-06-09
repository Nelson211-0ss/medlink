/**
 * Curated, license-free imagery (Unsplash) used across the marketing surfaces.
 * Centralized so they're easy to swap or self-host later.
 */
const u = (id: string, w = 1200, q = 80) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=${q}`;

export const images = {
  heroTeam: u('1666214280557-f1b5022eb634', 1400),
  heroCare: u('1559839734-2b71ea197ec2', 1000),
  doctor: u('1576091160550-2173dba999ef', 1000),
  surgeons: u('1504813184591-01572f98c85f', 1400),
  teamHuddle: u('1579684385127-1ef15d508118', 1200),
  nurse: u('1582750433449-648ed127bb54', 1000),
  hospital: u('1551190822-a9333d879b1f', 1200),
  authBackdrop: u('1638202993928-7267aad84c31', 1200),
} as const;

export const avatars = {
  ashley: u('1594824476967-48c8b964273f', 240),
  david: u('1622253692010-333f2da6031d', 240),
  maria: u('1559839734-2b71ea197ec2', 240),
} as const;

/** Hero slider — transparent PNG healthcare professional cutouts */
export const nurseSlides = [
  { src: '/nurses/44989995_9110036.png', alt: 'Male physician pointing toward opportunity' },
  { src: '/nurses/44990013_9109844.png', alt: 'Female clinician in protective gear with arms crossed' },
  { src: '/nurses/44990018_9109683.png', alt: 'Female doctor smiling with arms crossed' },
] as const;
