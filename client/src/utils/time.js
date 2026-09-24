// EIOS times are Kostroma (Moscow) local time; read the clock in that zone whatever the device's time zone is.
const MSK_PARTS = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Europe/Moscow',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

/** { date: 'YYYY-MM-DD', minutes: minutes since midnight } in Moscow time */
export const mskNow = (at = new Date()) => {
  const part = (type) => MSK_PARTS.formatToParts(at).find((p) => p.type === type)?.value;
  return { date: `${part('year')}-${part('month')}-${part('day')}`, minutes: Number(part('hour')) * 60 + Number(part('minute')) };
};

export const toMinutes = (hm = '') => {
  const [h, m] = hm.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
};
