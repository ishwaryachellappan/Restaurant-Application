import { useEffect, useState } from "react";
import "./CashierDashboard.css";

function CashierDashboard({ user, onLogout }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadOrders = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        "http://localhost:5000/api/cashier/orders"
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Unable to load cashier orders."
        );
      }

      setOrders(data.orders || []);
    } catch (error) {
      console.error("Cashier orders error:", error);
      setError(
        "Unable to load orders. Please make sure the backend is running."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const handleViewBill = (order) => {
    console.log("Selected order:", order);
  };

  return (
    <div className="cashier-page">
      {/* Header */}
      <header className="cashier-header">
        <div>
          <h1>Cashier Dashboard</h1>
          <p>
            Welcome, <strong>{user?.name}</strong>
          </p>
        </div>

        <div className="cashier-header-actions">
          <button
            className="cashier-refresh-button"
            onClick={loadOrders}
          >
            ↻ Refresh
          </button>

          <button
            className="cashier-logout-button"
            onClick={onLogout}
          >
            Logout
          </button>
        </div>
      </header>

      {/* Summary */}
      <section className="cashier-summary">
        <div className="cashier-summary-card">
          <span className="summary-label">
            Ready for Payment
          </span>

          <span className="summary-value">
            {orders.length}
          </span>
        </div>
      </section>

      {/* Main Content */}
      <main className="cashier-content">
        <div className="cashier-section-header">
          <div>
            <h2>Orders Ready for Payment</h2>
            <p>
              Orders completed by the kitchen and waiting
              for payment.
            </p>
          </div>
        </div>

        {loading && (
          <div className="cashier-message">
            Loading orders...
          </div>
        )}

        {!loading && error && (
          <div className="cashier-message cashier-error">
            {error}
          </div>
        )}

        {!loading && !error && orders.length === 0 && (
          <div className="cashier-empty">
            <div className="cashier-empty-icon">
              ✓
            </div>

            <h3>No orders ready for payment</h3>

            <p>
              When the kitchen marks an order as ready,
              it will appear here.
            </p>
          </div>
        )}

        {!loading && !error && orders.length > 0 && (
          <div className="cashier-orders-grid">
            {orders.map((order) => (
              <div
                className="cashier-order-card"
                key={order._id}
              >
                {/* Order Header */}
                <div className="cashier-order-header">
                  <div>
                    <span className="cashier-table-number">
                      Table {order.tableNumber}
                    </span>

                    <h3>{order.orderNumber}</h3>
                  </div>

                  <span className="cashier-ready-badge">
                    READY
                  </span>
                </div>

                {/* Items */}
                <div className="cashier-items">
                  {order.items.map((item, index) => (
                    <div
                      className="cashier-item"
                      key={`${item.menuItemId}-${index}`}
                    >
                      <div className="cashier-item-info">
                        <strong>
                          {item.name}
                        </strong>

                        <span>
                          {item.category}
                        </span>
                      </div>

                      <div className="cashier-item-quantity">
                        × {item.quantity}
                      </div>

                      <div className="cashier-item-total">
                        ₹
                        {Number(
                          item.itemTotal || 0
                        ).toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Total */}
                <div className="cashier-order-total">
                  <span>Total Amount</span>

                  <strong>
                    ₹
                    {Number(
                      order.total || 0
                    ).toFixed(2)}
                  </strong>
                </div>

                {/* Action */}
                <button
                  className="cashier-view-bill-button"
                  onClick={() =>
                    handleViewBill(order)
                  }
                >
                  VIEW BILL
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default CashierDashboard;