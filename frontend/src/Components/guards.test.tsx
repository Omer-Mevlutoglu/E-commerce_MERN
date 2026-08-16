import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import AuthProvider from "../context/Auth/AuthProvider";
import RequireUser from "./RequireUser";
import AdminRoute from "./AdminRoute";
import { makeToken } from "../test/token";

/**
 * Mounts the guard at /protected with recognisable stand-ins for each possible
 * destination, so a test can assert where the guard actually sent the user.
 */
const renderGuard = (Guard: () => React.JSX.Element) =>
  render(
    <AuthProvider>
      <MemoryRouter initialEntries={["/protected"]}>
        <Routes>
          <Route element={<Guard />}>
            <Route path="/protected" element={<div>PROTECTED</div>} />
          </Route>
          <Route path="/login" element={<div>LOGIN</div>} />
          <Route path="/" element={<div>HOME</div>} />
          <Route path="/admin/orders" element={<div>ADMIN DASHBOARD</div>} />
        </Routes>
      </MemoryRouter>
    </AuthProvider>
  );

const signIn = (role: "user" | "admin") =>
  localStorage.setItem("token", makeToken({ role }));

describe("RequireUser", () => {
  it("sends a signed-out visitor to login", () => {
    renderGuard(RequireUser);

    expect(screen.getByText("LOGIN")).toBeInTheDocument();
  });

  it("lets a customer through", () => {
    signIn("user");

    renderGuard(RequireUser);

    expect(screen.getByText("PROTECTED")).toBeInTheDocument();
  });

  it("redirects an admin to the admin dashboard", () => {
    signIn("admin");

    renderGuard(RequireUser);

    expect(screen.getByText("ADMIN DASHBOARD")).toBeInTheDocument();
    expect(screen.queryByText("PROTECTED")).not.toBeInTheDocument();
  });
});

describe("AdminRoute", () => {
  it("sends a signed-out visitor to login", () => {
    renderGuard(AdminRoute);

    expect(screen.getByText("LOGIN")).toBeInTheDocument();
  });

  it("sends a customer home", () => {
    signIn("user");

    renderGuard(AdminRoute);

    expect(screen.getByText("HOME")).toBeInTheDocument();
    expect(screen.queryByText("PROTECTED")).not.toBeInTheDocument();
  });

  it("lets an admin through", () => {
    signIn("admin");

    renderGuard(AdminRoute);

    expect(screen.getByText("PROTECTED")).toBeInTheDocument();
  });

  it("does not admit an expired admin token", () => {
    localStorage.setItem(
      "token",
      makeToken({ role: "admin", expiresInSeconds: -60 })
    );

    renderGuard(AdminRoute);

    expect(screen.getByText("LOGIN")).toBeInTheDocument();
  });
});
