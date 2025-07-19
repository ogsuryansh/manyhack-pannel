import React from "react";

const ThemeToggle = ({ theme, setTheme }) => (
  <button
    className="theme-toggle"
    onClick={() => setTheme(theme === "light" ? "dark" : "light")}
  >
    {theme === "light" ? "🌙 Dark" : "☀️ Light"}
  </button>
);

export default ThemeToggle;