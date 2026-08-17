import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/index.css'
import './styles/public.css'
import App from './App.jsx'

// Apply theme globally to the body element before rendering
const user = JSON.parse(localStorage.getItem("user:v1")) || {};
const userKey = user.email || user.id || user._id || "default";
const settings = JSON.parse(localStorage.getItem(`staffspire_settings:v1:${userKey}`)) || JSON.parse(localStorage.getItem("staffspire_settings:v1")) || {};
const theme = settings.theme || "system";
if (theme !== "system") {
    document.body.classList.add(`theme-${theme}`);
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
