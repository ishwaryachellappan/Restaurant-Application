import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";

import {
  RestaurantBrandingProvider,
} from "./context/RestaurantBrandingContext";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <RestaurantBrandingProvider>
      <App />
    </RestaurantBrandingProvider>
  </StrictMode>
);