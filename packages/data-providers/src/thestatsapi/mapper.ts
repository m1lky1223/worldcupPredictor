// ────────── Declarative Field Mapping Engine ──────────
//
// Provides a declarative approach to normalizing raw provider
// API payloads into strongly-typed normalized domain types.
// Each provider exposes mapping configurations that describe
// how to extract and transform fields using dot-path resolution.

/**
 * Resolve a dot-separated path like "team_home.iso_code" to the
 * nested value inside an object. Returns `undefined` for missing
 * intermediate keys.
 *
 * @example
 *   getNestedValue({ a: { b: { c: 42 } } }, "a.b.c") // => 42
 *   getNestedValue({ a: {} }, "a.b.c")                // => undefined
 */
export function getNestedValue<T = unknown>(obj: Record<string, unknown>, path: string): T | undefined {
  const keys = path.split(".");
  let current: unknown = obj;

  for (const key of keys) {
    if (current === null || current === undefined) {
      return undefined;
    }
    if (typeof current !== "object") {
      return undefined;
    }
    current = (current as Record<string, unknown>)[key];
  }

  return current as T | undefined;
}

/**
 * A mapping configuration entry. Can be either:
 * - A **string** dot-path that resolves to a value on the raw payload.
 * - A **function** that receives the raw payload and transforms it.
 */
export type MappingConfigEntry<TInput, TOutput = unknown> =
  | string
  | ((raw: TInput) => TOutput);

/**
 * Describes how to map one entity type from raw provider data to
 * a normalized shape. Each key in the config is the target field
 * name, and each value describes where to get it from.
 */
export type MappingConfig<TInput, TOutput> = {
  [K in keyof TOutput]: MappingConfigEntry<TInput, TOutput[K]>;
};

/**
 * Map a raw provider entity through a declarative mapping config
 * into a normalized output object.
 *
 * - String values are resolved via dot-path from the raw entity.
 * - Function values are called with the raw entity as argument.
 *
 * If a string path resolves to `undefined` / `null` a warning is
 * emitted via `console.warn` and the target property is set to
 * `null` (graceful degradation — the caller never receives a
 * partial crash).
 *
 * Function-based mappings that throw are caught, logged, and also
 * produce `null`.
 *
 * @param raw        Raw provider entity object
 * @param config     Mapping configuration describing field extractions
 * @param entityName Human-readable name for warning messages
 * @returns          Normalized output object
 */
export function mapRawEntity<TInput extends Record<string, unknown>, TOutput extends Record<string, unknown>>(
  raw: TInput,
  config: MappingConfig<TInput, TOutput>,
  entityName: string,
): TOutput {
  const result: Record<string, unknown> = {};

  for (const [targetKey, entry] of Object.entries(config)) {
    if (typeof entry === "function") {
      try {
        result[targetKey] = (entry as (raw: TInput) => unknown)(raw);
      } catch (err) {
        console.warn(
          `[Mapper] Warning: transformer function failed for "${entityName}.${targetKey}". ` +
            `Setting to null. Error: ${err instanceof Error ? err.message : String(err)}`,
        );
        result[targetKey] = null;
      }
    } else if (typeof entry === "string") {
      const value = getNestedValue(raw, entry);
      if (value === undefined || value === null) {
        console.warn(
          `[Mapper] Warning: missing optional property "${entry}" for "${entityName}.${targetKey}". Setting to null.`,
        );
        result[targetKey] = null;
      } else {
        result[targetKey] = value;
      }
    }
  }

  return result as TOutput;
}

// ────────── TheStatsAPI Mapping Configurations ──────────

/**
 * Expected shape of a fixture (match) from TheStatsAPI.
 * This is the raw provider schema we map FROM.
 */
interface RawFixture {
  fixture_id: string;
  match_no: number;
  start_time: string;
  status: string;
  stage: string;
  team_home: {
    iso_code: string;
    name: string;
  };
  team_away: {
    iso_code: string;
    name: string;
  };
  stadium: {
    name: string;
    location: string;
  };
}

/**
 * Shape of a normalized match output after mapping.
 */
interface NormalizedFixtureOutput {
  providerId: string;
  matchNumber: number;
  kickoffTime: Date;
  status: "Scheduled" | "Live" | "Completed";
  stage: string;
  homeTeamId: string;
  awayTeamId: string;
  homeTeamName: string;
  awayTeamName: string;
  venueName: string | null;
  venueCity: string | null;
}

export const fixtureMappingConfig: MappingConfig<RawFixture, NormalizedFixtureOutput> = {
  providerId: "fixture_id",
  matchNumber: "match_no",
  kickoffTime: (raw) => new Date(raw.start_time),
  status: "status",
  stage: "stage",
  homeTeamId: "team_home.iso_code",
  awayTeamId: "team_away.iso_code",
  homeTeamName: "team_home.name",
  awayTeamName: "team_away.name",
  venueName: "stadium.name",
  venueCity: "stadium.location",
};

/**
 * Expected shape of a team from TheStatsAPI.
 */
interface RawTeam {
  team_id: string;
  name: string;
  iso_code: string;
  group_name: string;
  flag_url: string;
}

/**
 * Shape of a normalized team output after mapping.
 */
interface NormalizedTeamOutput {
  providerId: string;
  name: string;
  id: string;
  groupName: string;
  flagUrl: string | null;
}

export const teamMappingConfig: MappingConfig<RawTeam, NormalizedTeamOutput> = {
  providerId: "team_id",
  name: "name",
  id: "iso_code",
  groupName: "group_name",
  flagUrl: "flag_url",
};

/**
 * Expected shape of a player from TheStatsAPI squad endpoint.
 */
interface RawPlayer {
  player_id: string;
  name: string;
  position: string;
  shirt_number: number;
  team_id: string;
}

/**
 * Shape of a normalized player output after mapping.
 */
interface NormalizedPlayerOutput {
  providerId: string;
  name: string;
  position: string;
  shirtNumber: number;
  teamId: string;
}

export const playerMappingConfig: MappingConfig<RawPlayer, NormalizedPlayerOutput> = {
  providerId: "player_id",
  name: "name",
  position: "position",
  shirtNumber: "shirt_number",
  teamId: "team_id",
};
