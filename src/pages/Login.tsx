import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  Stack,
} from "@mui/material";
import { supabase } from "@/integrations/supabase/client";

// Input validation schema
const loginSchema = z.object({
  email: z.string().trim().email({ message: "Invalid email address" }).max(255),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }).max(100),
});

const signUpSchema = loginSchema.extend({
  fullName: z.string().trim().min(1, { message: "Full name is required" }).max(100),
});

const Login = () => {
  const navigate = useNavigate();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Validate inputs
      const schema = isSignUp ? signUpSchema : loginSchema;
      const validationResult = schema.safeParse({
        email: email.trim(),
        password,
        ...(isSignUp && { fullName: fullName.trim() }),
      });

      if (!validationResult.success) {
        const firstError = validationResult.error.errors[0];
        setError(firstError.message);
        setLoading(false);
        return;
      }

      if (isSignUp) {
        const { error: signUpError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              full_name: fullName.trim(),
            },
            emailRedirectTo: `${window.location.origin}/dashboard`,
          },
        });

        if (signUpError) throw signUpError;
        
        // Auto-login after signup
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (signInError) throw signInError;
        navigate("/dashboard");
      } else {
        // Login flow
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (signInError) throw signInError;
        navigate("/dashboard");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred during authentication");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "background.default",
        padding: 2,
      }}
    >
      <Card sx={{ maxWidth: 480, width: "100%", boxShadow: 3 }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
            Atlas
          </Typography>
          <Typography variant="body1" color="text.secondary" mb={3}>
            {isSignUp
              ? "Create your account to get started"
              : "Sign in to manage your workforce"}
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <Stack spacing={2}>
              {isSignUp && (
                <TextField
                  fullWidth
                  label="Full Name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  disabled={loading}
                  inputProps={{ maxLength: 100 }}
                />
              )}

              <TextField
                fullWidth
                type="email"
                label="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                inputProps={{ maxLength: 255 }}
              />

              <TextField
                fullWidth
                type="password"
                label="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                inputProps={{ maxLength: 100 }}
              />

              <Button
                type="submit"
                variant="contained"
                size="large"
                fullWidth
                disabled={loading}
                sx={{ mt: 2 }}
              >
                {loading ? "Please wait..." : isSignUp ? "Sign Up" : "Sign In"}
              </Button>

              <Button
                variant="text"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setError("");
                }}
                disabled={loading}
              >
                {isSignUp
                  ? "Already have an account? Sign In"
                  : "Need an account? Sign Up"}
              </Button>
            </Stack>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Login;
