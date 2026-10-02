import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

const RestaurantBrandingContext =
  createContext(null);

export function RestaurantBrandingProvider({
  children,
}) {
  const [restaurantName, setRestaurantName] =
    useState("Restaurant POS");

  const [restaurantLogo, setRestaurantLogo] =
    useState("");

  const [loadingBranding, setLoadingBranding] =
    useState(true);

  const loadRestaurantBranding = async () => {
    try {
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
        data.settings?.restaurantName ||
          "Restaurant POS"
      );

      setRestaurantLogo(
        data.settings?.logo || ""
      );
    } catch (error) {
      console.error(
        "Restaurant branding error:",
        error
      );

      setRestaurantName("Restaurant POS");
      setRestaurantLogo("");
    } finally {
      setLoadingBranding(false);
    }
  };

  useEffect(() => {
    loadRestaurantBranding();
  }, []);

  const refreshRestaurantBranding =
    async () => {
      await loadRestaurantBranding();
    };

  return (
    <RestaurantBrandingContext.Provider
      value={{
        restaurantName,
        restaurantLogo,
        loadingBranding,
        refreshRestaurantBranding,
      }}
    >
      {children}
    </RestaurantBrandingContext.Provider>
  );
}

export function useRestaurantBranding() {
  const context = useContext(
    RestaurantBrandingContext
  );

  if (!context) {
    throw new Error(
      "useRestaurantBranding must be used inside RestaurantBrandingProvider"
    );
  }

  return context;
}