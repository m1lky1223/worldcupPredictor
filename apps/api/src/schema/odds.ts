import { desc, eq, and } from "drizzle-orm";
import { schemas } from "@worldcup/domain";
import type { GraphQLContext } from "@worldcup/domain";

function impliedProbabilities(
  homeOdds: number,
  drawOdds: number,
  awayOdds: number,
): { homeWin: number; draw: number; awayWin: number; margin: number } {
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

export const typeDefs = `#graphql
  type ImpliedOdds {
    homeWin: Float!
    draw: Float!
    awayWin: Float!
    margin: Float!
  }

  type MarketVsModelDiff {
    matchId: ID!
    matchNumber: Int!
    homeTeam: Team!
    awayTeam: Team!
    market: ImpliedOdds!
    model: PredictionProbabilities!
    diff: PredictionProbabilities!
    value: PredictionProbabilities!
  }

  type PredictionProbabilities {
    homeWin: Float!
    draw: Float!
    awayWin: Float!
  }

  extend type OddsEntry {
    implied: ImpliedOdds!
  }

  extend type Query {
    marketVsModel(matchId: ID): [MarketVsModelDiff!]!
  }
`;

export const resolvers = {
  OddsEntry: {
    implied: (parent: {
      homeOdds: number;
      drawOdds: number;
      awayOdds: number;
    }) => {
      return impliedProbabilities(
        parent.homeOdds,
        parent.drawOdds,
        parent.awayOdds,
      );
    },
  },

  Query: {
    marketVsModel: async (
      _parent: unknown,
      args: { matchId?: string | null },
      context: GraphQLContext,
    ) => {
      const where = args.matchId
        ? eq(schemas.matches.id, Number(args.matchId))
        : and(eq(schemas.matches.status, "Scheduled"));

      const matches = await context.db
        .select()
        .from(schemas.matches)
        .where(where)
        .orderBy(schemas.matches.kickoffTime)
        .limit(20);

      const results: any[] = [];

      for (const match of matches) {
        const [oddsRow] = await context.db
          .select()
          .from(schemas.oddsHistory)
          .where(eq(schemas.oddsHistory.matchId, match.id))
          .orderBy(desc(schemas.oddsHistory.createdAt))
          .limit(1);

        if (!oddsRow) continue;

        const [prediction] = await context.db
          .select()
          .from(schemas.predictions)
          .where(eq(schemas.predictions.matchId, match.id))
          .orderBy(desc(schemas.predictions.createdAt))
          .limit(1);

        if (!prediction) continue;

        const [homeTeam] = await context.db
          .select()
          .from(schemas.teams)
          .where(eq(schemas.teams.id, match.homeTeamId!))
          .limit(1);

        const [awayTeam] = await context.db
          .select()
          .from(schemas.teams)
          .where(eq(schemas.teams.id, match.awayTeamId!))
          .limit(1);

        if (!homeTeam || !awayTeam) continue;

        const market = impliedProbabilities(
          oddsRow.homeOdds,
          oddsRow.drawOdds,
          oddsRow.awayOdds,
        );

        results.push({
          matchId: match.id,
          matchNumber: match.matchNumber,
          homeTeam,
          awayTeam,
          market: {
            homeWin: market.homeWin,
            draw: market.draw,
            awayWin: market.awayWin,
            margin: market.margin,
          },
          model: {
            homeWin: prediction.homeWin,
            draw: prediction.draw,
            awayWin: prediction.awayWin,
          },
          diff: {
            homeWin: prediction.homeWin - market.homeWin,
            draw: prediction.draw - market.draw,
            awayWin: prediction.awayWin - market.awayWin,
          },
          value: {
            homeWin:
              prediction.homeWin > market.homeWin
                ? prediction.homeWin / market.homeWin - 1
                : -(market.homeWin / prediction.homeWin - 1),
            draw:
              prediction.draw > market.draw
                ? prediction.draw / market.draw - 1
                : -(market.draw / prediction.draw - 1),
            awayWin:
              prediction.awayWin > market.awayWin
                ? prediction.awayWin / market.awayWin - 1
                : -(market.awayWin / prediction.awayWin - 1),
          },
        });
      }

      return results;
    },
  },
};
