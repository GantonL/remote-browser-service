export enum LoadStatus {
  MINIMUM = "minimum",
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  EXTREME = "extreme",
}

export const LOAD_STATUS_MAPPING = {
  [LoadStatus.MINIMUM]: {
    maxPercentage: 0,
    message: "Service is operating at minimum capacity.",
  },
  [LoadStatus.LOW]: {
    maxPercentage: 30,
    message: "Service is operating at low capacity.",
  },
  [LoadStatus.MEDIUM]: {
    maxPercentage: 70,
    message: "Service is operating at medium capacity.",
  },
  [LoadStatus.HIGH]: {
    maxPercentage: 99,
    message: "Service is operating at high capacity.",
  },
  [LoadStatus.EXTREME]: {
    maxPercentage: 100, // Effectively anything >= 100
    message: "Service is at full capacity. Requests are being queued.",
  },
};
