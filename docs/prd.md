# 2026 World Cup Predictor - Product Requirements

## 1. Overview

Build a web application that predicts 2026 FIFA World Cup match outcomes and updates those predictions as the tournament unfolds.

The product should help users understand:

- Who is likely to win each match.
- How confident the prediction is.
- What factors are influencing the prediction.
- How teams and players are trending during the tournament.
- How the model compares with the betting market.
- How accurate the model has been over time.

Important date context:

- Current planning date: June 7, 2026.
- The tournament starts on June 11, 2026 in Mexico local time.
- The opener is Friday, June 12, 2026 in Australia/Melbourne time.

## 2. Product Goals

- Provide clear, explainable predictions for every 2026 World Cup fixture.
- Give users a live tournament dashboard for matches, scores, predictions, groups, and rating changes.
- Track team and player performance after every completed match.
- Recalculate future predictions as new tournament data becomes available.
- Compare model predictions with betting-market implied probabilities.
- Show whether the model is improving or underperforming over time.
- Make the app useful on both desktop and mobile during live match days.

## 3. Non-Goals

- The product is not gambling advice.
- The MVP will not require users to understand the prediction model internals.
- The MVP will not require user accounts unless saved picks or private groups are explicitly added.
- The MVP will not include sportsbook scraping.
- The MVP will not optimize for fantasy football, club football, or non-World Cup competitions.
- The MVP will not include a public marketplace or paid subscription flow.

## 4. Target Users

- Football fans who want smarter match predictions.
- Users running informal tipping or predictor games.
- Data-curious users who want to understand team strength, player form, and odds movement.
- Casual fans who want quick context before watching a match.
- Future optional users: private groups that want saved picks and leaderboards.

## 5. User Needs

Users need to know:

- Which matches are happening today and soon.
- What the model predicts for each match.
- Why the model favors one team over another.
- How injuries, lineups, player form, or recent results affect predictions.
- How group standings and knockout qualification chances are changing.
- Whether the model agrees or disagrees with the betting market.
- How well the model has performed so far.

## 6. Core Product Experience

The app should open directly to a tournament dashboard, not a marketing page.

The dashboard should answer:

- What is happening today?
- What should I watch next?
- Which teams are rising or falling?
- Which predictions changed after the latest results?
- Where does the model disagree with the market?

Each match should answer:

- Who is likely to win?
- What is the win/draw/loss probability?
- How confident is the model?
- What changed since the previous prediction?
- Which players or team factors are driving the prediction?
- How does the prediction compare to the market?

## 7. MVP Scope

### 7.1 Dashboard

The dashboard must show:

- Today's matches.
- Upcoming matches.
- Recently completed matches.
- Current model predictions.
- Key rating changes.
- Group table highlights.
- Player form movers.
- Model performance summary.

### 7.2 Matches

The match list must show:

- All fixtures.
- Kickoff time.
- Teams.
- Venue.
- Group or knockout round.
- Match status.
- Score when available.
- Model prediction.
- Market comparison when available.

### 7.3 Match Detail

Each match detail page must show:

- Match overview.
- Win/draw/loss probabilities.
- Confidence level.
- Team comparison.
- Key prediction factors.
- Likely or confirmed lineups when available.
- Important player availability notes when available.
- Market odds comparison when available.
- Post-match summary after completion.

### 7.4 Teams

The team section must show:

- Ranking of all 48 teams by current model rating.
- Baseline rating.
- Tournament-adjusted rating.
- Recent form.
- Group position.
- Qualification or progression probability where applicable.
- Team profile pages with squad and match history.

### 7.5 Players

The player section must show:

- Player leaderboard.
- Team.
- Position.
- Minutes played.
- Goals.
- Assists.
- Cards.
- Match rating or performance score when available.
- Current form score.
- Player profile pages with match-by-match performance.

### 7.6 Groups

The groups section must show:

- Group tables.
- Points.
- Wins, draws, losses.
- Goals for and against.
- Goal difference.
- Remaining fixtures.
- Projected qualification probabilities when available.

### 7.7 Bracket

The bracket section must show:

- Knockout-stage structure.
- Confirmed teams once known.
- Placeholder teams before qualification is settled.
- Projected advancement probabilities when available.

### 7.8 Model Tracker

The model tracker must show:

- Prediction accuracy.
- Brier score.
- Log loss.
- Calibration summary.
- Comparison against betting-market probabilities.

## 8. Prediction Product Requirements

Predictions must include:

- Team A win probability.
- Draw probability.
- Team B win probability.
- Confidence indicator.
- Prediction timestamp.
- Explanation factors.
- Previous prediction comparison when available.

Prediction explanations should be understandable to non-technical users. Examples:

- "Team strength edge"
- "Stronger expected starting XI"
- "Recent form improved after last match"
- "Key player unavailable"
- "Market moved toward this team"

The product must preserve old predictions so users can see how expectations changed over time.

## 9. Post-Match Update Requirements

After a match finishes, the product must update:

- Final score.
- Match status.
- Group standings.
- Player performance.
- Team performance.
- Team ratings.
- Player form scores.
- Future match predictions.
- Bracket or qualification projections.
- Model accuracy metrics.

Target freshness:

- Predictions should update within 5 minutes of the match being marked final by the chosen data source.

The UI should make important changes visible, such as:

- Team rating increase or decrease.
- Player form movement.
- Group qualification probability changes.
- Prediction changes for upcoming matches.

## 10. Odds and Market Comparison

The product should show betting-market information only as market context.

The app should show:

- Bookmaker or market source.
- Latest available odds.
- Implied probabilities.
- Difference between model probability and market probability.
- Odds movement over time when available.

The product must avoid language that encourages gambling behavior.

Open product decision:

- Decide whether market odds influence the model or are displayed only as comparison.

## 11. Data Expectations

The product needs data for:

- Fixtures.
- Teams.
- Groups.
- Venues.
- Squads.
- Players.
- Match status.
- Scores.
- Lineups.
- Player match performance.
- Team match performance.
- Rankings or baseline team strength.
- Betting-market odds.

Known possible sources to evaluate:

- FIFA official schedule and squad information.
- BALLDONTLIE FIFA API.
- API-Football / API-SPORTS.
- Sportmonks.
- FIFA rankings or national-team Elo ratings.
- The Odds API.
- TheStatsAPI.
- Betfair Exchange API.

The product should tolerate missing player-level data by falling back to team-level predictions.

## 12. UX Principles

- The first screen should be useful immediately.
- Prioritize live tournament utility over marketing copy.
- Make predictions easy to scan.
- Make explanations concise and human-readable.
- Support both casual fans and data-curious users.
- Avoid overwhelming users with raw statistics unless they open a detail view.
- Make mobile views first-class.
- Avoid presenting predictions as certainty.

## 13. Success Metrics

Product usage:

- Daily active users during tournament.
- Return visits after completed matches.
- Match detail views.
- Team profile views.
- Player profile views.
- Model tracker views.

Engagement:

- Prediction comparisons viewed.
- Bracket views.
- Group table views.
- Shares if sharing is added.
- Saved picks if accounts are added.

Data freshness:

- Time from match final to updated predictions.
- Percentage of matches with complete player performance data.
- Percentage of matches with current market odds.

Model performance:

- Outcome accuracy.
- Brier score.
- Log loss.
- Calibration quality.
- Performance compared with market probabilities.

## 14. Risks

- Data providers may have incomplete or delayed player-level stats.
- Final squad, injury, and lineup data may vary across providers.
- Betting odds availability may depend on region, licensing, or pricing.
- Player performance ratings may be noisy in a short tournament.
- Users may misinterpret predictions as certainty.
- If the model overreacts to one match, prediction quality may suffer.
- If odds are included too prominently, the product may feel betting-first rather than football-first.

## 15. Open Product Decisions

- Should the product include user accounts in v1?
- Should users be able to save picks?
- Should users be able to create private groups or leaderboards?
- Should market odds be used in the prediction model or shown only as comparison?
- How prominently should odds be displayed?
- Should the product include notifications or alerts?
- Should the product support sharing match predictions?
- Should the product show detailed model metrics to all users or only in a dedicated advanced section?
- What is the minimum acceptable player data coverage for launch?

## 16. Launch Criteria

The MVP is launch-ready when:

- All fixtures are visible.
- All teams and groups are visible.
- Match predictions exist for scheduled matches.
- Completed matches update results and group tables.
- Future predictions recalculate after completed matches.
- Team rankings update during the tournament.
- Player performance is shown when available.
- Odds comparison is shown when available.
- Model tracker shows basic accuracy metrics.
- The app works well on mobile and desktop.
- The product includes clear language that predictions are informational, not gambling advice.
