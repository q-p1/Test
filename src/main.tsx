import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { AppErrorBoundary } from './components/AppErrorBoundary';
import { registerServiceWorker } from './lib/registerServiceWorker';
import { RoutineProvider } from './state/RoutineContext';
import './styles.css';
import './rich-tracking.css';

document.documentElement.lang = 'ar';
document.documentElement.dir = 'rtl';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppErrorBoundary>
      <RoutineProvider><App /></RoutineProvider>
    </AppErrorBoundary>
  </StrictMode>,
);

registerServiceWorker();
