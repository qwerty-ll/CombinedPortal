// Initials avatars: a steady hue per person so faces in a list are easy to tell apart.
const HUES = ['blue', 'violet', 'green', 'pink', 'amber', 'cyan', 'orange'];

export const hueFor = (name = '') => {
  let h = 0;
  for (const ch of name) h = (h * 31 + ch.codePointAt(0)) >>> 0;
  return HUES[h % HUES.length];
};

export const initialsOf = (name = '') =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase();
