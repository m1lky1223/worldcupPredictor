import {
  NormalizedMatch,
  NormalizedTeam,
  NormalizedPlayer,
  NormalizedMatchStats,
  NormalizedTeamStats,
  NormalizedPlayerPerformance,
  NormalizedMatchEvent,
} from "../types.js";

// ────────── Country-specific name pools ──────────

const COUNTRY_NAME_TEMPLATES: Record<string, string[]> = {
  ARG: [
    "L. Messi", "J. Alvarez", "A. Di Maria", "R. De Paul", "E. Martinez",
    "C. Romero", "N. Otamendi", "L. Martinez", "G. Lo Celso", "A. Mac Allister",
    "N. Molina", "G. Montiel", "L. Paredes", "G. Pezzella", "J. Palacios",
    "P. Dybala", "L. Ocampos", "E. Palacios", "J. Correa", "A. Correa",
    "F. Armani", "G. Rulli", "W. Benitez", "M. Acuna", "T. Almada",
  ],
  FRA: [
    "K. Mbappe", "A. Griezmann", "O. Dembele", "A. Tchouameni", "E. Camavinga",
    "T. Hernandez", "W. Saliba", "M. Maignan", "R. Kolo Muani", "Y. Fofana",
    "J. Kounde", "D. Upamecano", "L. Hernandez", "B. Pavard", "I. Sarr",
    "K. Coman", "M. Thuram", "A. Rabiot", "B. Barcola", "L. Digne",
    "A. Areola", "B. Costil", "W. Zaire-Emery", "C. Nkunku", "M. Diaby",
  ],
  BRA: [
    "Neymar", "Vinicius Jr", "Rodrygo", "R. Casemiro", "L. Paqueta",
    "Marquinhos", "E. Militao", "Alisson", "Raphinha", "B. Guimaraes",
    "D. Alves", "A. Sandro", "G. Jesus", "P. Coutinho", "Fabinho",
    "Danilo", "L. Silva", "Gabriel", "M. Cunha", "Pedro",
    "Weverton", "Ederson", "A. Telles", "B. Arana", "J. Gomes",
  ],
  ENG: [
    "H. Kane", "B. Saka", "J. Bellingham", "D. Rice", "P. Foden",
    "M. Rashford", "K. Walker", "J. Stones", "J. Pickford", "T. Alexander-Arnold",
    "B. Chilwell", "R. James", "D. Henderson", "C. Gallagher", "M. Mount",
    "I. Toney", "R. Sterling", "L. Shaw", "H. Maguire", "E. Dier",
    "A. Ramsdale", "N. Pope", "C. Wilson", "E. Konsa", "J. Maddison",
  ],
  GER: [
    "M. Neuer", "T. Muller", "J. Musiala", "F. Wirtz", "I. Gundogan",
    "K. Havertz", "A. Rudiger", "J. Kimmich", "L. Sane", "S. Gnabry",
    "N. Schlotterbeck", "D. Raum", "R. Andrich", "P. Hradecky", "F. Kostorz",
    "B. Henrichs", "J. Tah", "C. Fuhrich", "D. Undav", "N. Fullkrug",
    "M. ter Stegen", "K. Trapp", "J. Brandt", "A. Stiller", "S. Beier",
  ],
  ITA: [
    "G. Donnarumma", "F. Chiesa", "N. Barella", "L. Insigne", "C. Immobile",
    "D. Berardi", "J. Raspadori", "M. Locatelli", "S. Tonali", "A. Bastoni",
    "L. Spinazzola", "G. Di Lorenzo", "L. Bonucci", "G. Chiellini", "R. Calafiori",
    "M. Darmian", "B. Cristante", "L. Pellegrini", "G. Scamacca", "F. Dimarco",
    "A. Meret", "G. Vicario", "S. Ricci", "N. Zaniolo", "D. Frattesi",
  ],
  ESP: [
    "L. Yamal", "P. Gavi", "Pedri", "A. Morata", "Rodri",
    "D. Olmo", "C. Balde", "P. Torres", "Unai Simon", "M. Merino",
    "D. Carvajal", "A. Laporte", "J. Navas", "M. Oyarzabal", "N. Williams",
    "F. Torres", "M. Asensio", "F. Ruiz", "S. Gomez", "P. Aubameyang",
    "D. Raya", "K. Navas", "E. Garcia", "B. Gil", "A. Barrios",
  ],
  POR: [
    "C. Ronaldo", "B. Silva", "R. Dias", "J. Felix", "Bruno Fernandes",
    "R. Leao", "D. Costa", "J. Cancelo", "R. Neves", "Nuno Mendes",
    "P. Goncalo Ramos", "Vitinha", "O. Diogo Jota", "J. Palhinha", "D. Dalot",
    "R. Patricio", "J. Sa", "J. Mario", "W. Carvalho", "A. Silva",
    "Otavio", "R. Prestia", "G. Inacio", "T. Silva", "F. Conceicao",
  ],
};

const FALLBACK_NAMES = [
  "A. Silva", "B. Santos", "C. Oliveira", "D. Costa", "E. Pereira",
  "F. Fernandez", "G. Rodriguez", "H. Lopez", "I. Torres", "J. Martinez",
  "K. Andersen", "L. Johansson", "M. Mueller", "N. Petrov", "O. Ivanov",
  "P. Popov", "R. Kovacs", "S. Horvath", "T. Novak", "U. Berg",
  "V. Lindholm", "W. Schmidt", "X. Fischer", "Y. Wagner", "Z. Weber",
];

const GROUP_TEAMS: Record<string, { id: string; name: string }[]> = {
  A: [
    { id: "MEX", name: "Mexico" },
    { id: "USA", name: "United States" },
    { id: "CAN", name: "Canada" },
    { id: "PAN", name: "Panama" },
  ],
  B: [
    { id: "ARG", name: "Argentina" },
    { id: "BRA", name: "Brazil" },
    { id: "URU", name: "Uruguay" },
    { id: "COL", name: "Colombia" },
  ],
  C: [
    { id: "FRA", name: "France" },
    { id: "ENG", name: "England" },
    { id: "GER", name: "Germany" },
    { id: "ESP", name: "Spain" },
  ],
  D: [
    { id: "POR", name: "Portugal" },
    { id: "ITA", name: "Italy" },
    { id: "BEL", name: "Belgium" },
    { id: "NED", name: "Netherlands" },
  ],
  E: [
    { id: "CRO", name: "Croatia" },
    { id: "MAR", name: "Morocco" },
    { id: "SEN", name: "Senegal" },
    { id: "JPN", name: "Japan" },
  ],
  F: [
    { id: "KOR", name: "South Korea" },
    { id: "AUS", name: "Australia" },
    { id: "KSA", name: "Saudi Arabia" },
    { id: "IRN", name: "Iran" },
  ],
  G: [
    { id: "SUI", name: "Switzerland" },
    { id: "DEN", name: "Denmark" },
    { id: "SRB", name: "Serbia" },
    { id: "CMR", name: "Cameroon" },
  ],
  H: [
    { id: "GHA", name: "Ghana" },
    { id: "EGY", name: "Egypt" },
    { id: "NGA", name: "Nigeria" },
    { id: "ALG", name: "Algeria" },
  ],
  I: [
    { id: "TUN", name: "Tunisia" },
    { id: "CIV", name: "Ivory Coast" },
    { id: "SWE", name: "Sweden" },
    { id: "NOR", name: "Norway" },
  ],
  J: [
    { id: "UKR", name: "Ukraine" },
    { id: "POL", name: "Poland" },
    { id: "CZE", name: "Czech Republic" },
    { id: "AUT", name: "Austria" },
  ],
  K: [
    { id: "CRC", name: "Costa Rica" },
    { id: "HON", name: "Honduras" },
    { id: "JAM", name: "Jamaica" },
    { id: "SLV", name: "El Salvador" },
  ],
  L: [
    { id: "ECU", name: "Ecuador" },
    { id: "PER", name: "Peru" },
    { id: "CHI", name: "Chile" },
    { id: "PAR", name: "Paraguay" },
  ],
};

const TEAM_ELO_RATINGS: Record<string, number> = {
  MEX: 1650, USA: 1720, CAN: 1600, PAN: 1500,
  ARG: 2100, BRA: 2050, URU: 1900, COL: 1850,
  FRA: 2080, ENG: 2000, GER: 1920, ESP: 1980,
  POR: 1960, ITA: 1930, BEL: 1880, NED: 1940,
  CRO: 1890, MAR: 1870, SEN: 1680, JPN: 1800,
  KOR: 1720, AUS: 1670, KSA: 1550, IRN: 1660,
  SUI: 1780, DEN: 1790, SRB: 1700, CMR: 1580,
  GHA: 1560, EGY: 1640, NGA: 1690, ALG: 1630,
  TUN: 1610, CIV: 1650, SWE: 1820, NOR: 1790,
  UKR: 1760, POL: 1740, CZE: 1730, AUT: 1770,
  CRC: 1620, HON: 1540, JAM: 1580, SLV: 1500,
  ECU: 1810, PER: 1780, CHI: 1720, PAR: 1690,
};

// ────────── Mock Fixture Data ──────────

const MOCK_FIXTURES: NormalizedMatch[] = [
  {
    matchNumber: 1, providerId: "mock-m-1",
    homeTeamId: "MEX", awayTeamId: "USA",
    status: "Scheduled", stage: "Group", kickoffTime: new Date("2026-06-11T17:00:00Z"),
    venueName: "Estadio Azteca", venueCity: "Mexico City",
  },
  {
    matchNumber: 2, providerId: "mock-m-2",
    homeTeamId: "CAN", awayTeamId: "PAN",
    status: "Scheduled", stage: "Group", kickoffTime: new Date("2026-06-11T20:00:00Z"),
    venueName: "BC Place", venueCity: "Vancouver",
  },
  {
    matchNumber: 3, providerId: "mock-m-3",
    homeTeamId: "ARG", awayTeamId: "COL",
    status: "Scheduled", stage: "Group", kickoffTime: new Date("2026-06-12T17:00:00Z"),
    venueName: "Estadio Monumental", venueCity: "Buenos Aires",
  },
  {
    matchNumber: 4, providerId: "mock-m-4",
    homeTeamId: "BRA", awayTeamId: "URU",
    status: "Scheduled", stage: "Group", kickoffTime: new Date("2026-06-12T20:00:00Z"),
    venueName: "Maracana", venueCity: "Rio de Janeiro",
  },
  {
    matchNumber: 5, providerId: "mock-m-5",
    homeTeamId: "FRA", awayTeamId: "ESP",
    status: "Scheduled", stage: "Group", kickoffTime: new Date("2026-06-13T17:00:00Z"),
    venueName: "Stade de France", venueCity: "Paris",
  },
  {
    matchNumber: 6, providerId: "mock-m-6",
    homeTeamId: "ENG", awayTeamId: "GER",
    status: "Scheduled", stage: "Group", kickoffTime: new Date("2026-06-13T20:00:00Z"),
    venueName: "Wembley Stadium", venueCity: "London",
  },
];

// ────────── MockSyncProvider ──────────

export class MockSyncProvider {
  private replayStep = 0;

  async fetchTeams(): Promise<NormalizedTeam[]> {
    const teams: NormalizedTeam[] = [];
    for (const [groupName, members] of Object.entries(GROUP_TEAMS)) {
      for (const team of members) {
        teams.push({
          id: team.id,
          name: team.name,
          groupName,
          flagUrl: (() => {
            const mapping: Record<string, string> = {
              MEX: "mx", USA: "us", CAN: "ca", PAN: "pa", ARG: "ar", BRA: "br", URU: "uy", COL: "co",
              FRA: "fr", ENG: "gb-eng", GER: "de", ESP: "es", POR: "pt", ITA: "it", BEL: "be", NED: "nl",
              CRO: "hr", MAR: "ma", SEN: "sn", JPN: "jp", KOR: "kr", AUS: "au", KSA: "sa", IRN: "ir",
              SUI: "ch", DEN: "dk", SRB: "rs", CMR: "cm", GHA: "gh", EGY: "eg", NGA: "ng", ALG: "dz",
              TUN: "tn", CIV: "ci", SWE: "se", NOR: "no", UKR: "ua", POL: "pl", CZE: "cz", AUT: "at",
              CRC: "cr", HON: "hn", JAM: "jm", SLV: "sv", ECU: "ec", PER: "pe", CHI: "cl", PAR: "py"
            };
            const code = mapping[team.id];
            return code ? `https://flagcdn.com/w160/${code}.png` : "";
          })(),
          eloRating: TEAM_ELO_RATINGS[team.id] ?? 1500,
          providerId: `p-${team.id.toLowerCase()}`,
        });
      }
    }
    return teams;
  }

  async fetchSquads(teamId: string, _providerTeamId: string): Promise<NormalizedPlayer[]> {
    const names = COUNTRY_NAME_TEMPLATES[teamId] ?? FALLBACK_NAMES;
    const teamElo = TEAM_ELO_RATINGS[teamId] ?? 1500;
    const baseRating = teamElo / 25; // Scale ELO to a 40–95 influence baseline
    const players: NormalizedPlayer[] = [];

    // Position distribution: 3 GK, 8 DEF, 8 MID, 5+ FWD = 24-26 total
    const positions: ('Goalkeeper' | 'Defender' | 'Midfielder' | 'Forward')[] = [];
    for (let i = 0; i < 3; i++) positions.push('Goalkeeper');
    for (let i = 0; i < 8; i++) positions.push('Defender');
    for (let i = 0; i < 8; i++) positions.push('Midfielder');
    // Add between 5 and 7 forwards so total squad size is 24–26
    const forwardCount = 5 + Math.floor(Math.random() * 3);
    for (let i = 0; i < forwardCount; i++) positions.push('Forward');

    for (let i = 0; i < positions.length; i++) {
      const name = names[i % names.length] + (i >= names.length ? ` ${i + 1}` : "");
      // Influence score: base from team ELO + random offset (40–95 range)
      const influenceOffset = Math.floor(Math.random() * 31) - 15; // -15 to +15
      const influenceScore = Math.max(40, Math.min(95, Math.round(baseRating + influenceOffset)));

      players.push({
        providerId: `mock-p-${teamId.toLowerCase()}-${i + 1}`,
        name,
        position: positions[i],
        teamId,
        influenceScore,
      });
    }

    return players;
  }

  async fetchFixtures(): Promise<NormalizedMatch[]> {
    const fixtures = MOCK_FIXTURES.map((fixture, idx) => {
      let status: 'Scheduled' | 'Live' | 'Completed' = 'Scheduled';
      if (this.replayStep > idx + 1) {
        status = 'Completed';
      } else if (this.replayStep === idx + 1) {
        status = 'Live';
      }
      return { ...fixture, status };
    });
    return fixtures;
  }

  async fetchMatchStats(_matchId: number, _providerMatchId: string): Promise<NormalizedMatchStats> {
    const isCompleted = this.replayStep > 2;

    const homeTeamStats: NormalizedTeamStats = {
      possession: 55, shots: 12, shotsOnTarget: 5,
      passesAttempted: 450, passesCompleted: 390,
      corners: 4, fouls: 10, yellowCards: 1, redCards: 0,
      offsides: 2, expectedGoals: 1.8,
    };

    const awayTeamStats: NormalizedTeamStats = {
      possession: 45, shots: 8, shotsOnTarget: 3,
      passesAttempted: 380, passesCompleted: 310,
      corners: 3, fouls: 12, yellowCards: 2, redCards: 0,
      offsides: 1, expectedGoals: 0.9,
    };

    const events: NormalizedMatchEvent[] = isCompleted
      ? [
          { playerProviderId: "mock-p-arg-1", teamId: "ARG", eventType: "Goal" as const, minute: 23, extraTimeMinute: null, detail: null },
          { playerProviderId: "mock-p-col-1", teamId: "COL", eventType: "YellowCard" as const, minute: 45, extraTimeMinute: 2, detail: "Professional foul" },
          { playerProviderId: "mock-p-arg-3", teamId: "ARG", eventType: "Goal" as const, minute: 67, extraTimeMinute: null, detail: "Penalty" },
          { playerProviderId: "mock-p-col-2", teamId: "COL", eventType: "Goal" as const, minute: 82, extraTimeMinute: null, detail: "Header from corner" },
        ]
      : [];

    const playerPerformances: NormalizedPlayerPerformance[] = isCompleted
      ? [
          { playerProviderId: "mock-p-arg-1", playerName: "L. Messi", rating: 8.5, minutesPlayed: 90, goals: 1, assists: 1, yellowCards: 0, redCards: 0, shots: 4, shotsOnTarget: 3, passesAttempted: 45, passesCompleted: 41, tackles: 1, interceptions: 0, saves: null, goalsConceded: null, cleanSheet: null },
          { playerProviderId: "mock-p-arg-2", playerName: "J. Alvarez", rating: 7.2, minutesPlayed: 75, goals: 0, assists: 0, yellowCards: 0, redCards: 0, shots: 2, shotsOnTarget: 1, passesAttempted: 22, passesCompleted: 18, tackles: 2, interceptions: 1, saves: null, goalsConceded: null, cleanSheet: null },
          { playerProviderId: "mock-p-col-1", playerName: "J. Cuadrado", rating: 7.5, minutesPlayed: 90, goals: 1, assists: 0, yellowCards: 1, redCards: 0, shots: 3, shotsOnTarget: 2, passesAttempted: 38, passesCompleted: 32, tackles: 3, interceptions: 2, saves: null, goalsConceded: null, cleanSheet: null },
          { playerProviderId: "mock-p-arg-5", playerName: "E. Martinez", rating: 6.8, minutesPlayed: 90, goals: 0, assists: 0, yellowCards: 0, redCards: 0, shots: 0, shotsOnTarget: 0, passesAttempted: 18, passesCompleted: 15, tackles: 0, interceptions: 0, saves: 3, goalsConceded: 1, cleanSheet: 0 },
        ]
      : [];

    return {
      status: isCompleted ? "Completed" : "Live",
      homeScore: isCompleted ? 2 : 1,
      awayScore: isCompleted ? 1 : 0,
      teamStats: {
        home: homeTeamStats,
        away: awayTeamStats,
      },
      playerPerformances,
      events,
    };
  }

  /** Advance the mock replay step to simulate match progression. */
  advanceReplay(): void {
    this.replayStep++;
  }
}
