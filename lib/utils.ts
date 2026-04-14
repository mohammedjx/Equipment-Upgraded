export function createShiftCode() {
  const d = new Date();
  const parts = [
    d.getUTCFullYear(),
    String(d.getUTCMonth() + 1).padStart(2, "0"),
    String(d.getUTCDate()).padStart(2, "0"),
    String(d.getUTCHours()).padStart(2, "0"),
    String(d.getUTCMinutes()).padStart(2, "0"),
    String(d.getUTCSeconds()).padStart(2, "0"),
    Math.floor(Math.random() * 1000).toString().padStart(3, "0"),
  ];
  return `SHIFT-${parts.join("")}`;
}

export function startOfDay(dateStr: string) {
  return new Date(`${dateStr}T00:00:00.000Z`);
}

export function endOfDay(dateStr: string) {
  return new Date(`${dateStr}T23:59:59.999Z`);
}

export function monthRange(monthStr: string) {
  const [year, month] = monthStr.split("-").map(Number);
  const start = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
  const end = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));
  return { start, end };
}

export function formatDateTime(value: string | Date | null | undefined) {
  if (!value) return "—";
  return new Date(value).toLocaleString();
}
