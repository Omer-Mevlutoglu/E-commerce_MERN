import { Box, Container, Typography, TextField, Button } from "@mui/material";
import { useRef, useState } from "react";
import { useAuth } from "../context/Auth/AuthContext";
const BASE_URL = import.meta.env.VITE_BASE_URL;

const RegisterPage = () => {
  const [error, setError] = useState("");
  const firstNameRef = useRef<HTMLInputElement>(null);
  const lastNameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const passowrdRef = useRef<HTMLInputElement>(null);
  const { login } = useAuth();
  const HandleSunbmit = async () => {
    const firstName = firstNameRef.current?.value;
    const lastName = lastNameRef.current?.value;
    const email = emailRef.current?.value;
    const password = passowrdRef.current?.value;

    if (!firstName || !lastName || !email || !password) {
      setError("A7a");
      return;
    }

    const response = await fetch(`${BASE_URL}/users/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firstName,
        lastName,
        email,
        password,
      }),
    });

    if (!response.ok) {
      setError(
        "Unable to register the user , please try a different credintials"
      );
      return;
    }
    const token = await response.json();
    if (!token) {
      setError("No data is found");
    }
    login(email, token);
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
        <Typography variant="h6">Register New Account</Typography>

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
          <TextField
            inputRef={firstNameRef}
            label="First Name"
            name="firstName"
          />
          <TextField inputRef={lastNameRef} label="Last Name" name="lastName" />
          <TextField inputRef={emailRef} label="Email" name="email" />
          <TextField
            inputRef={passowrdRef}
            type="password"
            label="password"
            name="password"
          />
          <Button onClick={HandleSunbmit} variant="contained" color="primary">
            Register
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

export default RegisterPage;
