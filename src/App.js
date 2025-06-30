import React from 'react';
import { AppProvider } from './contexts/AppContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { AppLayout } from './layouts/AppLayout';
import { AppRouter } from './components/AppRouter';
import { ErrorBoundary } from './components/ErrorBoundary';
import './App.css';

const VocabularyApp = () => {
  return (
    <ErrorBoundary>
      <NotificationProvider>
        <AppProvider>
          <AppLayout>
            <AppRouter />
          </AppLayout>
        </AppProvider>
      </NotificationProvider>
    </ErrorBoundary>
  );
};

export default VocabularyApp;