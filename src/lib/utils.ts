export function formatCents(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

export function formatCentsDecimal(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(cents / 100);
}

export function getProgressPercentage(funded: number, total: number): number {
  if (total === 0) return 0;
  return Math.min(100, Math.round((funded / total) * 100));
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function getCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    dining: "Dining",
    hotels: "Hotels",
    activities: "Activities",
    transport: "Transport",
    extras: "Extras",
  };
  return labels[category] || category;
}

export function getCategoryEmoji(category: string): string {
  const emojis: Record<string, string> = {
    dining: "🍽️",
    hotels: "🏨",
    activities: "🎯",
    transport: "✈️",
    extras: "🎁",
  };
  return emojis[category] || "✨";
}

const AVATAR_COLORS = [
  "#C17B5A",
  "#A8654A",
  "#7A9A6D",
  "#D4A24E",
  "#4A7FA5",
  "#9B89B5",
  "#8A7B6B",
  "#6B9BBD",
];

export function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}
