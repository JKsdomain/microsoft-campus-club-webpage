"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export type Theme = "dark";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme] = useState<Theme>("dark");

  useEffect(() => {
    try {
      localStorage.setItem("mcc_theme", "dark");
      document.documentElement.classList.remove("light");
      document.documentElement.classList.add("dark");
    } catch (e) {
      console.error("Theme initialization error:", e);
    }
  }, []);

  const setTheme = (_newTheme: Theme) => {
    try {
      localStorage.setItem("mcc_theme", "dark");
    } catch (e) {}
    document.documentElement.classList.remove("light");
    document.documentElement.classList.add("dark");
  };

  const toggleTheme = () => {
    // Locked to dark theme permanently
    setTheme("dark");
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
