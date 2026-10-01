import { useEffect, useState } from "react";
import "./MyOrders.css";
function MyOrders({ user, onBack, onLogout, onOpenOrder }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadOrders = async () => {
    try {
      setLoading(true);
      setError("");

      if (!user?.id) {
        setError("Waiter information is not available.");
        return;
      }

      const response = await fetch(
        `http://localhost:5000/api/orders/waiter/${user.id}`
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Unable to load your orders."
        );
      }

      setOrders(data.orders || []);
    } catch (error) {
      console.error("My Orders error:", error);
      setError(error.message || "Unable to load orders.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [user?.id]);

  const getStatusClass = (status) => {
    switch (status) {
      case "SENT_TO_KITCHEN":
        return "status-sent";

      case "PREPARING":
        return "status-preparing";

      case "READY":
        return "status-ready";

      case "COMPLETED":
        return "status-completed";

      default:
        return "status-default";
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "SENT_TO_KITCHEN":
        return "Sent to Kitchen";

      case "PREPARING":
        return "Preparing";

      case "READY":
        return "Ready";

      case "COMPLETED":
        return "Completed";

      default:
        return status || "Unknown";
    }
  };

  return (
    <div className="my-orders-page">

      {/* HEADER */}

      <header className="my-orders-header">

        <div className="my-orders-brand">

          <div className="my-orders-brand-icon">
            🍽️
          </div>

          <div>
            <h1>Restaurant POS</h1>
            <span>My Orders</span>
          </div>

        </div>

        <div className="my-orders-user">

          <div className="my-orders-user-info">
            <strong>
              {user?.name || "Waiter"}
            </strong>

            <span>
              {user?.role || "WAITER"}
            </span>
          </div>

          <button
            type="button"
            className="my-orders-logout"
            onClick={onLogout}
          >
            Logout
          </button>

        </div>

      </header>

      {/* MAIN */}

      <main className="my-orders-main">

        <div className="my-orders-toolbar">

          <div>
            <h2>My Orders</h2>

            <p>
              Orders created by {user?.name || "you"}
            </p>
          </div>

          <div className="my-orders-actions">

            <button
              type="button"
              className="my-orders-refresh"
              onClick={loadOrders}
              disabled={loading}
            >
              ↻ Refresh
            </button>

            <button
              type="button"
              className="my-orders-back"
              onClick={onBack}
            >
              ← Back
            </button>

          </div>

        </div>

        {/* ERROR */}

        {error && (
          <div className="my-orders-error">
            {error}
          </div>
        )}

        {/* LOADING */}

        {loading ? (
          <div className="my-orders-empty">
            <div className="my-orders-empty-icon">
              ⏳
            </div>

            <h3>Loading orders...</h3>

            <p>
              Please wait while your orders are loaded.
            </p>
          </div>
        ) : orders.length === 0 ? (

          /* NO ORDERS */

          <div className="my-orders-empty">

            <div className="my-orders-empty-icon">
              🧾
            </div>

            <h3>No Orders Yet</h3>

            <p>
              Orders created by you will appear here.
            </p>

          </div>

        ) : (

          /* ORDER LIST */

          <section className="my-orders-section">

            <div className="my-orders-count">
              {orders.length}{" "}
              {orders.length === 1 ? "Order" : "Orders"}
            </div>

            <div className="my-orders-list">

              {orders.map((order) => (

                <div
                  className="my-order-card"
                  onClick={() => onOpenOrder(order)}
                  key={order._id}
                >

                  {/* ORDER HEADER */}

                  <div className="my-order-header">

                    <div>
                      <span className="my-order-label">
                        ORDER
                      </span>

                      <h3>
                        {order.orderNumber}
                      </h3>
                    </div>

                    <span
                      className={`my-order-status ${getStatusClass(
                        order.status
                      )}`}
                    >
                      {getStatusText(order.status)}
                    </span>

                  </div>

                  {/* ORDER INFO */}

                  <div className="my-order-info">

                    <div className="my-order-info-item">

                      <span className="info-label">
                        TABLE
                      </span>

                      <strong>
                        {order.tableNumber}
                      </strong>

                    </div>

                    <div className="my-order-info-item">

                      <span className="info-label">
                        ITEMS
                      </span>

                      <strong>
                        {order.items?.reduce(
                          (total, item) =>
                            total +
                            Number(item.quantity || 0),
                          0
                        )}
                      </strong>

                    </div>

                    <div className="my-order-info-item">

                      <span className="info-label">
                        TOTAL
                      </span>

                      <strong className="my-order-total">
                        ₹{Number(order.total || 0).toFixed(2)}
                      </strong>

                    </div>

                  </div>

                  {/* ITEMS */}

                  <div className="my-order-items">

                    

                    <h4>
                      Order Items
                    </h4>

                    {order.items?.map((item, index) => (

                      <div
                        className="my-order-item"
                        key={`${order._id}-${index}`}
                      >

                        <div className="my-order-item-name">
                          <span>
                            {item.quantity} ×
                          </span>

                          <strong>
                            {item.name}
                          </strong>
                        </div>

                        <span>
                          ₹
                          {Number(
                            item.itemTotal ||
                            item.price *
                            item.quantity ||
                            0
                          ).toFixed(2)}
                        </span>




                      </div>

                    ))}

<div className="my-order-card-action">
                      View Details →
                    </div>
                    
                  </div>

                </div>

              ))}

            </div>

          </section>

        )}

      </main>

    </div>
  );
}

export default MyOrders;