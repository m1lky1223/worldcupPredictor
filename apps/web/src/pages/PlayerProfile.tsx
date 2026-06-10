import { gql, useQuery } from "@apollo/client";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Stack,
  Typography,
  Skeleton,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

const PLAYER_PROFILE_QUERY = gql`
  query PlayerProfile($id: Int!) {
    player(id: $id) {
      id
      name
      position
      influenceScore
      team {
        id
        name
        flagUrl
        eloRating
        groupName
      }
    }
  }
`;

export default function PlayerProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { loading, error, data } = useQuery(PLAYER_PROFILE_QUERY, {
    variables: { id: Number(id) },
    skip: !id,
  });

  if (loading) {
    return (
      <Stack spacing={3}>
        <Skeleton variant="rounded" height={150} />
      </Stack>
    );
  }

  if (error) {
    return (
      <Stack spacing={2}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate("/players")}>
          Back to Players
        </Button>
        <Typography color="error">
          Failed to load player: {error.message}
        </Typography>
      </Stack>
    );
  }

  const player = data?.player;
  if (!player) {
    return (
      <Stack spacing={2}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate("/players")}>
          Back to Players
        </Button>
        <Typography>Player not found.</Typography>
      </Stack>
    );
  }

  return (
    <Stack spacing={3}>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate("/players")}
        sx={{ alignSelf: "flex-start" }}
      >
        Back to Players
      </Button>

      <Card>
        <CardContent>
          <Stack spacing={3}>
            <Box>
              <Typography variant="h4" fontWeight={700}>
                {player.name}
              </Typography>
              <Chip
                label={player.position}
                size="small"
                color="primary"
                variant="outlined"
                sx={{ mt: 1 }}
              />
            </Box>

            <Card variant="outlined">
              <CardContent>
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                  Influence Score
                </Typography>
                <Typography variant="h3" fontWeight={700} color="primary.main">
                  {player.influenceScore}
                </Typography>
              </CardContent>
            </Card>

            <Box
              sx={{
                p: 2,
                border: 1,
                borderColor: "divider",
                borderRadius: 1,
                cursor: "pointer",
                "&:hover": { borderColor: "primary.main" },
              }}
              onClick={() => navigate(`/teams/${player.team?.id}`)}
            >
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                Team
              </Typography>
              <Stack direction="row" alignItems="center" spacing={1.5}>
                {player.team?.flagUrl && (
                  <Box
                    component="img"
                    src={player.team.flagUrl}
                    alt={player.team.name}
                    sx={{ width: 32, height: 21, objectFit: "cover" }}
                  />
                )}
                <Stack>
                  <Typography variant="body1" fontWeight={600}>
                    {player.team?.name ?? "N/A"}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Group {player.team?.groupName} &middot; Elo: {player.team?.eloRating}
                  </Typography>
                </Stack>
              </Stack>
            </Box>
          </Stack>
        </CardContent>
      </Card>
    </Stack>
  );
}
