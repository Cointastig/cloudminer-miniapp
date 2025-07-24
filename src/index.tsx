import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles.css';
import { TonConnectUIProvider } from '@tonconnect/ui-react';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    {/* Ton‑Connect‑Provider steht jetzt ganz oben */}
    <TonConnectUIProvider manifestUrl="/tonconnect-manifest.json">
      <App />
    </TonConnectUIProvider>
  </React.StrictMode>
);
