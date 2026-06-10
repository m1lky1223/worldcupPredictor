import React from "react";
import { gql, useQuery } from "@apollo/client";
import {
  Box,
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
import { useNavigate } from "react-router-dom";

const PLAYERS_QUERY = gql`
  query PlayersList {
    players(limit: 200, offset: 0) {
      items {
        id
        name
        position
        influenceScore
        team {
          id
          name
          flagUrl
        }
      }
      pagination {
        total
      }
    }
  }
`;

export default function Players() {
  const navigate = useNavigate();
  const { loading, error, data } = useQuery(PLAYERS_QUERY);

  if (loading) {
    return (
      <Stack spacing={2}>
        <Skeleton variant="rounded" height={60} />
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} variant="rounded" height={50} />
        ))}
      </Stack>
    );
  }

  if (error) {
    return (
      <Typography color="error">
        Failed to load players: {error.message}
      </Typography>
    );
  }

  const players = data?.players?.items ?? [];
  const total = data?.players?.pagination?.total ?? 0;

  return (
    <Stack spacing={3}>
      <Typography variant="h5" fontWeight={700}>
        Player Leaderboard
        <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 1 }}>
          ({total} players)
        </Typography>
      </Typography>

      <TableContainer component={Paper} variant="outlined">
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Rank</TableCell>
              <TableCell>Player</TableCell>
              <TableCell>Position</TableCell>
              <TableCell>Team</TableCell>
              <TableCell align="right">Influence Score</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {players.map((player: any, index: number) => (
              <TableRow
                key={player.id}
                hover
                sx={{ cursor: "pointer" }}
                onClick={() => navigate(`/players/${player.id}`)}
              >
                <TableCell>
                  <Typography variant="body2" fontWeight={700}>
                    {index + 1}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body1" fontWeight={600}>
                    {player.name}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip label={player.position} size="small" variant="outlined" />
                </TableCell>
                <TableCell>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    {player.team?.flagUrl && (
                      <Box
                        component="img"
                        src={player.team.flagUrl}
                        alt=""
                        sx={{ width: 20, height: 14, objectFit: "cover" }}
                      />
                    )}
                    <Typography variant="body2">{player.team?.name ?? "-"}</Typography>
                  </Stack>
                </TableCell>
                <TableCell align="right">
                  <Typography variant="body1" fontWeight={700} color="primary.main">
                    {player.influenceScore}
                  </Typography>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Stack>
  );
}
