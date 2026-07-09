import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Intercept and gracefully silence benign sandbox Vite HMR WebSocket errors
if (typeof window !== 'undefined') {
  const isWebsocketError = (err: any): boolean => {
    if (!err) return false;
    const msg = String(err.message || err.reason || err).toLowerCase();
    return msg.includes('websocket') || msg.includes('ws://') || msg.includes('wss://') || msg.includes('clsd');
  };

  window.addEventListener('unhandledrejection', (event) => {
    if (isWebsocketError(event.reason)) {
      event.preventDefault();
      event.stopPropagation();
    }
  });

  window.addEventListener('error', (event) => {
    if (isWebsocketError(event.error) || isWebsocketError(event.message)) {
      event.preventDefault();
      event.stopPropagation();
    }
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
