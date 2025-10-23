import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  Button,
  CircularProgress,
  Alert,
} from '@mui/material';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface OpenRole {
  id: number;
  role_title: string;
  department: string | null;
  required_skills_json: any;
  created_at: string;
}

export default function Mobility() {
  const [openRoles, setOpenRoles] = useState<OpenRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchOpenRoles() {
      try {
        const { data, error } = await supabase
          .from('process_requisitions')
          .select('*')
          .eq('status', 'PENDING_INTERNAL_REVIEW')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setOpenRoles(data || []);
      } catch (err) {
        console.error('Error fetching open roles:', err);
        setError(err instanceof Error ? err.message : 'Failed to load open roles');
      } finally {
        setLoading(false);
      }
    }

    fetchOpenRoles();
  }, []);

  const handleApply = async (roleId: number) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // This would create a transfer request in a real implementation
      toast({ 
        title: 'Application submitted!',
        description: 'Your manager will be notified of your interest.'
      });
    } catch (error) {
      console.error('Error applying for role:', error);
      toast({ 
        title: 'Failed to apply',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive'
      });
    }
  };

  if (loading) {
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
        Internal Mobility
      </Typography>

      {openRoles.length === 0 ? (
        <Alert severity="info">No open internal positions available at this time.</Alert>
      ) : (
        <Grid container spacing={3}>
          {openRoles.map((role) => (
            <Grid size={{ xs: 12, md: 6 }} key={role.id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography variant="h6" gutterBottom>
                    {role.role_title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {role.department || 'Department TBD'}
                  </Typography>
                  
                  <Box sx={{ mt: 2, mb: 2 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Required Skills:
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      {role.required_skills_json && Array.isArray(role.required_skills_json) ? (
                        role.required_skills_json.map((skill: any, idx: number) => (
                          <Chip
                            key={idx}
                            label={skill.name || skill}
                            size="small"
                            color="primary"
                            variant="outlined"
                          />
                        ))
                      ) : (
                        <Typography variant="body2">Skills not specified</Typography>
                      )}
                    </Box>
                  </Box>

                  <Typography variant="caption" color="text.secondary">
                    Posted: {new Date(role.created_at).toLocaleDateString()}
                  </Typography>
                </CardContent>

                <Box sx={{ p: 2, pt: 0 }}>
                  <Button
                    variant="contained"
                    fullWidth
                    onClick={() => handleApply(role.id)}
                  >
                    Express Interest
                  </Button>
                </Box>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
}
