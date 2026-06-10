import React, { useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  AppBar,
  Box,
  Container,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import DashboardIcon from "@mui/icons-material/Dashboard";
import SportsSoccerIcon from "@mui/icons-material/SportsSoccer";
import GroupsIcon from "@mui/icons-material/Groups";
import PeopleIcon from "@mui/icons-material/People";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import TimelineIcon from "@mui/icons-material/Timeline";

const navItems = [
  { label: "Dashboard", path: "/", icon: <DashboardIcon /> },
  { label: "Matches", path: "/matches", icon: <SportsSoccerIcon /> },
  { label: "Teams", path: "/teams", icon: <GroupsIcon /> },
  { label: "Players", path: "/players", icon: <PeopleIcon /> },
  { label: "Groups", path: "/groups", icon: <EmojiEventsIcon /> },
  { label: "Model", path: "/model", icon: <TimelineIcon /> },
];

export default function Layout() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [drawerOpen, setDrawerOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleNav = (path: string) => {
    navigate(path);
    if (isMobile) setDrawerOpen(false);
  };

  const drawer = (
    <Box sx={{ width: 250, pt: 2 }} role="presentation">
      <Typography
        variant="h6"
        sx={{ px: 2, mb: 2, color: "primary.main", fontWeight: 700 }}
      >
        World Cup Predictor
      </Typography>
      <List>
        {navItems.map((item) => (
          <ListItemButton
            key={item.path}
            selected={location.pathname === item.path}
            onClick={() => handleNav(item.path)}
          >
            <ListItemIcon sx={{ color: "primary.main" }}>
              {item.icon}
            </ListItemIcon>
            <ListItemText primary={item.label} />
          </ListItemButton>
        ))}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <AppBar position="sticky" elevation={1}>
        <Toolbar>
          {isMobile && (
            <IconButton
              edge="start"
              color="inherit"
              onClick={() => setDrawerOpen(true)}
              sx={{ mr: 1 }}
            >
              <MenuIcon />
            </IconButton>
          )}
          <SportsSoccerIcon sx={{ mr: 1 }} />
          <Typography
            variant="h6"
            sx={{ fontWeight: 700, cursor: "pointer" }}
            onClick={() => navigate("/")}
          >
            2026 World Cup Predictor
          </Typography>
          {!isMobile && (
            <Box sx={{ ml: 4, display: "flex", gap: 1 }}>
              {navItems.map((item) => (
                <Typography
                  key={item.path}
                  variant="body2"
                  onClick={() => handleNav(item.path)}
                  sx={{
                    px: 1.5,
                    py: 0.5,
                    borderRadius: 1,
                    cursor: "pointer",
                    bgcolor:
                      location.pathname === item.path
                        ? "rgba(255,255,255,0.12)"
                        : "transparent",
                    "&:hover": {
                      bgcolor: "rgba(255,255,255,0.08)",
                    },
                  }}
                >
                  {item.label}
                </Typography>
              ))}
            </Box>
          )}
        </Toolbar>
      </AppBar>

      <Drawer anchor="left" open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        {drawer}
      </Drawer>

      <Container maxWidth="xl" sx={{ flex: 1, py: 3 }}>
        <Outlet />
      </Container>

      <Box
        component="footer"
        sx={{
          py: 2,
          textAlign: "center",
          color: "text.secondary",
          typography: "caption",
          borderTop: 1,
          borderColor: "divider",
        }}
      >
        2026 FIFA World Cup Predictor &mdash; Powered by Elo Ratings
      </Box>
    </Box>
  );
}
