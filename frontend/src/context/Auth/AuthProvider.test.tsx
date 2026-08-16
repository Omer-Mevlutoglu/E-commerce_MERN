import { describe, it, expect } from "vitest";
import { useEffect } from "react";
import { act, render, screen, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import AuthProvider from "./AuthProvider";
import { useAuth } from "./AuthContext";
import { server, API, apiError } from "../../test/server";
import { makeToken, expiredToken } from "../../test/token";

/** Renders the context values so assertions can read them from the DOM. */
const Probe = () => {
  const {
    isAuthenticated,
    isAdmin,
    username,
    userRole,
    myOrders,
    logout,
    getMyOrders,
  } = useAuth();

  return (
    <div>
      <span data-testid="authed">{String(isAuthenticated)}</span>
      <span data-testid="admin">{String(isAdmin)}</span>
      <span data-testid="username">{username ?? "-"}</span>
      <span data-testid="role">{userRole ?? "-"}</span>
      <span data-testid="orders">{myOrders.length}</span>
      <button onClick={logout}>logout</button>
      <button onClick={getMyOrders}>load orders</button>
    </div>
  );
};

const renderAuth = () =>
  render(
    <AuthProvider>
      <Probe />
    </AuthProvider>
  );

describe("AuthProvider", () => {
  it("starts signed out when nothing is stored", () => {
    renderAuth();

    expect(screen.getByTestId("authed")).toHaveTextContent("false");
    expect(screen.getByTestId("role")).toHaveTextContent("-");
  });

  it("restores a stored session on load", () => {
    localStorage.setItem("token", makeToken({ role: "user" }));
    localStorage.setItem("username", "restored@example.com");

    renderAuth();

    expect(screen.getByTestId("authed")).toHaveTextContent("true");
    expect(screen.getByTestId("username")).toHaveTextContent(
      "restored@example.com"
    );
  });

  it("reads the role from the token", () => {
    localStorage.setItem("token", makeToken({ role: "admin" }));

    renderAuth();

    expect(screen.getByTestId("admin")).toHaveTextContent("true");
    expect(screen.getByTestId("role")).toHaveTextContent("admin");
  });

  it("is authenticated but not admin for a customer token", () => {
    localStorage.setItem("token", makeToken({ role: "user" }));

    renderAuth();

    expect(screen.getByTestId("authed")).toHaveTextContent("true");
    expect(screen.getByTestId("admin")).toHaveTextContent("false");
  });

  // Without this the app boots "logged in" with a token every request rejects.
  it("discards an expired token on load", () => {
    localStorage.setItem("token", expiredToken());
    localStorage.setItem("username", "stale@example.com");

    renderAuth();

    expect(screen.getByTestId("authed")).toHaveTextContent("false");
    expect(localStorage.getItem("token")).toBeNull();
    expect(localStorage.getItem("username")).toBeNull();
  });

  it("treats an unparseable token as signed out", () => {
    localStorage.setItem("token", "this-is-not-a-jwt");

    renderAuth();

    expect(screen.getByTestId("authed")).toHaveTextContent("false");
  });

  it("clears storage and state on logout", async () => {
    localStorage.setItem("token", makeToken());
    localStorage.setItem("username", "bye@example.com");
    renderAuth();

    await act(async () => {
      screen.getByText("logout").click();
    });

    expect(screen.getByTestId("authed")).toHaveTextContent("false");
    expect(localStorage.getItem("token")).toBeNull();
    expect(localStorage.getItem("username")).toBeNull();
  });

  it("loads the signed-in customer's orders", async () => {
    server.use(
      http.get(`${API}/orders`, () =>
        HttpResponse.json([
          { _id: "o1", orderItems: [], total: 10, address: "A", fullName: "B" },
        ])
      )
    );
    localStorage.setItem("token", makeToken());
    renderAuth();

    await act(async () => {
      screen.getByText("load orders").click();
    });

    await waitFor(() =>
      expect(screen.getByTestId("orders")).toHaveTextContent("1")
    );
  });

  it("drops stored orders on logout", async () => {
    server.use(
      http.get(`${API}/orders`, () =>
        HttpResponse.json([
          { _id: "o1", orderItems: [], total: 10, address: "A", fullName: "B" },
        ])
      )
    );
    localStorage.setItem("token", makeToken());
    renderAuth();

    await act(async () => {
      screen.getByText("load orders").click();
    });
    await waitFor(() =>
      expect(screen.getByTestId("orders")).toHaveTextContent("1")
    );

    await act(async () => {
      screen.getByText("logout").click();
    });

    expect(screen.getByTestId("orders")).toHaveTextContent("0");
  });

  /**
   * Regression: the API client used to be configured in a useEffect here, but
   * React runs child effects before parent effects — so a page that fetches on
   * mount sent its first request with no Authorization header and got a 401.
   * Refreshing on /my-orders showed an empty list as a result.
   */
  it("authenticates a request a child fires during its own mount effect", async () => {
    let authHeader: string | null = "never-called";
    server.use(
      http.get(`${API}/orders`, ({ request }) => {
        authHeader = request.headers.get("authorization");
        return HttpResponse.json([]);
      })
    );
    const token = makeToken();
    localStorage.setItem("token", token);

    const FetchesOnMount = () => {
      const { getMyOrders } = useAuth();
      useEffect(() => {
        getMyOrders();
      }, [getMyOrders]);
      return null;
    };

    render(
      <AuthProvider>
        <FetchesOnMount />
      </AuthProvider>
    );

    await waitFor(() => expect(authHeader).toBe(`Bearer ${token}`));
  });

  // The gap the shared API client closes: a token the server rejects must end
  // the session rather than leave the UI stuck in a signed-in state.
  it("signs out when the API answers 401", async () => {
    server.use(
      http.get(`${API}/orders`, () =>
        apiError(401, "TokenExpired", "Session expired, please log in again")
      )
    );
    localStorage.setItem("token", makeToken());
    renderAuth();

    expect(screen.getByTestId("authed")).toHaveTextContent("true");

    await act(async () => {
      screen.getByText("load orders").click();
    });

    await waitFor(() =>
      expect(screen.getByTestId("authed")).toHaveTextContent("false")
    );
    expect(localStorage.getItem("token")).toBeNull();
  });
});
