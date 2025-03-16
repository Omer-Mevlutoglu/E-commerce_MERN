import { Box, Container, Typography, TextField, Button } from "@mui/material";
import { useRef, useState } from "react";
import { useAuth } from "../context/Auth/AuthContext";
import { useNavigate } from "react-router-dom";
const BASE_URL = import.meta.env.VITE_BASE_URL;

const RegisterPage = () => {
  const [error, setError] = useState("");
  const firstNameRef = useRef<HTMLInputElement>(null);
  const lastNameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null); // Fixed typo
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async () => {
    // Fixed function name
    const firstName = firstNameRef.current?.value;
    const lastName = lastNameRef.current?.value;
    const email = emailRef.current?.value;
    const password = passwordRef.current?.value;

    if (!firstName || !lastName || !email || !password) {
      setError("Please fill all required fields");
      return;
    }

    try {
      const response = await fetch(`${BASE_URL}/users/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName, lastName, email, password }),
      });

      if (!response.ok) {
        throw new Error(
          "Registration failed - please try different credentials"
        );
      }

      const token = await response.json();
      login(email, token);
      navigate("/");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Registration failed");
    }
  };

  return (
    <Container maxWidth="xs">
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          minHeight: "80vh",
          py: 8,
          justifyContent: "center",
        }}
      >
        <Typography
          variant="h4"
          sx={{
            mb: 4,
            fontWeight: 700,
            textAlign: "center",
            color: "text.primary",
            letterSpacing: 0.5,
          }}
        >
          Create Account
        </Typography>

        <Box
          component="form"
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 3,
            p: 4,
            borderRadius: 4,
            boxShadow: 3,
            backgroundColor: "background.paper",
          }}
        >
          <TextField
            fullWidth
            inputRef={firstNameRef}
            label="First Name"
            InputProps={{
              sx: { borderRadius: 2 },
            }}
            InputLabelProps={{
              sx: { color: "text.secondary" },
            }}
          />

          <TextField
            fullWidth
            inputRef={lastNameRef}
            label="Last Name"
            InputProps={{
              sx: { borderRadius: 2 },
            }}
            InputLabelProps={{
              sx: { color: "text.secondary" },
            }}
          />

          <TextField
            fullWidth
            inputRef={emailRef}
            label="Email"
            type="email"
            InputProps={{
              sx: { borderRadius: 2 },
            }}
            InputLabelProps={{
              sx: { color: "text.secondary" },
            }}
          />

          <TextField
            fullWidth
            inputRef={passwordRef}
            type="password"
            label="Password"
            InputProps={{
              sx: { borderRadius: 2 },
            }}
            InputLabelProps={{
              sx: { color: "text.secondary" },
            }}
          />

          <Button
            fullWidth
            variant="contained"
            color="primary"
            onClick={handleSubmit}
            sx={{
              py: 1.5,
              borderRadius: 2,
              fontWeight: 600,
              letterSpacing: 1,
              textTransform: "uppercase",
              fontSize: "0.875rem",
              boxShadow: "none",
              "&:hover": {
                boxShadow: "0 4px 12px rgba(25, 118, 210, 0.3)",
                transform: "translateY(-1px)",
              },
              transition: "all 0.2s ease",
            }}
          >
            Create Account
          </Button>

          {error && (
            <Typography
              variant="body2"
              color="error"
              sx={{
                textAlign: "center",
                fontWeight: 500,
                px: 2,
                py: 1,
                borderRadius: 1,
                backgroundColor: "error.light + 15",
              }}
            >
              {error}
            </Typography>
          )}

          <Typography
            variant="body2"
            sx={{
              textAlign: "center",
              color: "text.secondary",
              mt: 1,
              "& span": {
                color: "secondary.main",
                cursor: "pointer",
                fontWeight: 600,
                "&:hover": {
                  textDecoration: "underline",
                },
              },
            }}
          >
            Already have an account?{" "}
            <span onClick={() => navigate("/login")}>Sign in</span>
          </Typography>
        </Box>
      </Box>
    </Container>
  );
};

export default RegisterPage;
