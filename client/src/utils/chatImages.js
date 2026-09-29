// Resolves [IMG:...] tags in chatbot replies: floor plans are drawn by FloorPlan, other pictures come from /public.
import { floorOf } from '../data/floorPlans';

/** { floor, room } for a plan tag: "301.png" → room 301 on floor 3, "floor2.png" → floor 2, "coworking.png" → the coworking */
export const planOf = (imgName) => {
  if (!imgName) return null;
  const clean = imgName.toLowerCase().trim().replace(/^\//, '');
  if (clean.includes('coworking') || clean.includes('коворкинг')) return { floor: 4, room: 'коворкинг' };
  const room = clean.match(/^(\d{3})(?:\.png)?$/);
  if (room && floorOf(room[1])) return { floor: floorOf(room[1]), room: room[1] };
  const floor = clean.match(/^(?:floor)?([1-4])(?:\.png)?$/);
  if (floor) return { floor: Number(floor[1]), room: null };
  return null;
};

export const mapImageNameToPath = (imgName) => {
  if (!imgName) return '';
  const clean = imgName.toLowerCase().trim().replace(/^\//, '');
  if (clean.includes('teachers') || clean.includes('преподаватель')) return '/teachers.png';
  return '';
};
