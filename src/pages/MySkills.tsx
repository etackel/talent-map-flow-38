import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Autocomplete,
  Slider,
  IconButton,
  Alert,
  CircularProgress,
} from "@mui/material";
import { Add, Delete } from "@mui/icons-material";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface Skill {
  id: number;
  name: string;
  category: string;
}

interface EmployeeSkill {
  id: number;
  skill_id: number;
  proficiency_level: number;
  skills: Skill;
}

const MySkills = () => {
  const { user } = useAuth();
  const [employeeSkills, setEmployeeSkills] = useState<EmployeeSkill[]>([]);
  const [allSkills, setAllSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);
  const [proficiency, setProficiency] = useState(3);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    if (!user) return;

    try {
      // Fetch user's skills
      const { data: skillsData, error: skillsError } = await supabase
        .from("employee_skills")
        .select(`
          id,
          skill_id,
          proficiency_level,
          skills (
            id,
            name,
            category
          )
        `)
        .eq("employee_id", user.id);

      if (skillsError) throw skillsError;

      setEmployeeSkills(skillsData || []);

      // Fetch all available skills
      const { data: allSkillsData, error: allSkillsError } = await supabase
        .from("skills")
        .select("*")
        .order("name");

      if (allSkillsError) throw allSkillsError;

      setAllSkills(allSkillsData || []);
    } catch (err: any) {
      console.error("Error fetching skills:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSkill = async () => {
    if (!selectedSkill || !user) return;

    setSubmitting(true);
    setError("");

    try {
      const { error: insertError } = await supabase.from("employee_skills").insert({
        employee_id: user.id,
        skill_id: selectedSkill.id,
        proficiency_level: proficiency,
      });

      if (insertError) throw insertError;

      setDialogOpen(false);
      setSelectedSkill(null);
      setProficiency(3);
      await fetchData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSkill = async (skillId: number) => {
    try {
      const { error: deleteError } = await supabase
        .from("employee_skills")
        .delete()
        .eq("id", skillId);

      if (deleteError) throw deleteError;

      await fetchData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const getProficiencyLabel = (level: number) => {
    const labels = ["Beginner", "Novice", "Intermediate", "Advanced", "Expert"];
    return labels[level - 1] || "Unknown";
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
            My Skills
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage your professional skills and proficiency levels
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setDialogOpen(true)}
        >
          Add Skill
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      <Card>
        <CardContent>
          {employeeSkills.length === 0 ? (
            <Box textAlign="center" py={4}>
              <Typography color="text.secondary">
                No skills added yet. Click "Add Skill" to get started.
              </Typography>
            </Box>
          ) : (
            <TableContainer component={Paper} elevation={0}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>
                      <strong>Skill Name</strong>
                    </TableCell>
                    <TableCell>
                      <strong>Category</strong>
                    </TableCell>
                    <TableCell>
                      <strong>Proficiency</strong>
                    </TableCell>
                    <TableCell align="right">
                      <strong>Actions</strong>
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {employeeSkills.map((skill) => (
                    <TableRow key={skill.id}>
                      <TableCell>{skill.skills.name}</TableCell>
                      <TableCell>{skill.skills.category}</TableCell>
                      <TableCell>
                        {getProficiencyLabel(skill.proficiency_level)} ({skill.proficiency_level}/5)
                      </TableCell>
                      <TableCell align="right">
                        <IconButton
                          color="error"
                          size="small"
                          onClick={() => handleDeleteSkill(skill.id)}
                        >
                          <Delete />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add New Skill</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: "flex", flexDirection: "column", gap: 3 }}>
            <Autocomplete
              options={allSkills}
              getOptionLabel={(option) => `${option.name} (${option.category})`}
              value={selectedSkill}
              onChange={(_, newValue) => setSelectedSkill(newValue)}
              renderInput={(params) => (
                <TextField {...params} label="Select Skill" required />
              )}
            />

            <Box>
              <Typography gutterBottom>
                Proficiency Level: {getProficiencyLabel(proficiency)}
              </Typography>
              <Slider
                value={proficiency}
                onChange={(_, value) => setProficiency(value as number)}
                min={1}
                max={5}
                step={1}
                marks
                valueLabelDisplay="auto"
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button
            onClick={handleAddSkill}
            variant="contained"
            disabled={!selectedSkill || submitting}
          >
            {submitting ? "Adding..." : "Add Skill"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MySkills;
