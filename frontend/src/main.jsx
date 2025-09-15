import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from "./context/AuthContext";
import { RefreshProvider } from "./context/RefreshContext";

createRoot(document.getElementById('root')).render(
  <RefreshProvider>
    <AuthProvider>
      <App />
    </AuthProvider>
  </RefreshProvider>,
)
