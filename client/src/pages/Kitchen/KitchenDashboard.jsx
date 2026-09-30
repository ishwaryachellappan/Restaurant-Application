import { useEffect, useState } from "react";
import "./KitchenDashboard.css";

function KitchenDashboard({ user, onLogout }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadOrders = async () => {
    try {
      setError("");

      const response = await fetch(
        "http://localhost:5000/api/kitchen/orders"
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to load kitchen orders");
      }

      setOrders(data.orders || []);
    } catch (err) {
      console.error("Kitchen orders error:", err);
      setError(err.message || "Failed to load kitchen orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  return (
    <div className="kitchen-page">
      <header className="kitchen-header">
        <div>
          <h1>Kitchen Dashboard</h1>
          <p>
            Welcome, {user?.name || "Kitchen Staff"}
          </p>
        </div>

        <button className="kitchen-logout" onClick={onLogout}>
          Logout
        </button>
      </header>

      <main className="kitchen-content">
        <div className="kitchen-title-row">
          <div>
            <h2>Kitchen Orders</h2>
            <p>
              {orders.length} active order
              {orders.length !== 1 ? "s" : ""}
            </p>
          </div>

          <button className="refresh-button" onClick={loadOrders}>
            Refresh
          </button>
        </div>

        {loading && (
          <div className="kitchen-message">
            Loading kitchen orders...
          </div>
        )}

        {!loading && error && (
          <div className="kitchen-error">
            {error}
          </div>
        )}

        {!loading && !error && orders.length === 0 && (
          <div className="kitchen-empty">
            <h3>No active orders</h3>
            <p>
              New orders sent by waiters will appear here.
            </p>
          </div>
        )}

        {!loading && !error && orders.length > 0 && (
          <div className="kitchen-orders-grid">
            {orders.map((order) => (
              <div
                className={`kitchen-order-card ${order.status.toLowerCase()}`}
                key={order._id}
              >
                <div className="order-card-header">
                  <div>
                    <span className="table-label">
                      TABLE {order.tableNumber}
                    </span>

                    <h3>{order.orderNumber}</h3>
                  </div>

                  <span className="order-status">
                    {order.status.replaceAll("_", " ")}
                  </span>
                </div>

                <div className="order-items">
                  {order.items.map((item, index) => (
                    <div
                      className="kitchen-item"
                      key={`${item.menuItemId}-${index}`}
                    >
                      <span className="item-name">
                        {item.name}
                      </span>

                      <span className="item-quantity">
                        × {item.quantity}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="order-card-footer">
                  <span>
                    Waiter: {order.waiterName}
                  </span>

                  <strong>
                    ₹{order.total}
                  </strong>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default KitchenDashboard;