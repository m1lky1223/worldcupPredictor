import React from "react";
import { gql, useQuery } from "@apollo/client";
import {
  Box,
  Grid,
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

const GROUPS_QUERY = gql`
  query GroupsStandings {
    groupStandings {
      groupName
      standings {
        position
        team {
          id
          name
          flagUrl
        }
        played
        won
        drawn
        lost
        goalsFor
        goalsAgainst
        goalDifference
        points
        qualified
        eliminated
      }
    }
  }
`;

function GroupTable({ group }: { group: any }) {
  const navigate = useNavigate();
  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Typography
        variant="h6"
        fontWeight={700}
        sx={{ mb: 2, color: "primary.main" }}
      >
        Group {group.groupName}
      </Typography>
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>#</TableCell>
              <TableCell>Team</TableCell>
              <TableCell align="right">Pld</TableCell>
              <TableCell align="right">W</TableCell>
              <TableCell align="right">D</TableCell>
              <TableCell align="right">L</TableCell>
              <TableCell align="right">GF</TableCell>
              <TableCell align="right">GA</TableCell>
              <TableCell align="right">GD</TableCell>
              <TableCell align="right">Pts</TableCell>
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
                  <Stack direction="row" alignItems="center" spacing={1}>
                    {entry.team?.flagUrl && (
                      <Box
                        component="img"
                        src={entry.team.flagUrl}
                        alt=""
                        sx={{ width: 20, height: 14, objectFit: "cover" }}
                      />
                    )}
                    <Typography
                      variant="body2"
                      fontWeight={600}
                      color={entry.qualified ? "success.main" : entry.eliminated ? "error.main" : "inherit"}
                    >
                      {entry.team.name}
                    </Typography>
                  </Stack>
                </TableCell>
                <TableCell align="right">{entry.played}</TableCell>
                <TableCell align="right">{entry.won}</TableCell>
                <TableCell align="right">{entry.drawn}</TableCell>
                <TableCell align="right">{entry.lost}</TableCell>
                <TableCell align="right">{entry.goalsFor}</TableCell>
                <TableCell align="right">{entry.goalsAgainst}</TableCell>
                <TableCell align="right">
                  <Typography
                    variant="body2"
                    fontWeight={600}
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
                <TableCell align="right">
                  <Typography variant="body2" fontWeight={700}>
                    {entry.points}
                  </Typography>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
}

export default function Groups() {
  const { loading, error, data } = useQuery(GROUPS_QUERY);

  if (loading) {
    return (
      <Grid container spacing={3}>
        {[1, 2, 3, 4].map((i) => (
          <Grid item xs={12} md={6} key={i}>
            <Skeleton variant="rounded" height={250} />
          </Grid>
        ))}
      </Grid>
    );
  }

  if (error) {
    return (
      <Typography color="error">
        Failed to load group standings: {error.message}
      </Typography>
    );
  }

  const groups = data?.groupStandings ?? [];

  return (
    <Stack spacing={3}>
      <Typography variant="h5" fontWeight={700}>
        Group Standings
      </Typography>
      <Grid container spacing={3}>
        {groups.map((group: any) => (
          <Grid item xs={12} md={6} key={group.groupName}>
            <GroupTable group={group} />
          </Grid>
        ))}
      </Grid>
    </Stack>
  );
}
