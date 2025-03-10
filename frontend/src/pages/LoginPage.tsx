import { Box, Container, Typography, TextField, Button } from "@mui/material";
import { useRef, useState } from "react";
import { useAuth } from "../context/Auth/AuthContext";
import { useNavigate } from "react-router-dom";

const BASE_URL = import.meta.env.VITE_BASE_URL;

const LoginPage = () => {
  const [error, setError] = useState("");
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null); // Fixed typo
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async () => {
    const email = emailRef.current?.value;
    const password = passwordRef.current?.value; // Fixed typo

    if (!email || !password) {
      setError("Invalid data");
      return;
    }

    const response = await fetch(`${BASE_URL}/users/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      setError("Unable to login, please try different credentials.");
      return;
    }

    const token = await response.json();
    if (!token) {
      setError("No data found");
      return;
    }

    login(email, token);
    navigate("/");
  };

  return (
    <Container>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          mt: 6,
        }}
      >
        <Typography variant="h6">Login to your Account</Typography>

        <Box
          sx={{
            display: "flex",
            border: "1px solid #f5f5f5",
            flexDirection: "column",
            p: 2,
            gap: 2,
            mt: 2,
            maxWidth: "400px",
            borderRadius: "8px",
            boxShadow: "0px 2px 10px rgba(0,0,0,0.1)",
          }}
        >
          <TextField inputRef={emailRef} label="Email" name="email" />
          <TextField
            inputRef={passwordRef}
            type="password"
            label="Password"
            name="password"
          />
          <Button onClick={handleSubmit} variant="contained" color="primary">
            Login
          </Button>

          {/* "Can’t sign in?" text with navigation */}
          <Typography
            variant="body1"
            sx={{
              cursor: "pointer",
              textAlign: "center",
              color: "blue",
              textDecoration: "underline",
              "&:hover": { color: "darkblue" },
            }}
            onClick={() => navigate("/register")}
          >
            Can't sign in?
          </Typography>

          {error && (
            <Typography variant="body1" color="error">
              {error}
            </Typography>
          )}
        </Box>
      </Box>
    </Container>
  );
};

export default LoginPage;
