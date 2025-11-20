import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Case, ViewState, CaseFile } from '../types';
import { extractCaseMetadata } from '../services/geminiService';

export const Dashboard: React.FC = () => {
  const { cases, addCase, setViewState, setCurrentCaseId, deleteCase } = useApp();
  const [showModal, setShowModal] = useState(false);
  const [creationMode, setCreationMode] = useState<'auto' | 'manual'>('auto');
  const [newCaseData, setNewCaseData] = useState({ rol: '', caratula: '', court: '' });
  const [initialFile, setInitialFile] = useState<CaseFile | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleCreateCase = () => {
    if (!newCaseData.rol || !newCaseData.caratula) return;
    
    const newCaseId = crypto.randomUUID();
    const files = initialFile ? [initialFile] : [];
    
    const newCase: Case = {
      id: newCaseId,
      ...newCaseData,
      files: files,
      timeline: [],
      createdAt: new Date().toISOString().split('T')[0]
    };
    addCase(newCase);
    
    // Reset and close
    setShowModal(false);
    setNewCaseData({ rol: '', caratula: '', court: '' });
    setInitialFile(null);
    setCreationMode('auto');
  };

  const handleFileAnalysis = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setIsAnalyzing(true);
      
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const base64String = (event.target?.result as string).split(',')[1];
          // Decode for analysis
          const textContent = atob(base64String);
          
          // Call AI service
          const metadata = await extractCaseMetadata(textContent);
          
          setNewCaseData({
            rol: metadata.rol || '',
            caratula: metadata.caratula || '',
            court: metadata.court || ''
          });

          // Prepare file to be added to case upon creation
          setInitialFile({
            id: crypto.randomUUID(),
            name: file.name,
            uploadDate: new Date().toISOString().split('T')[0],
            mimeType: file.type || 'text/markdown',
            content: base64String
          });

        } catch (err) {
          alert("No se pudo analizar el archivo. Intente ingresando los datos manualmente.");
          console.error(err);
        } finally {
          setIsAnalyzing(false);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const openCase = (id: string) => {
    setCurrentCaseId(id);
    setViewState(ViewState.CASE_DETAIL);
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (window.confirm('¿Estás seguro de eliminar esta causa?')) {
      deleteCase(id);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <nav className="bg-slate-800 text-white px-8 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <span className="text-2xl">⚖️</span>
          <span className="font-bold text-xl tracking-tight">LexChile AI</span>
        </div>
        <button 
          onClick={() => setViewState(ViewState.SETTINGS)}
          className="text-sm text-slate-300 hover:text-white flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          Configurar Normativa
        </button>
      </nav>

      <main className="p-8 max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Mis Causas</h1>
            <p className="text-slate-500">Gestiona tus expedientes y consulta plazos.</p>
          </div>
          <button 
            onClick={() => setShowModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium shadow-lg shadow-blue-600/20 transition-all flex items-center gap-2"
          >
            <span>+</span> Nueva Causa
          </button>
        </div>

        {cases.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center border border-slate-200 shadow-sm">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-4xl">📂</div>
            <h3 className="text-lg font-medium text-slate-800">No tienes causas registradas</h3>
            <p className="text-slate-500 mt-2 mb-6">Sube tu expediente en Markdown o crea una causa manualmente.</p>
            <button onClick={() => setShowModal(true)} className="text-blue-600 font-medium hover:underline">Crear Causa Ahora</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cases.map(c => (
              <div 
                key={c.id} 
                onClick={() => openCase(c.id)}
                className="bg-white rounded-xl border border-slate-200 p-6 cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group relative"
              >
                <button 
                  onClick={(e) => handleDelete(e, c.id)}
                  className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white hover:bg-red-500 rounded-full transition-all z-20 shadow-sm"
                  title="Eliminar causa"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
                <div className="flex justify-between items-start mb-4">
                  <span className="bg-slate-100 text-slate-600 text-xs font-mono px-2 py-1 rounded">{c.rol}</span>
                  <span className="text-xs text-slate-400 pr-8">{c.createdAt}</span>
                </div>
                <h3 className="font-bold text-lg text-slate-800 mb-1 group-hover:text-blue-600 transition-colors">{c.caratula}</h3>
                <p className="text-sm text-slate-500 mb-4">{c.court}</p>
                <div className="flex items-center gap-4 text-xs text-slate-400 border-t border-slate-100 pt-4">
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    {c.files.length} Docs
                  </span>
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    {c.timeline.length} Hitos
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* New Case Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="bg-slate-50 px-8 py-4 border-b border-slate-200">
              <h2 className="text-xl font-bold text-slate-800">Nueva Causa</h2>
            </div>
            
            {/* Tabs */}
            <div className="flex border-b border-slate-200">
              <button 
                className={`flex-1 py-3 text-sm font-medium ${creationMode === 'auto' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:bg-slate-50'}`}
                onClick={() => setCreationMode('auto')}
              >
                Automático (Desde Expediente)
              </button>
              <button 
                className={`flex-1 py-3 text-sm font-medium ${creationMode === 'manual' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:bg-slate-50'}`}
                onClick={() => setCreationMode('manual')}
              >
                Manual
              </button>
            </div>

            <div className="p-8">
              {creationMode === 'auto' && !initialFile ? (
                <div className="text-center py-4">
                  <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-blue-300 border-dashed rounded-lg cursor-pointer bg-blue-50 hover:bg-blue-100 transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      {isAnalyzing ? (
                        <div className="flex flex-col items-center animate-pulse">
                          <div className="w-10 h-10 mb-3 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                          <p className="text-sm text-blue-700 font-semibold">Analizando Expediente...</p>
                        </div>
                      ) : (
                        <>
                          <svg className="w-10 h-10 mb-3 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                          <p className="mb-2 text-sm text-slate-700"><span className="font-bold">Sube tu Expediente (Markdown)</span></p>
                          <p className="text-xs text-slate-500">La IA detectará Rol y Partes automáticamente</p>
                        </>
                      )}
                    </div>
                    <input 
                      type="file" 
                      className="hidden" 
                      onChange={handleFileAnalysis} 
                      accept=".md,.txt" 
                      disabled={isAnalyzing} 
                    />
                  </label>
                </div>
              ) : (
                <div className="space-y-4">
                  {initialFile && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-3 text-sm mb-4">
                      <span className="text-green-600">✓</span>
                      <span className="font-medium text-green-800 truncate">{initialFile.name}</span>
                      <button onClick={() => { setInitialFile(null); setNewCaseData({ rol: '', caratula: '', court: '' }); }} className="ml-auto text-xs text-red-500 hover:underline">Cambiar</button>
                    </div>
                  )}
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Carátula</label>
                    <input 
                      type="text" 
                      placeholder="PEREZ / GONZALEZ"
                      className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                      value={newCaseData.caratula}
                      onChange={e => setNewCaseData({...newCaseData, caratula: e.target.value})}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">ROL/RIT</label>
                      <input 
                        type="text" 
                        placeholder="C-1234-2024"
                        className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                        value={newCaseData.rol}
                        onChange={e => setNewCaseData({...newCaseData, rol: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Tribunal</label>
                      <input 
                        type="text" 
                        placeholder="1º Juzgado..."
                        className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                        value={newCaseData.court}
                        onChange={e => setNewCaseData({...newCaseData, court: e.target.value})}
                      />
                    </div>
                  </div>
                </div>
              )}
              
              <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-slate-100">
                <button onClick={() => setShowModal(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">Cancelar</button>
                <button 
                  onClick={handleCreateCase} 
                  disabled={!newCaseData.rol || !newCaseData.caratula}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Crear Causa
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};