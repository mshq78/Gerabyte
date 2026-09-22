import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AppProvider, useApp } from './state/AppContext';
import { AppRoutes } from './routes';
import { Toast } from './components/ui/Toast';

/**
 * The toast lives here, at the root, not inside a shell.
 *
 * It used to be rendered only by LearnerShell, which meant every message
 * raised outside that shell was silently discarded: a wrong password on
 * /login, a validation failure, a 500 from the API, and the
 * "به این بخش دسترسی ندارید" a route guard shows before redirecting. The
 * state changed, nothing drew it, and the screen just sat there.
 */
const GlobalToast: React.FC = () => {
  const { toast } = useApp();
  return <Toast toast={toast} />;
};

export function App() {
  return (
    <AppProvider>
      <GlobalToast />
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AppProvider>
  );
}

export default App;
