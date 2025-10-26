import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Stepper,
  Step,
  StepLabel,
  TextField,
  Button,
  Autocomplete,
  CircularProgress,
  Alert,
  Chip,
} from '@mui/material';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface Skill {
  id: number;
  name: string;
  category: string;
}

const steps = ['Role Details', 'Required Skills', 'Review & Submit'];

export default function Hiring() {
  const { user, role } = useAuth();
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Form state
  const [roleTitle, setRoleTitle] = useState('');
  const [department, setDepartment] = useState('');
  const [selectedSkills, setSelectedSkills] = useState<Skill[]>([]);

  useEffect(() => {
    async function fetchData() {
      if (!user) return;

      try {
        // Fetch manager's department from employees table
        const { data: employeeData, error: employeeError } = await supabase
          .from('employees')
          .select('department')
          .eq('id', user.id)
          .maybeSingle();

        if (employeeError) throw employeeError;
        if (employeeData?.department) {
          setDepartment(employeeData.department);
        }

        // Fetch all skills
        const { data: skillsData, error: skillsError } = await supabase
          .from('skills')
          .select('*')
          .order('category', { ascending: true })
          .order('name', { ascending: true });

        if (skillsError) throw skillsError;
        setSkills(skillsData || []);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [user]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (role !== 'manager' && role !== 'hr' && role !== 'executive') {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">Access denied. This page is only available to managers.</Alert>
      </Box>
    );
  }

  const handleNext = () => {
    if (activeStep === 0 && !roleTitle.trim()) {
      setError('Role title is required');
      return;
    }
    if (activeStep === 1 && selectedSkills.length === 0) {
      setError('Please select at least one skill');
      return;
    }
    setError(null);
    setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const handleSubmit = async () => {
    if (!user) return;

    setSubmitting(true);
    setError(null);

    try {
      // Prepare the required_skills_json with full skill objects
      const requiredSkillsJson = selectedSkills.map(skill => ({
        id: skill.id,
        name: skill.name,
        category: skill.category,
      }));

      const { error: insertError } = await supabase
        .from('process_requisitions')
        .insert({
          manager_id: user.id,
          role_title: roleTitle,
          department: department || null,
          status: 'PENDING_SCAN',
          required_skills_json: requiredSkillsJson,
        });

      if (insertError) throw insertError;

      // Get the inserted requisition ID
      const { data: insertedRequisition, error: fetchError } = await supabase
        .from('process_requisitions')
        .select('id')
        .eq('manager_id', user.id)
        .eq('role_title', roleTitle)
        .eq('status', 'PENDING_SCAN')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (fetchError) throw fetchError;

      // Trigger the edge function to scan for internal candidates
      const { error: functionError } = await supabase.functions.invoke('scan-for-internal-hires', {
        body: { requisition_id: insertedRequisition.id }
      });

      if (functionError) {
        console.error('Error invoking scan function:', functionError);
        setError('Requisition created but failed to start scanning. Please contact support.');
        return;
      }

      setSuccessMessage('Requisition submitted! The system is now scanning for internal candidates.');
      
      // Reset form
      setRoleTitle('');
      setSelectedSkills([]);
      setActiveStep(0);
      
    } catch (err) {
      console.error('Error submitting requisition:', err);
      setError(err instanceof Error ? err.message : 'Failed to submit requisition');
    } finally {
      setSubmitting(false);
    }
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <TextField
              label="Role Title"
              value={roleTitle}
              onChange={(e) => setRoleTitle(e.target.value)}
              fullWidth
              required
            />
            <TextField
              label="Department"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              fullWidth
              required
            />
          </Box>
        );
      case 1:
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Autocomplete
              multiple
              options={skills}
              getOptionLabel={(option) => `${option.name} (${option.category})`}
              value={selectedSkills}
              onChange={(_, newValue) => setSelectedSkills(newValue)}
              renderInput={(params) => (
                <TextField {...params} label="Required Skills" placeholder="Select skills" />
              )}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip
                    label={`${option.name} (${option.category})`}
                    {...getTagProps({ index })}
                    color="primary"
                  />
                ))
              }
            />
          </Box>
        );
      case 2:
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant="h6">Review Your Requisition</Typography>
            <Box>
              <Typography variant="body2" color="text.secondary">Role Title</Typography>
              <Typography variant="body1">{roleTitle}</Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">Department</Typography>
              <Typography variant="body1">{department}</Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">Required Skills</Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
                {selectedSkills.map((skill) => (
                  <Chip key={skill.id} label={skill.name} color="primary" />
                ))}
              </Box>
            </Box>
          </Box>
        );
      default:
        return null;
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 3, fontWeight: 600 }}>
        New Hiring Requisition
      </Typography>

      {successMessage && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccessMessage(null)}>
          {successMessage}
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Card>
        <CardContent>
          <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {renderStepContent()}

          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
            <Button
              disabled={activeStep === 0}
              onClick={handleBack}
            >
              Back
            </Button>
            <Button
              variant="contained"
              onClick={activeStep === steps.length - 1 ? handleSubmit : handleNext}
              disabled={submitting}
            >
              {submitting ? (
                <CircularProgress size={24} />
              ) : activeStep === steps.length - 1 ? (
                'Submit'
              ) : (
                'Next'
              )}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
