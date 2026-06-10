import { gql, useQuery } from "@apollo/client";
import {
  Box,
  Card,
  CardContent,
  Chip,
  Grid,
  Stack,
  Typography,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from "@mui/material";
import { useNavigate } from "react-router-dom";

const DASHBOARD_QUERY = gql`
  query DashboardData {
    matches(limit: 6, offset: 0) {
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
      }
    }
    teams {
      id
      name
      eloRating
      flagUrl
      groupName
    }
    groupStandings {
      groupName
      standings {
        position
        team {
          id
          name
        }
        points
        played
        won
        drawn
        lost
        goalDifference
        qualified
      }
    }
  }
`;

function StatusChip({ status }: { status: string }) {
  const color =
    status === "Live"
      ? "error"
      : status === "Completed"
        ? "success"
        : "default";
  return <Chip label={status} size="small" color={color} variant="outlined" />;
}

function MatchCard({ match }: { match: any }) {
  const navigate = useNavigate();
  const kickoff = new Date(match.kickoffTime).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

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
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
          <Typography variant="caption" color="text.secondary">
            {match.stage}
          </Typography>
          <StatusChip status={match.status} />
        </Stack>
        <Stack spacing={1}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="body1" fontWeight={600}>
              {match.homeTeam?.name ?? "TBD"}
            </Typography>
            <Typography variant="h6" fontWeight={700}>
              {match.status !== "Scheduled" ? match.homeScore ?? "-" : ""}
            </Typography>
          </Stack>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="body1" fontWeight={600}>
              {match.awayTeam?.name ?? "TBD"}
            </Typography>
            <Typography variant="h6" fontWeight={700}>
              {match.status !== "Scheduled" ? match.awayScore ?? "-" : ""}
            </Typography>
          </Stack>
        </Stack>
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
          {kickoff}
        </Typography>
      </CardContent>
    </Card>
  );
}

function EloTable({ teams }: { teams: any[] }) {
  const navigate = useNavigate();
  const topTeams = teams.slice(0, 10);
  return (
    <TableContainer component={Paper} variant="outlined">
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>#</TableCell>
            <TableCell>Team</TableCell>
            <TableCell align="right">Group</TableCell>
            <TableCell align="right">Elo Rating</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {topTeams.map((team: any, idx: number) => (
            <TableRow
              key={team.id}
              hover
              sx={{ cursor: "pointer" }}
              onClick={() => navigate(`/teams/${team.id}`)}
            >
              <TableCell>{idx + 1}</TableCell>
              <TableCell>
                <Stack direction="row" alignItems="center" spacing={1}>
                  {team.flagUrl && (
                    <Box
                      component="img"
                      src={team.flagUrl}
                      alt={team.name}
                      sx={{ width: 20, height: 14, objectFit: "cover" }}
                    />
                  )}
                  <Typography variant="body2">{team.name}</Typography>
                </Stack>
              </TableCell>
              <TableCell align="right">{team.groupName}</TableCell>
              <TableCell align="right">
                <Typography variant="body2" fontWeight={600}>
                  {team.eloRating}
                </Typography>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

function GroupHighlights({ standings }: { standings: any[] }) {
  const navigate = useNavigate();
  return (
    <Grid container spacing={2}>
      {standings.slice(0, 4).map((group: any) => (
        <Grid item xs={12} sm={6} key={group.groupName}>
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography
              variant="subtitle2"
              fontWeight={700}
              sx={{ mb: 1, color: "primary.main" }}
            >
              Group {group.groupName}
            </Typography>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>#</TableCell>
                  <TableCell>Team</TableCell>
                  <TableCell align="right">Pts</TableCell>
                  <TableCell align="right">GD</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {group.standings.map((entry: any) => (
                  <TableRow
                    key={entry.position}
                    hover
                    sx={{ cursor: "pointer" }}
                    onClick={() => navigate(`/teams/${entry.team.id}`)}
                  >
                    <TableCell>{entry.position}</TableCell>
                    <TableCell>
                      <Typography variant="body2">{entry.team.name}</Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight={700}>
                        {entry.points}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography
                        variant="body2"
                        color={
                          entry.goalDifference > 0
                            ? "success.main"
                            : entry.goalDifference < 0
                              ? "error.main"
                              : "text.secondary"
                        }
                      >
                        {entry.goalDifference > 0 ? "+" : ""}
                        {entry.goalDifference}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>
        </Grid>
      ))}
    </Grid>
  );
}

export default function Dashboard() {
  const { loading, error, data } = useQuery(DASHBOARD_QUERY);

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
      <Typography color="error">
        Failed to load dashboard: {error.message}
      </Typography>
    );
  }

  const matches = data?.matches?.items ?? [];
  const teams = data?.teams ?? [];
  const standings = data?.groupStandings ?? [];

  return (
    <Stack spacing={4}>
      <Box>
        <Typography variant="h5" fontWeight={700} sx={{ mb: 2 }}>
          Upcoming & Recent Matches
        </Typography>
        {matches.length === 0 ? (
          <Typography color="text.secondary">No matches scheduled.</Typography>
        ) : (
          <Grid container spacing={2}>
            {matches.map((match: any) => (
              <Grid item xs={12} sm={6} md={4} key={match.id}>
                <MatchCard match={match} />
              </Grid>
            ))}
          </Grid>
        )}
      </Box>

      <Grid container spacing={4}>
        <Grid item xs={12} md={6}>
          <Typography variant="h5" fontWeight={700} sx={{ mb: 2 }}>
            Top 10 Teams by Elo Rating
          </Typography>
          <EloTable teams={teams} />
        </Grid>
        <Grid item xs={12} md={6}>
          <Typography variant="h5" fontWeight={700} sx={{ mb: 2 }}>
            Group Standings
          </Typography>
          <GroupHighlights standings={standings} />
        </Grid>
      </Grid>
    </Stack>
  );
}
