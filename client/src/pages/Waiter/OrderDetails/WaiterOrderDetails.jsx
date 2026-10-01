import "./WaiterOrderDetails.css";

function WaiterOrderDetails({
  order,
  user,
  onBack,
  onLogout,
}) {
  if (!order) {
    return (
      <div className="waiter-order-details-page">
        <div className="waiter-order-details-empty">
          <h2>Order not found</h2>

          <button
            type="button"
            onClick={onBack}
          >
            ← Back to My Orders
          </button>
        </div>
      </div>
    );
  }

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

  const getStatusClass = (status) => {
    switch (status) {
      case "SENT_TO_KITCHEN":
        return "sent";

      case "PREPARING":
        return "preparing";

      case "READY":
        return "ready";

      case "COMPLETED":
        return "completed";

      default:
        return "default";
    }
  };

  const getStepClass = (step) => {
    const steps = [
      "SENT_TO_KITCHEN",
      "PREPARING",
      "READY",
      "COMPLETED",
    ];

    const currentIndex = steps.indexOf(order.status);
    const stepIndex = steps.indexOf(step);

    if (currentIndex === -1) {
      return "";
    }

    if (stepIndex < currentIndex) {
      return "done";
    }

    if (stepIndex === currentIndex) {
      return "active";
    }

    return "";
  };

  const totalItems =
    order.items?.reduce(
      (total, item) =>
        total + Number(item.quantity || 0),
      0
    ) || 0;

  const formatDateTime = (date) => {
    if (!date) {
      return "-";
    }

    return new Date(date).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="waiter-order-details-page">

      {/* HEADER */}

      <header className="waiter-order-details-header">

        <div className="waiter-order-details-brand">

          <div className="waiter-order-details-brand-icon">
            🍽️
          </div>

          <div>
            <h1>Restaurant POS</h1>
            <span>Order Details</span>
          </div>

        </div>

        <div className="waiter-order-details-user">

          <div className="waiter-order-details-user-info">
            <strong>
              {user?.name || "Waiter"}
            </strong>

            <span>
              {user?.role || "WAITER"}
            </span>
          </div>

          <button
            type="button"
            className="waiter-order-details-logout"
            onClick={onLogout}
          >
            Logout
          </button>

        </div>

      </header>

      {/* MAIN */}

      <main className="waiter-order-details-main">

        {/* TOOLBAR */}

        <div className="waiter-order-details-toolbar">

          <button
            type="button"
            className="waiter-order-details-back"
            onClick={onBack}
          >
            ← Back to My Orders
          </button>

        </div>

        {/* ORDER SUMMARY */}

        <section className="order-details-summary">

          <div>

            <span className="order-details-label">
              ORDER
            </span>

            <h2>
              {order.orderNumber}
            </h2>

            <p>
              Created on {formatDateTime(order.createdAt)}
            </p>

          </div>

          <span
            className={`order-details-status ${getStatusClass(
              order.status
            )}`}
          >
            {getStatusText(order.status)}
          </span>

        </section>

        {/* ORDER INFO CARDS */}

        <section className="order-details-info-grid">

          <div className="order-details-info-card">
            <span>TABLE</span>
            <strong>
              Table {order.tableNumber}
            </strong>
          </div>

          <div className="order-details-info-card">
            <span>WAITER</span>
            <strong>
              {order.waiterName || user?.name || "-"}
            </strong>
          </div>

          <div className="order-details-info-card">
            <span>ITEMS</span>
            <strong>
              {totalItems}
            </strong>
          </div>

          <div className="order-details-info-card">
            <span>TOTAL</span>
            <strong className="order-details-total">
              ₹{Number(order.total || 0).toFixed(2)}
            </strong>
          </div>

        </section>

        {/* STATUS TIMELINE */}

        <section className="order-details-section">

          <div className="order-details-section-title">
            <h3>Order Status</h3>

            <span>
              {getStatusText(order.status)}
            </span>
          </div>

          <div className="order-status-timeline">

            <div
              className={`order-status-step ${getStepClass(
                "SENT_TO_KITCHEN"
              )}`}
            >
              <div className="order-status-circle">
                ✓
              </div>

              <div>
                <strong>Sent to Kitchen</strong>
                <span>
                  Order received by kitchen
                </span>
              </div>
            </div>

            <div
              className={`order-status-line ${
                getStepClass("PREPARING")
                  ? "filled"
                  : ""
              }`}
            />

            <div
              className={`order-status-step ${getStepClass(
                "PREPARING"
              )}`}
            >
              <div className="order-status-circle">
                ✓
              </div>

              <div>
                <strong>Preparing</strong>
                <span>
                  Kitchen is preparing the order
                </span>
              </div>
            </div>

            <div
              className={`order-status-line ${
                getStepClass("READY")
                  ? "filled"
                  : ""
              }`}
            />

            <div
              className={`order-status-step ${getStepClass(
                "READY"
              )}`}
            >
              <div className="order-status-circle">
                ✓
              </div>

              <div>
                <strong>Ready</strong>
                <span>
                  Order is ready for serving
                </span>
              </div>
            </div>

            <div
              className={`order-status-line ${
                getStepClass("COMPLETED")
                  ? "filled"
                  : ""
              }`}
            />

            <div
              className={`order-status-step ${getStepClass(
                "COMPLETED"
              )}`}
            >
              <div className="order-status-circle">
                ✓
              </div>

              <div>
                <strong>Completed</strong>
                <span>
                  Order and payment completed
                </span>
              </div>
            </div>

          </div>

        </section>

        {/* ITEMS */}

        <section className="order-details-section">

          <div className="order-details-section-title">
            <h3>Order Items</h3>

            <span>
              {totalItems}{" "}
              {totalItems === 1 ? "item" : "items"}
            </span>
          </div>

          <div className="order-details-items">

            {order.items?.map((item, index) => (

              <div
                className="order-details-item"
                key={`${order._id}-${index}`}
              >

                <div className="order-details-item-number">
                  {index + 1}
                </div>

                <div className="order-details-item-main">

                  <strong>
                    {item.name}
                  </strong>

                  <span>
                    {item.category}
                  </span>

                </div>

                <div className="order-details-item-qty">
                  × {item.quantity}
                </div>

                <div className="order-details-item-price">
                  ₹
                  {Number(
                    item.itemTotal ||
                    item.price * item.quantity ||
                    0
                  ).toFixed(2)}
                </div>

              </div>

            ))}

          </div>

        </section>

        {/* BILL SUMMARY */}

        <section className="order-details-bill">

          <div className="order-details-section-title">
            <h3>Bill Summary</h3>
          </div>

          <div className="order-details-bill-row">
            <span>Subtotal</span>

            <strong>
              ₹{Number(order.subtotal || 0).toFixed(2)}
            </strong>
          </div>

          <div className="order-details-bill-row">
            <span>Total</span>

            <strong className="order-details-grand-total">
              ₹{Number(order.total || 0).toFixed(2)}
            </strong>
          </div>

        </section>

        {/* PAYMENT */}

        <section className="order-details-payment">

          <div>
            <span>PAYMENT METHOD</span>

            <strong>
              {order.paymentMethod || "Not Paid"}
            </strong>
          </div>

          <div>
            <span>PAYMENT STATUS</span>

            <strong>
              {order.paymentMethod
                ? "Paid"
                : "Pending"}
            </strong>
          </div>

          <div>
            <span>PAID AT</span>

            <strong>
              {formatDateTime(order.paidAt)}
            </strong>
          </div>

        </section>

      </main>

    </div>
  );
}

export default WaiterOrderDetails;