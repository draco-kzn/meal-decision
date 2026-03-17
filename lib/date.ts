export function startOfDay(date = new Date()) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

export function toDateKey(date = new Date()) {
  return startOfDay(date).toISOString().slice(0, 10);
}

export function fromDateKey(value?: string | null) {
  if (!value) {
    return startOfDay();
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? startOfDay() : startOfDay(date);
}

export function dayDiff(targetDate: Date | null) {
  if (!targetDate) {
    return null;
  }

  const diff = startOfDay(targetDate).getTime() - startOfDay().getTime();
  return Math.max(Math.ceil(diff / (1000 * 60 * 60 * 24)), 0);
}
