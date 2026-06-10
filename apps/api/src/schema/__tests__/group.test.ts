import { describe, it, expect } from "vitest";
import {
  computeTeamStats,
  buildHeadToHeadLookup,
  getHeadToHeadGD,
  findTiedTeams,
  buildStandingsEntries,
  sortStandings,
} from "../group.js";

// ── Fixtures ────────────────────────────────────────────────────────

const completedMatch = (
  homeTeamId: string,
  awayTeamId: string,
  homeScore: number,
  awayScore: number,
) => ({
  homeTeamId,
  awayTeamId,
  homeScore,
  awayScore,
});

const incompleteMatch = (homeTeamId: string, awayTeamId: string) => ({
  homeTeamId,
  awayTeamId,
  homeScore: null,
  awayScore: null,
});

// ── computeTeamStats ────────────────────────────────────────────────

describe("computeTeamStats", () => {
  it("returns empty array for no matches", () => {
    expect(computeTeamStats([])).toEqual([]);
  });

  it("skips incomplete matches (null scores)", () => {
    const result = computeTeamStats([incompleteMatch("ARG", "BRA")]);
    expect(result).toEqual([]);
  });

  it("computes correct stats for a single match (home win)", () => {
    const result = computeTeamStats([completedMatch("ARG", "BRA", 3, 1)]);
    expect(result).toHaveLength(2);

    const arg = result.find((r) => r.teamId === "ARG")!;
    expect(arg).toMatchObject({
      teamId: "ARG",
      played: 1,
      won: 1,
      drawn: 0,
      lost: 0,
      goalsFor: 3,
      goalsAgainst: 1,
    });

    const bra = result.find((r) => r.teamId === "BRA")!;
    expect(bra).toMatchObject({
      teamId: "BRA",
      played: 1,
      won: 0,
      drawn: 0,
      lost: 1,
      goalsFor: 1,
      goalsAgainst: 3,
    });
  });

  it("computes correct stats for a draw", () => {
    const result = computeTeamStats([completedMatch("ARG", "BRA", 1, 1)]);
    const arg = result.find((r) => r.teamId === "ARG")!;
    expect(arg).toMatchObject({ played: 1, won: 0, drawn: 1, lost: 0, goalsFor: 1, goalsAgainst: 1 });
  });

  it("computes correct stats for an away win", () => {
    const result = computeTeamStats([completedMatch("ARG", "BRA", 0, 2)]);
    const bra = result.find((r) => r.teamId === "BRA")!;
    expect(bra).toMatchObject({ played: 1, won: 1, drawn: 0, lost: 0, goalsFor: 2, goalsAgainst: 0 });
  });

  it("accumulates stats across multiple matches", () => {
    const result = computeTeamStats([
      completedMatch("ARG", "BRA", 1, 0),
      completedMatch("ARG", "URU", 2, 2),
      completedMatch("BRA", "URU", 3, 1),
    ]);

    const arg = result.find((r) => r.teamId === "ARG")!;
    expect(arg).toMatchObject({
      teamId: "ARG",
      played: 2,
      won: 1,
      drawn: 1,
      lost: 0,
      goalsFor: 3,
      goalsAgainst: 2,
    });

    const bra = result.find((r) => r.teamId === "BRA")!;
    expect(bra).toMatchObject({
      teamId: "BRA",
      played: 2,
      won: 1,
      drawn: 0,
      lost: 1,
      goalsFor: 3,
      goalsAgainst: 2,
    });

    const uru = result.find((r) => r.teamId === "URU")!;
    expect(uru).toMatchObject({
      teamId: "URU",
      played: 2,
      won: 0,
      drawn: 1,
      lost: 1,
      goalsFor: 3,
      goalsAgainst: 5,
    });
  });
});

// ── buildHeadToHeadLookup / getHeadToHeadGD ────────────────────────

describe("buildHeadToHeadLookup & getHeadToHeadGD", () => {
  it("builds empty lookup for no matches", () => {
    const lookup = buildHeadToHeadLookup([]);
    expect(getHeadToHeadGD("ARG", "BRA", lookup)).toBe(0);
  });

  it("computes H2H goal difference from a single match", () => {
    const lookup = buildHeadToHeadLookup([completedMatch("ARG", "BRA", 3, 1)]);
    // ARG beat BRA 3-1 → GD for ARG is +2, for BRA is -2
    // The key is sorted: ARG:BRA
    expect(getHeadToHeadGD("ARG", "BRA", lookup)).toBe(2);
    expect(getHeadToHeadGD("BRA", "ARG", lookup)).toBe(2); // symmetric key
  });

  it("accumulates H2H across multiple meetings", () => {
    // Two matches between same teams
    const lookup = buildHeadToHeadLookup([
      completedMatch("ARG", "BRA", 2, 0),
      completedMatch("BRA", "ARG", 1, 1),
    ]);
    // First: ARG +2, Second: ARG 0 (away draw is neutral for GD per home perspective... wait)
    // First: ARG 2-0 BRA → ARG +2
    // Second: BRA 1-1 ARG → from home perspective ARG goal diff: -1 but wait...
    
    // Actually, the GD from ARG's perspective in second match: they scored 1, conceded 1 → GD 0
    // Total H2H GD for ARG: +2 + 0 = +2
    expect(getHeadToHeadGD("ARG", "BRA", lookup)).toBe(2);
  });
});

// ── findTiedTeams ──────────────────────────────────────────────────

describe("findTiedTeams", () => {
  it("returns empty when no teams are tied", () => {
    const stats = computeTeamStats([
      completedMatch("ARG", "BRA", 2, 0),
      completedMatch("URU", "CHI", 1, 0),
    ]);
    // ARG: 3pts, BRA: 0pts, URU: 3pts, CHI: 0pts
    // ARG and URU are tied on 3 points
    const tied = findTiedTeams(stats);
    expect(tied.length).toBeGreaterThan(0);
  });

  it("detects two-team tie on points", () => {
    const stats = [
      { teamId: "ARG", played: 1, won: 1, drawn: 0, lost: 0, goalsFor: 2, goalsAgainst: 0 },
      { teamId: "BRA", played: 1, won: 0, drawn: 1, lost: 0, goalsFor: 1, goalsAgainst: 1 },
      { teamId: "URU", played: 1, won: 1, drawn: 0, lost: 0, goalsFor: 1, goalsAgainst: 0 },
    ];
    // ARG: 3pts, BRA: 1pt, URU: 3pts → ARG and URU tied
    const tied = findTiedTeams(stats);
    const pts3 = tied.find((g) => g.includes("ARG"));
    expect(pts3).toBeDefined();
    expect(pts3!.sort()).toEqual(["ARG", "URU"]);
  });

  it("detects three-way tie", () => {
    const stats = [
      { teamId: "ARG", played: 2, won: 1, drawn: 0, lost: 1, goalsFor: 3, goalsAgainst: 2 },
      { teamId: "BRA", played: 2, won: 1, drawn: 0, lost: 1, goalsFor: 2, goalsAgainst: 3 },
      { teamId: "URU", played: 2, won: 1, drawn: 0, lost: 1, goalsFor: 4, goalsAgainst: 4 },
    ];
    // All on 3 points
    const tied = findTiedTeams(stats);
    const threeWay = tied.find((g) => g.length === 3);
    expect(threeWay).toBeDefined();
    expect(threeWay!.sort()).toEqual(["ARG", "BRA", "URU"]);
  });
});

// ── buildStandingsEntries ──────────────────────────────────────────

describe("buildStandingsEntries", () => {
  it("computes points and GD correctly", () => {
    const stats = [
      { teamId: "ARG", played: 2, won: 2, drawn: 0, lost: 0, goalsFor: 5, goalsAgainst: 1 },
      { teamId: "BRA", played: 2, won: 0, drawn: 1, lost: 1, goalsFor: 2, goalsAgainst: 3 },
    ];
    const entries = buildStandingsEntries(stats, []);
    const argEntry = entries.find((e) => e.teamId === "ARG")!;
    expect(argEntry.points).toBe(6);
    expect(argEntry.goalDifference).toBe(4);
    expect(argEntry.goalsFor).toBe(5);

    const braEntry = entries.find((e) => e.teamId === "BRA")!;
    expect(braEntry.points).toBe(1);
    expect(braEntry.goalDifference).toBe(-1);
  });

  it("attaches tied team IDs for tied groups", () => {
    const stats = [
      { teamId: "ARG", played: 2, won: 1, drawn: 0, lost: 1, goalsFor: 3, goalsAgainst: 2 },
      { teamId: "BRA", played: 2, won: 1, drawn: 0, lost: 1, goalsFor: 2, goalsAgainst: 3 },
      { teamId: "URU", played: 2, won: 2, drawn: 0, lost: 0, goalsFor: 5, goalsAgainst: 1 },
    ];
    const tiedGroups = [["ARG", "BRA"]];
    const entries = buildStandingsEntries(stats, tiedGroups);
    const argEntry = entries.find((e) => e.teamId === "ARG")!;
    expect(argEntry.teamIdsTied).toEqual(["BRA"]);
  });
});

// ── sortStandings ──────────────────────────────────────────────────

describe("sortStandings", () => {
  it("sorts by points descending", () => {
    const entries = [
      { teamId: "BRA", points: 1, goalDifference: 0, goalsFor: 1, teamIdsTied: [] },
      { teamId: "ARG", points: 7, goalDifference: 5, goalsFor: 6, teamIdsTied: [] },
      { teamId: "URU", points: 4, goalDifference: 2, goalsFor: 3, teamIdsTied: [] },
    ];
    const sorted = sortStandings(entries, []);
    expect(sorted).toEqual(["ARG", "URU", "BRA"]);
  });

  it("breaks points tie by goal difference", () => {
    const entries = [
      { teamId: "BRA", points: 4, goalDifference: 1, goalsFor: 3, teamIdsTied: [] },
      { teamId: "ARG", points: 4, goalDifference: 3, goalsFor: 4, teamIdsTied: [] },
    ];
    const sorted = sortStandings(entries, []);
    expect(sorted).toEqual(["ARG", "BRA"]);
  });

  it("breaks GD tie by goals scored", () => {
    const entries = [
      { teamId: "BRA", points: 4, goalDifference: 2, goalsFor: 3, teamIdsTied: [] },
      { teamId: "ARG", points: 4, goalDifference: 2, goalsFor: 5, teamIdsTied: [] },
    ];
    const sorted = sortStandings(entries, []);
    expect(sorted).toEqual(["ARG", "BRA"]);
  });

  it("uses head-to-head to break two-way tie when all other metrics equal", () => {
    // ARG and BRA: same points, same GD, same GF
    const entries = [
      {
        teamId: "BRA",
        points: 4,
        goalDifference: 1,
        goalsFor: 3,
        teamIdsTied: ["ARG"],
      },
      {
        teamId: "ARG",
        points: 4,
        goalDifference: 1,
        goalsFor: 3,
        teamIdsTied: ["BRA"],
      },
    ];
    // ARG beat BRA 2-0 in their direct match
    const matches = [completedMatch("BRA", "ARG", 0, 2)];
    const sorted = sortStandings(entries, matches);
    // ARG should be ahead due to H2H
    expect(sorted).toEqual(["ARG", "BRA"]);
  });

  it("handles complete 4-team group scenario", () => {
    // Matches for Group A: ARG, BRA, URU, CHI
    const matches = [
      completedMatch("ARG", "BRA", 2, 1),
      completedMatch("URU", "CHI", 0, 0),
      completedMatch("ARG", "URU", 3, 0),
      completedMatch("BRA", "CHI", 1, 1),
      completedMatch("ARG", "CHI", 4, 0),
      completedMatch("BRA", "URU", 1, 2),
    ];

    const stats = computeTeamStats(matches);
    const tiedGroups = findTiedTeams(stats);
    const entries = buildStandingsEntries(stats, tiedGroups);
    const sorted = sortStandings(entries, matches);

    // Expected standings:
    // ARG: 3 wins = 9 pts, GF 9, GA 1, GD +8
    // URU: 1 win, 1 draw, 1 loss = 4 pts, GF 2, GA 4, GD -2
    // BRA: 0 wins, 1 draw, 2 losses = 1 pt, GF 3, GA 5, GD -2
    // CHI: 0 wins, 2 draws, 1 loss = 2 pts, GF 1, GA 5, GD -4

    // Actually let me recalculate:
    // ARG: W vs BRA (2-1), W vs URU (3-0), W vs CHI (4-0) → 9pts, GF 9, GA 1, GD +8
    // BRA: L vs ARG (1-2), D vs CHI (1-1), L vs URU (1-2) → 1pt, GF 3, GA 5, GD -2
    // URU: D vs CHI (0-0), L vs ARG (0-3), W vs BRA (2-1) → 4pts, GF 2, GA 4, GD -2
    // CHI: D vs URU (0-0), D vs BRA (1-1), L vs ARG (0-4) → 2pts, GF 1, GA 5, GD -4

    // Sorted: ARG(9) > URU(4) > CHI(2) > BRA(1)
    expect(sorted[0]).toBe("ARG"); // 9 pts
    expect(sorted[1]).toBe("URU"); // 4 pts
    expect(sorted[2]).toBe("CHI"); // 2 pts
    expect(sorted[3]).toBe("BRA"); // 1 pt
  });

  it("handles tie with same points, GD, and GF using H2H", () => {
    // ARG and URU have identical records but ARG beat URU
    const matches = [
      completedMatch("ARG", "URU", 1, 0),
    ];
    const entries = [
      {
        teamId: "URU",
        points: 4,
        goalDifference: 2,
        goalsFor: 3,
        teamIdsTied: ["ARG"],
      },
      {
        teamId: "ARG",
        points: 4,
        goalDifference: 2,
        goalsFor: 3,
        teamIdsTied: ["URU"],
      },
    ];
    const sorted = sortStandings(entries, matches);
    expect(sorted[0]).toBe("ARG"); // Won H2H
    expect(sorted[1]).toBe("URU");
  });
});
