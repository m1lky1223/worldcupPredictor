import type { GraphQLResolveInfo, GraphQLScalarType, GraphQLScalarTypeConfig } from 'graphql';
import type { GraphQLContext } from '@worldcup/domain';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
export type RequireFields<T, K extends keyof T> = Omit<T, K> & { [P in K]-?: NonNullable<T[P]> };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  JSON: { input: any; output: any; }
};

export type Factor = {
  __typename?: 'Factor';
  factor: Scalars['String']['output'];
  weight: Scalars['Float']['output'];
};

export type GroupStandingEntry = {
  __typename?: 'GroupStandingEntry';
  drawn: Scalars['Int']['output'];
  eliminated: Scalars['Boolean']['output'];
  goalDifference: Scalars['Int']['output'];
  goalsAgainst: Scalars['Int']['output'];
  goalsFor: Scalars['Int']['output'];
  lost: Scalars['Int']['output'];
  played: Scalars['Int']['output'];
  points: Scalars['Int']['output'];
  position: Scalars['Int']['output'];
  qualified: Scalars['Boolean']['output'];
  team: Team;
  won: Scalars['Int']['output'];
};

export type GroupStandings = {
  __typename?: 'GroupStandings';
  groupName: Scalars['String']['output'];
  standings: Array<GroupStandingEntry>;
};

export type Match = {
  __typename?: 'Match';
  awayScore?: Maybe<Scalars['Int']['output']>;
  awayTeam?: Maybe<Team>;
  homeScore?: Maybe<Scalars['Int']['output']>;
  homeTeam?: Maybe<Team>;
  id: Scalars['ID']['output'];
  kickoffTime: Scalars['String']['output'];
  matchNumber: Scalars['Int']['output'];
  odds?: Maybe<Array<OddsEntry>>;
  prediction?: Maybe<Prediction>;
  stage: MatchStage;
  status: MatchStatus;
};

export type MatchConnection = {
  __typename?: 'MatchConnection';
  items: Array<Match>;
  pagination: PaginationInfo;
};

export enum MatchStage {
  Final = 'Final',
  Group = 'Group',
  Quarterfinals = 'Quarterfinals',
  RoundOf16 = 'RoundOf16',
  RoundOf32 = 'RoundOf32',
  Semifinals = 'Semifinals'
}

export enum MatchStatus {
  Completed = 'Completed',
  Live = 'Live',
  Scheduled = 'Scheduled'
}

export type ModelMetrics = {
  __typename?: 'ModelMetrics';
  accuracy: Scalars['Float']['output'];
  brierScore: Scalars['Float']['output'];
  calculatedAt: Scalars['String']['output'];
  calibration: Scalars['JSON']['output'];
  logLoss: Scalars['Float']['output'];
  modelVersion: Scalars['String']['output'];
};

export type OddsEntry = {
  __typename?: 'OddsEntry';
  awayOdds: Scalars['Float']['output'];
  bookmaker: Scalars['String']['output'];
  drawOdds: Scalars['Float']['output'];
  homeOdds: Scalars['Float']['output'];
  matchId: Scalars['ID']['output'];
  updatedAt: Scalars['String']['output'];
};

export type PaginationInfo = {
  __typename?: 'PaginationInfo';
  limit: Scalars['Int']['output'];
  offset: Scalars['Int']['output'];
  total: Scalars['Int']['output'];
};

export type Player = {
  __typename?: 'Player';
  id: Scalars['ID']['output'];
  influenceScore: Scalars['Int']['output'];
  name: Scalars['String']['output'];
  position: PlayerPosition;
  team: Team;
};

export type PlayerConnection = {
  __typename?: 'PlayerConnection';
  items: Array<Player>;
  pagination: PaginationInfo;
};

export enum PlayerPosition {
  Defender = 'Defender',
  Forward = 'Forward',
  Goalkeeper = 'Goalkeeper',
  Midfielder = 'Midfielder'
}

export type Prediction = {
  __typename?: 'Prediction';
  awayWin: Scalars['Float']['output'];
  confidence: Scalars['Float']['output'];
  createdAt: Scalars['String']['output'];
  draw: Scalars['Float']['output'];
  factors: Array<Factor>;
  homeWin: Scalars['Float']['output'];
};

export type Query = {
  __typename?: 'Query';
  groupStandings: Array<GroupStandings>;
  match?: Maybe<Match>;
  matches: MatchConnection;
  modelMetrics?: Maybe<ModelMetrics>;
  player?: Maybe<Player>;
  players: PlayerConnection;
  team?: Maybe<Team>;
  teams: Array<Team>;
  venue?: Maybe<Venue>;
  venues: Array<Venue>;
};


export type QueryGroupStandingsArgs = {
  groupName?: InputMaybe<Scalars['String']['input']>;
};


export type QueryMatchArgs = {
  id: Scalars['ID']['input'];
};


export type QueryMatchesArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  stage?: InputMaybe<MatchStage>;
};


export type QueryPlayerArgs = {
  id: Scalars['ID']['input'];
};


export type QueryPlayersArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryTeamArgs = {
  id: Scalars['ID']['input'];
};


export type QueryVenueArgs = {
  id: Scalars['ID']['input'];
};

export type Team = {
  __typename?: 'Team';
  eloRating: Scalars['Int']['output'];
  flagUrl?: Maybe<Scalars['String']['output']>;
  groupName: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
};

export type Venue = {
  __typename?: 'Venue';
  city: Scalars['String']['output'];
  country: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
};

export type WithIndex<TObject> = TObject & Record<string, any>;
export type ResolversObject<TObject> = WithIndex<TObject>;

export type ResolverTypeWrapper<T> = Promise<T> | T;


export type ResolverWithResolve<TResult, TParent, TContext, TArgs> = {
  resolve: ResolverFn<TResult, TParent, TContext, TArgs>;
};
export type Resolver<TResult, TParent = {}, TContext = {}, TArgs = {}> = ResolverFn<TResult, TParent, TContext, TArgs> | ResolverWithResolve<TResult, TParent, TContext, TArgs>;

export type ResolverFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => Promise<TResult> | TResult;

export type SubscriptionSubscribeFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => AsyncIterable<TResult> | Promise<AsyncIterable<TResult>>;

export type SubscriptionResolveFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => TResult | Promise<TResult>;

export interface SubscriptionSubscriberObject<TResult, TKey extends string, TParent, TContext, TArgs> {
  subscribe: SubscriptionSubscribeFn<{ [key in TKey]: TResult }, TParent, TContext, TArgs>;
  resolve?: SubscriptionResolveFn<TResult, { [key in TKey]: TResult }, TContext, TArgs>;
}

export interface SubscriptionResolverObject<TResult, TParent, TContext, TArgs> {
  subscribe: SubscriptionSubscribeFn<any, TParent, TContext, TArgs>;
  resolve: SubscriptionResolveFn<TResult, any, TContext, TArgs>;
}

export type SubscriptionObject<TResult, TKey extends string, TParent, TContext, TArgs> =
  | SubscriptionSubscriberObject<TResult, TKey, TParent, TContext, TArgs>
  | SubscriptionResolverObject<TResult, TParent, TContext, TArgs>;

export type SubscriptionResolver<TResult, TKey extends string, TParent = {}, TContext = {}, TArgs = {}> =
  | ((...args: any[]) => SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>)
  | SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>;

export type TypeResolveFn<TTypes, TParent = {}, TContext = {}> = (
  parent: TParent,
  context: TContext,
  info: GraphQLResolveInfo
) => Maybe<TTypes> | Promise<Maybe<TTypes>>;

export type IsTypeOfResolverFn<T = {}, TContext = {}> = (obj: T, context: TContext, info: GraphQLResolveInfo) => boolean | Promise<boolean>;

export type NextResolverFn<T> = () => Promise<T>;

export type DirectiveResolverFn<TResult = {}, TParent = {}, TContext = {}, TArgs = {}> = (
  next: NextResolverFn<TResult>,
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => TResult | Promise<TResult>;



/** Mapping between all available schema types and the resolvers types */
export type ResolversTypes = ResolversObject<{
  Boolean: ResolverTypeWrapper<Scalars['Boolean']['output']>;
  Factor: ResolverTypeWrapper<Factor>;
  Float: ResolverTypeWrapper<Scalars['Float']['output']>;
  GroupStandingEntry: ResolverTypeWrapper<GroupStandingEntry>;
  GroupStandings: ResolverTypeWrapper<GroupStandings>;
  ID: ResolverTypeWrapper<Scalars['ID']['output']>;
  Int: ResolverTypeWrapper<Scalars['Int']['output']>;
  JSON: ResolverTypeWrapper<Scalars['JSON']['output']>;
  Match: ResolverTypeWrapper<Match>;
  MatchConnection: ResolverTypeWrapper<MatchConnection>;
  MatchStage: MatchStage;
  MatchStatus: MatchStatus;
  ModelMetrics: ResolverTypeWrapper<ModelMetrics>;
  OddsEntry: ResolverTypeWrapper<OddsEntry>;
  PaginationInfo: ResolverTypeWrapper<PaginationInfo>;
  Player: ResolverTypeWrapper<Player>;
  PlayerConnection: ResolverTypeWrapper<PlayerConnection>;
  PlayerPosition: PlayerPosition;
  Prediction: ResolverTypeWrapper<Prediction>;
  Query: ResolverTypeWrapper<{}>;
  String: ResolverTypeWrapper<Scalars['String']['output']>;
  Team: ResolverTypeWrapper<Team>;
  Venue: ResolverTypeWrapper<Venue>;
}>;

/** Mapping between all available schema types and the resolvers parents */
export type ResolversParentTypes = ResolversObject<{
  Boolean: Scalars['Boolean']['output'];
  Factor: Factor;
  Float: Scalars['Float']['output'];
  GroupStandingEntry: GroupStandingEntry;
  GroupStandings: GroupStandings;
  ID: Scalars['ID']['output'];
  Int: Scalars['Int']['output'];
  JSON: Scalars['JSON']['output'];
  Match: Match;
  MatchConnection: MatchConnection;
  ModelMetrics: ModelMetrics;
  OddsEntry: OddsEntry;
  PaginationInfo: PaginationInfo;
  Player: Player;
  PlayerConnection: PlayerConnection;
  Prediction: Prediction;
  Query: {};
  String: Scalars['String']['output'];
  Team: Team;
  Venue: Venue;
}>;

export type FactorResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['Factor'] = ResolversParentTypes['Factor']> = ResolversObject<{
  factor?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  weight?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type GroupStandingEntryResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['GroupStandingEntry'] = ResolversParentTypes['GroupStandingEntry']> = ResolversObject<{
  drawn?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  eliminated?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  goalDifference?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  goalsAgainst?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  goalsFor?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  lost?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  played?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  points?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  position?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  qualified?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  team?: Resolver<ResolversTypes['Team'], ParentType, ContextType>;
  won?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type GroupStandingsResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['GroupStandings'] = ResolversParentTypes['GroupStandings']> = ResolversObject<{
  groupName?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  standings?: Resolver<Array<ResolversTypes['GroupStandingEntry']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export interface JsonScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['JSON'], any> {
  name: 'JSON';
}

export type MatchResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['Match'] = ResolversParentTypes['Match']> = ResolversObject<{
  awayScore?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  awayTeam?: Resolver<Maybe<ResolversTypes['Team']>, ParentType, ContextType>;
  homeScore?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  homeTeam?: Resolver<Maybe<ResolversTypes['Team']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  kickoffTime?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  matchNumber?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  odds?: Resolver<Maybe<Array<ResolversTypes['OddsEntry']>>, ParentType, ContextType>;
  prediction?: Resolver<Maybe<ResolversTypes['Prediction']>, ParentType, ContextType>;
  stage?: Resolver<ResolversTypes['MatchStage'], ParentType, ContextType>;
  status?: Resolver<ResolversTypes['MatchStatus'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type MatchConnectionResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['MatchConnection'] = ResolversParentTypes['MatchConnection']> = ResolversObject<{
  items?: Resolver<Array<ResolversTypes['Match']>, ParentType, ContextType>;
  pagination?: Resolver<ResolversTypes['PaginationInfo'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type ModelMetricsResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['ModelMetrics'] = ResolversParentTypes['ModelMetrics']> = ResolversObject<{
  accuracy?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  brierScore?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  calculatedAt?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  calibration?: Resolver<ResolversTypes['JSON'], ParentType, ContextType>;
  logLoss?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  modelVersion?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type OddsEntryResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['OddsEntry'] = ResolversParentTypes['OddsEntry']> = ResolversObject<{
  awayOdds?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  bookmaker?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  drawOdds?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  homeOdds?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  matchId?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type PaginationInfoResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['PaginationInfo'] = ResolversParentTypes['PaginationInfo']> = ResolversObject<{
  limit?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  offset?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  total?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type PlayerResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['Player'] = ResolversParentTypes['Player']> = ResolversObject<{
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  influenceScore?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  position?: Resolver<ResolversTypes['PlayerPosition'], ParentType, ContextType>;
  team?: Resolver<ResolversTypes['Team'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type PlayerConnectionResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['PlayerConnection'] = ResolversParentTypes['PlayerConnection']> = ResolversObject<{
  items?: Resolver<Array<ResolversTypes['Player']>, ParentType, ContextType>;
  pagination?: Resolver<ResolversTypes['PaginationInfo'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type PredictionResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['Prediction'] = ResolversParentTypes['Prediction']> = ResolversObject<{
  awayWin?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  confidence?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  draw?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  factors?: Resolver<Array<ResolversTypes['Factor']>, ParentType, ContextType>;
  homeWin?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type QueryResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['Query'] = ResolversParentTypes['Query']> = ResolversObject<{
  groupStandings?: Resolver<Array<ResolversTypes['GroupStandings']>, ParentType, ContextType, Partial<QueryGroupStandingsArgs>>;
  match?: Resolver<Maybe<ResolversTypes['Match']>, ParentType, ContextType, RequireFields<QueryMatchArgs, 'id'>>;
  matches?: Resolver<ResolversTypes['MatchConnection'], ParentType, ContextType, Partial<QueryMatchesArgs>>;
  modelMetrics?: Resolver<Maybe<ResolversTypes['ModelMetrics']>, ParentType, ContextType>;
  player?: Resolver<Maybe<ResolversTypes['Player']>, ParentType, ContextType, RequireFields<QueryPlayerArgs, 'id'>>;
  players?: Resolver<ResolversTypes['PlayerConnection'], ParentType, ContextType, Partial<QueryPlayersArgs>>;
  team?: Resolver<Maybe<ResolversTypes['Team']>, ParentType, ContextType, RequireFields<QueryTeamArgs, 'id'>>;
  teams?: Resolver<Array<ResolversTypes['Team']>, ParentType, ContextType>;
  venue?: Resolver<Maybe<ResolversTypes['Venue']>, ParentType, ContextType, RequireFields<QueryVenueArgs, 'id'>>;
  venues?: Resolver<Array<ResolversTypes['Venue']>, ParentType, ContextType>;
}>;

export type TeamResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['Team'] = ResolversParentTypes['Team']> = ResolversObject<{
  eloRating?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  flagUrl?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  groupName?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type VenueResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['Venue'] = ResolversParentTypes['Venue']> = ResolversObject<{
  city?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  country?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type Resolvers<ContextType = GraphQLContext> = ResolversObject<{
  Factor?: FactorResolvers<ContextType>;
  GroupStandingEntry?: GroupStandingEntryResolvers<ContextType>;
  GroupStandings?: GroupStandingsResolvers<ContextType>;
  JSON?: GraphQLScalarType;
  Match?: MatchResolvers<ContextType>;
  MatchConnection?: MatchConnectionResolvers<ContextType>;
  ModelMetrics?: ModelMetricsResolvers<ContextType>;
  OddsEntry?: OddsEntryResolvers<ContextType>;
  PaginationInfo?: PaginationInfoResolvers<ContextType>;
  Player?: PlayerResolvers<ContextType>;
  PlayerConnection?: PlayerConnectionResolvers<ContextType>;
  Prediction?: PredictionResolvers<ContextType>;
  Query?: QueryResolvers<ContextType>;
  Team?: TeamResolvers<ContextType>;
  Venue?: VenueResolvers<ContextType>;
}>;

