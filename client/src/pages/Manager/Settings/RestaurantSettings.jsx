import React, { useEffect, useState } from "react";
import "./RestaurantSettings.css";

function RestaurantSettings({
  user,
  onBack,
  onLogout,
}) {
  const [restaurantName, setRestaurantName] =
    useState("");

  const [logo, setLogo] = useState("");

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [error, setError] =
    useState("");

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

      setRestaurantName(
        data.settings?.restaurantName || ""
      );

      setLogo(
        data.settings?.logo || ""
      );

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
    setError("Logo image must be smaller than 5 MB.");
    return;
  }

  const reader = new FileReader();

  reader.onload = (loadEvent) => {
    const image = new Image();

    image.onload = () => {
      const MAX_SIZE = 800;

      let width = image.width;
      let height = image.height;

      if (width > MAX_SIZE || height > MAX_SIZE) {
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

    image.src = loadEvent.target.result;
  };

  reader.onerror = () => {
    setError(
      "Unable to read the selected logo."
    );
  };

  reader.readAsDataURL(file);
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

            logo,
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

      setRestaurantName(
        data.settings.restaurantName
      );

      setLogo(
        data.settings.logo || ""
      );

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
  // REMOVE LOGO
  // ------------------------------------------

  const handleRemoveLogo = () => {
    setLogo("");
  };


  // ------------------------------------------
  // RENDER
  // ------------------------------------------

  return (
    <div className="restaurant-settings-page">

      {/* HEADER */}

      <header className="restaurant-settings-header">

        <div className="restaurant-settings-brand">

          <div className="restaurant-settings-logo">
            {logo ? (
              <img
                src={logo}
                alt="Restaurant logo"
              />
            ) : (
              "₹"
            )}
          </div>

          <div>

            <h1>
              Restaurant POS
            </h1>

            <p>
              Restaurant Settings
            </p>

          </div>

        </div>


        <div className="restaurant-settings-user">

          <div>

            <strong>
              {user?.name || "Manager"}
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


      {/* CONTENT */}

      <main className="restaurant-settings-content">

        <button
          type="button"
          className="restaurant-settings-back"
          onClick={onBack}
        >
          ← Back
        </button>


        <section className="restaurant-settings-card">

          <div className="restaurant-settings-card-header">

            <div>

              <span className="restaurant-settings-label">
                SYSTEM CONFIGURATION
              </span>

              <h2>
                Restaurant Settings
              </h2>

              <p>
                Configure the restaurant name
                and logo used throughout the POS.
              </p>

            </div>

          </div>


          <div className="restaurant-settings-body">

            {/* RESTAURANT NAME */}

            <div className="restaurant-settings-field">

              <label>
                Restaurant Name
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

              <small>
                This name will appear throughout
                the POS and on printed receipts.
              </small>

            </div>


            {/* LOGO */}

            <div className="restaurant-settings-field">

              <label>
                Restaurant Logo
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
                JPG, PNG, SVG or other image
                formats. Maximum size: 2 MB.
              </small>

            </div>

          </div>


          {/* MESSAGES */}

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


          {/* FOOTER */}

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
                ? "Saving..."
                : "SAVE CHANGES"}
            </button>

          </div>

        </section>

      </main>

    </div>
  );
}

export default RestaurantSettings;