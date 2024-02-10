export async function toNormalDate(date: Date) {
  return new Date(date).toLocaleString('ru-RU', {
    timeZone: 'Europe/Kiev',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}
