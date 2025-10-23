import { useEffect, useState } from "react";
import { useNavigate, useLocation, Outlet } from "react-router-dom";
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  Divider,
} from "@mui/material";
import {
  Dashboard,
  Psychology,
  Group,
  Work,
  TrendingUp,
  AccountCircle,
  Logout,
} from "@mui/icons-material";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";

const drawerWidth = 280;

const AppLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [userEmail, setUserEmail] = useState("");
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const { role } = useUserRole();

  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/");
        return;
      }
      
      setUserEmail(session.user.email || "");
    };

    checkAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT" || !session) {
        navigate("/");
      } else {
        setUserEmail(session.user.email || "");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const menuItems = [
    { text: "Dashboard", icon: <Dashboard />, path: "/dashboard", roles: ['employee', 'manager', 'hr', 'executive'] },
    { text: "My Skills", icon: <Psychology />, path: "/my-skills", roles: ['employee', 'manager', 'hr', 'executive'] },
    { text: "My Team", icon: <Group />, path: "/team", roles: ['manager', 'hr', 'executive'] },
    { text: "Hiring", icon: <Work />, path: "/hiring", roles: ['manager', 'hr', 'executive'] },
    { text: "Mobility", icon: <TrendingUp />, path: "/mobility", roles: ['employee', 'manager', 'hr', 'executive'] },
  ];

  const visibleMenuItems = menuItems.filter(item => 
    !role || item.roles.includes(role)
  );

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      <AppBar
        position="fixed"
        sx={{
          zIndex: (theme) => theme.zIndex.drawer + 1,
          bgcolor: "hsl(var(--primary))",
        }}
      >
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: "bold" }}>
            Atlas
          </Typography>
          <IconButton
            color="inherit"
            onClick={(e) => setAnchorEl(e.currentTarget)}
          >
            <Avatar sx={{ width: 32, height: 32, bgcolor: "hsl(var(--accent))" }}>
              {userEmail.charAt(0).toUpperCase()}
            </Avatar>
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={() => setAnchorEl(null)}
          >
            <MenuItem disabled>
              <Typography variant="body2" color="text.secondary">
                {userEmail}
              </Typography>
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleLogout}>
              <ListItemIcon>
                <Logout fontSize="small" />
              </ListItemIcon>
              Logout
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          "& .MuiDrawer-paper": {
            width: drawerWidth,
            boxSizing: "border-box",
            bgcolor: "hsl(var(--sidebar-background))",
            borderRight: "1px solid hsl(var(--border))",
          },
        }}
      >
        <Toolbar />
        <Box sx={{ overflow: "auto", mt: 2 }}>
          <List>
            {visibleMenuItems.map((item) => (
              <ListItem key={item.text} disablePadding>
                <ListItemButton
                  selected={location.pathname === item.path}
                  onClick={() => navigate(item.path)}
                  sx={{
                    mx: 1,
                    borderRadius: 1,
                    "&.Mui-selected": {
                      bgcolor: "hsl(var(--primary) / 0.1)",
                      color: "hsl(var(--primary))",
                      "&:hover": {
                        bgcolor: "hsl(var(--primary) / 0.15)",
                      },
                    },
                  }}
                >
                  <ListItemIcon
                    sx={{
                      color: location.pathname === item.path ? "hsl(var(--primary))" : "inherit",
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText primary={item.text} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Box>
      </Drawer>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          bgcolor: "hsl(var(--background))",
          p: 3,
          minHeight: "100vh",
        }}
      >
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  );
};

export default AppLayout;
