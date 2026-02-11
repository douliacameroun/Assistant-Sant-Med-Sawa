import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenerativeAI } from "@google/generative-ai";

// ⚠️ METTEZ VOTRE CLÉ ICI
const API_KEY = "AIzaSyAsrP_cMNKJqDvBv9_4LFReEP8fEPi6ew0"; 
const genAI = new GoogleGenerativeAI(API_KEY);

const App = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const newMsg = { role: "user", text: input };
    setMessages(prev => [...prev, newMsg]);
    setInput("");
    setLoading(true);

    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const result = await model.generateContent(`Tu es MED SAWA, l'IA hospitalière d'élite de DOULIA. Réponds de manière experte. Instruction : ${input}`);
      const text = result.response.text();
      setMessages(prev => [...prev, { role: "ai", text }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: "ai", text: "Difficulté de connexion. Contactez le 6 56 30 48 18." }]);
    } finally { setLoading(false); }
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans">
      {/* PANNEAU LATÉRAL (Comme sur votre photo 1) */}
      <div className="w-80 bg-[#1B3B66]/5 border-r border-slate-200 p-6 hidden md:flex flex-col">
        <div className="mb-10">
          <h2 className="text-[#1B3B66] font-extrabold text-xl">SOLUTIONS <span className="text-[#C07D38]">DOULIA</span></h2>
          <p className="text-[10px] text-slate-400 uppercase tracking-widest">Cabinet de Conseil IA & Stratégie</p>
        </div>
        
        <div className="space-y-6">
          <div className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-blue-500">
            <h3 className="font-bold text-[#1B3B66] text-sm">DOULIA CONNECT</h3>
            <p className="text-xs text-slate-500 mt-1">Boostez votre visibilité et votre engagement client.</p>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-cyan-500">
            <h3 className="font-bold text-[#1B3B66] text-sm">DOULIA PROCESS</h3>
            <p className="text-xs text-slate-500 mt-1">Optimisez vos opérations internes pour gagner en efficacité.</p>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-amber-500">
            <h3 className="font-bold text-[#1B3B66] text-sm">DOULIA INSIGHT</h3>
            <p className="text-xs text-slate-500 mt-1">Analyse de données et support à la décision stratégique.</p>
          </div>
        </div>
        <div className="mt-auto text-[10px] text-slate-400 uppercase">© 2026 DOULIA • L'Excellence Digitale</div>
      </div>

      {/* ZONE DE CHAT PRINCIPALE */}
      <div className="flex-1 flex flex-col relative">
        <header className="h-16 border-b bg-white flex items-center justify-between px-8">
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 bg-[#1B3B66] rounded flex items-center justify-center text-white font-bold text-xs">MS</div>
             <span className="font-bold text-[#1B3B66]">Assistant Santé MED SAWA</span>
          </div>
          <button className="text-[10px] bg-[#1B3B66] text-white px-3 py-1 rounded-full font-bold uppercase tracking-wider">Espace Conseil</button>
        </header>

        <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-[#F8FAFC]">
          {messages.length === 0 && (
            <div className="max-w-2xl mx-auto bg-white p-8 rounded-3xl shadow-sm border border-slate-100 mt-10">
              <p className="text-slate-600 leading-relaxed text-lg">
                Bienvenue chez <strong>DOULIA</strong>, votre partenaire d'élite pour la transformation digitale par l'IA au Cameroun. 🚀<br/><br/>
                Je suis <strong>MED SAWA</strong>, votre consultante experte. Ensemble, nous allons propulser votre structure.
              </p>
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] p-4 rounded-2xl shadow-sm ${m.role === 'user' ? 'bg-[#1B3B66] text-white rounded-tr-none' : 'bg-white border border-slate-200 rounded-tl-none'}`}>
                {m.text}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-6 bg-white border-t">
          <div className="max-w-4xl mx-auto flex gap-4 bg-slate-100 p-2 rounded-2xl border border-slate-200">
            <input className="flex-1 bg-transparent px-4 py-2 outline-none text-sm" value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSend()} placeholder="Posez une question sur votre stratégie..." />
            <button onClick={handleSend} className="bg-[#1B3B66] text-white p-3 rounded-xl shadow-lg hover:opacity-90 transition">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
            </button>
          </div>
          <p className="text-center text-[9px] text-slate-400 mt-3 uppercase tracking-widest">Contact@douliacameroun.com</p>
        </div>
      </div>
    </div>
  );
};

export default App;