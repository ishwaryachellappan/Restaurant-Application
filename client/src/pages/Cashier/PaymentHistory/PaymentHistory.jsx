import { useEffect, useState } from "react";
import "./PaymentHistory.css";
import Receipt from "../Receipt/Receipt";

function PaymentHistory({
  user,
  onBack,
  onLogout,
}) {
  const getLocalDateString = (date) => {
    const d = new Date(date);

    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  };

  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [receiptData, setReceiptData] = useState(null);

  // Default = today
  const [selectedDate, setSelectedDate] = useState(
    getLocalDateString(new Date())
  );


  const handleReprint = (payment) => {
  setReceiptData({
    order: payment,
    paymentMethod: payment.paymentMethod,
    paidAt: payment.paidAt,
  });
};

  const loadPayments = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        "http://localhost:5000/api/cashier/payments"
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Unable to load payment history."
        );
      }

      setPayments(data.payments || []);
    } catch (error) {
      console.error(
        "Payment history error:",
        error
      );

      setError(
        error.message ||
          "Unable to load payment history."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPayments();
  }, []);

  // ------------------------------------------
  // FILTER BY SELECTED DATE
  // ------------------------------------------

  const filteredPayments = payments.filter(
    (payment) => {
      if (!payment.paidAt) {
        return false;
      }

      return (
        getLocalDateString(payment.paidAt) ===
        selectedDate
      );
    }
  );

  // ------------------------------------------
  // TOTAL COLLECTED
  // ------------------------------------------

  const totalCollected =
    filteredPayments.reduce(
      (sum, payment) =>
        sum + Number(payment.total || 0),
      0
    );

  // ------------------------------------------
  // PAYMENT METHOD TOTALS
  // ------------------------------------------

  const cashTotal = filteredPayments
    .filter(
      (payment) =>
        payment.paymentMethod === "CASH"
    )
    .reduce(
      (sum, payment) =>
        sum + Number(payment.total || 0),
      0
    );

  const cardTotal = filteredPayments
    .filter(
      (payment) =>
        payment.paymentMethod === "CARD"
    )
    .reduce(
      (sum, payment) =>
        sum + Number(payment.total || 0),
      0
    );

  const upiTotal = filteredPayments
    .filter(
      (payment) =>
        payment.paymentMethod === "UPI"
    )
    .reduce(
      (sum, payment) =>
        sum + Number(payment.total || 0),
      0
    );

  const formattedSelectedDate = selectedDate
    ? new Date(
        `${selectedDate}T00:00:00`
      ).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "";

  // ------------------------------------------
  // PAYMENT METHOD LABEL
  // ------------------------------------------

  const getPaymentMethodClass = (method) => {
    switch (method) {
      case "CASH":
        return "payment-method-cash";

     case "CARD":
  return "payment-method-card-badge";

      case "UPI":
        return "payment-method-upi";

      default:
        return "payment-method-default";
    }
  };

  // ------------------------------------------
  // DATE / TIME
  // ------------------------------------------

  const formatPaidAt = (date) => {
    if (!date) {
      return "-";
    }

    return new Date(date).toLocaleString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }
    );
  };

  return (
    <div className="payment-history-page">

      {/* ======================================
          HEADER
      ====================================== */}

      <header className="payment-history-header">

        <div className="payment-history-brand">

          <div className="payment-history-brand-icon">
            🍽️
          </div>

          <div>
            <h1>
              Restaurant POS
            </h1>

            <span>
              Payment History
            </span>
          </div>

        </div>

        <div className="payment-history-user">

          <div className="payment-history-user-info">

            <strong>
              {user?.name || "Cashier"}
            </strong>

            <span>
              {user?.role || "CASHIER"}
            </span>

          </div>

          <button
            type="button"
            className="payment-history-logout"
            onClick={onLogout}
          >
            Logout
          </button>

        </div>

      </header>

      {/* ======================================
          MAIN
      ====================================== */}

      <main className="payment-history-main">

        {/* TOP TOOLBAR */}

        <div className="payment-history-toolbar">

          <div>

            <h2>
              Payment History
            </h2>

            <p>
              View completed payments and
              collections.
            </p>

          </div>

          <div className="payment-history-actions">

            <button
              type="button"
              className="payment-history-refresh"
              onClick={loadPayments}
              disabled={loading}
            >
              ↻ Refresh
            </button>

            <button
              type="button"
              className="payment-history-back"
              onClick={onBack}
            >
              ← Back
            </button>

          </div>

        </div>

        {/* ======================================
            FILTER
        ====================================== */}

        <div className="payment-history-filter">

          <div className="payment-history-date">

            <label htmlFor="payment-date">
              Payment Date
            </label>

            <div className="payment-history-date-input">

              <span className="payment-history-calendar">
                📅
              </span>

              <input
                id="payment-date"
                type="date"
                value={selectedDate}
                max={getLocalDateString(
                  new Date()
                )}
                onChange={(event) =>
                  setSelectedDate(
                    event.target.value
                  )
                }
              />

            </div>

          </div>

          <div className="payment-history-selected-date">

            <span>
              SHOWING
            </span>

            <strong>
              {formattedSelectedDate}
            </strong>

          </div>

        </div>

        {/* ======================================
            SUMMARY CARDS
        ====================================== */}

        <section className="payment-summary">

          <div className="payment-summary-card">

            <div className="payment-summary-icon">
              ₹
            </div>

            <div>
              <span>
                Total Collected
              </span>

              <strong>
                ₹
                {totalCollected.toFixed(2)}
              </strong>
            </div>

          </div>

          <div className="payment-summary-card">

            <div className="payment-summary-icon">
              #
            </div>

            <div>
              <span>
                Payments
              </span>

              <strong>
                {filteredPayments.length}
              </strong>
            </div>

          </div>

          <div className="payment-summary-card">

            <div className="payment-summary-icon cash">
              ₹
            </div>

            <div>
              <span>
                Cash
              </span>

              <strong>
                ₹{cashTotal.toFixed(2)}
              </strong>
            </div>

          </div>

          <div className="payment-summary-card">

            <div className="payment-summary-icon card">
              ▣
            </div>

            <div>
              <span>
                Card
              </span>

              <strong>
                ₹{cardTotal.toFixed(2)}
              </strong>
            </div>

          </div>

          <div className="payment-summary-card">

            <div className="payment-summary-icon upi">
              U
            </div>

            <div>
              <span>
                UPI
              </span>

              <strong>
                ₹{upiTotal.toFixed(2)}
              </strong>
            </div>

          </div>

        </section>

        {/* ======================================
            ERROR
        ====================================== */}

        {error && (
          <div className="payment-history-error">
            {error}

            <button
              type="button"
              onClick={loadPayments}
            >
              Try Again
            </button>
          </div>
        )}

        {/* ======================================
            LOADING
        ====================================== */}

        {loading ? (

          <div className="payment-history-empty">

            <div className="payment-history-empty-icon">
              ⏳
            </div>

            <h3>
              Loading Payment History...
            </h3>

            <p>
              Please wait while payments
              are loaded.
            </p>

          </div>

        ) : filteredPayments.length === 0 ? (

          /* ====================================
             NO PAYMENTS
          ==================================== */

          <div className="payment-history-empty">

            <div className="payment-history-empty-icon">
              ₹
            </div>

            <h3>
              No Payments for This Date
            </h3>

            <p>
              There are no completed payments
              recorded on{" "}
              {formattedSelectedDate}.
            </p>

          </div>

        ) : (

          /* ====================================
             PAYMENT TABLE
          ==================================== */

          <section className="payment-history-section">

            <div className="payment-history-section-header">

              <div>

                <span>
                  COMPLETED PAYMENTS
                </span>

                <h3>
                  {filteredPayments.length}{" "}
                  {filteredPayments.length === 1
                    ? "Payment"
                    : "Payments"}
                </h3>

              </div>

              <strong>
                ₹{totalCollected.toFixed(2)}
              </strong>

            </div>

            <div className="payment-history-table-wrapper">

              <table className="payment-history-table">

                <thead>

                  <tr>
                    <th>ORDER</th>
                    <th>TABLE</th>
                    <th>WAITER</th>
                    <th>AMOUNT</th>
                    <th>METHOD</th>
                    <th>PAID AT</th>
                    <th>ACTION</th>
                  </tr>

                </thead>

                <tbody>

                  {filteredPayments.map(
                    (payment) => (

                      <tr
                        key={payment._id}
                      >

                        <td>

                          <strong className="payment-order-number">
                            {payment.orderNumber}
                          </strong>

                        </td>

                        <td>
                          <span className="payment-table-number">
                            Table{" "}
                            {payment.tableNumber}
                          </span>
                        </td>

                        <td>
                          {payment.waiterName ||
                            "-"}
                        </td>

                        <td>

                          <strong className="payment-amount">
                            ₹
                            {Number(
                              payment.total ||
                                0
                            ).toFixed(2)}
                          </strong>

                        </td>

                        <td>

                          <span
                            className={`payment-method ${getPaymentMethodClass(
                              payment.paymentMethod
                            )}`}
                          >
                            {payment.paymentMethod}
                          </span>

                        </td>

                        <td>
                          <span className="payment-paid-time">
                            {formatPaidAt(
                              payment.paidAt
                            )}
                          </span>
                        </td>

                        <td>
  <button
    className="payment-history-reprint"
    onClick={() => handleReprint(payment)}
  >
    🖨 Reprint
  </button>
</td>

                      </tr>

                    )
                  )}

                </tbody>

              </table>

            </div>

          </section>

        )}

      </main>

      {receiptData && (
  <Receipt
    order={receiptData.order}
    paymentMethod={receiptData.paymentMethod}
    paidAt={receiptData.paidAt}
    onClose={() => setReceiptData(null)}
  />
)}

    </div>
  );
}

export default PaymentHistory;