export interface OddsApiSportEvent {
  id: string;
  sport_key: string;
  sport_title: string;
  commence_time: string;
  home_team: string;
  away_team: string;
  bookmakers: OddsApiBookmaker[];
}

export interface OddsApiBookmaker {
  key: string;
  title: string;
  last_update: string;
  markets: OddsApiMarket[];
}

export interface OddsApiMarket {
  key: string;
  last_update: string;
  outcomes: OddsApiOutcome[];
}

export interface OddsApiOutcome {
  name: string;
  price: number;
}

export interface NormalizedOddsEntry {
  matchId: number;
  matchNumber: number;
  homeTeamId: string;
  awayTeamId: string;
  homeTeamName: string;
  awayTeamName: string;
  bookmaker: string;
  homeOdds: number;
  drawOdds: number;
  awayOdds: number;
  lastUpdate: Date;
}

export interface ImpliedProbabilities {
  homeWin: number;
  draw: number;
  awayWin: number;
  margin: number;
}

export interface MarketVsModelDiff {
  matchId: number;
  matchNumber: number;
  homeTeamId: string;
  awayTeamId: string;
  market: ImpliedProbabilities;
  model: { homeWin: number; draw: number; awayWin: number };
  diff: { homeWin: number; draw: number; awayWin: number };
  value: { homeWin: number; draw: number; awayWin: number };
}
