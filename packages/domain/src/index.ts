export * from "./db/index.js";
export * from "./db/schema.js";
export * from "./generated/graphql.js";
export * from "./graphql-context.js";

// Common domain types
export interface Factor {
  factor: string;
  weight: number;
}

export interface PredictionPayload {
  homeWin: number;
  draw: number;
  awayWin: number;
  confidence: number;
  factors: Factor[];
  timestamp: string;
}
