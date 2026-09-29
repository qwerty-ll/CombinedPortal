// Floor plans of корпус Б, traced from the building's plans (1882×652 px drawings, same coordinates here).
// Rooms are [x0, y0, x1, y1] rectangles or { points } polygons; their facts (places, computers, OS) come
// from /api/v1/rooms. `kind` colours the rooms that are not in that table.

export const VIEW = { x: 14, y: 16, width: 1858, height: 618 };

const rect = (x0, y0, x1, y1) => ({ x0, y0, x1, y1 });

// Stairs and toilets sit in the same places on every floor
const stairs = (top) => [rect(619, top, 706, 292), rect(1180, top, 1266, 292)];

export const FLOOR_PLANS = {
  1: {
    shell: [rect(82, 80, 1828, 505), rect(632, 60, 1278, 80)],
    corridors: [rect(98, 245, 1809, 338), rect(638, 338, 1268, 492)],
    rooms: [
      { id: '107', ...rect(98, 97, 551, 247) },
      { id: '108', ...rect(98, 337, 637, 487), kind: 'коворкинг', note: '8 бит' },
      { id: '101', ...rect(1371, 97, 1809, 245) },
      { id: '104', ...rect(1275, 338, 1542, 487) },
      { id: '102', ...rect(1544, 337, 1809, 486) },
      { id: 'ит-улей', ...rect(740, 77, 1175, 234), kind: 'коворкинг', label: 'ИТ улей' },
      { id: '1-post', ...rect(647, 338, 740, 412), kind: 'office' },
    ],
    halls: [{ label: 'Холл', x: 955, y: 450 }],
    stairs: [rect(650, 62, 732, 245), rect(1185, 62, 1266, 245), rect(350, 283, 478, 325)],
    wc: [rect(553, 97, 640, 245), rect(1276, 97, 1370, 245)],
    entrance: { porch: rect(822, 502, 1086, 628), steps: [rect(832, 552, 895, 626), rect(1012, 552, 1076, 626)] },
  },
  2: {
    shell: [rect(22, 100, 1855, 578), rect(600, 75, 1283, 100)],
    corridors: [rect(606, 288, 1836, 391), rect(904, 96, 987, 292)],
    rooms: [
      { id: '209', ...rect(714, 96, 904, 265), kind: 'дирекция', note: 'Дирекция' },
      { id: '207', ...rect(987, 95, 1169, 264) },
      { id: '203', ...rect(1374, 120, 1552, 287) },
      { id: '201', ...rect(1553, 120, 1835, 287) },
      { id: '208', ...rect(616, 391, 890, 558) },
      { id: '206', ...rect(891, 391, 1265, 558) },
      { id: '204', ...rect(1274, 391, 1657, 558) },
      { id: '202', ...rect(1658, 391, 1836, 558) },
      { id: 'teachers', ...rect(247, 290, 606, 390), kind: 'staff', label: 'Преподавательская' },
      { id: '2-a', ...rect(40, 120, 131, 205), kind: 'office' },
      { id: '2-b', ...rect(40, 205, 112, 288), kind: 'office' },
      { id: '2-c', ...rect(131, 120, 216, 186), kind: 'office' },
      { id: '2-d', points: [[216, 120], [415, 120], [415, 288], [112, 288], [112, 205], [131, 186], [216, 186]], kind: 'office' },
      { id: '2-e', ...rect(415, 120, 502, 288), kind: 'office' },
      { id: '2-f', ...rect(40, 290, 247, 390), kind: 'office' },
      { id: '2-g', ...rect(40, 390, 322, 558), kind: 'office' },
      { id: '2-g2', ...rect(235, 478, 322, 558), kind: 'office' },
      { id: '2-i', ...rect(322, 390, 508, 558), kind: 'office' },
      { id: '2-i2', ...rect(422, 478, 508, 558), kind: 'office' },
      { id: '2-j', ...rect(508, 390, 606, 558), kind: 'office' },
    ],
    stairs: stairs(77),
    wc: [rect(502, 120, 606, 288), rect(1276, 120, 1372, 288)],
  },
  3: {
    shell: [rect(25, 100, 1855, 578), rect(600, 75, 1283, 100)],
    corridors: [rect(44, 288, 1836, 391), rect(905, 99, 986, 292)],
    rooms: [
      { id: '313', ...rect(44, 122, 516, 289) },
      { id: '309', ...rect(714, 99, 905, 266) },
      { id: '307', ...rect(986, 99, 1170, 266) },
      { id: '303', ...rect(1375, 121, 1553, 288) },
      { id: '301', ...rect(1554, 121, 1836, 288) },
      { id: '300', ...rect(1622, 303, 1838, 375), kind: 'office', label: '300' },
      { id: '312', ...rect(43, 391, 230, 558) },
      { id: '310', ...rect(231, 391, 607, 558) },
      { id: '308', ...rect(618, 391, 893, 558) },
      { id: '306', ...rect(894, 391, 1266, 558) },
      { id: '304', ...rect(1276, 391, 1558, 558) },
      { id: '302', ...rect(1559, 391, 1836, 558) },
    ],
    stairs: stairs(77),
    wc: [rect(518, 122, 607, 289), rect(1276, 121, 1375, 288)],
  },
  4: {
    shell: [rect(25, 108, 1855, 578), rect(600, 85, 1283, 108)],
    corridors: [rect(44, 293, 715, 394), rect(1171, 293, 1836, 394)],
    rooms: [
      { id: '409', ...rect(44, 130, 516, 293) },
      { id: '407', ...rect(715, 107, 1171, 379) },
      { id: '403', ...rect(1374, 130, 1553, 293) },
      { id: '401', ...rect(1554, 129, 1836, 293) },
      { id: '408', ...rect(44, 394, 231, 557) },
      { id: '406', ...rect(232, 394, 606, 557) },
      { id: '4-hall', ...rect(617, 394, 1267, 558), kind: 'office' },
      { id: 'коворкинг', ...rect(1276, 394, 1836, 558), kind: 'коворкинг', label: 'Коворкинг', note: '64 бит' },
    ],
    stairs: stairs(87),
    wc: [rect(518, 130, 607, 295), rect(1276, 130, 1374, 295)],
  },
};

export const FLOORS = [1, 2, 3, 4];

// The floor of a room id: "301" → 3, "коворкинг" → 4
export const floorOf = (id) => {
  const floor = FLOORS.find((f) => FLOOR_PLANS[f].rooms.some((r) => r.id === id));
  return floor || null;
};

export const roomShape = (id) => {
  for (const f of FLOORS) {
    const room = FLOOR_PLANS[f].rooms.find((r) => r.id === id);
    if (room) return room;
  }
  return null;
};

// Rooms a visitor can pick: numbered rooms and the coworkings, not offices without a number
export const isPickable = (room) => (/^\d{3}$/.test(room.id) ? room.kind !== 'office' : room.kind === 'коворкинг');

export const boundsOf = (room) => {
  if (!room.points) return room;
  const xs = room.points.map((p) => p[0]);
  const ys = room.points.map((p) => p[1]);
  return { x0: Math.min(...xs), y0: Math.min(...ys), x1: Math.max(...xs), y1: Math.max(...ys) };
};

// Colours by the kind of room (the table's type, else the plan's kind)
export const KIND_STYLE = {
  'компьютерный класс': { tone: 'blue', label: 'Компьютерный класс' },
  'мультимедийный класс': { tone: 'cyan', label: 'Мультимедийный класс' },
  лекционная: { tone: 'violet', label: 'Лекционная' },
  лаборатория: { tone: 'green', label: 'Лаборатория' },
  учебная: { tone: 'amber', label: 'Учебная' },
  коворкинг: { tone: 'orange', label: 'Коворкинг' },
  дирекция: { tone: 'pink', label: 'Дирекция' },
  staff: { tone: 'slate', label: 'Для преподавателей' },
  office: { tone: 'neutral', label: 'Служебные и кафедры' },
};
