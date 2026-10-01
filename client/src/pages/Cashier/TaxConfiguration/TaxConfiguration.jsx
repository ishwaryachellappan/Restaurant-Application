import React, { useEffect, useState } from "react";
import "./TaxConfiguration.css";

function TaxConfiguration({
  user,
  onBack,
  onLogout,
}) {
  const [taxRate, setTaxRate] = useState("");
  const [currentTax, setCurrentTax] = useState(0);

  const [effectiveDate, setEffectiveDate] =
    useState("");

  const [updatedBy, setUpdatedBy] =
    useState("");

  const [updatedAt, setUpdatedAt] =
    useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // ------------------------------------------
  // LOAD TODAY'S TAX
  // ------------------------------------------

  const loadTax = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        "http://localhost:5000/api/tax/today"
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Unable to load today's tax rate."
        );
      }

      const rate = Number(data.taxRate || 0);

      setCurrentTax(rate);
      setTaxRate(rate);

      setEffectiveDate(
        data.effectiveDate || ""
      );

      setUpdatedBy(
        data.updatedBy || "-"
      );

      setUpdatedAt(
        data.updatedAt || ""
      );

    } catch (error) {
      console.error(
        "Load tax configuration error:",
        error
      );

      setError(
        error.message ||
          "Unable to load tax configuration."
      );

    } finally {
      setLoading(false);
    }
  };

  // ------------------------------------------
  // INITIAL LOAD
  // ------------------------------------------

  useEffect(() => {
    loadTax();
  }, []);

  // ------------------------------------------
  // UPDATE TAX
  // ------------------------------------------

  const handleUpdateTax = async () => {
    setMessage("");
    setError("");

    const rate = Number(taxRate);

    if (!Number.isFinite(rate)) {
      setError(
        "Please enter a valid tax rate."
      );
      return;
    }

    if (rate < 0 || rate > 100) {
      setError(
        "Tax rate must be between 0% and 100%."
      );
      return;
    }

    try {
      setSaving(true);

      const response = await fetch(
        "http://localhost:5000/api/tax/today",
        {
          method: "PUT",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            taxRate: rate,
            updatedBy:
              user?.username ||
              user?.name ||
              "cashier",
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Unable to update tax rate."
        );
      }

      const configuration =
        data.configuration;

      setCurrentTax(
        Number(configuration.taxRate || 0)
      );

      setTaxRate(
        Number(configuration.taxRate || 0)
      );

      setEffectiveDate(
        configuration.effectiveDate || ""
      );

      setUpdatedBy(
        configuration.updatedBy || "-"
      );

      setUpdatedAt(
        configuration.updatedAt || ""
      );

      setMessage(
        "Today's tax rate updated successfully."
      );

    } catch (error) {
      console.error(
        "Update tax configuration error:",
        error
      );

      setError(
        error.message ||
          "Unable to update tax rate."
      );

    } finally {
      setSaving(false);
    }
  };

  // ------------------------------------------
  // FORMAT DATE
  // ------------------------------------------

  const formatDate = (value) => {
    if (!value) {
      return "-";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      }
    );
  };

  // ------------------------------------------
  // RENDER
  // ------------------------------------------

  return (
    <div className="tax-config-page">

      {/* HEADER */}

      <header className="tax-config-header">

        <div className="tax-config-brand">

          <div className="tax-config-logo">
            ₹
          </div>

          <div>
            <h1>
              Restaurant POS
            </h1>

            <p>
              Tax Configuration
            </p>
          </div>

        </div>

        <div className="tax-config-user">

          <div>
            <strong>
              {user?.name || "Cashier"}
            </strong>

            <span>
              CASHIER
            </span>
          </div>

          <button
            type="button"
            onClick={onLogout}
          >
            Logout
          </button>

        </div>

      </header>


      {/* CONTENT */}

      <main className="tax-config-content">

        <button
          type="button"
          className="tax-back-button"
          onClick={onBack}
        >
          ← Back
        </button>


        <section className="tax-config-card">

          <div className="tax-card-header">

            <div>

              <span className="tax-section-label">
                DAILY CONFIGURATION
              </span>

              <h2>
                Tax Configuration
              </h2>

              <p>
                Set the tax rate that will be
                applied to new orders today.
              </p>

            </div>

            <div className="tax-current-badge">
              <span>
                CURRENT TAX
              </span>

              <strong>
                {currentTax.toFixed(2)}%
              </strong>
            </div>

          </div>


          {/* FORM */}

          <div className="tax-form">

            <div className="tax-form-group">

              <label>
                Today's Tax Rate
              </label>

              <div className="tax-input-wrapper">

                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={taxRate}
                  onChange={(event) =>
                    setTaxRate(
                      event.target.value
                    )
                  }
                  disabled={loading || saving}
                  placeholder="Enter tax rate"
                />

                <span>
                  %
                </span>

              </div>

              <small>
                Enter a value between 0% and
                100%.
              </small>

            </div>


            <div className="tax-effective-date">

              <span>
                EFFECTIVE DATE
              </span>

              <strong>
                {effectiveDate || "-"}
              </strong>

            </div>

          </div>


          {/* STATUS */}

          {message && (
            <div className="tax-success-message">
              ✓ {message}
            </div>
          )}

          {error && (
            <div className="tax-error-message">
              ! {error}
            </div>
          )}


          {/* SAVE */}

          <div className="tax-card-footer">

            <div className="tax-update-info">

              <span>
                LAST UPDATED
              </span>

              <strong>
                {formatDate(updatedAt)}
              </strong>

              <small>
                By {updatedBy || "-"}
              </small>

            </div>

            <button
              type="button"
              className="tax-update-button"
              onClick={handleUpdateTax}
              disabled={loading || saving}
            >
              {saving
                ? "Updating..."
                : "UPDATE TAX RATE"}
            </button>

          </div>

        </section>

      </main>

    </div>
  );
}

export default TaxConfiguration;