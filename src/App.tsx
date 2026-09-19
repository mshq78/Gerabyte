import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AppProvider } from './state/AppContext';
import { AppRoutes } from './routes';

export function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AppProvider>
  );
}

export default App;
