// ────────── Normalized Domain Interfaces ──────────
//
// These types represent the "clean" domain representation after
// normalizing provider-specific payloads. They decouple the rest
// of the application from any single external data source.

export interface NormalizedTeam {
  id: string; // Internal 3-letter code, e.g. 'ARG'
  name: string;
  groupName: string;
  flagUrl: string | null;
  eloRating: number;
  providerId: string | null;
}

export interface NormalizedPlayer {
  providerId: string;
  name: string;
  position: 'Goalkeeper' | 'Defender' | 'Midfielder' | 'Forward';
  teamId: string;
  influenceScore: number;
}

export interface NormalizedMatch {
  matchNumber: number;
  providerId: string | null;
  homeTeamId: string | null;
  awayTeamId: string | null;
  status: 'Scheduled' | 'Live' | 'Completed';
  stage: string;
  kickoffTime: Date;
  venueName: string | null;
  venueCity: string | null;
}

export interface NormalizedMatchStats {
  status: 'Live' | 'Completed';
  homeScore: number | null;
  awayScore: number | null;
  teamStats: {
    home: NormalizedTeamStats;
    away: NormalizedTeamStats;
  };
  playerPerformances: NormalizedPlayerPerformance[];
  events: NormalizedMatchEvent[];
}

export interface NormalizedTeamStats {
  possession: number | null;
  shots: number | null;
  shotsOnTarget: number | null;
  passesAttempted: number | null;
  passesCompleted: number | null;
  corners: number | null;
  fouls: number | null;
  yellowCards: number;
  redCards: number;
  offsides: number | null;
  expectedGoals: number | null;
}

export interface NormalizedPlayerPerformance {
  playerProviderId: string;
  playerName: string;
  rating: number;
  minutesPlayed: number;
  goals: number;
  assists: number;
  yellowCards: number;
  redCards: number;
  shots: number | null;
  shotsOnTarget: number | null;
  passesAttempted: number | null;
  passesCompleted: number | null;
  tackles: number | null;
  interceptions: number | null;
  saves: number | null;
  goalsConceded: number | null;
  cleanSheet: number | null;
}

export interface NormalizedMatchEvent {
  playerProviderId: string | null;
  teamId: string;
  eventType: 'Goal' | 'YellowCard' | 'RedCard' | 'Substitution';
  minute: number;
  extraTimeMinute: number | null;
  detail: string | null;
}
