import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { CaseFile, ViewState } from '../types';
import { ChatAssistant } from './ChatAssistant';
import { generateCaseTimeline } from '../services/geminiService';

export const CaseDetail: React.FC = () => {
  const { currentCaseId, setViewState, cases: allCases, updateCaseTimeline, addCaseFile } = useApp();
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
          mimeType: file.type || 'text/markdown',
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
      alert("Sube archivos al expediente electrónico primero.");
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
    <div className="h-screen flex flex-col bg-[#F5F5F7] overflow-hidden">
      {/* Glassmorphism Header */}
      <header className="glass-panel sticky top-0 z-30 px-6 py-3 flex justify-between items-center h-16">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setViewState(ViewState.DASHBOARD)} 
            className="p-2 rounded-lg hover:bg-black/5 text-[#007AFF] transition-colors flex items-center gap-1 font-medium"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" /></svg>
            Atrás
          </button>
          <div className="h-6 w-px bg-gray-300 mx-1"></div>
          <div>
            <h1 className="text-sm font-bold text-gray-900 tracking-tight">{activeCase.caratula}</h1>
            <p className="text-xs text-gray-500 font-mono">{activeCase.rol}</p>
          </div>
        </div>
        
        <div>
           <button 
            onClick={() => setShowChat(!showChat)}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium transition-all border ${showChat ? 'bg-[#007AFF] text-white border-transparent shadow-md' : 'bg-white text-gray-700 border-gray-200 shadow-sm hover:bg-gray-50'}`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
            Asistente
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Main Content Area */}
        <main className={`flex-1 overflow-y-auto p-8 transition-all duration-300 ease-out ${showChat ? 'mr-[400px]' : ''}`}>
          
          {/* iOS Segmented Control Style Tabs */}
          <div className="flex justify-center mb-8">
            <div className="bg-[#E9E9EB] p-1 rounded-xl inline-flex relative">
              <button 
                onClick={() => setActiveTab('timeline')}
                className={`px-6 py-1.5 text-sm font-medium rounded-lg transition-all duration-200 ${activeTab === 'timeline' ? 'bg-white shadow-sm text-black' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Línea de Tiempo
              </button>
              <button 
                onClick={() => setActiveTab('files')}
                className={`px-6 py-1.5 text-sm font-medium rounded-lg transition-all duration-200 ${activeTab === 'files' ? 'bg-white shadow-sm text-black' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Expediente
              </button>
            </div>
          </div>

          {activeTab === 'timeline' && (
            <div className="max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex justify-between items-center mb-6 px-4">
                <h2 className="text-xl font-bold text-[#1d1d1f]">Historia Procesal</h2>
                <button 
                  onClick={handleGenerateTimeline}
                  disabled={isGeneratingTimeline}
                  className="text-xs font-medium bg-white/80 backdrop-blur border border-gray-200 text-gray-700 px-3 py-1.5 rounded-full hover:bg-white hover:shadow-sm transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {isGeneratingTimeline ? (
                    <>Actualizando...</>
                  ) : (
                    <>
                      <svg className="w-3 h-3 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                      Generar con IA
                    </>
                  )}
                </button>
              </div>

              {activeCase.timeline.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl shadow-sm border border-gray-100 mx-4">
                  <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  </div>
                  <p className="text-gray-500 font-medium">Sin hitos procesales</p>
                  <p className="text-sm text-gray-400 mt-1">Sube el expediente y genera la historia.</p>
                </div>
              ) : (
                <div className="relative ml-6 space-y-8 pb-10">
                  <div className="absolute left-0 top-4 bottom-4 w-px bg-gray-200"></div>
                  {activeCase.timeline.map((event, idx) => (
                    <div key={idx} className="relative pl-8 group">
                      <div className={`absolute -left-[5px] top-1.5 w-[11px] h-[11px] rounded-full border-2 border-[#F5F5F7] shadow-sm z-10 ${event.type === 'resolucion' ? 'bg-red-500' : event.type === 'escrito' ? 'bg-blue-500' : 'bg-gray-400'}`}></div>
                      <div className="bg-white p-5 rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-gray-100 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">{event.date}</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-md font-semibold tracking-wide uppercase ${event.type === 'resolucion' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
                            {event.type}
                          </span>
                        </div>
                        <h3 className="text-base font-bold text-[#1d1d1f] mb-1">{event.title}</h3>
                        <p className="text-sm text-gray-600 leading-relaxed">{event.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'files' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="mb-6 flex items-center gap-4">
                <label className={`inline-flex items-center gap-2 px-5 py-2.5 bg-[#007AFF] hover:bg-[#0071E3] text-white rounded-full text-sm font-medium shadow-md shadow-blue-500/20 cursor-pointer transition-all active:scale-95 ${isUploading ? 'opacity-70 cursor-wait' : ''}`}>
                  {isUploading ? (
                    <span className="animate-pulse">Subiendo...</span>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/></svg>
                      Subir Archivo
                    </>
                  )}
                  <input 
                    type="file" 
                    className="hidden" 
                    onChange={handleFileUpload} 
                    accept=".pdf,.txt,.md,application/pdf,text/plain,text/markdown"
                    disabled={isUploading}
                  />
                </label>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                 {activeCase.files.length === 0 && (
                   <div className="col-span-full flex flex-col items-center justify-center py-20 text-gray-400 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50/50">
                     <p>Arrastra archivos aquí o usa el botón subir</p>
                   </div>
                 )}
                 {activeCase.files.map(f => (
                   <div key={f.id} className="group bg-white p-4 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5">
                     <div className="flex items-start gap-4">
                       <div className={`w-10 h-12 rounded-lg flex items-center justify-center text-[10px] font-bold shadow-sm ${f.mimeType === 'application/pdf' ? 'bg-red-50 text-red-600' : 'bg-gray-100 text-gray-600'}`}>
                         {f.mimeType === 'application/pdf' ? 'PDF' : 'DOC'}
                       </div>
                       <div className="overflow-hidden flex-1">
                         <p className="font-semibold text-gray-900 text-sm truncate mb-1" title={f.name}>{f.name}</p>
                         <p className="text-xs text-gray-400">{f.uploadDate}</p>
                       </div>
                     </div>
                   </div>
                 ))}
              </div>
            </div>
          )}
        </main>

        {/* Floating Chat Sidebar - Refined Animation */}
        <aside 
          className={`fixed top-[64px] bottom-0 right-0 w-[400px] bg-white shadow-[0_0_40px_rgba(0,0,0,0.1)] transform transition-transform duration-300 cubic-bezier(0.2, 0.8, 0.2, 1) z-40 border-l border-gray-200 ${showChat ? 'translate-x-0' : 'translate-x-full'}`}
        >
          <ChatAssistant caseFiles={activeCase.files} />
        </aside>
      </div>
    </div>
  );
};