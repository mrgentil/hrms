"use client";

import { Toaster as HotToaster } from "react-hot-toast";

const Toaster = () => {
  return (
    <HotToaster
      position="top-right"
      reverseOrder={false}
      gutter={8}
      containerClassName=""
      containerStyle={{}}
      toastOptions={{
        // Styles par défaut
        className: "",
        duration: 4000,
        style: {
          background: "#fff",
          color: "#363636",
          fontSize: "14px",
          fontWeight: "500",
          padding: "16px",
          borderRadius: "8px",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
          border: "1px solid #e5e7eb",
        },

        // Styles pour les différents types
        success: {
          style: {
            background: "#f0fdf4",
            color: "#166534",
            border: "1px solid #bbf7d0",
          },
          iconTheme: {
            primary: "#22c55e",
            secondary: "#f0fdf4",
          },
        },
        error: {
          style: {
            background: "#fef2f2",
            color: "#dc2626",
            border: "1px solid #fecaca",
          },
          iconTheme: {
            primary: "#ef4444",
            secondary: "#fef2f2",
          },
        },
        loading: {
          style: {
            background: "#fefce8",
            color: "#a16207",
            border: "1px solid #fef3c7",
          },
          iconTheme: {
            primary: "#eab308",
            secondary: "#fefce8",
          },
        },
      }}
    />
  );
};

export default Toaster;
