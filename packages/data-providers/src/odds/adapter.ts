import { OddsApiClient } from "./client.js";
import type { NormalizedOddsEntry, ImpliedProbabilities, MarketVsModelDiff } from "./types.js";

const SPORT_KEY = "soccer_world_cup";

export class OddsAdapter {
  private client: OddsApiClient;

  constructor(client?: OddsApiClient) {
    this.client = client ?? new OddsApiClient();
  }

  async fetchOdds(): Promise<NormalizedOddsEntry[]> {
    const events = await this.client.getOdds(SPORT_KEY);
    const entries: NormalizedOddsEntry[] = [];

    for (const event of events) {
      for (const bookmaker of event.bookmakers) {
        const h2hMarket = bookmaker.markets.find((m) => m.key === "h2h");
        if (!h2hMarket) continue;

        const homeOutcome = h2hMarket.outcomes.find(
          (o) => o.name === event.home_team,
        );
        const awayOutcome = h2hMarket.outcomes.find(
          (o) => o.name === event.away_team,
        );
        const drawOutcome = h2hMarket.outcomes.find(
          (o) => o.name !== event.home_team && o.name !== event.away_team,
        );

        if (!homeOutcome || !awayOutcome) continue;

        entries.push({
          matchId: 0,
          matchNumber: 0,
          homeTeamId: "",
          awayTeamId: "",
          homeTeamName: event.home_team,
          awayTeamName: event.away_team,
          bookmaker: bookmaker.title,
          homeOdds: homeOutcome.price,
          drawOdds: drawOutcome?.price ?? 0,
          awayOdds: awayOutcome.price,
          lastUpdate: new Date(bookmaker.last_update),
        });
      }
    }

    return entries;
  }

  static impliedProbabilities(
    homeOdds: number,
    drawOdds: number,
    awayOdds: number,
  ): ImpliedProbabilities {
    const homeImp = homeOdds > 0 ? 1 / homeOdds : 0;
    const drawImp = drawOdds > 0 ? 1 / drawOdds : 0;
    const awayImp = awayOdds > 0 ? 1 / awayOdds : 0;
    const total = homeImp + drawImp + awayImp;

    return {
      homeWin: total > 0 ? homeImp / total : 0,
      draw: total > 0 ? drawImp / total : 0,
      awayWin: total > 0 ? awayImp / total : 0,
      margin: total - 1,
    };
  }

  static marketVsModelDiff(
    matchId: number,
    matchNumber: number,
    homeTeamId: string,
    awayTeamId: string,
    homeOdds: number,
    drawOdds: number,
    awayOdds: number,
    modelHomeWin: number,
    modelDraw: number,
    modelAwayWin: number,
  ): MarketVsModelDiff {
    const market = this.impliedProbabilities(homeOdds, drawOdds, awayOdds);

    return {
      matchId,
      matchNumber,
      homeTeamId,
      awayTeamId,
      market: {
        homeWin: market.homeWin,
        draw: market.draw,
        awayWin: market.awayWin,
        margin: market.margin,
      },
      model: {
        homeWin: modelHomeWin,
        draw: modelDraw,
        awayWin: modelAwayWin,
      },
      diff: {
        homeWin: modelHomeWin - market.homeWin,
        draw: modelDraw - market.draw,
        awayWin: modelAwayWin - market.awayWin,
      },
      value: {
        homeWin:
          modelHomeWin > market.homeWin
            ? modelHomeWin / market.homeWin - 1
            : -(market.homeWin / modelHomeWin - 1),
        draw:
          modelDraw > market.draw
            ? modelDraw / market.draw - 1
            : -(market.draw / modelDraw - 1),
        awayWin:
          modelAwayWin > market.awayWin
            ? modelAwayWin / market.awayWin - 1
            : -(market.awayWin / modelAwayWin - 1),
      },
    };
  }
}
