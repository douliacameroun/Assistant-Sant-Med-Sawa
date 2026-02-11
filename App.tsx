import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenerativeAI } from "@google/generative-ai";

// ⚠️ COLLE TA CLÉ API ICI
const API_KEY = "AIzaSyAsrP_cMNKJqDvBv9_4LFReEP8fEPi6ew0"; 

const App = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isFirstVisit, setIsFirstVisit] = useState(true);
  const messagesEndRef = useRef(null);

  // Initialisation de l'IA avec le modèle le plus fiable
  const genAI = new GoogleGenerativeAI(API_KEY);

  // Scroll automatique vers le bas
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // GESTION DE LA MÉMOIRE CLIENT
  useEffect(() => {
    const hasVisited = localStorage.getItem('med_sawa_client_memory');
    if (hasVisited) {
      setIsFirstVisit(false);
    } else {
      localStorage.setItem('med_sawa_client_memory', 'true');
    }
  }, []);

  const systemInstruction = `
    INSTRUCTIONS SYSTÈME POUR MED SAWA :
    
    1. IDENTITÉ : Tu es MED SAWA, l'IA Hospitalière Élite du Cameroun, créée par DOULIA.
    2. MISSION : Assister les directeurs d'hôpitaux via les solutions DOULIA (Connect, Process, Insight).
    3. COMPORTEMENT :
       - Si le client revient, salue-le comme un partenaire fidèle ("Ravi de vous revoir...").
       - NÉGOCIATION : Tu es un expert. Si le client hésite, rassure-le avec des arguments sur le ROI et l'efficacité.
       - VENTE CROISÉE : Propose subtilement des "Audits IA Hospitaliers" ou des "Formations Personnel Médical".
    4. SÉCURITÉ & CONTACT :
       - Si une question dépasse tes compétences médicales/techniques, dis : "Pour cette expertise spécifique, veuillez contacter nos spécialistes à Douala au (+237) 6 56 30 48 18 ou 6 73 04 31 27."
       - À chaque fin de conversation importante, précise : "Vos besoins ont été transmis à contact@douliacameroun.com."
    5. INTERDICTION : Ne jamais envoyer de PDF ou de rapport fictif à l'utilisateur.
  `;

  const handleSend = async () => {
    if (!input.trim()) return;
    
    const userMsg = { role: "user", text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      // Utilisation du modèle Flash, plus rapide et fiable
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      
      // Construction du contexte pour la mémoire immédiate
      let history = systemInstruction + "\n\nHistorique de conversation :\n";
      messages.forEach(msg => {
        history += `${msg.role === 'user' ? 'Client' : 'MED SAWA'}: ${msg.text}\n`;
      });
      history += `Client: ${input}\nMED SAWA:`;

      const result = await model.generateContent(history);
      const response = await result.response;
      const text = response.text();
      
      setMessages(prev => [...prev, { role: "ai", text: text }]);
    } catch (error) {
      console.error("Erreur IA:", error);
      setMessages(prev => [...prev, { role: "ai", text: "Je rencontre une difficulté de connexion. Pour une assistance immédiate, appelez le 6 56 30 48 18." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    // CONTENEUR PRINCIPAL AVEC DÉGRADÉ "ÉLITE"
    <div className="min-h-screen font-sans text-slate-800 flex flex-col items-center justify-center p-4 relative overflow-hidden"
         style={{ background: 'linear-gradient(135deg, #FFFFFF 0%, #EBF4FF 50%, #F0F9FF 100%)' }}>
      
      {/* En-tête */}
      <header className="text-center mb-6 z-10">
        <h1 className="text-4xl font-extrabold mb-2" style={{ color: '#1B3B66' }}>MED SAWA</h1>
        <p className="font-medium tracking-wide" style={{ color: '#C07D38' }}>IA Hospitalière Élite</p>
      </header>

      {/* Carte principale effet "Glassmorphism" */}
      <div className="w-full max-w-3xl h-[600px] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-white/50 backdrop-blur-xl z-10"
           style={{ backgroundColor: 'rgba(255, 255, 255, 0.65)' }}>
        
        {/* Zone de chat */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-4 opacity-70">
              <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-3xl">🏥</div>
              <p className="text-lg font-medium text-slate-600 max-w-md">
                {isFirstVisit 
                  ? "Bienvenue. Je suis MED SAWA, prête à optimiser votre structure hospitalière. Par quoi commençons-nous ?" 
                  : "Ravi de vous revoir. Continuons notre optimisation. Quel est le défi du jour ?"}
              </p>
            </div>
          )}
          
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] p-4 rounded-2xl shadow-sm text-sm leading-relaxed ${
                m.role === 'user' 
                  ? 'bg-[#1B3B66] text-white rounded-tr-none' 
                  : 'bg-white text-slate-700 border border-slate-100 rounded-tl-none'
              }`}>
                {m.text}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-white p-3 rounded-2xl rounded-tl-none shadow-sm border border-slate-100 text-sm text-slate-400 italic">
                MED SAWA analyse...
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Zone de saisie */}
        <div className="p-4 bg-white/80 border-t border-white flex gap-3 backdrop-blur-md">
          <input 
            className="flex-1 p-4 rounded-xl border border-slate-200 bg-white/90 focus:outline-none focus:ring-2 focus:ring-[#C07D38]/50 focus:border-[#C07D38] transition-all shadow-inner placeholder-slate-400"
            value={input} 
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()} 
            placeholder="Posez votre question stratégique ou médicale..." 
          />
          <button 
            onClick={handleSend}
            disabled={loading}
            className="bg-[#C07D38] hover:bg-[#a66a2e] text-white px-8 py-4 rounded-xl font-bold transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed">
            {loading ? '...' : 'Envoyer'}
          </button>
        </div>
      </div>
      
      {/* Signature */}
      <div className="mt-6 text-xs text-slate-400 text-center font-medium">
        Propulsé par DOULIA • (+237) 6 56 30 48 18
      </div>
    </div>
  );
};

export default App;