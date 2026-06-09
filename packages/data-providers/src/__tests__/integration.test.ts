import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ConcreteTheStatsApiClient } from "../thestatsapi/client.js";
import { FixturesAdapter } from "../thestatsapi/fixtures.js";
import { TeamsAdapter } from "../thestatsapi/teams.js";
import { StatsAdapter } from "../thestatsapi/stats.js";

// ─── Mock the domain module to avoid DB connections ───
vi.mock("@worldcup/domain", () => ({
  db: { insert: vi.fn().mockReturnValue({ values: vi.fn().mockResolvedValue(undefined) }) },
  providerLogs: {},
}));

/**
 * Build a minimal fetch mock that resolves to a given response body + status.
 */
function mockFetchResponse(data: unknown, status = 200) {
  return vi.spyOn(globalThis, "fetch").mockResolvedValue(
    new Response(JSON.stringify(data), {
      status,
      headers: { "Content-Type": "application/json" },
    }),
  );
}

// ─── Sample fixture data matching TheStatsAPI shape ───
const MOCK_FIXTURES_RESPONSE = {
  data: [
    {
      fixture_id: "f-001",
      match_no: 1,
      start_time: "2026-06-11T17:00:00Z",
      status: "scheduled",
      stage: "Group Stage",
      team_home: { iso_code: "MEX", name: "Mexico" },
      team_away: { iso_code: "USA", name: "United States" },
      stadium: { name: "Estadio Azteca", location: "Mexico City" },
    },
    {
      fixture_id: "f-002",
      match_no: 2,
      start_time: "2026-06-11T20:00:00Z",
      status: "scheduled",
      stage: "Group Stage",
      team_home: { iso_code: "CAN", name: "Canada" },
      team_away: { iso_code: "PAN", name: "Panama" },
      stadium: { name: "BC Place", location: "Vancouver" },
    },
  ],
};

// ─── Sample team data ───
const MOCK_TEAMS_RESPONSE = {
  data: [
    { team_id: "t-mex", name: "Mexico", iso_code: "MEX", group_name: "A", flag_url: "https://flags.fm/mex.png", elo_rating: 1650 },
    { team_id: "t-arg", name: "Argentina", iso_code: "ARG", group_name: "B", flag_url: "https://flags.fm/arg.png", elo_rating: 2100 },
    { team_id: "t-fra", name: "France", iso_code: "FRA", group_name: "C", flag_url: "https://flags.fm/fra.png", elo_rating: 2080 },
    { team_id: "t-eng", name: "England", iso_code: "ENG", group_name: "C", flag_url: "https://flags.fm/eng.png", elo_rating: 2000 },
  ],
};

// ─── Sample squad data ───
const MOCK_SQUAD_RESPONSE = {
  data: [
    { player_id: "p-messi", name: "L. Messi", position: "Forward", shirt_number: 10, team_id: "ARG" },
    { player_id: "p-di-maria", name: "A. Di Maria", position: "Forward", shirt_number: 11, team_id: "ARG" },
    { player_id: "p-martinez", name: "E. Martinez", position: "Goalkeeper", shirt_number: 1, team_id: "ARG" },
    { player_id: "p-romero", name: "C. Romero", position: "Defender", shirt_number: 13, team_id: "ARG" },
  ],
};

// ─── Sample match performance data ───
const MOCK_STATS_RESPONSE = {
  data: [
    {
      status: "completed",
      home_score: 2,
      away_score: 1,
      home_team_stats: {
        possession: 55,
        shots: 12,
        shots_on_target: 5,
        passes_attempted: 450,
        passes_completed: 390,
        corners: 4,
        fouls: 10,
        yellow_cards: 1,
        red_cards: 0,
        offsides: 2,
        expected_goals: 1.8,
      },
      away_team_stats: {
        possession: 45,
        shots: 8,
        shots_on_target: 3,
        passes_attempted: 380,
        passes_completed: 310,
        corners: 3,
        fouls: 12,
        yellow_cards: 2,
        red_cards: 0,
        offsides: 1,
        expected_goals: 0.9,
      },
      player_performances: [
        {
          player_id: "p-messi",
          player_name: "L. Messi",
          rating: 8.5,
          minutes_played: 90,
          goals: 1,
          assists: 1,
          yellow_cards: 0,
          red_cards: 0,
          shots: 4,
          shots_on_target: 3,
          passes_attempted: 45,
          passes_completed: 41,
          tackles: 1,
          interceptions: 0,
          saves: null,
          goals_conceded: null,
          clean_sheet: null,
        },
      ],
      events: [
        {
          player_id: "p-messi",
          team_id: "ARG",
          event_type: "Goal",
          minute: 23,
          extra_time_minute: null,
          detail: null,
        },
        {
          player_id: "p-martinez",
          team_id: "ARG",
          event_type: "YellowCard",
          minute: 45,
          extra_time_minute: 2,
          detail: "Professional foul",
        },
      ],
    },
  ],
};

describe("FixturesAdapter Integration", () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>;
  let adapter: FixturesAdapter;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.THESTATSAPI_KEY = "test-key";
    fetchSpy = mockFetchResponse(MOCK_FIXTURES_RESPONSE);
    adapter = new FixturesAdapter(new ConcreteTheStatsApiClient());
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  it("should fetch and map fixtures to NormalizedMatch[]", async () => {
    const fixtures = await adapter.fetch();

    expect(fixtures).toHaveLength(2);
    expect(fixtures[0].matchNumber).toBe(1);
    expect(fixtures[0].homeTeamId).toBe("MEX");
    expect(fixtures[0].awayTeamId).toBe("USA");
    expect(fixtures[0].providerId).toBe("f-001");
    expect(fixtures[0].status).toBe("Scheduled");
    expect(fixtures[0].stage).toBe("Group Stage");
    expect(fixtures[0].kickoffTime).toBeInstanceOf(Date);
    expect(fixtures[0].venueName).toBe("Estadio Azteca");
    expect(fixtures[0].venueCity).toBe("Mexico City");

    expect(fixtures[1].matchNumber).toBe(2);
    expect(fixtures[1].homeTeamId).toBe("CAN");
  });

  it("should return empty array when response has no data", async () => {
    fetchSpy.mockResolvedValue(
      new Response(JSON.stringify({}), { status: 200, headers: { "Content-Type": "application/json" } }),
    );
    const fixtures = await adapter.fetch();
    expect(fixtures).toEqual([]);
  });
});

describe("TeamsAdapter Integration", () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>;
  let adapter: TeamsAdapter;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.THESTATSAPI_KEY = "test-key";
    fetchSpy = mockFetchResponse(MOCK_TEAMS_RESPONSE);
    adapter = new TeamsAdapter(new ConcreteTheStatsApiClient());
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  it("should fetch and map teams to NormalizedTeam[]", async () => {
    const teams = await adapter.fetch();

    expect(teams).toHaveLength(4);
    expect(teams[0].id).toBe("MEX");
    expect(teams[0].name).toBe("Mexico");
    expect(teams[0].groupName).toBe("A");
    expect(teams[0].flagUrl).toBe("https://flags.fm/mex.png");
    expect(teams[0].eloRating).toBe(1650);
    expect(teams[0].providerId).toBe("t-mex");
  });

  it("should default eloRating to 1500 when not provided", async () => {
    const stripped = {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      data: MOCK_TEAMS_RESPONSE.data.map((item: Record<string, unknown>) => {
        const { elo_rating, ...rest } = item;
        return rest;
      }),
    };
    fetchSpy.mockResolvedValue(
      new Response(JSON.stringify(stripped), { status: 200, headers: { "Content-Type": "application/json" } }),
    );
    const teams = await adapter.fetch();
    expect(teams[0].eloRating).toBe(1500);
  });
});

describe("TeamsAdapter.fetchSquads Integration", () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>;
  let adapter: TeamsAdapter;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.THESTATSAPI_KEY = "test-key";
    fetchSpy = mockFetchResponse(MOCK_SQUAD_RESPONSE);
    adapter = new TeamsAdapter(new ConcreteTheStatsApiClient());
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  it("should fetch and map squad to NormalizedPlayer[]", async () => {
    const players = await adapter.fetchSquads("ARG", "t-arg");

    expect(players).toHaveLength(4);
    expect(players[0].providerId).toBe("p-messi");
    expect(players[0].name).toBe("L. Messi");
    expect(players[0].position).toBe("Forward");
    expect(players[0].teamId).toBe("ARG");
    expect(players[0].influenceScore).toBe(50); // Default
  });

  it("should normalize position strings correctly", async () => {
    const players = await adapter.fetchSquads("ARG", "t-arg");

    const messi = players.find((p) => p.name === "L. Messi");
    expect(messi?.position).toBe("Forward");

    const martinez = players.find((p) => p.name === "E. Martinez");
    expect(martinez?.position).toBe("Goalkeeper");

    const romero = players.find((p) => p.name === "C. Romero");
    expect(romero?.position).toBe("Defender");
  });
});

describe("StatsAdapter Integration", () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>;
  let adapter: StatsAdapter;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.THESTATSAPI_KEY = "test-key";
    fetchSpy = mockFetchResponse(MOCK_STATS_RESPONSE);
    adapter = new StatsAdapter(new ConcreteTheStatsApiClient());
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  it("should fetch and map match stats to NormalizedMatchStats", async () => {
    const stats = await adapter.fetchMatchStats(1, "m-001");

    expect(stats.status).toBe("Completed");
    expect(stats.homeScore).toBe(2);
    expect(stats.awayScore).toBe(1);

    // Team stats
    expect(stats.teamStats.home.possession).toBe(55);
    expect(stats.teamStats.home.shots).toBe(12);
    expect(stats.teamStats.home.expectedGoals).toBe(1.8);
    expect(stats.teamStats.away.yellowCards).toBe(2);
    expect(stats.teamStats.away.redCards).toBe(0);

    // Player performances
    expect(stats.playerPerformances).toHaveLength(1);
    expect(stats.playerPerformances[0].playerProviderId).toBe("p-messi");
    expect(stats.playerPerformances[0].playerName).toBe("L. Messi");
    expect(stats.playerPerformances[0].rating).toBe(8.5);
    expect(stats.playerPerformances[0].goals).toBe(1);
    expect(stats.playerPerformances[0].minutesPlayed).toBe(90);

    // Events
    expect(stats.events).toHaveLength(2);
    expect(stats.events[0].eventType).toBe("Goal");
    expect(stats.events[0].minute).toBe(23);
    expect(stats.events[0].detail).toBeNull();
    expect(stats.events[1].eventType).toBe("YellowCard");
    expect(stats.events[1].extraTimeMinute).toBe(2);
  });

  it("should return empty stats when response has no data", async () => {
    fetchSpy.mockResolvedValue(
      new Response(JSON.stringify({}), { status: 200, headers: { "Content-Type": "application/json" } }),
    );
    const stats = await adapter.fetchMatchStats(1, "m-001");

    expect(stats.status).toBe("Completed");
    expect(stats.homeScore).toBeNull();
    expect(stats.awayScore).toBeNull();
    expect(stats.teamStats.home.possession).toBeNull();
    expect(stats.playerPerformances).toEqual([]);
    expect(stats.events).toEqual([]);
  });
});
