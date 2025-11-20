import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Case, NormativeDoc, CaseFile, ViewState } from '../types';
import { dbService } from '../services/db';

interface AppContextType {
  viewState: ViewState;
  setViewState: (view: ViewState) => void;
  cases: Case[];
  addCase: (newCase: Case) => void;
  deleteCase: (caseId: string) => void;
  addCaseFile: (caseId: string, file: CaseFile) => void;
  currentCaseId: string | null;
  setCurrentCaseId: (id: string | null) => void;
  normativeDocs: NormativeDoc[];
  addNormativeDoc: (doc: NormativeDoc) => void;
  removeNormativeDoc: (id: string) => void;
  updateCaseTimeline: (caseId: string, timeline: any[]) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [viewState, setViewState] = useState<ViewState>(ViewState.DASHBOARD);
  const [cases, setCases] = useState<Case[]>([]);
  const [currentCaseId, setCurrentCaseId] = useState<string | null>(null);
  const [normativeDocs, setNormativeDocs] = useState<NormativeDoc[]>([]);

  // Load from IndexedDB on mount
  useEffect(() => {
    const loadData = async () => {
      const loadedCases = await dbService.getAllCases();
      // Sort cases by most recent
      setCases(loadedCases.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      
      const loadedNorms = await dbService.getAllNorms();
      setNormativeDocs(loadedNorms);
    };
    loadData();
  }, []);

  const addCase = (newCase: Case) => {
    setCases(prev => [newCase, ...prev]);
    dbService.saveCase(newCase).catch(console.error);
  };

  const deleteCase = (caseId: string) => {
    setCases(prev => prev.filter(c => c.id !== caseId));
    if (currentCaseId === caseId) {
      setCurrentCaseId(null);
      setViewState(ViewState.DASHBOARD);
    }
    dbService.deleteCase(caseId).catch(console.error);
  };

  const addCaseFile = (caseId: string, file: CaseFile) => {
    setCases(prev => {
      const nextCases = prev.map(c => {
        if (c.id === caseId) {
          const updatedCase = { ...c, files: [...c.files, file] };
          dbService.saveCase(updatedCase).catch(console.error);
          return updatedCase;
        }
        return c;
      });
      return nextCases;
    });
  };

  const addNormativeDoc = (doc: NormativeDoc) => {
    setNormativeDocs(prev => [...prev, doc]);
    dbService.saveNorm(doc).catch(console.error);
  };

  const removeNormativeDoc = (id: string) => {
    setNormativeDocs(prev => prev.filter(d => d.id !== id));
    dbService.deleteNorm(id).catch(console.error);
  };

  const updateCaseTimeline = (caseId: string, timeline: any[]) => {
    setCases(prev => {
      const nextCases = prev.map(c => {
        if (c.id === caseId) {
          const updatedCase = { ...c, timeline };
          dbService.saveCase(updatedCase).catch(console.error);
          return updatedCase;
        }
        return c;
      });
      return nextCases;
    });
  };

  return (
    <AppContext.Provider value={{
      viewState,
      setViewState,
      cases,
      addCase,
      deleteCase,
      addCaseFile,
      currentCaseId,
      setCurrentCaseId,
      normativeDocs,
      addNormativeDoc,
      removeNormativeDoc,
      updateCaseTimeline
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};