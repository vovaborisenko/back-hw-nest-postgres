export function parseJwtTime(time?: number): Date {
  return new Date((time || 0) * 1e3);
}
