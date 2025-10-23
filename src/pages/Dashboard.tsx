import { useEffect, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  CircularProgress,
} from "@mui/material";
import { People, Work, TrendingUp, Assignment } from "@mui/icons-material";
import { supabase } from "@/integrations/supabase/client";
import RoleSwitcher from "@/components/RoleSwitcher";

interface Stats {
  totalEmployees: number;
  openRequisitions: number;
  activeTransfers: number;
  mySkills: number;
}

const Dashboard = () => {
  const [stats, setStats] = useState<Stats>({
    totalEmployees: 0,
    openRequisitions: 0,
    activeTransfers: 0,
    mySkills: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) return;

        // Fetch various stats
        const [employeesRes, requisitionsRes, transfersRes, skillsRes] = await Promise.all([
          supabase.from("employees").select("*", { count: "exact", head: true }),
          supabase.from("process_requisitions").select("*", { count: "exact", head: true }),
          supabase.from("process_transfers").select("*", { count: "exact", head: true }),
          supabase
            .from("employee_skills")
            .select("*", { count: "exact", head: true })
            .eq("employee_id", user.id),
        ]);

        setStats({
          totalEmployees: employeesRes.count || 0,
          openRequisitions: requisitionsRes.count || 0,
          activeTransfers: transfersRes.count || 0,
          mySkills: skillsRes.count || 0,
        });
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const statCards = [
    {
      title: "Total Employees",
      value: stats.totalEmployees,
      icon: <People sx={{ fontSize: 40 }} />,
      color: "hsl(var(--primary))",
    },
    {
      title: "Open Requisitions",
      value: stats.openRequisitions,
      icon: <Work sx={{ fontSize: 40 }} />,
      color: "hsl(var(--accent))",
    },
    {
      title: "Active Transfers",
      value: stats.activeTransfers,
      icon: <TrendingUp sx={{ fontSize: 40 }} />,
      color: "hsl(var(--success))",
    },
    {
      title: "My Skills",
      value: stats.mySkills,
      icon: <Assignment sx={{ fontSize: 40 }} />,
      color: "hsl(231 48% 48%)",
    },
  ];

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
        Dashboard
      </Typography>
      <Typography variant="body1" color="text.secondary" mb={4}>
        Welcome to your strategic workforce platform
      </Typography>

      <RoleSwitcher />

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(2, 1fr)",
            md: "repeat(4, 1fr)",
          },
          gap: 3,
        }}
      >
        {statCards.map((card) => (
          <Card
            key={card.title}
            sx={{
              height: "100%",
              transition: "transform 0.2s, box-shadow 0.2s",
              "&:hover": {
                transform: "translateY(-4px)",
                boxShadow: 4,
              },
            }}
          >
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                <Box>
                  <Typography color="text.secondary" gutterBottom variant="body2">
                    {card.title}
                  </Typography>
                  <Typography variant="h3" component="div" fontWeight="bold">
                    {card.value}
                  </Typography>
                </Box>
                <Box sx={{ color: card.color }}>{card.icon}</Box>
              </Box>
            </CardContent>
          </Card>
        ))}
      </Box>
    </Box>
  );
};

export default Dashboard;
