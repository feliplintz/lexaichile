import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { CaseFile, ViewState } from '../types';
import { ChatAssistant } from './ChatAssistant';
import { generateCaseTimeline } from '../services/geminiService';

export const CaseDetail: React.FC = () => {
  const { cases, currentCaseId, setViewState, cases: allCases, updateCaseTimeline, addCaseFile } = useApp();
  const activeCase = allCases.find(c => c.id === currentCaseId);
  const [activeTab, setActiveTab] = useState<'timeline' | 'files'>('timeline');
  const [isGeneratingTimeline, setIsGeneratingTimeline] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showChat, setShowChat] = useState(false);

  if (!activeCase) return <div>Error: Causa no encontrada</div>;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setIsUploading(true);
      const file = e.target.files[0];
      const reader = new FileReader();

      reader.onload = (event) => {
        const base64String = (event.target?.result as string).split(',')[1];
        const newFile: CaseFile = {
          id: crypto.randomUUID(),
          name: file.name,
          uploadDate: new Date().toISOString().split('T')[0],
          mimeType: file.type || 'text/markdown', // Default to markdown/text if unknown in this context
          content: base64String
        };
        addCaseFile(activeCase.id, newFile);
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerateTimeline = async () => {
    if (activeCase.files.length === 0) {
      alert("Sube archivos al expediente electrónico (E-Book) primero.");
      return;
    }
    setIsGeneratingTimeline(true);
    try {
      const events = await generateCaseTimeline(activeCase.files);
      updateCaseTimeline(activeCase.id, events);
    } catch (e) {
      alert("Error al generar línea de tiempo.");
    } finally {
      setIsGeneratingTimeline(false);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-slate-50 overflow-hidden relative">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center shadow-sm z-10">
        <div className="flex items-center gap-4">
          <button onClick={() => setViewState(ViewState.DASHBOARD)} className="text-slate-500 hover:text-slate-800">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-800">{activeCase.caratula}</h1>
            <span className="text-sm font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">ROL: {activeCase.rol}</span>
          </div>
        </div>
        <div className="flex gap-3">
           <button 
            onClick={() => setShowChat(!showChat)}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
            {showChat ? 'Ocultar Asistente' : 'Asistente'}
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Main Content */}
        <main className={`flex-1 overflow-y-auto p-8 transition-all duration-300 ${showChat ? 'mr-96' : ''}`}>
          
          {/* Tabs */}
          <div className="flex gap-6 border-b border-slate-200 mb-8">
            <button 
              onClick={() => setActiveTab('timeline')}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'timeline' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            >
              Línea de Tiempo Procesal
            </button>
            <button 
              onClick={() => setActiveTab('files')}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'files' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            >
              E-Book (Expediente)
            </button>
          </div>

          {activeTab === 'timeline' && (
            <div className="max-w-3xl mx-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-semibold text-slate-700">Historia Procesal</h2>
                <button 
                  onClick={handleGenerateTimeline}
                  disabled={isGeneratingTimeline}
                  className="text-sm bg-white border border-slate-300 text-slate-700 px-3 py-1.5 rounded-md hover:bg-slate-50 disabled:opacity-50 flex items-center gap-2 shadow-sm font-medium"
                >
                  {isGeneratingTimeline ? (
                    <>Actualizando <span className="animate-spin">⏳</span></>
                  ) : (
                    <>
                      <svg className="w-4 h-4 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                      Generar con IA
                    </>
                  )}
                </button>
              </div>

              {activeCase.timeline.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl border border-dashed border-slate-300">
                  <p className="text-slate-500 mb-2">No hay hitos generados aún.</p>
                  <p className="text-xs text-slate-400">Sube archivos al E-Book y presiona "Generar con IA"</p>
                </div>
              ) : (
                <div className="relative border-l-2 border-slate-200 ml-3 space-y-8 pb-10">
                  {activeCase.timeline.map((event, idx) => (
                    <div key={idx} className="relative pl-8 group">
                      <div className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full border-2 border-white ${event.type === 'resolucion' ? 'bg-red-500' : event.type === 'escrito' ? 'bg-blue-500' : 'bg-slate-400'}`}></div>
                      <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{event.date}</span>
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${event.type === 'resolucion' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
                            {event.type.toUpperCase()}
                          </span>
                        </div>
                        <h3 className="text-md font-bold text-slate-800 mb-1">{event.title}</h3>
                        <p className="text-slate-600 text-sm leading-relaxed">{event.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'files' && (
            <div>
              <div className="mb-6 flex items-center gap-4">
                <label className={`inline-block px-4 py-2 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700 transition-colors ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                  {isUploading ? 'Subiendo...' : '+ Subir Archivo (Markdown/PDF)'}
                  <input 
                    type="file" 
                    className="hidden" 
                    onChange={handleFileUpload} 
                    accept=".pdf,.txt,.md,application/pdf,text/plain,text/markdown"
                    disabled={isUploading}
                  />
                </label>
                {isUploading && <span className="text-sm text-blue-600 animate-pulse">Procesando documento...</span>}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                 {activeCase.files.length === 0 && (
                   <div className="col-span-full text-center py-10 text-slate-400 border border-dashed border-slate-300 rounded-lg">
                     No hay archivos en este expediente.
                   </div>
                 )}
                 {activeCase.files.map(f => (
                   <div key={f.id} className="bg-white p-4 rounded-lg border border-slate-200 flex items-center gap-3 shadow-sm hover:shadow-md transition-shadow">
                     <div className={`w-10 h-12 flex items-center justify-center text-xs font-bold rounded ${f.mimeType === 'application/pdf' ? 'bg-red-50 border border-red-100 text-red-500' : 'bg-gray-50 border border-gray-100 text-gray-600'}`}>
                       {f.mimeType === 'application/pdf' ? 'PDF' : 'MD'}
                     </div>
                     <div className="overflow-hidden flex-1">
                       <p className="font-medium text-slate-700 text-sm truncate" title={f.name}>{f.name}</p>
                       <p className="text-xs text-slate-400">Subido: {f.uploadDate}</p>
                     </div>
                   </div>
                 ))}
              </div>
            </div>
          )}
        </main>

        {/* Floating Chat Sidebar */}
        <aside 
          className={`fixed top-[73px] bottom-0 right-0 w-96 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out border-l border-slate-200 z-20 ${showChat ? 'translate-x-0' : 'translate-x-full'}`}
        >
          <ChatAssistant caseFiles={activeCase.files} />
        </aside>
      </div>
    </div>
  );
};