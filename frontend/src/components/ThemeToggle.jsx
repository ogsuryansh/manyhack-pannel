import React, { useState } from "react";
import { FaSun, FaMoon } from "react-icons/fa";

const ThemeToggle = ({ theme, setTheme }) => {
  const [animating, setAnimating] = useState(false);
  const isLight = theme === "light";

  const handleToggle = () => {
    setAnimating(true);
    setTheme(isLight ? "dark" : "light");
    setTimeout(() => setAnimating(false), 500);
  };

  return (
    <button className="theme-toggle" onClick={handleToggle} aria-label="Toggle theme">
      <span className={`theme-toggle-icon ${animating ? "theme-toggle-anim" : ""}`}
        style={{ display: "inline-flex", alignItems: "center", transition: "transform 0.5s" }}>
        {isLight ? <FaMoon size={22} /> : <FaSun size={22} />}
      </span>
    </button>
  );
};

export default ThemeToggle;