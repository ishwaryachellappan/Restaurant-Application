import { useState } from "react";
import "./App.css";

import WaiterDashboard from "./pages/Waiter/WaiterDashboard";
import Tables from "./pages/Waiter/Tables";
import Order from "./pages/Waiter/Order/Order";
import KitchenDashboard from "./pages/Kitchen/KitchenDashboard";
import CashierDashboard from "./pages/Cashier/CashierDashboard";
import ManagerDashboard from "./pages/Manager/ManagerDashboard";
import ManagerOrders from "./pages/Manager/Orders/ManagerOrders";
import ManagerSales from "./pages/Manager/Sales/ManagerSales";

function App() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [currentPage, setCurrentPage] = useState("dashboard");
  const [selectedTable, setSelectedTable] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const [user, setUser] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // ------------------------------------------
  // LOGIN
  // ------------------------------------------

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

      // ------------------------------------------
      // ROLE CHECK
      // ------------------------------------------

      const role = data.user.role?.toUpperCase();

   if (
  role !== "WAITER" &&
  role !== "KITCHEN" &&
  role !== "CASHIER" &&
  role !== "MANAGER"
) {
        setError(
          "This account does not have access to the current system."
        );
        return;
      }

      // Store logged-in user
      setUser(data.user);

      // ------------------------------------------
      // ROLE-BASED LANDING PAGE
      // ------------------------------------------

      if (role === "WAITER") {
        setCurrentPage("dashboard");
      }

      if (role === "KITCHEN") {
        setCurrentPage("kitchen");
      }

      if (role === "CASHIER") {
  setCurrentPage("cashier");
}

if (role === "MANAGER") {
  setCurrentPage("manager");
}

    } catch (error) {
      console.error("Login error:", error);

      setError(
        "Unable to connect to the server. Please make sure the backend is running."
      );
    } finally {
      setLoading(false);
    }
  };

  // ------------------------------------------
  // LOGOUT
  // ------------------------------------------

  const handleLogout = () => {
    setUser(null);

    setCurrentPage("dashboard");

    setSelectedTable(null);
    setSelectedOrder(null);

    setUsername("");
    setPassword("");
    setError("");
  };

  // ------------------------------------------
  // TABLE SELECTION
  // ------------------------------------------

  const handleTableSelect = async (table) => {
    console.log("Selected table:", table);

    setSelectedTable(table);

    // ------------------------------------------
    // AVAILABLE TABLE
    // ------------------------------------------
    // Open a fresh order

    if (
      !table.currentOrder ||
      table.status?.toUpperCase() !== "OCCUPIED"
    ) {
      setSelectedOrder(null);
      setCurrentPage("order");
      return;
    }

    // ------------------------------------------
    // OCCUPIED TABLE
    // ------------------------------------------
    // Load the existing order

    try {
      const response = await fetch(
        `http://localhost:5000/api/orders/${table.currentOrder}`
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Unable to load existing order."
        );
      }

      console.log("Existing order:", data.order);

      setSelectedOrder(data.order);
      setCurrentPage("order");

    } catch (error) {
      console.error(
        "Load existing order error:",
        error
      );

      alert(
        "Unable to load the existing order. Please try again."
      );
    }
  };

  // ------------------------------------------
  // LOGGED-IN USER
  // ------------------------------------------

  if (user) {

    // ------------------------------------------
    // KITCHEN
    // ------------------------------------------

    if (currentPage === "kitchen") {
      return (
        <KitchenDashboard
          user={user}
          onLogout={handleLogout}
        />
      );
    }

    if (currentPage === "cashier") {
  return (
    <CashierDashboard
      user={user}
      onLogout={handleLogout}
    />
  );
}

if (currentPage === "manager-sales") {
  return (
    <ManagerSales
      user={user}
      onBack={() =>
        setCurrentPage("manager")
      }
      onOrders={() =>
        setCurrentPage("manager-orders")
      }
      onLogout={handleLogout}
    />
  );
}

if (currentPage === "manager-orders") {
  return (
    <ManagerOrders
      user={user}
      onBack={() =>
        setCurrentPage("manager")
      }
      onLogout={handleLogout}
    />
  );
}

if (currentPage === "manager") {
  return (
    <ManagerDashboard
      user={user}
      onLogout={handleLogout}
      onOpenOrders={() =>
        setCurrentPage("manager-orders")
      }
      onOpenSales={() =>
        setCurrentPage("manager-sales")
      }
    />
  );
}

    // ------------------------------------------
    // WAITER - TABLES
    // ------------------------------------------

    if (currentPage === "tables") {
      return (
        <Tables
          user={user}
          onBack={() => setCurrentPage("dashboard")}
          onTableSelect={handleTableSelect}
        />
      );
    }

    // ------------------------------------------
    // WAITER - ORDER
    // ------------------------------------------

    if (currentPage === "order" && selectedTable) {
      return (
        <Order
          table={selectedTable}
          user={user}
          existingOrder={selectedOrder}
          onBack={() => {
            setSelectedOrder(null);
            setCurrentPage("tables");
          }}
        />
      );
    }

    // ------------------------------------------
    // WAITER DASHBOARD
    // ------------------------------------------

    return (
      <WaiterDashboard
        user={user}
        onLogout={handleLogout}
        onOpenTables={() => setCurrentPage("tables")}
      />
    );
  }

  // ------------------------------------------
  // LOGIN PAGE
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