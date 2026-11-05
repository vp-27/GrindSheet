// Missing measurements must stay missing; Number(null) would invent a zero.
export const metricNumber = (value: unknown) =>
  value == null ? Number.NaN : Number(value);
