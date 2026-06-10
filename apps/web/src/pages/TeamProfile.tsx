import { gql, useQuery } from "@apollo/client";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
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

const TEAM_PROFILE_QUERY = gql`
  query TeamProfile($id: String!) {
    team(id: $id) {
      id
      name
      eloRating
      flagUrl
      groupName
    }
    players(limit: 50, offset: 0) {
      items {
        id
        name
        position
        influenceScore
        team {
          id
        }
      }
    }
  }
`;

export default function TeamProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { loading, error, data } = useQuery(TEAM_PROFILE_QUERY, {
    variables: { id },
    skip: !id,
  });

  if (loading) {
    return (
      <Stack spacing={3}>
        <Skeleton variant="rounded" height={150} />
        <Skeleton variant="rounded" height={300} />
      </Stack>
    );
  }

  if (error) {
    return (
      <Stack spacing={2}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate("/teams")}>
          Back to Teams
        </Button>
        <Typography color="error">
          Failed to load team: {error.message}
        </Typography>
      </Stack>
    );
  }

  const team = data?.team;
  if (!team) {
    return (
      <Stack spacing={2}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate("/teams")}>
          Back to Teams
        </Button>
        <Typography>Team not found.</Typography>
      </Stack>
    );
  }

  const teamPlayers =
    data?.players?.items?.filter(
      (p: any) => p.team?.id === id
    ) ?? [];

  return (
    <Stack spacing={3}>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate("/teams")}
        sx={{ alignSelf: "flex-start" }}
      >
        Back to Teams
      </Button>

      <Card>
        <CardContent>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={3}
            alignItems={{ xs: "flex-start", sm: "center" }}
          >
            {team.flagUrl && (
              <Box
                component="img"
                src={team.flagUrl}
                alt={team.name}
                sx={{ width: 64, height: 42, objectFit: "cover" }}
              />
            )}
            <Box sx={{ flex: 1 }}>
              <Typography variant="h4" fontWeight={700}>
                {team.name}
              </Typography>
              <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
                <Chip label={`Group ${team.groupName}`} variant="outlined" />
                <Chip
                  label={`Elo: ${team.eloRating}`}
                  color="primary"
                  variant="outlined"
                />
              </Stack>
            </Box>
          </Stack>
        </CardContent>
      </Card>

      {teamPlayers.length > 0 && (
        <Card>
          <CardContent>
            <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
              Players ({teamPlayers.length})
            </Typography>
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Position</TableCell>
                    <TableCell align="right">Influence Score</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {teamPlayers.map((player: any) => (
                    <TableRow
                      key={player.id}
                      hover
                      sx={{ cursor: "pointer" }}
                      onClick={() => navigate(`/players/${player.id}`)}
                    >
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>
                          {player.name}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip label={player.position} size="small" variant="outlined" />
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight={600}>
                          {player.influenceScore}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {teamPlayers.length === 0 && (
        <Typography color="text.secondary">
          No player data available for this team.
        </Typography>
      )}
    </Stack>
  );
}
