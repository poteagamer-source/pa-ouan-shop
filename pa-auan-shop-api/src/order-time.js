// Always derive the shop's calendar date and clock time from the actual instant.
const formatter = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Asia/Bangkok', year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
});

export function orderDateTime(createdAt) {
  const parts = Object.fromEntries(formatter.formatToParts(new Date(createdAt)).map(part => [part.type, part.value]));
  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    time: `${parts.hour}:${parts.minute}:${parts.second}`,
  };
}
