import React from "react";
import { gql, useQuery } from "@apollo/client";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Grid,
  LinearProgress,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Skeleton,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

const MATCH_DETAIL_QUERY = gql`
  query MatchDetail($id: ID!) {
    match(id: $id) {
      id
      kickoffTime
      stage
      status
      matchNumber
      homeScore
      awayScore
      homeTeam {
        id
        name
        flagUrl
        eloRating
        groupName
      }
      awayTeam {
        id
        name
        flagUrl
        eloRating
        groupName
      }
      prediction {
        homeWin
        draw
        awayWin
        confidence
        factors {
          factor
          weight
        }
        createdAt
      }
      odds {
        bookmaker
        homeOdds
        drawOdds
        awayOdds
        updatedAt
      }
    }
  }
`;

function ProbabilityBar({
  homeWin,
  draw,
  awayWin,
}: {
  homeWin: number;
  draw: number;
  awayWin: number;
}) {
  const homePct = Math.round(homeWin * 100);
  const drawPct = Math.round(draw * 100);
  const awayPct = Math.round(awayWin * 100);

  return (
    <Box sx={{ width: "100%" }}>
      <Stack
        direction="row"
        sx={{ height: 32, borderRadius: 1, overflow: "hidden" }}
      >
        <Box
          sx={{
            width: `${homePct}%`,
            bgcolor: "success.main",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minWidth: homePct > 0 ? "fit-content" : 0,
            px: 0.5,
          }}
        >
          <Typography variant="caption" fontWeight={700} color="#fff">
            {homePct}%
          </Typography>
        </Box>
        <Box
          sx={{
            width: `${drawPct}%`,
            bgcolor: "warning.main",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minWidth: drawPct > 0 ? "fit-content" : 0,
            px: 0.5,
          }}
        >
          <Typography variant="caption" fontWeight={700} color="#000">
            {drawPct}%
          </Typography>
        </Box>
        <Box
          sx={{
            width: `${awayPct}%`,
            bgcolor: "info.main",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minWidth: awayPct > 0 ? "fit-content" : 0,
            px: 0.5,
          }}
        >
          <Typography variant="caption" fontWeight={700} color="#fff">
            {awayPct}%
          </Typography>
        </Box>
      </Stack>
      <Stack direction="row" justifyContent="space-between" sx={{ mt: 0.5 }}>
        <Typography variant="caption" color="success.main" fontWeight={600}>
          Home Win
        </Typography>
        <Typography variant="caption" color="warning.main" fontWeight={600}>
          Draw
        </Typography>
        <Typography variant="caption" color="info.main" fontWeight={600}>
          Away Win
        </Typography>
      </Stack>
    </Box>
  );
}

export default function MatchDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { loading, error, data } = useQuery(MATCH_DETAIL_QUERY, {
    variables: { id },
    skip: !id,
  });

  if (loading) {
    return (
      <Stack spacing={3}>
        <Skeleton variant="rounded" height={200} />
        <Skeleton variant="rounded" height={300} />
      </Stack>
    );
  }

  if (error) {
    return (
      <Stack spacing={2}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate("/matches")}
        >
          Back to Matches
        </Button>
        <Typography color="error">
          Failed to load match: {error.message}
        </Typography>
      </Stack>
    );
  }

  const match = data?.match;
  if (!match) {
    return (
      <Stack spacing={2}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate("/matches")}
        >
          Back to Matches
        </Button>
        <Typography>Match not found.</Typography>
      </Stack>
    );
  }

  const kickoff = new Date(match.kickoffTime).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <Stack spacing={3}>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate("/matches")}
        sx={{ alignSelf: "flex-start" }}
      >
        Back to Matches
      </Button>

      <Card>
        <CardContent>
          <Stack spacing={2}>
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
            >
              <Typography variant="overline" color="text.secondary">
                Match #{match.matchNumber} &middot;{" "}
                {match.stage.replace(/([A-Z])/g, " $1").trim()}
              </Typography>
              <Chip
                label={match.status}
                color={
                  match.status === "Live"
                    ? "error"
                    : match.status === "Completed"
                      ? "success"
                      : "default"
                }
              />
            </Stack>

            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={5} textAlign={{ xs: "left", sm: "right" }}>
                <Stack
                  direction="row"
                  spacing={1}
                  alignItems="center"
                  justifyContent={{ xs: "flex-start", sm: "flex-end" }}
                >
                  <Box sx={{ textAlign: "right" }}>
                    <Typography
                      variant="h5"
                      fontWeight={700}
                      component="button"
                      onClick={() => navigate(`/teams/${match.homeTeam?.id}`)}
                      sx={{
                        background: "none",
                        border: "none",
                        color: "inherit",
                        cursor: "pointer",
                        "&:hover": { color: "primary.main" },
                      }}
                    >
                      {match.homeTeam?.name ?? "TBD"}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block">
                      Elo: {match.homeTeam?.eloRating ?? "-"} &middot;{" "}
                      {match.homeTeam?.groupName ?? ""}
                    </Typography>
                  </Box>
                  {match.homeTeam?.flagUrl && (
                    <Box
                      component="img"
                      src={match.homeTeam.flagUrl}
                      alt=""
                      sx={{ width: 32, height: 21, objectFit: "cover" }}
                    />
                  )}
                </Stack>
              </Grid>

              <Grid item xs={12} sm={2} textAlign="center">
                <Typography variant="h3" fontWeight={700}>
                  {match.status !== "Scheduled"
                    ? `${match.homeScore ?? "-"} - ${match.awayScore ?? "-"}`
                    : "vs"}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {kickoff}
                </Typography>
              </Grid>

              <Grid item xs={12} sm={5}>
                <Stack direction="row" spacing={1} alignItems="center">
                  {match.awayTeam?.flagUrl && (
                    <Box
                      component="img"
                      src={match.awayTeam.flagUrl}
                      alt=""
                      sx={{ width: 32, height: 21, objectFit: "cover" }}
                    />
                  )}
                  <Box>
                    <Typography
                      variant="h5"
                      fontWeight={700}
                      component="button"
                      onClick={() => navigate(`/teams/${match.awayTeam?.id}`)}
                      sx={{
                        background: "none",
                        border: "none",
                        color: "inherit",
                        cursor: "pointer",
                        "&:hover": { color: "primary.main" },
                      }}
                    >
                      {match.awayTeam?.name ?? "TBD"}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block">
                      Elo: {match.awayTeam?.eloRating ?? "-"} &middot;{" "}
                      {match.awayTeam?.groupName ?? ""}
                    </Typography>
                  </Box>
                </Stack>
              </Grid>
            </Grid>
          </Stack>
        </CardContent>
      </Card>

      {match.prediction && (
        <Card>
          <CardContent>
            <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
              Prediction
            </Typography>
            <ProbabilityBar
              homeWin={match.prediction.homeWin}
              draw={match.prediction.draw}
              awayWin={match.prediction.awayWin}
            />

            <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
              <Chip
                label={`${Math.round(match.prediction.confidence * 100)}% confidence`}
                color="primary"
              />
              <Typography variant="caption" color="text.secondary" sx={{ alignSelf: "center" }}>
                Generated:{" "}
                {new Date(match.prediction.createdAt).toLocaleDateString()}
              </Typography>
            </Stack>

            {match.prediction.factors && match.prediction.factors.length > 0 && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Contributing Factors
                </Typography>
                <Stack spacing={1}>
                  {match.prediction.factors.map((f: any, i: number) => (
                    <Stack key={i} spacing={0.5}>
                      <Stack direction="row" justifyContent="space-between">
                        <Typography variant="body2">{f.factor}</Typography>
                        <Typography variant="body2" fontWeight={600}>
                          {Math.round(f.weight * 100)}%
                        </Typography>
                      </Stack>
                      <LinearProgress
                        variant="determinate"
                        value={f.weight * 100}
                        sx={{ height: 6, borderRadius: 1 }}
                      />
                    </Stack>
                  ))}
                </Stack>
              </Box>
            )}
          </CardContent>
        </Card>
      )}

      {match.odds && match.odds.length > 0 && (
        <Card>
          <CardContent>
            <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
              Odds Comparison
            </Typography>
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Bookmaker</TableCell>
                    <TableCell align="right">Home</TableCell>
                    <TableCell align="right">Draw</TableCell>
                    <TableCell align="right">Away</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {match.odds.map((odds: any, i: number) => (
                    <TableRow key={i}>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>
                          {odds.bookmaker}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">{odds.homeOdds.toFixed(2)}</TableCell>
                      <TableCell align="right">{odds.drawOdds.toFixed(2)}</TableCell>
                      <TableCell align="right">{odds.awayOdds.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}
    </Stack>
  );
}
