import { useState } from "react";
import "./App.css";

import WaiterDashboard from "./pages/Waiter/WaiterDashboard";
import Tables from "./pages/Waiter/Tables";
import Order from "./pages/Waiter/Order/Order";


function App() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [currentPage, setCurrentPage] = useState("dashboard");
  const [selectedTable, setSelectedTable] = useState(null);

  const [user, setUser] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (event) => {
    event.preventDefault();

    setError("");

    if (!username.trim() || !password.trim()) {
      setError("Please enter your username and password.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        "http://localhost:5000/api/auth/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username,
            password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(data.message || "Invalid username or password.");
        return;
      }

      if (data.user.role !== "WAITER") {
        setError("This account does not have waiter access.");
        return;
      }

      setUser(data.user);
      setCurrentPage("dashboard");
    } catch (error) {
      console.error("Login error:", error);

      setError(
        "Unable to connect to the server. Please make sure the backend is running."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setUser(null);
    setCurrentPage("dashboard");
    setSelectedTable(null);

    setUsername("");
    setPassword("");
    setError("");
  };

  // ------------------------------------------
  // TABLE SELECTION
  // ------------------------------------------

 const handleTableSelect = (table) => {
  console.log("Selected table:", table);

  setSelectedTable(table);
  setCurrentPage("order");
};

  // ------------------------------------------
  // Logged-in user
  // ------------------------------------------

  if (user) {
    if (currentPage === "tables") {
      return (
        <Tables
          user={user}
          onBack={() => setCurrentPage("dashboard")}
          onTableSelect={handleTableSelect}
        />
      );
    }

    if (currentPage === "order" && selectedTable) {
  return (
    <Order
  table={selectedTable}
  user={user}
  onBack={() => setCurrentPage("tables")}
/>
  );
}

    return (
      <WaiterDashboard
        user={user}
        onLogout={handleLogout}
        onOpenTables={() => setCurrentPage("tables")}
      />
    );
  }

  // ------------------------------------------
  // Login Page
  // ------------------------------------------

  return (
    <div className="login-page">

      <div className="login-card">

        <div className="brand-section">

          <div className="restaurant-icon">
            🍽️
          </div>

          <h1>
            Restaurant POS
          </h1>

          <p>
            Welcome back
          </p>

        </div>

        <form
          onSubmit={handleLogin}
          className="login-form"
        >

          <div className="form-group">

            <label htmlFor="username">
              Username
            </label>

            <input
              id="username"
              type="text"
              placeholder="Enter your username"
              value={username}
              onChange={(event) =>
                setUsername(event.target.value)
              }
              autoComplete="username"
            />

          </div>

          <div className="form-group">

            <label htmlFor="password">
              Password
            </label>

            <div className="password-wrapper">

              <input
                id="password"
                type={
                  showPassword
                    ? "text"
                    : "password"
                }
                placeholder="Enter your password"
                value={password}
                onChange={(event) =>
                  setPassword(event.target.value)
                }
                autoComplete="current-password"
              />

              <button
                type="button"
                className="show-password"
                onClick={() =>
                  setShowPassword(!showPassword)
                }
              >
                {showPassword
                  ? "Hide"
                  : "Show"}
              </button>

            </div>

          </div>

          {error && (
            <div className="login-error">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="login-button"
            disabled={loading}
          >
            {loading
              ? "Signing in..."
              : "Login"}
          </button>

        </form>

        <div className="login-footer">
          <span>
            Restaurant Management System
          </span>
        </div>

      </div>

    </div>
  );
}

export default App;