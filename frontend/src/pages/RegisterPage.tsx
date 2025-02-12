import { Box, Container, Typography, TextField, Button } from "@mui/material";
import { useRef, useState } from "react";
const BASE_URL = import.meta.env.VITE_BASE_URL;

const RegisterPage = () => {
  const [error, setError] = useState("");
  const firstNameRef = useRef<HTMLInputElement>(null);
  const lastNameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const passowrdRef = useRef<HTMLInputElement>(null);

  const HandleSunbmit = async () => {
    const firstName = firstNameRef.current?.value;
    const lastName = lastNameRef.current?.value;
    const email = emailRef.current?.value;
    const password = passowrdRef.current?.value;

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
    const data = await response.json();

    console.log(data);
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
