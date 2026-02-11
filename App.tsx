import React, { useState, useEffect } from 'react';
import { GoogleGenerativeAI } from "@google/genai"; // Retour à l'import standard propre

// Remplacez par votre vraie clé Gemini
const API_KEY = "AIzaSyAsrP_cMNKJqDvBv9_4LFReEP8fEPi6ew0"; 

const App = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isFirstVisit, setIsFirstVisit] = useState(true);

  // Initialisation sécurisée de l'IA
  const genAI = new GoogleGenerativeAI(API_KEY);

  useEffect(() => {
    const hasVisited = localStorage.getItem('med_sawa_visited');
    if (hasVisited) {
      setIsFirstVisit(false);
    } else {
      localStorage.setItem('med_sawa_visited', 'true');
    }
  }, []);

  const systemInstruction = `
    Identité : Tu es MED SAWA, IA hospitalière d'élite par DOULIA.
    Services : DOULIA Connect, Process et Insight.
    Négociation : Réagis avec expertise aux objections. Propose des audits IA et formations pour le personnel.
    Sécurité : Si bloqué, donne les numéros (+237) 6 56 30 48 18 / 6 73 04 31 27.
    Données : Informe que les données sont transmises à contact@douliacameroun.com.
  `;

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg = { role: "user", text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput("");

    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const result = await model.generateContent([systemInstruction, input]);
      const text = result.response.text();
      setMessages(prev => [...prev, { role: "ai", text }]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: "ai", text: "Une erreur technique s'est produite. Contactez le 6 56 30 48 18." }]);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center p-4">
      <header className="py-6 text-center">
        <h1 className="text-3xl font-bold text-blue-900">MED SAWA</h1>
        <p className="text-slate-500">Expertise IA Hospitalière</p>
      </header>
      <div className="w-full max-w-2xl bg-white shadow-lg rounded-xl h-[500px] overflow-y-auto p-4 border flex flex-col gap-3">
        {messages.length === 0 && (
          <p className="text-center text-slate-400 mt-20 italic">
            {isFirstVisit ? "Bienvenue chez MED SAWA. Comment puis-je vous aider ?" : "Ravi de vous revoir ! Comment se porte votre établissement ?"}
          </p>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`p-3 rounded-lg max-w-[85%] ${m.role === 'user' ? 'bg-blue-600 text-white self-end' : 'bg-gray-100 self-start'}`}>
            {m.text}
          </div>
        ))}
      </div>
      <div className="w-full max-w-2xl mt-4 flex gap-2">
        <input className="flex-1 p-3 border rounded-lg" value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSend()} placeholder="Posez votre question..." />
        <button onClick={handleSend} className="bg-blue-900 text-white px-6 py-3 rounded-lg">Envoyer</button>
      </div>
    </div>
  );
};

export default App;