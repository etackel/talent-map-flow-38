import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  Alert,
} from '@mui/material';
import { supabase } from '@/integrations/supabase/client';
import { useUserRole } from '@/hooks/useUserRole';

interface TeamMember {
  id: string;
  full_name: string;
  email: string;
  role_title: string | null;
  department: string | null;
  utilization_percent: number | null;
  skills: { name: string; category: string; proficiency_level: number }[];
}

export default function Team() {
  const { role, loading: roleLoading } = useUserRole();
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTeam() {
      if (roleLoading) return;
      
      if (role !== 'manager' && role !== 'hr' && role !== 'executive') {
        setError('Access denied. This page is only available to managers and HR.');
        setLoading(false);
        return;
      }

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        // Fetch team members
        const { data: employeeData, error: employeeError } = await supabase
          .from('employees')
          .select('id, full_name, email, role_title, department, utilization_percent')
          .eq('manager_id', user.id);

        if (employeeError) throw employeeError;

        // Fetch skills for each team member
        const teamWithSkills = await Promise.all(
          (employeeData || []).map(async (employee) => {
            const { data: skillsData } = await supabase
              .from('employee_skills')
              .select(`
                proficiency_level,
                skills (name, category)
              `)
              .eq('employee_id', employee.id);

            return {
              ...employee,
              skills: skillsData?.map(s => ({
                name: (s.skills as any).name,
                category: (s.skills as any).category,
                proficiency_level: s.proficiency_level,
              })) || [],
            };
          })
        );

        setTeam(teamWithSkills);
      } catch (err) {
        console.error('Error fetching team:', err);
        setError(err instanceof Error ? err.message : 'Failed to load team data');
      } finally {
        setLoading(false);
      }
    }

    fetchTeam();
  }, [role, roleLoading]);

  if (roleLoading || loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 3, fontWeight: 600 }}>
        My Team
      </Typography>

      {team.length === 0 ? (
        <Alert severity="info">You don't have any team members yet.</Alert>
      ) : (
        <Card>
          <CardContent>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Email</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Role</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Department</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Utilization</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Skills</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {team.map((member) => (
                    <TableRow key={member.id} hover>
                      <TableCell>{member.full_name}</TableCell>
                      <TableCell>{member.email}</TableCell>
                      <TableCell>{member.role_title || '-'}</TableCell>
                      <TableCell>{member.department || '-'}</TableCell>
                      <TableCell>
                        {member.utilization_percent ? `${member.utilization_percent}%` : '-'}
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                          {member.skills.length === 0 ? (
                            <Typography variant="body2" color="text.secondary">No skills</Typography>
                          ) : (
                            member.skills.map((skill, idx) => (
                              <Chip
                                key={idx}
                                label={`${skill.name} (${skill.proficiency_level})`}
                                size="small"
                                color="primary"
                                variant="outlined"
                              />
                            ))
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}
