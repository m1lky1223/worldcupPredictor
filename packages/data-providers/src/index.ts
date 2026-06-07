export interface SyncProvider {
  fetchFixtures(): Promise<unknown[]>;
  fetchTeams(): Promise<unknown[]>;
}

export class MockSyncProvider implements SyncProvider {
  async fetchFixtures(): Promise<unknown[]> {
    return [];
  }
  async fetchTeams(): Promise<unknown[]> {
    return [];
  }
}
