import type { OddsApiSportEvent } from "./types.js";

const BASE_URL = "https://api.the-odds-api.com/v4";

export class OddsApiClient {
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.ODDS_API_KEY || "";
  }

  async getSports(): Promise<{ key: string; title: string }[]> {
    const url = `${BASE_URL}/sports?apiKey=${this.apiKey}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Odds API: failed to fetch sports (${response.status})`);
    }
    return response.json();
  }

  async getOdds(
    sport: string,
    regions: string = "us",
    markets: string = "h2h",
  ): Promise<OddsApiSportEvent[]> {
    const url = `${BASE_URL}/sports/${encodeURIComponent(sport)}/odds?apiKey=${this.apiKey}&regions=${regions}&markets=${markets}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Odds API: failed to fetch odds (${response.status})`);
    }
    return response.json();
  }
}
