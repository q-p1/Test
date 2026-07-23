import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, HashRouter } from 'react-router-dom';
import App from './App';
import './index.css';

// Hash routing is used for the fully self-contained (single-file) build so the
// app runs from any static host / embedded context without a server rewrite.
const Router = import.meta.env.VITE_ARTIFACT ? HashRouter : BrowserRouter;

// Ensure RTL/Arabic even when the host document root isn't ours (e.g. embedded).
document.documentElement.setAttribute('dir', 'rtl');
document.documentElement.setAttribute('lang', 'ar');

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Router>
      <App />
    </Router>
  </React.StrictMode>,
);
