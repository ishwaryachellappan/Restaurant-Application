import { useEffect, useState } from "react";
import "./KitchenDashboard.css";

function KitchenDashboard({ user, onLogout }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingOrderId, setUpdatingOrderId] = useState(null);

  // ------------------------------------------
  // LOAD KITCHEN ORDERS
  // ------------------------------------------

  const loadOrders = async () => {
    try {
      setError("");

      const response = await fetch(
        "http://localhost:5000/api/kitchen/orders"
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Failed to load kitchen orders"
        );
      }

      setOrders(data.orders || []);

    } catch (err) {
      console.error("Kitchen orders error:", err);

      setError(
        err.message || "Failed to load kitchen orders"
      );
    } finally {
      setLoading(false);
    }
  };

  // ------------------------------------------
  // INITIAL LOAD
  // ------------------------------------------

  useEffect(() => {
    loadOrders();
  }, []);

  // ------------------------------------------
  // UPDATE ORDER STATUS
  // ------------------------------------------

  const updateOrderStatus = async (orderId, action) => {
    try {
      setUpdatingOrderId(orderId);
      setError("");

      const response = await fetch(
        `http://localhost:5000/api/kitchen/orders/${orderId}/${action}`,
        {
          method: "PATCH",
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Failed to update order"
        );
      }

      console.log(
        "Kitchen order updated:",
        data.order
      );

      // Refresh orders from backend
      await loadOrders();

    } catch (err) {
      console.error(
        "Kitchen status update error:",
        err
      );

      setError(
        err.message || "Failed to update order"
      );
    } finally {
      setUpdatingOrderId(null);
    }
  };

  // ------------------------------------------
  // RENDER
  // ------------------------------------------

  return (
    <div className="kitchen-page">

      {/* HEADER */}
      <header className="kitchen-header">

        <div>
          <h1>Kitchen Dashboard</h1>

          <p>
            Welcome, {user?.name || "Kitchen Staff"}
          </p>
        </div>

        <button
          className="kitchen-logout"
          onClick={onLogout}
        >
          Logout
        </button>

      </header>

      {/* CONTENT */}
      <main className="kitchen-content">

        {/* TITLE */}
        <div className="kitchen-title-row">

          <div>
            <h2>Kitchen Orders</h2>

            <p>
              {orders.length} active order
              {orders.length !== 1 ? "s" : ""}
            </p>
          </div>

          <button
            className="refresh-button"
            onClick={loadOrders}
            disabled={loading}
          >
            {loading ? "Loading..." : "Refresh"}
          </button>

        </div>

        {/* ERROR */}
        {error && (
          <div className="kitchen-error">
            {error}
          </div>
        )}

        {/* LOADING */}
        {loading && (
          <div className="kitchen-message">
            Loading kitchen orders...
          </div>
        )}

        {/* EMPTY */}
        {!loading &&
          !error &&
          orders.length === 0 && (
            <div className="kitchen-empty">

              <h3>
                No active orders
              </h3>

              <p>
                New orders sent by waiters
                will appear here.
              </p>

            </div>
          )}

        {/* ORDERS */}
        {!loading &&
          !error &&
          orders.length > 0 && (

            <div className="kitchen-orders-grid">

              {orders.map((order) => {

                const isUpdating =
                  updatingOrderId === order._id;

                return (
                  <div
                    className={`kitchen-order-card ${order.status.toLowerCase()}`}
                    key={order._id}
                  >

                    {/* ORDER HEADER */}
                    <div className="order-card-header">

                      <div>

                        <span className="table-label">
                          TABLE {order.tableNumber}
                        </span>

                        <h3>
                          {order.orderNumber}
                        </h3>

                      </div>

                      <span
                        className={`order-status ${order.status.toLowerCase()}`}
                      >
                        {order.status.replaceAll(
                          "_",
                          " "
                        )}
                      </span>

                    </div>

                    {/* ITEMS */}
                    <div className="order-items">

                      {order.items.map(
                        (item, index) => (

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

                        )
                      )}

                    </div>

                    {/* FOOTER */}
                    <div className="order-card-footer">

                      <span>
                        Waiter: {order.waiterName}
                      </span>

                      <strong>
                        ₹{order.total}
                      </strong>

                    </div>

                    {/* ACTIONS */}

                    {order.status === "SENT_TO_KITCHEN" && (
                      <button
                        className="kitchen-action-button start-button"
                        disabled={isUpdating}
                        onClick={() =>
                          updateOrderStatus(
                            order._id,
                            "start"
                          )
                        }
                      >
                        {isUpdating
                          ? "Starting..."
                          : "START PREPARING"}
                      </button>
                    )}

                    {order.status === "PREPARING" && (
                      <button
                        className="kitchen-action-button ready-button"
                        disabled={isUpdating}
                        onClick={() =>
                          updateOrderStatus(
                            order._id,
                            "ready"
                          )
                        }
                      >
                        {isUpdating
                          ? "Updating..."
                          : "MARK READY"}
                      </button>
                    )}

                    {order.status === "READY" && (
                      <div className="ready-message">
                        ✓ Order Ready
                      </div>
                    )}

                  </div>
                );
              })}

            </div>
          )}

      </main>
    </div>
  );
}

export default KitchenDashboard;