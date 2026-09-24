import React from 'react';
import { SECTIONS } from '../data/sections';

/** A section's icon on its hue tile. Decorative: the section name is always shown next to it. */
const SectionIcon = ({ section, size = 'md', className = '' }) => {
  const s = SECTIONS[section];
  if (!s) return null;
  const px = size === 'sm' ? 16 : size === 'lg' ? 24 : 20;
  return (
    <span className={`tile tile-${size} hue-${s.hue} ${className}`} aria-hidden="true">
      <s.Icon size={px} strokeWidth={1.75} />
    </span>
  );
};

export default SectionIcon;
