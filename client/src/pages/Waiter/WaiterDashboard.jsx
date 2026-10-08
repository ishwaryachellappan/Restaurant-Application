import { useEffect, useState } from "react";
import "./WaiterDashboard.css";
import {
  useRestaurantBranding,
} from "../../context/RestaurantBrandingContext";
function WaiterDashboard({
  user,
  onLogout,
  onNewOrder,
  onOpenOrders,
}) {

  const {
    restaurantName,
    restaurantLogo,
  } = useRestaurantBranding();


  const [status, setStatus] = useState({
    activeTables: 0,
    openOrders: 0,
    completedOrders: 0,
  });

  const [loadingStatus, setLoadingStatus] = useState(true);

  const loadTodayStatus = async () => {
    try {
      setLoadingStatus(true);

      // ------------------------------------------
      // LOAD TABLES
      // ------------------------------------------

      const tablesResponse = await fetch(
        "http://localhost:5000/api/tables"
      );

      const tablesData = await tablesResponse.json();

      const tables = tablesData.tables || [];

      const activeTables = tables.filter(
        (table) => table.status === "OCCUPIED"
      ).length;

      // ------------------------------------------
      // LOAD THIS WAITER'S ORDERS
      // ------------------------------------------

      let openOrders = 0;
      let completedOrders = 0;

      if (user?.id) {
        const ordersResponse = await fetch(
          `http://localhost:5000/api/orders/waiter/${user.id}`
        );

        const ordersData = await ordersResponse.json();

        const orders = ordersData.orders || [];

        // ------------------------------------------
        // OPEN ORDERS
        // ------------------------------------------

        openOrders = orders.filter(
          (order) =>
            order.status !== "COMPLETED" &&
            order.status !== "CANCELLED"
        ).length;

        // ------------------------------------------
        // COMPLETED ORDERS TODAY
        // ------------------------------------------

        const today = new Date();

        const startOfToday = new Date(today);
        startOfToday.setHours(0, 0, 0, 0);

        const endOfToday = new Date(today);
        endOfToday.setHours(23, 59, 59, 999);

        completedOrders = orders.filter((order) => {
          if (order.status !== "COMPLETED") {
            return false;
          }

          const completedDate = new Date(
            order.updatedAt || order.createdAt
          );

          return (
            completedDate >= startOfToday &&
            completedDate <= endOfToday
          );
        }).length;
      }

      setStatus({
        activeTables,
        openOrders,
        completedOrders,
      });
    } catch (error) {
      console.error(
        "Failed to load waiter dashboard status:",
        error
      );
    } finally {
      setLoadingStatus(false);
    }
  };

  useEffect(() => {
    loadTodayStatus();

    // Refresh dashboard status periodically
    const interval = setInterval(() => {
      loadTodayStatus();
    }, 30000);

    return () => clearInterval(interval);
  }, [user?.id]);

  return (
    <div className="waiter-dashboard">

      {/* HEADER */}

      <header className="waiter-header">

        <div className="waiter-brand">
          <div className="waiter-brand-icon">
            {restaurantLogo ? (
              <img
                src={restaurantLogo}
                alt={restaurantName}
              />
            ) : (
              "🍽"
            )}
          </div>

          <div>
            <strong>{restaurantName}</strong>
          </div>
        </div>

        <div className="waiter-user">

          <div className="waiter-user-info">

            <strong>
              {user?.name || "Waiter"}
            </strong>

            <span>
              {user?.role || "WAITER"}
            </span>

          </div>

          <button
            type="button"
            className="logout-button"
            onClick={onLogout}
          >
            Logout
          </button>

        </div>

      </header>

      {/* MAIN */}

      <main className="waiter-main">

        {/* WELCOME */}

        <section className="welcome-section">

          <h2>
            Welcome, {user?.name || "Waiter"} 👋
          </h2>

          <p>
            Manage your tables and orders from here.
          </p>

        </section>

        {/* MAIN CARDS */}

        <section className="waiter-cards">

          {/* NEW ORDER */}

          <div className="waiter-card">

            <div className="card-icon">
              🍴
            </div>

            <div className="card-content">

              <h3>New Order</h3>

              <p>
                Start a new customer order.
              </p>

              <button
                type="button"
                onClick={onNewOrder}
              >
                Create Order
              </button>

            </div>

          </div>

          {/* MY ORDERS */}

          <div className="waiter-card">

            <div className="card-icon">
              🧾
            </div>

            <div className="card-content">

              <h3>My Orders</h3>

              <p>
                View orders created by you.
              </p>

              <button
                type="button"
                onClick={onOpenOrders}
              >
                View Orders
              </button>

            </div>

          </div>



        </section>

        {/* TODAY'S STATUS */}

        <section className="waiter-status">

          <h3>
            Today's Status
          </h3>

          <div className="status-grid">

            {/* ACTIVE TABLES */}

            <div className="status-item">

              <span className="status-number">

                {loadingStatus
                  ? "..."
                  : status.activeTables}

              </span>

              <span className="status-label">
                Active Tables
              </span>

            </div>

            {/* OPEN ORDERS */}

            <div className="status-item">

              <span className="status-number">

                {loadingStatus
                  ? "..."
                  : status.openOrders}

              </span>

              <span className="status-label">
                Open Orders
              </span>

            </div>

            {/* COMPLETED ORDERS */}

            <div className="status-item">

              <span className="status-number">

                {loadingStatus
                  ? "..."
                  : status.completedOrders}

              </span>

              <span className="status-label">
                Completed Orders
              </span>

            </div>

          </div>

        </section>

      </main>

    </div>
  );
}

export default WaiterDashboard;