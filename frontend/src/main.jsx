import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import App from "./App.jsx";
import { WalletProvider } from "./context/WalletContext.jsx";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <WalletProvider>
        <App />
        <Toaster
          position="top-right"
          toastOptions={{
            className: "!bg-navy !text-ice !border !border-ice/30",
            duration: 4500,
          }}
        />
      </WalletProvider>
    </BrowserRouter>
  </React.StrictMode>
);
