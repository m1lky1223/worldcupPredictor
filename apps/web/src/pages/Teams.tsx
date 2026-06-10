import React from "react";
import { gql, useQuery } from "@apollo/client";
import {
  Box,
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
  Chip,
} from "@mui/material";
import { useNavigate } from "react-router-dom";

const TEAMS_QUERY = gql`
  query TeamsList {
    teams {
      id
      name
      eloRating
      flagUrl
      groupName
    }
  }
`;

export default function Teams() {
  const navigate = useNavigate();
  const { loading, error, data } = useQuery(TEAMS_QUERY);

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
        Failed to load teams: {error.message}
      </Typography>
    );
  }

  const teams = data?.teams ?? [];

  return (
    <Stack spacing={3}>
      <Typography variant="h5" fontWeight={700}>
        Teams
        <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 1 }}>
          ({teams.length} qualified teams)
        </Typography>
      </Typography>

      <TableContainer component={Paper} variant="outlined">
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Rank</TableCell>
              <TableCell>Team</TableCell>
              <TableCell>Group</TableCell>
              <TableCell align="right">Elo Rating</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {teams.map((team: any, index: number) => (
              <TableRow
                key={team.id}
                hover
                sx={{ cursor: "pointer" }}
                onClick={() => navigate(`/teams/${team.id}`)}
              >
                <TableCell>
                  <Typography variant="body2" fontWeight={700}>
                    {index + 1}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Stack direction="row" alignItems="center" spacing={1.5}>
                    {team.flagUrl && (
                      <Box
                        component="img"
                        src={team.flagUrl}
                        alt={team.name}
                        sx={{ width: 28, height: 18, objectFit: "cover" }}
                      />
                    )}
                    <Typography variant="body1" fontWeight={600}>
                      {team.name}
                    </Typography>
                  </Stack>
                </TableCell>
                <TableCell>
                  <Chip label={team.groupName} size="small" variant="outlined" />
                </TableCell>
                <TableCell align="right">
                  <Typography variant="body1" fontWeight={700} color="primary.main">
                    {team.eloRating}
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
