import { useState } from "react";
import { gql, useQuery } from "@apollo/client";
import {
  Box,
  Card,
  CardContent,
  Chip,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
  Stack,
  Typography,
  Skeleton,
} from "@mui/material";
import { useNavigate } from "react-router-dom";

const MATCHES_QUERY = gql`
  query MatchList($stage: MatchStage, $limit: Int, $offset: Int) {
    matches(stage: $stage, limit: $limit, offset: $offset) {
      items {
        id
        kickoffTime
        stage
        status
        homeScore
        awayScore
        homeTeam {
          id
          name
          flagUrl
        }
        awayTeam {
          id
          name
          flagUrl
        }
        prediction {
          homeWin
          draw
          awayWin
          confidence
        }
      }
      pagination {
        total
      }
    }
  }
`;

const stageOptions = [
  { value: "", label: "All Stages" },
  { value: "Group", label: "Group Stage" },
  { value: "RoundOf32", label: "Round of 32" },
  { value: "RoundOf16", label: "Round of 16" },
  { value: "Quarterfinals", label: "Quarterfinals" },
  { value: "Semifinals", label: "Semifinals" },
  { value: "Final", label: "Final" },
];

function formatKickoff(kickoffTime: string) {
  return new Date(kickoffTime).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function MatchListItem({ match }: { match: any }) {
  const navigate = useNavigate();
  const winnerProb = match.prediction
    ? Math.max(match.prediction.homeWin, match.prediction.awayWin)
    : null;
  const isHomeFav =
    match.prediction && match.prediction.homeWin >= match.prediction.awayWin;

  return (
    <Card
      sx={{
        cursor: "pointer",
        transition: "transform 0.15s, box-shadow 0.15s",
        "&:hover": { transform: "translateY(-2px)", boxShadow: 4 },
      }}
      onClick={() => navigate(`/matches/${match.id}`)}
    >
      <CardContent>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          sx={{ mb: 1 }}
        >
          <Typography variant="caption" color="text.secondary">
            {match.stage.replace(/([A-Z])/g, " $1").trim()} &middot;{" "}
            {formatKickoff(match.kickoffTime)}
          </Typography>
          <Chip
            label={match.status}
            size="small"
            color={
              match.status === "Live"
                ? "error"
                : match.status === "Completed"
                  ? "success"
                  : "default"
            }
            variant="outlined"
          />
        </Stack>

        <Stack spacing={1}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Stack direction="row" alignItems="center" spacing={1}>
              {match.homeTeam?.flagUrl && (
                <Box
                  component="img"
                  src={match.homeTeam.flagUrl}
                  alt=""
                  sx={{ width: 22, height: 15, objectFit: "cover" }}
                />
              )}
              <Typography variant="body1" fontWeight={600}>
                {match.homeTeam?.name ?? "TBD"}
              </Typography>
            </Stack>
            <Typography variant="h6" fontWeight={700}>
              {match.status !== "Scheduled" ? match.homeScore ?? "-" : ""}
            </Typography>
          </Stack>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Stack direction="row" alignItems="center" spacing={1}>
              {match.awayTeam?.flagUrl && (
                <Box
                  component="img"
                  src={match.awayTeam.flagUrl}
                  alt=""
                  sx={{ width: 22, height: 15, objectFit: "cover" }}
                />
              )}
              <Typography variant="body1" fontWeight={600}>
                {match.awayTeam?.name ?? "TBD"}
              </Typography>
            </Stack>
            <Typography variant="h6" fontWeight={700}>
              {match.status !== "Scheduled" ? match.awayScore ?? "-" : ""}
            </Typography>
          </Stack>
        </Stack>

        {match.prediction && match.status === "Scheduled" && winnerProb !== null && (
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 1 }}>
            <Typography variant="caption" color="text.secondary">
              Predicted: {isHomeFav ? match.homeTeam?.name : match.awayTeam?.name} favored
              ({Math.round(winnerProb * 100)}%)
            </Typography>
            <Chip
              label={`${Math.round(match.prediction.confidence * 100)}% confidence`}
              size="small"
              color="primary"
              variant="outlined"
            />
          </Stack>
        )}
      </CardContent>
    </Card>
  );
}

export default function MatchList() {
  const [stage, setStage] = useState("");
  const { loading, error, data } = useQuery(MATCHES_QUERY, {
    variables: { stage: stage || undefined, limit: 300, offset: 0 },
  });

  const matches = data?.matches?.items ?? [];
  const total = data?.matches?.pagination?.total ?? 0;

  return (
    <Stack spacing={3}>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "stretch", sm: "center" }}
        spacing={2}
      >
        <Typography variant="h5" fontWeight={700}>
          Matches
          {total > 0 && (
            <Typography
              component="span"
              variant="body2"
              color="text.secondary"
              sx={{ ml: 1 }}
            >
              ({total} total)
            </Typography>
          )}
        </Typography>
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>Stage</InputLabel>
          <Select
            value={stage}
            label="Stage"
            onChange={(e: SelectChangeEvent) => setStage(e.target.value)}
          >
            {stageOptions.map((opt) => (
              <MenuItem key={opt.value} value={opt.value}>
                {opt.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Stack>

      {loading && (
        <Grid container spacing={2}>
          {[1, 2, 3, 4].map((i) => (
            <Grid item xs={12} key={i}>
              <Skeleton variant="rounded" height={120} />
            </Grid>
          ))}
        </Grid>
      )}

      {error && (
        <Typography color="error">
          Failed to load matches: {error.message}
        </Typography>
      )}

      {!loading && !error && matches.length === 0 && (
        <Typography color="text.secondary" sx={{ py: 4, textAlign: "center" }}>
          No matches found for the selected filter.
        </Typography>
      )}

      {!loading && !error && (
        <Stack spacing={2}>
          {matches.map((match: any) => (
            <MatchListItem key={match.id} match={match} />
          ))}
        </Stack>
      )}
    </Stack>
  );
}
