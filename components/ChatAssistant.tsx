import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { ChatMessage, CaseFile } from '../types';
import { askLegalAssistant } from '../services/geminiService';

interface ChatAssistantProps {
  caseFiles?: CaseFile[];
}

export const ChatAssistant: React.FC<ChatAssistantProps> = ({ caseFiles = [] }) => {
  const { normativeDocs } = useApp();
  const [messages, setMessages] = useState<ChatMessage[]>([
    { 
      id: 'init', 
      role: 'model', 
      text: 'Hola. Soy tu asistente legal. Consulta plazos o procedimientos y responderé de forma directa basándome en tu normativa.' 
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [useWebSearch, setUseWebSearch] = useState(false);
  const [includeCaseContext, setIncludeCaseContext] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Auto-enable case context if there are files
  useEffect(() => {
    if (caseFiles.length > 0) {
      setIncludeCaseContext(true);
    }
  }, [caseFiles]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      text: input
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const filesToInclude = includeCaseContext ? caseFiles : [];
      const response = await askLegalAssistant(userMsg.text, normativeDocs, useWebSearch, messages, filesToInclude);
      
      const botMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'model',
        text: response.text,
        sources: response.sources
      };

      setMessages(prev => [...prev, botMsg]);
    } catch (error) {
      setMessages(prev => [...prev, {
        id: crypto.randomUUID(),
        role: 'model',
        text: 'Lo siento, tuve un problema al procesar tu solicitud.'
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper to render bold text from markdown syntax **text**
  const renderFormattedText = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, idx) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={idx} className="font-bold text-slate-900 bg-yellow-50 px-0.5 rounded">{part.slice(2, -2)}</strong>;
      }
      return <span key={idx}>{part}</span>;
    });
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-xl border border-slate-200 shadow-lg overflow-hidden">
      <div className="bg-slate-800 p-4 space-y-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <h3 className="text-white font-semibold">Asistente Jurídico</h3>
          </div>
        </div>
        
        <div className="flex items-center justify-between gap-2 text-xs text-slate-300 bg-slate-700/50 p-2 rounded-lg">
          <div className="flex items-center gap-2">
            <span className="font-medium">Internet</span>
            <button 
              onClick={() => setUseWebSearch(!useWebSearch)}
              className={`w-9 h-5 rounded-full transition-colors flex items-center p-1 ${useWebSearch ? 'bg-blue-500' : 'bg-slate-600'}`}
            >
              <div className={`w-3 h-3 bg-white rounded-full shadow-sm transition-transform duration-200 ${useWebSearch ? 'translate-x-4' : 'translate-x-0'}`}></div>
            </button>
          </div>
          
          {caseFiles.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="font-medium">Expediente</span>
              <button 
                onClick={() => setIncludeCaseContext(!includeCaseContext)}
                className={`w-9 h-5 rounded-full transition-colors flex items-center p-1 ${includeCaseContext ? 'bg-green-500' : 'bg-slate-600'}`}
              >
                 <div className={`w-3 h-3 bg-white rounded-full shadow-sm transition-transform duration-200 ${includeCaseContext ? 'translate-x-4' : 'translate-x-0'}`}></div>
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 bg-slate-50 space-y-4">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-lg p-3 text-sm ${
              msg.role === 'user' 
                ? 'bg-blue-600 text-white rounded-tr-none' 
                : 'bg-white border border-slate-200 text-slate-700 rounded-tl-none shadow-sm'
            }`}>
              <div className="whitespace-pre-wrap leading-relaxed">
                {msg.role === 'model' ? renderFormattedText(msg.text) : msg.text}
              </div>
              {msg.sources && msg.sources.length > 0 && (
                <div className="mt-2 pt-2 border-t border-slate-100">
                  <p className="text-xs font-bold text-slate-500 mb-1">Fuentes Web:</p>
                  <ul className="list-disc pl-4">
                    {msg.sources.map((src, idx) => (
                      <li key={idx} className="text-xs text-blue-500 truncate max-w-xs">
                        <a href={src} target="_blank" rel="noreferrer" className="hover:underline">{src}</a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white border border-slate-200 rounded-lg p-3 rounded-tl-none shadow-sm">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 bg-white border-t border-slate-200">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder='Ej: "¿Cuál es la última resolución?"'
            className="flex-1 border border-slate-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleSend}
            disabled={isLoading}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
          </button>
        </div>
        <div className="mt-2 text-xs text-slate-400 flex gap-2 overflow-x-auto">
           <button onClick={() => setInput("Resumen del expediente")} className="whitespace-nowrap bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded">Resumir Causa</button>
          <button onClick={() => setInput("Plazo para contestar la demanda")} className="whitespace-nowrap bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded">Contestar Demanda</button>
        </div>
      </div>
    </div>
  );
};