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
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-bold text-slate-800">Configuración Normativa</h2>
        <button 
          onClick={() => setViewState(ViewState.DASHBOARD)}
          className="text-slate-500 hover:text-slate-700"
        >
          &larr; Volver
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
        <div className="flex items-start gap-4 mb-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-800">Cuerpos Legales de Contexto</h3>
            <p className="text-slate-500 text-sm mt-1">
              Sube aquí los archivos PDF o de texto que contengan las leyes (CPC, Código Civil, Autos Acordados) que la IA debe utilizar para calcular plazos y responder consultas.
            </p>
          </div>
        </div>

        <div className="mt-6">
          <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-300 border-dashed rounded-lg cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors">
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <svg className="w-8 h-8 mb-4 text-slate-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
              </svg>
              <p className="mb-2 text-sm text-slate-500"><span className="font-semibold">Haz click para subir</span> o arrastra un archivo</p>
              <p className="text-xs text-slate-500">PDF, TXT (MAX. 10MB)</p>
            </div>
            <input type="file" className="hidden" onChange={handleFileUpload} accept=".pdf,.txt" disabled={isUploading} />
          </label>
          {isUploading && <p className="text-center text-blue-600 mt-2 text-sm font-medium animate-pulse">Procesando archivo...</p>}
        </div>
      </div>

      <div className="grid gap-4">
        {normativeDocs.length === 0 && (
          <div className="text-center py-10 text-slate-400 italic">
            No hay normativas cargadas. La IA usará conocimiento general.
          </div>
        )}
        {normativeDocs.map(doc => (
          <div key={doc.id} className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-lg hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 text-red-600 rounded flex items-center justify-center font-bold text-xs">
                {doc.mimeType.includes('pdf') ? 'PDF' : 'TXT'}
              </div>
              <span className="font-medium text-slate-700">{doc.name}</span>
            </div>
            <button 
              onClick={() => removeNormativeDoc(doc.id)}
              className="text-red-500 hover:text-red-700 text-sm font-medium px-3 py-1 rounded hover:bg-red-50"
            >
              Eliminar
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};