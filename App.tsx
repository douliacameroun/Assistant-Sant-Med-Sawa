
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WELCOME_MESSAGE, LOGO_URL } from './constants';
import { Message, VoiceState, AuditData, AppView } from './types';
import { 
  createChatSession, 
  generateTTS,
  decodeBase64,
  decodeAudioData
} from './services/geminiService';
import { GoogleGenAI } from "@google/genai";

const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

const NeuralBackground: React.FC<{ isTyping: boolean; isListening: boolean; isSpeaking: boolean }> = ({ isTyping, isListening, isSpeaking }) => {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0 bg-[#F8FAFF] print:hidden">
      <motion.div 
        animate={{ scale: [1, 1.2, 1], opacity: isTyping ? [0.1, 0.3, 0.1] : 0.1 }}
        transition={{ duration: 15, repeat: Infinity }}
        className="absolute top-[-20%] left-[-10%] w-[80vw] h-[80vw] rounded-full bg-gradient-to-br from-[#1B3B66] via-[#4A90E2] to-transparent blur-[140px]"
      />
      <motion.div 
        animate={{ scale: [1, 1.3, 1], opacity: (isListening || isSpeaking) ? [0.2, 0.4, 0.2] : 0.08 }}
        transition={{ duration: 12, repeat: Infinity }}
        className="absolute bottom-[-20%] right-[-10%] w-[70vw] h-[70vw] rounded-full bg-gradient-to-tl from-[#C07D38] via-[#E4A853] to-transparent blur-[140px]"
      />
      <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(#1B3B66 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
    </div>
  );
};

const Logo: React.FC<{ isTyping?: boolean; isListening?: boolean; isSpeaking?: boolean }> = ({ isTyping, isListening, isSpeaking }) => (
  <div className="flex items-center gap-3">
    <div className="relative">
      <AnimatePresence>
        {(isTyping || isListening || isSpeaking) && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1.3 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className={`absolute inset-0 blur-2xl rounded-full ${
              isListening ? 'bg-red-400/40' : 
              isSpeaking ? 'bg-[#C07D38]/60' : 
              'bg-[#C07D38]/40'
            }`}
            transition={{ duration: 0.8, repeat: Infinity, repeatType: "reverse" }}
          />
        )}
      </AnimatePresence>
      <div className="w-12 h-12 md:w-16 md:h-16 relative z-10 bg-white rounded-xl p-1.5 md:p-2 shadow-2xl border border-slate-100 flex items-center justify-center">
        <img src={LOGO_URL} alt="MED SAWA" className="w-full h-full object-contain" />
      </div>
    </div>
    <div className="flex flex-col">
      <div className="flex items-baseline gap-1">
        <span className="text-xl md:text-2xl font-black text-[#1B3B66] tracking-tighter uppercase leading-none">MED SAWA</span>
      </div>
      <span className="text-[8px] md:text-[9px] font-bold text-[#C07D38] uppercase tracking-[0.3em] opacity-80">IA Consulting Élite</span>
    </div>
  </div>
);

const MessageContent: React.FC<{ text: string; role: 'user' | 'ai' }> = ({ text, role }) => {
  if (role === 'user') return <p>{text}</p>;

  return (
    <div className="space-y-2">
      {text.split('\n').map((line, idx) => {
        const isTitle = line.length > 3 && line === line.toUpperCase() && !line.includes('**');
        const parts = line.split(/(\*\*.*?\*\*)/g);
        
        return (
          <p key={idx} className={isTitle ? 'text-[#C07D38] font-black uppercase tracking-widest text-[11px] mt-4 first:mt-0' : ''}>
            {parts.map((part, pIdx) => {
              if (part.startsWith('**') && part.endsWith('**')) {
                return <strong key={pIdx} className="font-bold text-[#1B3B66]">{part.slice(2, -2)}</strong>;
              }
              return part;
            })}
          </p>
        );
      })}
    </div>
  );
};

const SolutionCard: React.FC<{ title: string; subtitle: string; desc: string; icon: React.ReactNode; colorClass: string; onClick: () => void }> = ({ title, subtitle, desc, icon, colorClass, onClick }) => (
  <motion.button 
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
    onClick={onClick}
    className="w-full text-left group relative overflow-hidden bg-white/60 backdrop-blur-lg border border-white/80 p-5 rounded-[2rem] shadow-sm hover:shadow-xl transition-all"
  >
    <div className={`absolute -right-4 -top-4 w-24 h-24 blur-3xl opacity-0 group-hover:opacity-20 transition-opacity rounded-full ${colorClass}`} />
    <div className="relative z-10">
      <div className="mb-3 text-[#1B3B66] group-hover:scale-110 transition-transform origin-left">{icon}</div>
      <h3 className="text-[10px] font-black text-[#C07D38] uppercase tracking-[0.2em] mb-1">{subtitle}</h3>
      <h2 className="text-lg font-black text-[#1B3B66] tracking-tight mb-2 uppercase leading-none">{title}</h2>
      <p className="text-[11px] text-slate-500 font-medium leading-relaxed line-clamp-2">{desc}</p>
    </div>
  </motion.button>
);

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', role: 'ai', text: WELCOME_MESSAGE, timestamp: Date.now() }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [view, setView] = useState<AppView>('chat');
  const [auditData, setAuditData] = useState<AuditData | null>(null);
  const [attachedFile, setAttachedFile] = useState<{name: string, data: string, type: string} | null>(null);

  const chatSessionRef = useRef<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    chatSessionRef.current = createChatSession();
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.lang = 'fr-FR';
      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputText(transcript);
        setTimeout(() => handleSend(transcript), 600);
      };
      recognitionRef.current = recognition;
    }
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages, isTyping]);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        if (result) {
          const base64Data = result.split(',')[1];
          setAttachedFile({
            name: file.name,
            data: base64Data,
            type: file.type
          });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const speak = async (text: string) => {
    try {
      setIsSpeaking(true);
      const cleanText = text.replace(/\*\*/g, '');
      const audio = await generateTTS(cleanText);
      if (audio) {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        const buf = await decodeAudioData(decodeBase64(audio), ctx, 24000, 1);
        const src = ctx.createBufferSource();
        src.buffer = buf;
        src.connect(ctx.destination);
        src.onended = () => setIsSpeaking(false);
        src.start();
      } else {
        setIsSpeaking(false);
      }
    } catch (e) { 
      console.error("TTS Error", e); 
      setIsSpeaking(false);
    }
  };

  const handleSend = async (textToSend: string = inputText) => {
    const trimmedText = textToSend.trim();
    if (!trimmedText && !attachedFile || isTyping) return;

    const userMsg = trimmedText || `[Fichier joint: ${attachedFile?.name}]`;
    setMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', text: userMsg, timestamp: Date.now() }]);
    setInputText('');
    
    const file = attachedFile;
    setAttachedFile(null);
    setIsTyping(true);
    setIsSidebarOpen(false);

    try {
      let response;
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      if (file) {
        const res = await ai.models.generateContent({
          model: 'gemini-3-pro-preview',
          contents: {
            parts: [
              { inlineData: { data: file.data, mimeType: file.type } },
              { text: trimmedText || "Analyse ce document dans le contexte d'un audit stratégique MED SAWA." }
            ]
          }
        });
        response = { text: res.text };
      } else {
        response = await chatSessionRef.current.sendMessage({ message: trimmedText });
      }

      const aiText = response.text || "Expertise temporairement indisponible.";
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'ai', text: aiText, timestamp: Date.now() }]);
      setIsTyping(false);
      
      speak(aiText);

      if (aiText.toUpperCase().includes("AUDIT") || aiText.toUpperCase().includes("TRANSFORMATION")) {
        setAuditData({
          maturityScore: Math.floor(Math.random() * (92 - 58) + 58),
          identifiedPains: ["Processus manuels chronophages", "Manque de visibilité sur les réseaux", "Données non exploitées pour la stratégie"],
          recommendedPacks: ["Connect", "Process", "Insight"],
          potentialROI: "+50% de croissance et d'efficacité",
          transformationPlan: [
            "Lancement de SAWA Connect pour la visibilité réseaux",
            "Automatisation des flux avec SAWA Process",
            "Déploiement d'outils analytiques SAWA Insight"
          ]
        });
      }
    } catch (e) {
      console.error(e);
      setIsTyping(false);
    }
  };

  const handleExport = () => {
    window.print();
  };

  const handleSolutionClick = (solutionName: string) => {
    const prompt = `Comment la solution SAWA ${solutionName} peut-elle améliorer spécifiquement la performance de mon entreprise ?`;
    handleSend(prompt);
  };

  return (
    <div className="h-screen w-full flex flex-col overflow-hidden font-sans relative">
      <NeuralBackground isTyping={isTyping} isListening={isListening} isSpeaking={isSpeaking} />
      
      <header className="h-20 shrink-0 flex items-center justify-between px-4 md:px-8 bg-white/80 backdrop-blur-2xl border-b border-slate-200/50 z-50 print:hidden">
        <Logo isTyping={isTyping} isListening={isListening} isSpeaking={isSpeaking} />
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="lg:hidden p-2 text-[#1B3B66] hover:bg-slate-100 rounded-lg"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7"/></svg>
          </button>
          <div className="hidden md:flex gap-2">
            <button onClick={() => setView('chat')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${view === 'chat' ? 'bg-[#1B3B66] text-white shadow-xl' : 'text-[#1B3B66] hover:bg-slate-100'}`}>Espace Conseil</button>
            <button onClick={() => auditData && setView('audit')} disabled={!auditData} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${view === 'audit' ? 'bg-[#C07D38] text-white shadow-xl' : auditData ? 'text-[#C07D38] hover:bg-slate-100' : 'text-slate-300 opacity-40 cursor-not-allowed'}`}>Stratégie Digitale</button>
          </div>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden relative z-10">
        <AnimatePresence mode="wait">
          {view === 'chat' ? (
            <motion.div key="chat" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col lg:flex-row h-full">
              <aside className={`fixed inset-y-0 left-0 z-40 w-full md:w-[350px] lg:relative lg:block lg:w-[32%] transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} transition-transform duration-300 ease-in-out bg-white/95 lg:bg-white/20 backdrop-blur-3xl border-r border-slate-200/40 p-6 overflow-y-auto custom-scrollbar print:hidden`}>
                <div className="flex justify-between items-center mb-6 lg:hidden">
                  <Logo />
                  <button onClick={() => setIsSidebarOpen(false)} className="p-2 text-slate-400"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg></button>
                </div>
                <div className="pb-4 border-b border-slate-100 mb-6">
                  <h1 className="text-2xl font-black text-[#1B3B66] tracking-tighter uppercase leading-tight">Solutions <span className="text-[#C07D38]">MED SAWA</span></h1>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Cabinet de Conseil IA & Stratégie</p>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  <SolutionCard title="SAWA Connect" subtitle="RÉSEAUX SOCIAUX" desc="Boostez votre visibilité et votre engagement client sur toutes les plateformes." colorClass="bg-green-500" icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586z"/></svg>} onClick={() => handleSolutionClick("Connect")} />
                  <SolutionCard title="SAWA Process" subtitle="AUTOMATISATION" desc="Optimisez vos opérations internes pour gagner en efficacité et en rapidité." colorClass="bg-blue-500" icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>} onClick={() => handleSolutionClick("Process")} />
                  <SolutionCard title="SAWA Insight" subtitle="STRATÉGIE DATA" desc="Exploitez vos données pour prendre des décisions éclairées et prédictives." colorClass="bg-indigo-500" icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2z"/></svg>} onClick={() => handleSolutionClick("Insight")} />
                </div>
              </aside>

              <section className="flex-1 flex flex-col h-full bg-slate-50/10 backdrop-blur-sm relative">
                <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 custom-scrollbar scroll-smooth">
                  {messages.map((m) => (
                    <motion.div key={m.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[90%] md:max-w-[80%] p-5 md:p-6 rounded-[2rem] shadow-sm text-sm leading-relaxed ${m.role === 'user' ? 'bg-[#1B3B66] text-white rounded-br-none' : 'bg-white border border-slate-100 text-slate-800 rounded-tl-none shadow-md'}`}>
                        <MessageContent text={m.text} role={m.role} />
                      </div>
                    </motion.div>
                  ))}
                  {isTyping && (
                    <div className="flex justify-start">
                      <div className="bg-white/80 border border-slate-100 px-6 py-3 rounded-full shadow-lg flex items-center gap-3">
                        <motion.span animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1 }} className="w-2 h-2 bg-[#C07D38] rounded-full" />
                        <span className="text-[10px] font-black text-[#C07D38] uppercase tracking-[0.2em]">Med en réflexion stratégique</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-4 md:p-8 shrink-0 bg-white/90 backdrop-blur-2xl border-t border-slate-100 print:hidden">
                  <div className="flex items-center gap-2 md:gap-4 max-w-5xl mx-auto">
                    <input type="file" ref={fileInputRef} onChange={onFileChange} className="hidden" accept="image/*,application/pdf" />
                    <button onClick={() => fileInputRef.current?.click()} className="w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center bg-slate-100 text-[#1B3B66] hover:bg-slate-200 transition-colors">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"/></svg>
                    </button>
                    <button 
                      onClick={() => isListening ? recognitionRef.current?.stop() : recognitionRef.current?.start()} 
                      className={`w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center transition-all shadow-xl relative ${isListening ? 'bg-red-500 text-white' : isSpeaking ? 'bg-[#C07D38] text-white' : 'bg-[#1B3B66] text-white'}`}
                    >
                      {(isListening || isSpeaking) && (
                        <motion.div 
                          animate={{ scale: [1, 2.2], opacity: [0.6, 0] }} 
                          transition={{ repeat: Infinity, duration: 1.2 }} 
                          className={`absolute inset-0 rounded-full ${isListening ? 'bg-red-200' : 'bg-[#C07D38]/30'}`} 
                        />
                      )}
                      <svg className="w-6 h-6 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        {isSpeaking ? (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                        ) : (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"/>
                        )}
                      </svg>
                    </button>
                    <div className="flex-1 flex items-center bg-slate-100 rounded-2xl md:rounded-[2.2rem] px-4 md:px-8 py-1">
                      <input type="text" value={inputText} onChange={(e) => setInputText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSend()} placeholder={isListening ? "Med vous écoute..." : "Posez une question sur votre stratégie..."} className="flex-1 bg-transparent border-none focus:ring-0 text-sm py-3 text-slate-800 placeholder-slate-400 outline-none" />
                      <button onClick={() => handleSend()} disabled={isTyping} className="p-2 text-[#1B3B66] disabled:opacity-20 hover:scale-110 transition-transform"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg></button>
                    </div>
                  </div>
                </div>
              </section>
            </motion.div>
          ) : (
            <motion.div key="audit" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 p-4 md:p-8 bg-white md:bg-slate-50 overflow-y-auto print:p-0 print:bg-white">
              <div className="max-w-6xl mx-auto space-y-6 print:space-y-8">
                 <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 md:p-8 rounded-[2rem] shadow-xl border border-slate-100 print:shadow-none print:border-none print:p-0 print:pb-8 print:border-b print:rounded-none">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 md:w-16 md:h-16 flex items-center justify-center bg-[#1B3B66] text-white rounded-xl font-black text-2xl print:bg-black">M</div>
                      <div>
                        <h1 className="text-3xl md:text-4xl font-black text-[#1B3B66] uppercase tracking-tight">Audit Stratégique <span className="text-[#C07D38]">MED SAWA</span></h1>
                        <p className="text-[10px] md:text-xs font-bold text-[#C07D38] uppercase tracking-[0.3em] mt-1 print:text-[#1B3B66]">Rapport d'Excellence Opérationnelle • {new Date().toLocaleDateString('fr-FR')}</p>
                      </div>
                    </div>
                    <div className="mt-6 md:mt-0 flex gap-3 print:hidden">
                      <button onClick={handleExport} className="flex items-center gap-2 px-6 py-3 bg-[#C07D38] text-white rounded-xl text-[10px] font-black uppercase shadow-lg hover:shadow-2xl transition-all active:scale-95">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                        Exporter Stratégie
                      </button>
                      <button onClick={() => setView('chat')} className="px-6 py-3 bg-[#1B3B66] text-white rounded-xl text-[10px] font-black uppercase shadow-lg hover:shadow-2xl transition-all active:scale-95">Retour Conseil</button>
                    </div>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-[#1B3B66] p-8 md:p-10 rounded-[2.5rem] text-white text-center shadow-2xl relative overflow-hidden group print:rounded-2xl print:bg-[#1B3B66] print:text-white">
                      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      <span className="text-[10px] md:text-xs font-black uppercase opacity-60 tracking-widest relative z-10">Maturité Digitale</span>
                      <div className="text-6xl md:text-7xl font-black mt-2 tracking-tighter relative z-10">{auditData?.maturityScore}%</div>
                      <div className="mt-4 text-[9px] font-bold uppercase opacity-40 relative z-10">Standard Excellence MED SAWA</div>
                    </div>
                    <div className="md:col-span-2 bg-white p-8 md:p-10 rounded-[2.5rem] flex flex-col justify-center border border-slate-100 shadow-xl relative overflow-hidden print:rounded-2xl print:border print:shadow-none">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-[#C07D38]/5 rounded-full blur-3xl -mr-16 -mt-16" />
                      <span className="text-[#C07D38] text-[10px] md:text-xs font-black uppercase mb-2 tracking-[0.2em]">Potentiel de Croissance</span>
                      <p className="text-2xl md:text-3xl font-black text-[#1B3B66] uppercase leading-tight">{auditData?.potentialROI}</p>
                      <p className="text-slate-400 text-xs mt-2 font-medium">Projection basée sur l'optimisation des processus et l'augmentation de la visibilité.</p>
                    </div>
                 </div>

                 <div className="bg-[#1B3B66] p-8 md:p-12 rounded-[2.5rem] text-center text-white relative overflow-hidden print:bg-[#1B3B66] print:text-white print:rounded-2xl">
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />
                    <h2 className="text-2xl md:text-3xl font-black uppercase mb-4 relative z-10 tracking-tight">Visez l'Excellence Business</h2>
                    <p className="text-white/60 text-sm md:text-base mb-8 max-w-2xl mx-auto relative z-10">Contactez nos consultants MED SAWA pour une étude de faisabilité et un accompagnement sur mesure.</p>
                    <div className="flex flex-col md:flex-row items-center justify-center gap-6 relative z-10">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                          <svg className="w-5 h-5 text-[#C07D38]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                        </div>
                        <span className="font-bold text-sm">contact@medsawa.com</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                          <svg className="w-5 h-5 text-[#C07D38]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
                        </div>
                        <span className="font-bold text-sm">+237 656 304 818</span>
                      </div>
                    </div>
                 </div>

                 <div className="hidden print:block text-center pt-8 border-t border-slate-100">
                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Généré par MED SAWA IA • Expert en Transformation Digitale au Cameroun</p>
                 </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="h-10 hidden md:flex shrink-0 bg-white border-t border-slate-100 items-center justify-between px-8 z-50 print:hidden">
        <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest">© 2025 MED SAWA • L'EXCELLENCE DIGITALE PAR L'IA</p>
        <p className="text-[8px] font-bold text-[#C07D38] uppercase tracking-widest">contact@medsawa.com</p>
      </footer>
    </div>
  );
};

export default App;
