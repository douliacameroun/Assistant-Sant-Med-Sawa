import React, { useState, useEffect } from 'react';
import { GoogleGenerativeAI } from "@google/genai";

// Configuration de l'IA avec la clé Vercel
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_API_KEY);

const App = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isFirstVisit, setIsFirstVisit] = useState(true);

  // GESTION DE LA MÉMOIRE (LocalStorage)
  useEffect(() => {
    const hasVisited = localStorage.getItem('med_sawa_visited');
    if (hasVisited) {
      setIsFirstVisit(false);
    } else {
      localStorage.setItem('med_sawa_visited', 'true');
    }
  }, []);

  const systemInstruction = `
    Tu es MED SAWA, une IA hospitalière d'élite développée par DOULIA.
    
    TON IDENTITÉ & MÉMOIRE :
    - Si l'utilisateur revient (isFirstVisit = false), accueille-le chaleureusement comme un client fidèle.
    - Tes piliers : DOULIA Connect (Automatisation 24/7), DOULIA Process (Tâches administratives), DOULIA Insight (Analyse de données).
    
    EXPERTISE EN NÉGOCIATION :
    - Tu es un expert en négociation. Réagis intelligemment et professionnellement aux objections.
    - Subtils services additionnels : Propose des audits IA approfondis pour les hôpitaux et des formations pour le personnel médical sur l'adoption des outils IA.
    
    CONSIGNES DE SÉCURITÉ :
    - En cas de question trop complexe, propose d'appeler le (+237) 6 56 30 48 18 / 6 73 04 31 27 ou d'écrire à contact@douliacameroun.com.
    - Ne propose JAMAIS le document de présentation PDF sauf demande explicite.
    - Rapports : Informe l'utilisateur que ses données ont été transmises à contact@douliacameroun.com et qu'il sera rappelé rapidement. (En interne, tu envoies à doualiacameroun@gmail.com).
  `;

  const handleSend = async () => {
    if (!input.trim()) return;
    
    const userMessage = { role: "user", text: input };
    setMessages([...messages, userMessage]);
    setInput("");

    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const result = await model.generateContent([systemInstruction, ...messages.map(m => m.text), input]);
      const response = await result.response;
      
      setMessages(prev => [...prev, { role: "ai", text: response.text() }]);
    } catch (error) {
      console.error("Erreur API:", error);
      setMessages(prev => [...prev, { role: "ai", text: "Désolé, j'ai du mal à répondre. Contactez-nous au 6 56 30 48 18." }]);
    }
  };

  return (
    <div className="min-h-screen bg-ai-gradient p-4 flex flex-col items-center">
      <header className="text-center mb-8">
        <h1 className="text-4xl font-extrabold text-gradient-med">MED SAWA</h1>
        <p className="text-slate-600">L'IA Hospitalière par DOULIA</p>
      </header>

      <div className="glass-card w-full max-w-2xl h-[500px] rounded-2xl p-4 overflow-y-auto custom-scrollbar flex flex-col gap-4">
        {messages.length === 0 && (
          <p className="text-center text-slate-400 mt-20">
            {isFirstVisit ? "Bienvenue chez MED SAWA. Comment puis-je vous aider ?" : "Ravi de vous revoir ! Comment se porte votre établissement aujourd'hui ?"}
          </p>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`p-3 rounded-lg max-w-[80%] ${msg.role === 'user' ? 'bg-blue-600 text-white self-end' : 'bg-white border text-slate-800 self-start'}`}>
            {msg.text}
          </div>
        ))}
      </div>

      <div className="w-full max-w-2xl mt-4 flex gap-2">
        <input 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Posez votre question à MED SAWA..."
          className="flex-1 p-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        <button onClick={handleSend} className="bg-[#1B3B66] text-white px-6 py-3 rounded-xl hover:bg-opacity-90 transition">
          Envoyer
        </button>
      </div>
    </div>
  );
};

export default App;