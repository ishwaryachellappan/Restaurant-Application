import "./WaiterDashboard.css";

function WaiterDashboard({ user, onLogout, onOpenTables }) {
  return (
    <div className="waiter-dashboard">

      <header className="waiter-header">

        <div className="waiter-brand">
          <div className="waiter-brand-icon">
            🍽️
          </div>

          <div>
            <h1>Restaurant POS</h1>
            <span>Waiter Dashboard</span>
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

      <main className="waiter-main">

        <section className="welcome-section">

          <h2>
            Welcome, {user?.name || "Waiter"} 👋
          </h2>

          <p>
            Manage your tables and orders from here.
          </p>

        </section>

        <section className="waiter-cards">

          {/* TABLES */}

          <div className="waiter-card">

            <div className="card-icon">
              🪑
            </div>

            <div className="card-content">

              <h3>Tables</h3>

              <p>
                View and manage restaurant tables.
              </p>

              <button
                type="button"
                onClick={onOpenTables}
              >
                View Tables
              </button>

            </div>

          </div>

          {/* ORDERS */}

          <div className="waiter-card">

            <div className="card-icon">
              🧾
            </div>

            <div className="card-content">

              <h3>My Orders</h3>

              <p>
                View orders created by you.
              </p>

              <button type="button">
                View Orders
              </button>

            </div>

          </div>

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

              <button type="button">
                Create Order
              </button>

            </div>

          </div>

        </section>

        <section className="waiter-status">

          <h3>
            Today's Status
          </h3>

          <div className="status-grid">

            <div className="status-item">
              <span className="status-number">
                0
              </span>

              <span className="status-label">
                Active Tables
              </span>
            </div>

            <div className="status-item">
              <span className="status-number">
                0
              </span>

              <span className="status-label">
                Open Orders
              </span>
            </div>

            <div className="status-item">
              <span className="status-number">
                0
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