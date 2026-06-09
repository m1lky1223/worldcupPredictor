import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  getNestedValue,
  mapRawEntity,
  fixtureMappingConfig,
  teamMappingConfig,
  playerMappingConfig,
} from "../thestatsapi/mapper.js";

describe("getNestedValue", () => {
  it("should resolve a top-level property", () => {
    const obj = { name: "Argentina" };
    expect(getNestedValue(obj, "name")).toBe("Argentina");
  });

  it("should resolve a nested property via dot notation", () => {
    const obj = { team_home: { iso_code: "ARG" } };
    expect(getNestedValue(obj, "team_home.iso_code")).toBe("ARG");
  });

  it("should resolve a deeply nested property (3+ levels)", () => {
    const obj = { a: { b: { c: { d: 42 } } } };
    expect(getNestedValue(obj, "a.b.c.d")).toBe(42);
  });

  it("should return undefined for a missing intermediate key", () => {
    const obj = { team_home: {} };
    expect(getNestedValue(obj, "team_home.iso_code")).toBeUndefined();
  });

  it("should return undefined when root is null", () => {
    expect(getNestedValue(null as unknown as Record<string, unknown>, "a.b")).toBeUndefined();
  });

  it("should return undefined when encountering a non-object value mid-path", () => {
    const obj = { a: "string" };
    expect(getNestedValue(obj, "a.b")).toBeUndefined();
  });

  it("should return undefined for an empty path", () => {
    const obj = { a: 1 };
    expect(getNestedValue(obj, "")).toBeUndefined();
  });

  it("should use generic type parameter for return type inference", () => {
    const obj = { data: { value: 42 } };
    const result = getNestedValue<number>(obj, "data.value");
    expect(result).toBe(42);
  });
});

describe("mapRawEntity", () => {
  let warnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  it("should map a simple object using string paths", () => {
    const raw = { name: "Argentina", iso_code: "ARG" };
    const config = { name: "name", id: "iso_code" };

    const result = mapRawEntity(raw, config, "test");
    expect(result).toEqual({ name: "Argentina", id: "ARG" });
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it("should map an object with nested property paths", () => {
    const raw = {
      team_home: { iso_code: "ARG", name: "Argentina" },
      match_no: 1,
    };
    const config = {
      homeTeamId: "team_home.iso_code",
      matchNumber: "match_no",
    };

    const result = mapRawEntity(raw, config, "fixture");
    expect(result).toEqual({ homeTeamId: "ARG", matchNumber: 1 });
  });

  it("should transform values using function entries", () => {
    const raw = { start_time: "2026-06-11T17:00:00Z" };
    const config = {
      kickoffTime: (r: Record<string, unknown>) => new Date(r.start_time as string),
    };

    const result = mapRawEntity(raw, config, "fixture");
    expect(result.kickoffTime).toBeInstanceOf(Date);
    expect((result.kickoffTime as Date).toISOString()).toBe("2026-06-11T17:00:00.000Z");
  });

  it("should set null for missing string path field and log warning", () => {
    const raw = { name: "Argentina" };
    const config = { name: "name", flagUrl: "flag_url" };

    const result = mapRawEntity(raw, config, "team");
    expect(result).toEqual({ name: "Argentina", flagUrl: null });
    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('missing optional property "flag_url"'),
    );
  });

  it("should set null and log warning when transformer function throws", () => {
    const raw = { bad_date: "invalid" };
    const config = {
      parsed: (_r: Record<string, unknown>) => {
        throw new Error("Parsing failed");
      },
    };

    const result = mapRawEntity(raw, config, "test");
    expect(result).toEqual({ parsed: null });
    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining("transformer function failed"),
    );
  });

  it("should map fixtures config correctly with real data", () => {
    const raw = {
      fixture_id: "f123",
      match_no: 42,
      start_time: "2026-06-15T20:00:00Z",
      status: "scheduled",
      stage: "Group Stage",
      team_home: { iso_code: "FRA", name: "France" },
      team_away: { iso_code: "ENG", name: "England" },
      stadium: { name: "Stade de France", location: "Paris" },
    };

    const result = mapRawEntity(raw, fixtureMappingConfig, "fixture") as Record<string, unknown>;

    expect(result.providerId).toBe("f123");
    expect(result.matchNumber).toBe(42);
    expect(result.kickoffTime).toBeInstanceOf(Date);
    expect(result.status).toBe("scheduled");
    expect(result.stage).toBe("Group Stage");
    expect(result.homeTeamId).toBe("FRA");
    expect(result.awayTeamId).toBe("ENG");
    expect(result.homeTeamName).toBe("France");
    expect(result.awayTeamName).toBe("England");
    expect(result.venueName).toBe("Stade de France");
    expect(result.venueCity).toBe("Paris");
  });

  it("should handle missing nested fields gracefully with fixture config", () => {
    const raw = {
      fixture_id: "f456",
      match_no: 10,
      start_time: "2026-06-12T17:00:00Z",
      status: "scheduled",
      stage: "Group Stage",
      team_home: { iso_code: "MEX" },
      team_away: {},
      // stadium is completely missing
    };

    const result = mapRawEntity(raw, fixtureMappingConfig, "fixture") as Record<string, unknown>;

    expect(result.venueName).toBeNull();
    expect(result.venueCity).toBeNull();
    expect(result.awayTeamId).toBeNull();
    expect(result.awayTeamName).toBeNull();
    expect(result.homeTeamId).toBe("MEX");
    expect(warnSpy).toHaveBeenCalled();
  });

  it("should map team config correctly", () => {
    const raw = {
      team_id: "provider-123",
      name: "Argentina",
      iso_code: "ARG",
      group_name: "B",
      flag_url: "https://example.com/arg.png",
    };

    const result = mapRawEntity(raw, teamMappingConfig, "team") as Record<string, unknown>;

    expect(result.providerId).toBe("provider-123");
    expect(result.name).toBe("Argentina");
    expect(result.id).toBe("ARG");
    expect(result.groupName).toBe("B");
    expect(result.flagUrl).toBe("https://example.com/arg.png");
  });

  it("should map player config correctly", () => {
    const raw = {
      player_id: "p-messi",
      name: "L. Messi",
      position: "Forward",
      shirt_number: 10,
      team_id: "ARG",
    };

    const result = mapRawEntity(raw, playerMappingConfig, "player") as Record<string, unknown>;

    expect(result.providerId).toBe("p-messi");
    expect(result.name).toBe("L. Messi");
    expect(result.position).toBe("Forward");
    expect(result.shirtNumber).toBe(10);
    expect(result.teamId).toBe("ARG");
  });
});
