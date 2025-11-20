import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { NormativeDoc, ViewState } from '../types';

export const NormativeSettings: React.FC = () => {
  const { normativeDocs, addNormativeDoc, removeNormativeDoc, setViewState } = useApp();
  const [isUploading, setIsUploading] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setIsUploading(true);
      const file = e.target.files[0];
      const reader = new FileReader();

      reader.onload = (event) => {
        const base64String = (event.target?.result as string).split(',')[1];
        const newDoc: NormativeDoc = {
          id: crypto.randomUUID(),
          name: file.name,
          mimeType: file.type,
          content: base64String
        };
        addNormativeDoc(newDoc);
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F5F7] p-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
           <button 
            onClick={() => setViewState(ViewState.DASHBOARD)}
            className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center text-gray-500 hover:text-black transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7 7-7" /></svg>
          </button>
          <h2 className="text-2xl font-bold text-[#1d1d1f]">Configuración</h2>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-6">
          <div className="p-6 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-[#1d1d1f]">Biblioteca Legal</h3>
            <p className="text-sm text-gray-500 mt-1">
              Los documentos que subas aquí formarán la base de conocimiento de Lex.
            </p>
          </div>

          <div className="p-6 bg-gray-50/50">
            <label className="flex flex-col items-center justify-center w-full h-24 border border-dashed border-gray-300 rounded-xl cursor-pointer bg-white hover:bg-gray-50 transition-all group">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-50 text-[#007AFF] rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/></svg>
                </div>
                <span className="text-sm font-medium text-gray-600 group-hover:text-[#007AFF]">Añadir Ley o Auto Acordado (PDF/TXT)</span>
              </div>
              <input type="file" className="hidden" onChange={handleFileUpload} accept=".pdf,.txt" disabled={isUploading} />
            </label>
            {isUploading && <p className="text-center text-[#007AFF] mt-2 text-xs font-medium animate-pulse">Procesando...</p>}
          </div>
        </div>

        <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 ml-4">Documentos Activos</h4>
        
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          {normativeDocs.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-sm italic">
              No hay documentos. Lex usará su conocimiento base.
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {normativeDocs.map(doc => (
                <div key={doc.id} className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors group">
                  <div className="flex items-center gap-4">
                    <div className={`w-8 h-8 rounded flex items-center justify-center text-[10px] font-bold ${doc.mimeType.includes('pdf') ? 'bg-red-50 text-red-600' : 'bg-gray-100 text-gray-600'}`}>
                      {doc.mimeType.includes('pdf') ? 'PDF' : 'TXT'}
                    </div>
                    <span className="text-sm font-medium text-gray-900">{doc.name}</span>
                  </div>
                  <button 
                    onClick={() => removeNormativeDoc(doc.id)}
                    className="text-gray-400 hover:text-red-500 p-2 rounded-full hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};