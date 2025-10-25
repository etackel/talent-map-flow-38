import { useEffect } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  AppBar,
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
} from "@mui/material";
import {
  Dashboard as DashboardIcon,
  Psychology as SkillsIcon,
  Groups as TeamIcon,
  Work as HiringIcon,
  SwapHoriz as MobilityIcon,
  Assessment as RequisitionsIcon,
} from "@mui/icons-material";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Database } from "@/integrations/supabase/types";
import * as React from "react";

type AppRole = Database['public']['Enums']['app_role'];

const DRAWER_WIDTH = 240;

export default function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profile, role, loading } = useAuth();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/");
    }
  }, [user, loading, navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setAnchorEl(null);
    navigate("/");
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const menuItems = [
    { text: "Dashboard", icon: DashboardIcon, path: "/dashboard", roles: ["employee", "manager", "hr", "executive"] as AppRole[] },
    { text: "My Skills", icon: SkillsIcon, path: "/my-skills", roles: ["employee", "manager"] as AppRole[] },
    { text: "My Team", icon: TeamIcon, path: "/team", roles: ["manager"] as AppRole[] },
    { text: "Hiring", icon: HiringIcon, path: "/hiring", roles: ["manager"] as AppRole[] },
    { text: "All Requisitions", icon: RequisitionsIcon, path: "/hiring", roles: ["hr", "executive"] as AppRole[] },
    { text: "All Transfers", icon: MobilityIcon, path: "/mobility", roles: ["hr", "executive"] as AppRole[] },
  ];

  const visibleMenuItems = role ? menuItems.filter((item) =>
    item.roles.includes(role)
  ) : [];

  if (loading) {
    return null;
  }

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      {/* AppBar */}
      <AppBar 
        position="fixed" 
        sx={{ 
          zIndex: (theme) => theme.zIndex.drawer + 1,
          bgcolor: "primary.main"
        }}
      >
        <Toolbar>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            Atlas
          </Typography>
          
          <Typography variant="body2" sx={{ mr: 2 }}>
            {profile?.email || user?.email}
          </Typography>

          <IconButton onClick={handleMenuOpen} sx={{ p: 0 }}>
            <Avatar sx={{ bgcolor: "secondary.main", color: "primary.main" }}>
              {profile?.full_name?.[0] || profile?.email?.[0] || "U"}
            </Avatar>
          </IconButton>

          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
            transformOrigin={{ vertical: "top", horizontal: "right" }}
          >
            <MenuItem disabled>
              <Typography variant="body2">{profile?.full_name || "User"}</Typography>
            </MenuItem>
            <MenuItem disabled>
              <Typography variant="caption" color="text.secondary">
                Role: {role || "N/A"}
              </Typography>
            </MenuItem>
            <MenuItem onClick={handleLogout}>Logout</MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      {/* Sidebar Drawer */}
      <Drawer
        variant="permanent"
        sx={{
          width: DRAWER_WIDTH,
          flexShrink: 0,
          "& .MuiDrawer-paper": {
            width: DRAWER_WIDTH,
            boxSizing: "border-box",
          },
        }}
      >
        <Toolbar />
        <Box sx={{ overflow: "auto", mt: 2 }}>
          <List>
            {visibleMenuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <ListItem key={item.text} disablePadding>
                  <ListItemButton
                    selected={isActive}
                    onClick={() => navigate(item.path)}
                    sx={{
                      mx: 1,
                      borderRadius: 1,
                      "&.Mui-selected": {
                        bgcolor: "primary.main",
                        color: "white",
                        "&:hover": {
                          bgcolor: "primary.dark",
                        },
                        "& .MuiListItemIcon-root": {
                          color: "white",
                        },
                      },
                    }}
                  >
                    <ListItemIcon sx={{ color: isActive ? "white" : "inherit" }}>
                      <Icon />
                    </ListItemIcon>
                    <ListItemText primary={item.text} />
                  </ListItemButton>
                </ListItem>
              );
            })}
          </List>
        </Box>
      </Drawer>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          mt: 8,
          bgcolor: "background.default",
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
}
