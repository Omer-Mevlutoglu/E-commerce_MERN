import { Box, Container, Typography, TextField, Button } from "@mui/material";
import { useRef, useState } from "react";
import { useAuth } from "../context/Auth/AuthContext";
import { useNavigate } from "react-router-dom";
const BASE_URL = import.meta.env.VITE_BASE_URL;

const LoginPage = () => {
  const [error, setError] = useState("");
  const emailRef = useRef<HTMLInputElement>(null);
  const passowrdRef = useRef<HTMLInputElement>(null);
  const { login } = useAuth();
  const navigate = useNavigate();
  const HandleSunbmit = async () => {
    const email = emailRef.current?.value;
    const password = passowrdRef.current?.value;

    if (!email || !password) {
      setError("Inavalid data");
      return;
    }

    const response = await fetch(`${BASE_URL}/users/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        password,
      }),
    });

    if (!response.ok) {
      setError("Unable to Login the user , please try a different credintials");
      return;
    }
    const token = await response.json();
    if (!token) {
      setError("No data is found");
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
          }}
        >
          <TextField inputRef={emailRef} label="Email" name="email" />
          <TextField
            inputRef={passowrdRef}
            type="password"
            label="password"
            name="password"
          />
          <Button onClick={HandleSunbmit} variant="contained" color="primary">
            Login
          </Button>
          {error && (
            <Typography variant="body1" color="red">
              {error}
            </Typography>
          )}
        </Box>
      </Box>
    </Container>
  );
};

export default LoginPage;
