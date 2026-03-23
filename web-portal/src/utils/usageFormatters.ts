// Usage value formatters

export function formatDataMbToGb(mb: number): number {
  return mb / 1024;
}

export function formatDataGb(mb: number, decimals: number = 2): string {
  const gb = mb / 1024;
  return gb.toFixed(decimals);
}

export function formatVoiceMinutes(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

export function formatSms(count: number): string {
  return `${count} msg`;
}

export function formatPercentage(value: number, decimals: number = 0): string {
  return `${value.toFixed(decimals)}%`;
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
  });
}

export function formatDateLong(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function formatDateRange(startDate: string, endDate: string): string {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const startStr = start.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  const endStr = end.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  return `${startStr} - ${endStr}`;
}

export function calculatePercentage(used: number, limit: number): number {
  if (limit === 0) return 0;
  return (used / limit) * 100;
}

export function getDaysRemaining(endDateString: string): number {
  const endDate = new Date(endDateString);
  const today = new Date();
  const diffTime = endDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
}
