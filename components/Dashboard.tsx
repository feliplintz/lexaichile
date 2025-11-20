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
          const textContent = atob(base64String);
          const metadata = await extractCaseMetadata(textContent);
          
          setNewCaseData({
            rol: metadata.rol || '',
            caratula: metadata.caratula || '',
            court: metadata.court || ''
          });

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
    <div className="min-h-screen bg-[#F5F5F7] text-[#1d1d1f]">
      {/* macOS-style Toolbar */}
      <header className="glass-panel sticky top-0 z-40 px-8 py-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-black text-white rounded-xl flex items-center justify-center text-xl font-serif shadow-sm">L</div>
          <h1 className="text-2xl font-semibold tracking-tight">Lex</h1>
        </div>
        <button 
          onClick={() => setViewState(ViewState.SETTINGS)}
          className="p-2 rounded-full hover:bg-black/5 text-gray-500 transition-all active:scale-95"
          title="Configuración"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
        </button>
      </header>

      <main className="p-8 max-w-screen-2xl mx-auto">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h2 className="text-3xl font-bold text-[#1d1d1f]">Mis Causas</h2>
            <p className="text-gray-500 mt-1">Recientes</p>
          </div>
          <button 
            onClick={() => setShowModal(true)}
            className="bg-[#007AFF] hover:bg-[#0071E3] text-white px-5 py-2.5 rounded-full font-medium shadow-md shadow-blue-500/20 transition-all active:scale-95 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/></svg>
            Nueva Causa
          </button>
        </div>

        {cases.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-96 bg-white rounded-3xl border border-black/5 shadow-sm">
            <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6 text-5xl shadow-inner">
              📂
            </div>
            <h3 className="text-xl font-semibold text-gray-900">Sin expedientes</h3>
            <p className="text-gray-500 mt-2 max-w-sm text-center">Comienza gestionando tus causas legales creando una nueva carpeta.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {cases.map(c => (
              <div 
                key={c.id} 
                onClick={() => openCase(c.id)}
                className="group relative bg-white p-6 rounded-[20px] shadow-[0_2px_12px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] transition-all duration-300 cursor-default ring-1 ring-black/5"
              >
                <button 
                  onClick={(e) => handleDelete(e, c.id)}
                  className="absolute top-4 right-4 p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>

                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-blue-50 text-[#007AFF] rounded-xl flex items-center justify-center text-2xl shadow-inner">
                    ⚖️
                  </div>
                  <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">{c.createdAt}</span>
                </div>

                <h3 className="font-bold text-lg text-[#1d1d1f] leading-snug mb-1 truncate">{c.caratula}</h3>
                <p className="text-sm text-[#007AFF] font-medium bg-blue-50/50 inline-block px-2 py-0.5 rounded-md mb-3">{c.rol}</p>
                <p className="text-xs text-gray-500 mb-4 truncate">{c.court}</p>

                <div className="flex items-center gap-3 pt-4 border-t border-gray-50">
                  <div className="flex items-center gap-1.5 text-xs text-gray-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                    {c.files.length}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-400">
                     <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    {c.timeline.length}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* macOS Sheet/Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-gray-100 overflow-hidden scale-100 animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-gray-100 bg-[#F5F5F7]">
              <h2 className="text-lg font-semibold text-gray-900">Nueva Causa</h2>
            </div>
            
            <div className="p-1 bg-[#F5F5F7] mx-6 mt-6 rounded-lg flex shadow-inner">
              <button 
                className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${creationMode === 'auto' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                onClick={() => setCreationMode('auto')}
              >
                Automático
              </button>
              <button 
                className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${creationMode === 'manual' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                onClick={() => setCreationMode('manual')}
              >
                Manual
              </button>
            </div>

            <div className="p-6">
              {creationMode === 'auto' && !initialFile ? (
                <div className="text-center">
                  <label className="flex flex-col items-center justify-center w-full h-32 border border-dashed border-gray-300 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors group">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      {isAnalyzing ? (
                        <div className="animate-spin w-8 h-8 border-2 border-[#007AFF] border-t-transparent rounded-full mb-2"></div>
                      ) : (
                        <svg className="w-8 h-8 mb-2 text-gray-400 group-hover:text-[#007AFF] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                      )}
                      <p className="text-sm text-gray-600 font-medium">{isAnalyzing ? 'Analizando...' : 'Seleccionar Expediente'}</p>
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
                    <div className="bg-green-50/50 border border-green-100 rounded-lg p-2 flex items-center gap-2 text-xs text-green-700 mb-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/></svg>
                      <span className="font-medium truncate flex-1">{initialFile.name}</span>
                      <button onClick={() => { setInitialFile(null); setNewCaseData({ rol: '', caratula: '', court: '' }); }} className="text-gray-400 hover:text-gray-600">✕</button>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">Carátula</label>
                    <input 
                      type="text" 
                      placeholder="DEMANDANTE / DEMANDADO"
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#007AFF]/20 focus:border-[#007AFF] outline-none transition-all"
                      value={newCaseData.caratula}
                      onChange={e => setNewCaseData({...newCaseData, caratula: e.target.value})}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">Rol</label>
                      <input 
                        type="text" 
                        placeholder="C-123-2025"
                        className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#007AFF]/20 focus:border-[#007AFF] outline-none transition-all"
                        value={newCaseData.rol}
                        onChange={e => setNewCaseData({...newCaseData, rol: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">Tribunal</label>
                      <input 
                        type="text" 
                        placeholder="Juzgado..."
                        className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#007AFF]/20 focus:border-[#007AFF] outline-none transition-all"
                        value={newCaseData.court}
                        onChange={e => setNewCaseData({...newCaseData, court: e.target.value})}
                      />
                    </div>
                  </div>
                </div>
              )}
              
              <div className="flex justify-end gap-3 mt-8">
                <button 
                  onClick={() => setShowModal(false)} 
                  className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleCreateCase} 
                  disabled={!newCaseData.rol || !newCaseData.caratula}
                  className="px-6 py-2 bg-[#007AFF] hover:bg-[#0071E3] text-white text-sm font-medium rounded-full shadow-md transition-all active:scale-95 disabled:opacity-50 disabled:scale-100"
                >
                  Crear
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};