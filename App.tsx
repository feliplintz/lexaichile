import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { ViewState } from './types';
import { Dashboard } from './components/Dashboard';
import { CaseDetail } from './components/CaseDetail';
import { NormativeSettings } from './components/NormativeSettings';

const MainContent: React.FC = () => {
  const { viewState } = useApp();

  switch (viewState) {
    case ViewState.CASE_DETAIL:
      return <CaseDetail />;
    case ViewState.SETTINGS:
      return <NormativeSettings />;
    case ViewState.DASHBOARD:
    default:
      return <Dashboard />;
  }
};

const App: React.FC = () => {
  return (
    <AppProvider>
      <MainContent />
    </AppProvider>
  );
};

export default App;