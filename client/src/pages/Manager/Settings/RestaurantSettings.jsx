import React, { useEffect, useState } from "react";
import "./RestaurantSettings.css";
import { useRestaurantBranding } from "../../../context/RestaurantBrandingContext";

function RestaurantSettings({
  user,
  onBack,
  onLogout,
}) {
  const {
    restaurantName: globalRestaurantName,
    restaurantLogo: globalRestaurantLogo,
    refreshRestaurantBranding,
  } = useRestaurantBranding();

  // ------------------------------------------
  // FORM STATE
  // ------------------------------------------

  const [restaurantName, setRestaurantName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [gstTaxNumber, setGstTaxNumber] = useState("");
  const [currency, setCurrency] = useState("INR");
  const [taxRate, setTaxRate] = useState("");
  const [receiptFooter, setReceiptFooter] = useState(
    "Thank you for dining with us!"
  );
  const [logo, setLogo] = useState("");
  const [orderPrefix, setOrderPrefix] = useState("ORD");
  const [tableCount, setTableCount] = useState(10);

  const [paymentMethods, setPaymentMethods] = useState({
    cash: true,
    card: true,
    upi: true,
  });

  // ------------------------------------------
  // UI STATE
  // ------------------------------------------

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // ------------------------------------------
  // LOAD SETTINGS
  // ------------------------------------------

  const loadSettings = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        "http://localhost:5000/api/settings/restaurant"
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Unable to load restaurant settings."
        );
      }

      const settings = data.settings || {};

      setRestaurantName(
        settings.restaurantName || ""
      );

      setAddress(settings.address || "");
      setPhone(settings.phone || "");
      setGstTaxNumber(settings.gstTaxNumber || "");
      setCurrency(settings.currency || "INR");
      setTaxRate(
        settings.taxRate !== undefined
          ? String(settings.taxRate)
          : ""
      );

      setReceiptFooter(
        settings.receiptFooter ||
          "Thank you for dining with us!"
      );

      setLogo(settings.logo || "");

      setOrderPrefix(
        settings.orderPrefix || "ORD"
      );

      setTableCount(
        settings.tableCount || 10
      );

      setPaymentMethods({
        cash:
          settings.paymentMethods?.cash !== false,
        card:
          settings.paymentMethods?.card !== false,
        upi:
          settings.paymentMethods?.upi !== false,
      });
    } catch (error) {
      console.error(
        "Load restaurant settings error:",
        error
      );

      setError(
        error.message ||
          "Unable to load restaurant settings."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  // ------------------------------------------
  // LOGO UPLOAD
  // ------------------------------------------

  const handleLogoChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select an image file.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError(
        "Logo image must be smaller than 5 MB."
      );
      return;
    }

    const reader = new FileReader();

    reader.onload = (loadEvent) => {
      const image = new Image();

      image.onload = () => {
        const MAX_SIZE = 800;

        let width = image.width;
        let height = image.height;

        if (
          width > MAX_SIZE ||
          height > MAX_SIZE
        ) {
          if (width > height) {
            height =
              (height / width) * MAX_SIZE;
            width = MAX_SIZE;
          } else {
            width =
              (width / height) * MAX_SIZE;
            height = MAX_SIZE;
          }
        }

        const canvas =
          document.createElement("canvas");

        canvas.width = Math.round(width);
        canvas.height = Math.round(height);

        const context =
          canvas.getContext("2d");

        if (!context) {
          setError(
            "Unable to process the selected logo."
          );
          return;
        }

        context.clearRect(
          0,
          0,
          canvas.width,
          canvas.height
        );

        context.drawImage(
          image,
          0,
          0,
          canvas.width,
          canvas.height
        );

        const compressedLogo =
          canvas.toDataURL(
            "image/jpeg",
            0.8
          );

        setLogo(compressedLogo);
        setError("");
      };

      image.onerror = () => {
        setError(
          "Unable to process the selected logo."
        );
      };

      image.src =
        loadEvent.target.result;
    };

    reader.onerror = () => {
      setError(
        "Unable to read the selected logo."
      );
    };

    reader.readAsDataURL(file);
  };

  // ------------------------------------------
  // REMOVE LOGO
  // ------------------------------------------

  const handleRemoveLogo = () => {
    setLogo("");
  };

  // ------------------------------------------
  // PAYMENT METHOD TOGGLE
  // ------------------------------------------

  const togglePaymentMethod = (method) => {
    setPaymentMethods((previous) => ({
      ...previous,
      [method]: !previous[method],
    }));
  };

  // ------------------------------------------
  // SAVE SETTINGS
  // ------------------------------------------

  const handleSave = async () => {
    setMessage("");
    setError("");

    if (!restaurantName.trim()) {
      setError(
        "Restaurant name is required."
      );
      return;
    }

    const numericTaxRate = Number(taxRate);
    const numericTableCount = Number(tableCount);

    if (
      !Number.isFinite(numericTaxRate) ||
      numericTaxRate < 0 ||
      numericTaxRate > 100
    ) {
      setError(
        "Tax rate must be between 0 and 100."
      );
      return;
    }

    if (
      !Number.isInteger(numericTableCount) ||
      numericTableCount < 1
    ) {
      setError(
        "Table count must be at least 1."
      );
      return;
    }

    const hasPaymentMethod =
      paymentMethods.cash ||
      paymentMethods.card ||
      paymentMethods.upi;

    if (!hasPaymentMethod) {
      setError(
        "At least one payment method must be enabled."
      );
      return;
    }

    try {
      setSaving(true);

      const response = await fetch(
        "http://localhost:5000/api/settings/restaurant",
        {
          method: "PUT",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            restaurantName:
              restaurantName.trim(),

            address: address.trim(),

            phone: phone.trim(),

            gstTaxNumber:
              gstTaxNumber.trim(),

            currency,

            taxRate: numericTaxRate,

            receiptFooter:
              receiptFooter.trim(),

            logo,

            orderPrefix:
              orderPrefix.trim().toUpperCase(),

            tableCount:
              numericTableCount,

            paymentMethods,
          }),
        }
      );

      const data =
        await response.json();

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.message ||
            "Unable to save restaurant settings."
        );
      }

      const settings =
        data.settings || {};

      setRestaurantName(
        settings.restaurantName || ""
      );

      setAddress(
        settings.address || ""
      );

      setPhone(
        settings.phone || ""
      );

      setGstTaxNumber(
        settings.gstTaxNumber || ""
      );

      setCurrency(
        settings.currency || "INR"
      );

      setTaxRate(
        settings.taxRate !== undefined
          ? String(settings.taxRate)
          : "0"
      );

      setReceiptFooter(
        settings.receiptFooter || ""
      );

      setLogo(
        settings.logo || ""
      );

      setOrderPrefix(
        settings.orderPrefix || "ORD"
      );

      setTableCount(
        settings.tableCount || 10
      );

      setPaymentMethods({
        cash:
          settings.paymentMethods?.cash !== false,
        card:
          settings.paymentMethods?.card !== false,
        upi:
          settings.paymentMethods?.upi !== false,
      });

      // Refresh global restaurant
      // branding throughout the POS.
      await refreshRestaurantBranding();

      setMessage(
        "Restaurant settings saved successfully."
      );
    } catch (error) {
      console.error(
        "Save restaurant settings error:",
        error
      );

      setError(
        error.message ||
          "Unable to save restaurant settings."
      );
    } finally {
      setSaving(false);
    }
  };

  // ------------------------------------------
  // RENDER
  // ------------------------------------------

  return (
    <div className="restaurant-settings-page">

      {/* ======================================
          HEADER
      ====================================== */}

      <header className="restaurant-settings-header">

        <div className="restaurant-settings-brand">

          <div className="restaurant-settings-logo">
            {globalRestaurantLogo ? (
              <img
                src={globalRestaurantLogo}
                alt={globalRestaurantName}
              />
            ) : (
              "🍽"
            )}
          </div>

          <div className="restaurant-settings-brand-text">

            <h1>
              {globalRestaurantName ||
                restaurantName ||
                "Restaurant POS"}
            </h1>

            <p>
              Restaurant Settings
            </p>

          </div>

        </div>


        <div className="restaurant-settings-user">

          <div className="restaurant-settings-user-info">

            <strong>
              {user?.name || "Restaurant Manager"}
            </strong>

            <span>
              MANAGER
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


      {/* ======================================
          PAGE CONTENT
      ====================================== */}

      <main className="restaurant-settings-content">

        <button
          type="button"
          className="restaurant-settings-back"
          onClick={onBack}
        >
          ← Back
        </button>


        <section className="restaurant-settings-card">

          {/* ==================================
              CARD HEADER
          ================================== */}

          <div className="restaurant-settings-card-header">

            <span className="restaurant-settings-label">
              SYSTEM CONFIGURATION
            </span>

            <h2>
              Restaurant Settings
            </h2>

            <p>
              Configure restaurant information,
              tax, receipt, tables and payment methods.
            </p>

          </div>


          <div className="restaurant-settings-body">

            {/* ==================================
                RESTAURANT INFORMATION
            ================================== */}

            <section className="settings-section">

              <h3 className="settings-section-title">
                RESTAURANT INFORMATION
              </h3>


              <div className="settings-grid">

                {/* NAME */}

                <div className="restaurant-settings-field">

                  <label>
                    Restaurant Name
                    <span className="required-mark">
                      *
                    </span>
                  </label>

                  <input
                    type="text"
                    value={restaurantName}
                    onChange={(event) =>
                      setRestaurantName(
                        event.target.value
                      )
                    }
                    placeholder="Enter restaurant name"
                    disabled={
                      loading || saving
                    }
                  />

                </div>


                {/* PHONE */}

                <div className="restaurant-settings-field">

                  <label>
                    Phone
                  </label>

                  <input
                    type="text"
                    value={phone}
                    onChange={(event) =>
                      setPhone(
                        event.target.value
                      )
                    }
                    placeholder="Enter phone number"
                    disabled={
                      loading || saving
                    }
                  />

                </div>


                {/* ADDRESS */}

                <div className="restaurant-settings-field settings-field-full">

                  <label>
                    Address
                  </label>

                  <textarea
                    value={address}
                    onChange={(event) =>
                      setAddress(
                        event.target.value
                      )
                    }
                    placeholder="Enter restaurant address"
                    rows={3}
                    disabled={
                      loading || saving
                    }
                  />

                </div>


                {/* GST */}

                <div className="restaurant-settings-field">

                  <label>
                    GST / Tax Number
                  </label>

                  <input
                    type="text"
                    value={gstTaxNumber}
                    onChange={(event) =>
                      setGstTaxNumber(
                        event.target.value
                      )
                    }
                    placeholder="Enter GST / Tax number"
                    disabled={
                      loading || saving
                    }
                  />

                </div>


                {/* CURRENCY */}

                <div className="restaurant-settings-field">

                  <label>
                    Currency
                  </label>

                  <select
                    value={currency}
                    onChange={(event) =>
                      setCurrency(
                        event.target.value
                      )
                    }
                    disabled={
                      loading || saving
                    }
                  >
                    <option value="INR">
                      INR - ₹
                    </option>

                    <option value="MYR">
                      MYR - RM
                    </option>

                    <option value="USD">
                      USD - $
                    </option>

                    <option value="SGD">
                      SGD - S$
                    </option>

                    <option value="AED">
                      AED - د.إ
                    </option>
                  </select>

                </div>

              </div>

            </section>


            {/* ==================================
                TAX & RECEIPT
            ================================== */}

            <section className="settings-section">

              <h3 className="settings-section-title">
                TAX & RECEIPT
              </h3>


              <div className="settings-grid">

                {/* TAX */}

                <div className="restaurant-settings-field">

                  <label>
                    Tax %
                  </label>

                  <div className="settings-input-with-suffix">

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
                      placeholder="0"
                      disabled={
                        loading || saving
                      }
                    />

                    <span>
                      %
                    </span>

                  </div>

                  <small>
                    Enter tax percentage
                    (e.g. 6 for 6%)
                  </small>

                </div>


                {/* RECEIPT FOOTER */}

                <div className="restaurant-settings-field">

                  <label>
                    Receipt Footer
                  </label>

                  <input
                    type="text"
                    value={receiptFooter}
                    onChange={(event) =>
                      setReceiptFooter(
                        event.target.value
                      )
                    }
                    placeholder="Thank you for dining with us!"
                    disabled={
                      loading || saving
                    }
                  />

                  <small>
                    This text will appear at the
                    bottom of printed receipts.
                  </small>

                </div>


                {/* RECEIPT LOGO */}

                <div className="restaurant-settings-field settings-field-full">

                  <label>
                    Receipt Logo
                  </label>

                  <div className="restaurant-logo-upload">

                    <div className="restaurant-logo-preview">

                      {logo ? (
                        <img
                          src={logo}
                          alt="Restaurant logo preview"
                        />
                      ) : (
                        <span>
                          No Logo
                        </span>
                      )}

                    </div>


                    <div className="restaurant-logo-actions">

                      <label className="restaurant-upload-button">

                        Upload Logo

                        <input
                          type="file"
                          accept="image/*"
                          onChange={
                            handleLogoChange
                          }
                          disabled={
                            loading ||
                            saving
                          }
                        />

                      </label>


                      {logo && (
                        <button
                          type="button"
                          className="restaurant-remove-logo"
                          onClick={
                            handleRemoveLogo
                          }
                          disabled={
                            loading ||
                            saving
                          }
                        >
                          Remove Logo
                        </button>
                      )}

                    </div>

                  </div>

                  <small>
                    This logo will appear on printed
                    receipts and POS screens.
                    Maximum size: 5 MB.
                  </small>

                </div>

              </div>

            </section>


            {/* ==================================
                ORDER & TABLES
            ================================== */}

            <section className="settings-section">

              <h3 className="settings-section-title">
                ORDER & TABLES
              </h3>


              <div className="settings-grid">

                {/* ORDER PREFIX */}

                <div className="restaurant-settings-field">

                  <label>
                    Order Prefix
                  </label>

                  <input
                    type="text"
                    value={orderPrefix}
                    onChange={(event) =>
                      setOrderPrefix(
                        event.target.value
                          .toUpperCase()
                      )
                    }
                    placeholder="ORD"
                    disabled={
                      loading || saving
                    }
                  />

                  <small>
                    Example: ORD-1001
                  </small>

                </div>


                {/* TABLE COUNT */}

                <div className="restaurant-settings-field">

                  <label>
                    Table Count
                  </label>

                  <input
                    type="number"
                    min="1"
                    value={tableCount}
                    onChange={(event) =>
                      setTableCount(
                        event.target.value
                      )
                    }
                    disabled={
                      loading || saving
                    }
                  />

                  <small>
                    Number of restaurant tables.
                  </small>

                </div>

              </div>

            </section>


            {/* ==================================
                PAYMENT METHODS
            ================================== */}

            <section className="settings-section settings-payment-section">

              <h3 className="settings-section-title">
                PAYMENT METHODS
              </h3>


              <div className="payment-methods-grid">

                {/* CASH */}

                <label className="payment-method-card">

                  <input
                    type="checkbox"
                    checked={
                      paymentMethods.cash
                    }
                    onChange={() =>
                      togglePaymentMethod(
                        "cash"
                      )
                    }
                    disabled={
                      loading || saving
                    }
                  />

                  <span className="payment-method-check">
                    ✓
                  </span>

                  <span className="payment-method-name">
                    CASH
                  </span>

                </label>


                {/* CARD */}

                <label className="payment-method-card">

                  <input
                    type="checkbox"
                    checked={
                      paymentMethods.card
                    }
                    onChange={() =>
                      togglePaymentMethod(
                        "card"
                      )
                    }
                    disabled={
                      loading || saving
                    }
                  />

                  <span className="payment-method-check">
                    ✓
                  </span>

                  <span className="payment-method-name">
                    CARD
                  </span>

                </label>


                {/* UPI */}

                <label className="payment-method-card">

                  <input
                    type="checkbox"
                    checked={
                      paymentMethods.upi
                    }
                    onChange={() =>
                      togglePaymentMethod(
                        "upi"
                      )
                    }
                    disabled={
                      loading || saving
                    }
                  />

                  <span className="payment-method-check">
                    ✓
                  </span>

                  <span className="payment-method-name">
                    UPI
                  </span>

                </label>

              </div>

            </section>

          </div>


          {/* ==================================
              MESSAGES
          ================================== */}

          {message && (
            <div className="restaurant-settings-success">
              ✓ {message}
            </div>
          )}

          {error && (
            <div className="restaurant-settings-error">
              ! {error}
            </div>
          )}


          {/* ==================================
              FOOTER
          ================================== */}

          <div className="restaurant-settings-footer">

            <div className="restaurant-settings-note">

              <span>
                ℹ
              </span>

              <p>
                Changes will be visible across
                the POS after saving.
              </p>

            </div>


            <button
              type="button"
              className="restaurant-settings-save"
              onClick={handleSave}
              disabled={
                loading || saving
              }
            >
              {saving
                ? "SAVING..."
                : "SAVE CHANGES"}
            </button>

          </div>

        </section>

      </main>

    </div>
  );
}

export default RestaurantSettings;