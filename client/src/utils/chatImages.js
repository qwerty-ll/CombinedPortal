// Resolves [IMG:...] tags in chatbot replies to images in /public.
const ROOM_RE = /(101|102|104|107|108|201|202|203|204|206|207|208|209|301|302|303|304|306|307|308|309|310|312|313|401|403|406|407|408|409)/;

export const mapImageNameToPath = (imgName) => {
  if (!imgName) return '';
  const clean = imgName.toLowerCase().trim().replace(/^\//, '');

  if (clean.includes('coworking') || clean.includes('коворкинг')) return '/coworking.png';
  if (clean.includes('teachers') || clean.includes('преподаватель')) return '/teachers.png';

  const roomMatch = clean.match(ROOM_RE);
  if (roomMatch) return `/${roomMatch[1]}.png`;

  const floorMatch = clean.match(/^(?:floor)?([1-4])(?:\.png)?$/);
  if (floorMatch) return `/floor${floorMatch[1]}.png`;

  return '';
};
