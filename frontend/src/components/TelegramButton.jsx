import React, { useState } from "react";

const TELEGRAM_URL = "https://t.me/legitsells66";

export default function TelegramButton() {
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  return (
    <div className="telegram-float-btn">
      <a
        href={TELEGRAM_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="telegram-float-link"
      >
        <TelegramIcon />
        <span style={{ marginLeft: 8 }}>Contact Admin</span>
      </a>
      <button
        className="telegram-float-close"
        onClick={() => setVisible(false)}
        title="Close"
      >
        ×
      </button>
    </div>
  );
}

function TelegramIcon() {
  return (
    <svg height="20" width="20" viewBox="0 0 240 240" style={{ verticalAlign: "middle" }}>
      <circle cx="120" cy="120" r="120" fill="#37aee2" />
      <path
        d="M100 170l-40-15 160-65-120 80 10 30 30-10 80-120-65 160-15-40z"
        fill="#fff"
      />
    </svg>
  );
}