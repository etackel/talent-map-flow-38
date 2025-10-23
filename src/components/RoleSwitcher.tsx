import { useState } from 'react';
import {
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent,
  Typography,
  Alert,
} from '@mui/material';
import { supabase } from '@/integrations/supabase/client';
import { useUserRole } from '@/hooks/useUserRole';
import type { Database } from '@/integrations/supabase/types';

type AppRole = Database['public']['Enums']['app_role'];

export default function RoleSwitcher() {
  const { role } = useUserRole();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleRoleChange = async (newRole: AppRole) => {
    setLoading(true);
    setMessage('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Update existing role (avoid RLS restrictions on insert)
      const { error } = await supabase
        .from('user_roles')
        .update({ role: newRole })
        .eq('user_id', user.id);

      if (error) throw error;

      setMessage('Role updated! Refresh the page to see changes.');
      setTimeout(() => window.location.reload(), 1500);
    } catch (error) {
      console.error('Error updating role:', error);
      setMessage('Failed to update role');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Testing Mode - Role Switcher
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Switch between roles to test different features. Current role: <strong>{role}</strong>
        </Typography>
        
        <FormControl fullWidth>
          <InputLabel>Select Role</InputLabel>
          <Select
            value={role || 'employee'}
            label="Select Role"
            onChange={(e) => handleRoleChange(e.target.value as AppRole)}
            disabled={loading}
          >
            <MenuItem value="employee">Employee</MenuItem>
            <MenuItem value="manager">Manager</MenuItem>
            <MenuItem value="hr">HR</MenuItem>
            <MenuItem value="executive">Executive</MenuItem>
          </Select>
        </FormControl>

        {message && (
          <Alert severity="info" sx={{ mt: 2 }}>
            {message}
          </Alert>
        )}

        <Box sx={{ mt: 2 }}>
          <Typography variant="caption" color="text.secondary">
            <strong>Employee:</strong> Can view/add their skills, browse mobility opportunities<br />
            <strong>Manager:</strong> All employee features + view team, create hiring requisitions<br />
            <strong>HR/Executive:</strong> All features + view all employees, requisitions, and transfers
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
}
