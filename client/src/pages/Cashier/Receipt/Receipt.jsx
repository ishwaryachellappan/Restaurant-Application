import React from "react";
import "./Receipt.css";
import { useEffect } from "react";
import {
  useRestaurantBranding,
} from "../../../context/RestaurantBrandingContext";

function Receipt({
  order,
  paymentMethod,
  paidAt,
  onClose,
}) {

  const {
  restaurantName,
  restaurantLogo,
} = useRestaurantBranding();

  
  if (!order) {
    return null;
  }

 const items = order.items || [];

const subtotal = items.reduce((sum, item) => {
  const itemTotal =
    Number(item.itemTotal) ||
    Number(item.price || 0) *
      Number(item.quantity || 0);

  return sum + itemTotal;
}, 0);

const discountAmount =
  Number(order.discountAmount || 0);

const taxRate =
  Number(order.taxRate || 0);

// First try the saved tax amount
let taxAmount =
  Number(order.taxAmount || 0);

// Fallback for older orders where taxAmount
// was not saved but total already includes tax
if (
  taxAmount === 0 &&
  Number(order.total || 0) >
    subtotal - discountAmount
) {
  taxAmount =
    Number(order.total) -
    (subtotal - discountAmount);
}

const cgstRate = taxRate / 2;
const sgstRate = taxRate / 2;

const cgstAmount = taxAmount / 2;
const sgstAmount = taxAmount / 2;

const grandTotal =
  Number(order.total || 0) ||
  (
    subtotal -
    discountAmount +
    taxAmount
  );

  const paymentDate = paidAt
    ? new Date(paidAt)
    : new Date();

  const formattedDate = paymentDate.toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }
  );

  const formattedTime = paymentDate.toLocaleTimeString(
    "en-IN",
    {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }
  );

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="receipt-overlay">
      <div className="receipt-container">

        {/* PRINTABLE RECEIPT */}
        <div className="receipt-page">

        <div className="receipt-header">

  {restaurantLogo && (
    <div className="receipt-logo">
      <img
        src={restaurantLogo}
        alt={restaurantName}
      />
    </div>
  )}

  <h1>{restaurantName}</h1>

  <p>Payment Receipt</p>

</div>

          <div className="receipt-divider" />

          <div className="receipt-info">
            <div>
              <span>Order No</span>
              <strong>{order.orderNumber || "-"}</strong>
            </div>

            <div>
              <span>Table</span>
              <strong>{order.tableNumber || "-"}</strong>
            </div>

            <div>
              <span>Waiter</span>
              <strong>{order.waiterName || "-"}</strong>
            </div>

            <div>
              <span>Date</span>
              <strong>{formattedDate}</strong>
            </div>

            <div>
              <span>Time</span>
              <strong>{formattedTime}</strong>
            </div>
          </div>

          <div className="receipt-divider" />

          <div className="receipt-items">

            <div className="receipt-item-header">
              <span>ITEM</span>
              <span>QTY</span>
              <span>PRICE</span>
              <span>TOTAL</span>
            </div>

            {items.map((item, index) => {

              const quantity = Number(
                item.quantity || 0
              );

              const price = Number(
                item.price || 0
              );

              const itemTotal =
                Number(item.itemTotal) ||
                price * quantity;

              return (
                <div
                  className="receipt-item"
                  key={item.menuItemId || index}
                >
                  <span className="receipt-item-name">
                    {item.name || "-"}
                  </span>

                  <span>
                    {quantity}
                  </span>

                  <span>
                    ₹{price.toFixed(2)}
                  </span>

                  <span>
                    ₹{itemTotal.toFixed(2)}
                  </span>
                </div>
              );
            })}

          </div>

          <div className="receipt-divider" />

         <div className="receipt-summary">

  <div>
    <span>Subtotal</span>

    <strong>
      ₹{subtotal.toFixed(2)}
    </strong>
  </div>

  {discountAmount > 0 && (
    <div>
      <span>Discount</span>

      <strong>
        - ₹{discountAmount.toFixed(2)}
      </strong>
    </div>
  )}

  {taxAmount > 0 && (
    <>
      <div>
        <span>
          CGST ({cgstRate}%)
        </span>

        <strong>
          ₹{cgstAmount.toFixed(2)}
        </strong>
      </div>

      <div>
        <span>
          SGST ({sgstRate}%)
        </span>

        <strong>
          ₹{sgstAmount.toFixed(2)}
        </strong>
      </div>
    </>
  )}

  <div className="receipt-grand-total">
    <span>GRAND TOTAL</span>

    <strong>
      ₹{grandTotal.toFixed(2)}
    </strong>
  </div>

</div>


          <div className="receipt-divider" />

          <div className="receipt-payment">

            <span>Payment Method</span>

            <strong>
              {paymentMethod || order.paymentMethod || "-"}
            </strong>

          </div>

          <div className="receipt-thank-you">
            <h3>Thank You!</h3>
            <p>
              We appreciate your visit.
            </p>
            <p>
              Please visit us again.
            </p>
          </div>

        </div>

        {/* ACTION BUTTONS */}
        <div className="receipt-actions">

          <button
            className="receipt-print-button"
            onClick={handlePrint}
          >
            🖨 PRINT RECEIPT
          </button>

          <button
            className="receipt-close-button"
            onClick={onClose}
          >
            DONE
          </button>

        </div>

      </div>
    </div>
  );
}

export default Receipt;