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
  IconButton,
  Collapse,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import { KeyboardArrowDown, KeyboardArrowUp } from '@mui/icons-material';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

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
  const { user, role, loading: authLoading } = useAuth();
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const toggleRow = (id: string) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  useEffect(() => {
    async function fetchTeam() {
      if (authLoading) return;
      
      if (role !== 'manager' && role !== 'hr' && role !== 'executive') {
        setError('Access denied. This page is only available to managers and HR.');
        setLoading(false);
        return;
      }

      if (!user) {
        setError('Not authenticated');
        setLoading(false);
        return;
      }

      try {

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
  }, [user, role, authLoading]);

  if (authLoading || loading) {
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
                    <TableCell sx={{ fontWeight: 600, width: 50 }} />
                    <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Email</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Role</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Department</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Utilization</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {team.map((member) => (
                    <>
                      <TableRow key={member.id} hover>
                        <TableCell>
                          <IconButton
                            size="small"
                            onClick={() => toggleRow(member.id)}
                          >
                            {expandedRows.has(member.id) ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
                          </IconButton>
                        </TableCell>
                        <TableCell>{member.full_name}</TableCell>
                        <TableCell>{member.email}</TableCell>
                        <TableCell>{member.role_title || '-'}</TableCell>
                        <TableCell>{member.department || '-'}</TableCell>
                        <TableCell>
                          {member.utilization_percent ? `${member.utilization_percent}%` : '-'}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
                          <Collapse in={expandedRows.has(member.id)} timeout="auto" unmountOnExit>
                            <Box sx={{ margin: 2 }}>
                              <Typography variant="h6" gutterBottom component="div">
                                Skills
                              </Typography>
                              {member.skills.length === 0 ? (
                                <Alert severity="info">No skills added yet</Alert>
                              ) : (
                                <List>
                                  {member.skills.map((skill, idx) => (
                                    <ListItem key={idx}>
                                      <Chip
                                        label={skill.category}
                                        size="small"
                                        color="secondary"
                                        variant="outlined"
                                        sx={{ mr: 2 }}
                                      />
                                      <ListItemText
                                        primary={skill.name}
                                        secondary={`Proficiency Level: ${skill.proficiency_level}/5`}
                                      />
                                    </ListItem>
                                  ))}
                                </List>
                              )}
                            </Box>
                          </Collapse>
                        </TableCell>
                      </TableRow>
                    </>
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
