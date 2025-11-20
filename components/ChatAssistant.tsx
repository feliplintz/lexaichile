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
      text: 'Hola. Soy Lex, tu asistente legal. ¿En qué puedo ayudarte hoy?' 
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
        text: 'Lo siento, ha ocurrido un error en el servicio.'
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const renderFormattedText = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, idx) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={idx} className="font-bold">{part.slice(2, -2)}</strong>;
      }
      return <span key={idx}>{part}</span>;
    });
  };

  return (
    <div className="flex flex-col h-full bg-white/80 backdrop-blur-xl border-l border-gray-200 shadow-2xl">
      {/* iOS Style Header */}
      <div className="flex flex-col bg-white/50 border-b border-gray-200 p-4 backdrop-blur-md z-10">
        <div className="flex items-center justify-center mb-3 relative">
          <h3 className="text-sm font-semibold text-gray-900">Asistente</h3>
          <div className="absolute right-0 w-2 h-2 bg-green-500 rounded-full"></div>
        </div>
        
        <div className="flex items-center justify-center gap-4">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-gray-500">Internet</span>
            <button 
              onClick={() => setUseWebSearch(!useWebSearch)}
              className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-300 ${useWebSearch ? 'bg-[#34C759]' : 'bg-[#E9E9EB]'}`}
            >
              <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-300 ${useWebSearch ? 'translate-x-4' : 'translate-x-0'}`}></div>
            </button>
          </div>
          
          {caseFiles.length > 0 && (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-gray-500">Expediente</span>
              <button 
                onClick={() => setIncludeCaseContext(!includeCaseContext)}
                className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-300 ${includeCaseContext ? 'bg-[#34C759]' : 'bg-[#E9E9EB]'}`}
              >
                 <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-300 ${includeCaseContext ? 'translate-x-4' : 'translate-x-0'}`}></div>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Chat Area - iMessage Style */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
            <div 
              className={`max-w-[85%] px-4 py-2.5 text-[15px] leading-relaxed shadow-sm ${
                msg.role === 'user' 
                  ? 'bg-[#007AFF] text-white rounded-[20px] rounded-br-none' 
                  : 'bg-[#E9E9EB] text-black rounded-[20px] rounded-bl-none'
              }`}
            >
              <div className="whitespace-pre-wrap">
                {msg.role === 'model' ? renderFormattedText(msg.text) : msg.text}
              </div>
            </div>
            
            {msg.sources && msg.sources.length > 0 && (
              <div className="mt-2 ml-2">
                <p className="text-[10px] font-semibold text-gray-400 uppercase mb-1">Fuentes</p>
                <div className="flex flex-wrap gap-2">
                  {msg.sources.map((src, idx) => (
                    <a 
                      key={idx} 
                      href={src} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="text-[11px] text-[#007AFF] bg-blue-50 px-2 py-0.5 rounded-md hover:underline truncate max-w-[200px]"
                    >
                      {new URL(src).hostname}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
        {isLoading && (
          <div className="flex items-start">
             <div className="bg-[#E9E9EB] rounded-[20px] rounded-bl-none px-4 py-3">
              <div className="flex gap-1.5">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.15s'}}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.3s'}}></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white/80 backdrop-blur-xl border-t border-gray-200">
        <div className="flex gap-2 items-end">
          <div className="flex-1 bg-[#F2F2F7] border border-[#E5E5EA] rounded-[20px] flex items-center px-4 py-2 focus-within:ring-2 focus-within:ring-[#007AFF]/20 transition-all">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="iMessage"
              className="flex-1 bg-transparent border-none outline-none text-sm placeholder-gray-400"
            />
          </div>
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
              input.trim() ? 'bg-[#007AFF] text-white shadow-md active:scale-90' : 'bg-[#E9E9EB] text-gray-400'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 12h14M12 5l7 7-7 7" /></svg>
          </button>
        </div>
        <div className="mt-3 flex gap-2 overflow-x-auto no-scrollbar pb-1">
           <button onClick={() => setInput("Resumen del expediente")} className="flex-shrink-0 text-xs text-[#007AFF] bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-full transition-colors font-medium">Resumir Causa</button>
          <button onClick={() => setInput("Plazo para contestar la demanda")} className="flex-shrink-0 text-xs text-[#007AFF] bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-full transition-colors font-medium">Plazo Contestación</button>
        </div>
      </div>
    </div>
  );
};