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
 * @param raw        Raw provider entity object (widened to Record)
 * @param config     Mapping configuration describing field extractions
 * @param entityName Human-readable name for warning messages
 * @returns          Normalized output object
 */
export function mapRawEntity(
  raw: Record<string, unknown>,
  config: Record<string, string | ((raw: Record<string, unknown>) => unknown)>,
  entityName: string,
): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const [targetKey, entry] of Object.entries(config)) {
    if (typeof entry === "function") {
      try {
        result[targetKey] = (entry as (raw: Record<string, unknown>) => unknown)(raw);
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

  return result;
}

// ────────── TheStatsAPI Mapping Configurations ──────────

export const fixtureMappingConfig = {
  providerId: "fixture_id" as const,
  matchNumber: "match_no" as const,
  kickoffTime: (raw: Record<string, unknown>) => new Date(raw.start_time as string),
  status: "status" as const,
  stage: "stage" as const,
  homeTeamId: "team_home.iso_code" as const,
  awayTeamId: "team_away.iso_code" as const,
  homeTeamName: "team_home.name" as const,
  awayTeamName: "team_away.name" as const,
  venueName: "stadium.name" as const,
  venueCity: "stadium.location" as const,
};

export const teamMappingConfig = {
  providerId: "team_id" as const,
  name: "name" as const,
  id: "iso_code" as const,
  groupName: "group_name" as const,
  flagUrl: "flag_url" as const,
};

export const playerMappingConfig = {
  providerId: "player_id" as const,
  name: "name" as const,
  position: "position" as const,
  shirtNumber: "shirt_number" as const,
  teamId: "team_id" as const,
};
