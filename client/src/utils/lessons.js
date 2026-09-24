// EIOS writes the subgroup into the discipline name ("пр Python, п/г 1") and only sometimes into номерПодгруппы.
const SUBGROUP_IN_TITLE = /(?:п\/г|подгр[а-яё]*)\.?\s*(\d)|(\d)\s*п\/г/i;
const SUBGROUP_SUFFIX = /[\s,(]*(?:(?:п\/г|подгр[а-яё]*)\.?\s*\d|\d\s*п\/г)\s*\)?\s*$/i;

/** 0 for the whole group, else the subgroup number */
export const subgroupOf = (lesson) => {
  const n = Number(lesson?.номерПодгруппы);
  if (n > 0) return n;
  const m = String(lesson?.дисциплина || '').match(SUBGROUP_IN_TITLE);
  return m ? Number(m[1] || m[2]) : 0;
};

/** "лек Философия, п/г 1" → "Философия" */
export const cleanLessonTitle = (raw = '') => String(raw)
  .replace(/^(лек|лаб|пр|экз|зач|конс)\.?\s+/i, '')
  .replace(SUBGROUP_SUFFIX, '')
  .trim();
