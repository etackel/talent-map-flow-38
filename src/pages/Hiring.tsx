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
import { useUserRole } from '@/hooks/useUserRole';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';

interface Skill {
  id: number;
  name: string;
  category: string;
}

const steps = ['Role Details', 'Required Skills', 'Review & Submit'];

export default function Hiring() {
  const { role, loading: roleLoading } = useUserRole();
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [skills, setSkills] = useState<Skill[]>([]);
  
  // Form state
  const [roleTitle, setRoleTitle] = useState('');
  const [department, setDepartment] = useState('');
  const [selectedSkills, setSelectedSkills] = useState<Skill[]>([]);

  useEffect(() => {
    async function fetchSkills() {
      const { data } = await supabase
        .from('skills')
        .select('*')
        .order('name');
      
      if (data) setSkills(data);
    }

    fetchSkills();
  }, []);

  if (roleLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (role !== 'manager' && role !== 'hr' && role !== 'executive') {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">Access denied. This page is only available to managers and HR.</Alert>
      </Box>
    );
  }

  const handleNext = () => {
    if (activeStep === 0 && (!roleTitle || !department)) {
      toast({ title: 'Please fill in all fields', variant: 'destructive' });
      return;
    }
    if (activeStep === 1 && selectedSkills.length === 0) {
      toast({ title: 'Please select at least one skill', variant: 'destructive' });
      return;
    }
    setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: insertData, error } = await supabase
        .from('process_requisitions')
        .insert({
          manager_id: user.id,
          role_title: roleTitle,
          department,
          required_skills_json: selectedSkills.map(s => ({ id: s.id, name: s.name })),
          status: 'PENDING_SCAN',
        })
        .select()
        .single();

      if (error) throw error;

      // Trigger the internal candidate scanning
      if (insertData) {
        supabase.functions.invoke('scan-for-internal-hires', {
          body: { requisition_id: insertData.id }
        }).then(({ data, error: fnError }) => {
          if (fnError) {
            console.error('Error scanning for internal candidates:', fnError);
          } else {
            console.log('Internal candidate scan result:', data);
          }
        });
      }

      toast({ 
        title: 'Requisition submitted successfully!',
        description: 'The system is now scanning for internal candidates.'
      });
      
      // Reset form
      setRoleTitle('');
      setDepartment('');
      setSelectedSkills([]);
      setActiveStep(0);
      
    } catch (error) {
      console.error('Error creating requisition:', error);
      toast({ 
        title: 'Failed to create requisition',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
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
        Create Hiring Requisition
      </Typography>

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
              disabled={loading}
            >
              {loading ? (
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
