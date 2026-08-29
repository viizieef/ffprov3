import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { unregisterServiceWorker } from './services/serviceWorkerRegistration';

// Unregister any legacy offline service workers
unregisterServiceWorker();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

