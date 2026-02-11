import React, { useState, useEffect } from 'react';
import * as GoogleGenAI from "@google/genai"; // Correction de l'importation

// Remplace TON_API_KEY_ICI par ta vraie clé Gemini (AIza...)
const API_KEY = "AIzaSyAsrP_cMNKJqDvBv9_4LFReEP8fEPi6ew0"; 
const genAI = new GoogleGenAI.GoogleGenerativeAI(API_KEY);

const App = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isFirstVisit, setIsFirstVisit] = useState(true);

  // GESTION DE LA MÉMOIRE (LocalStorage) pour reconnaître le client
  useEffect(() => {
    const hasVisited = localStorage.getItem('med_sawa_visited');
    if (hasVisited) {
      setIsFirstVisit(false);
    } else {
      localStorage.setItem('med_sawa_visited', 'true');
    }
  }, []);

  // Instructions MED SAWA basées sur les services DOULIA
  const systemInstruction = `
    Tu es MED SAWA, une IA hospitalière d'élite développée par DOULIA.
    
    TON IDENTITÉ & MÉMOIRE :
    - Si l'utilisateur revient (isFirstVisit = false), accueille-le chaleureusement comme un client fidèle.
    - Tes piliers : DOULIA Connect (Automatisation), DOULIA Process, DOULIA Insight.
    
    EXPERTISE EN NÉGOCIATION :
    - Tu es un expert en négociation. Réagis intelligemment aux objections.
    - Services additionnels : Propose subtilement des audits IA et des formations pour le personnel.
    
    SÉCURITÉ & CONTACT :
    - Si bloqué, propose d'appeler le 6 56 30 48 18 / 6 73 04 31 27 ou d'écrire à contact@douliacameroun.com.
    - Informe l'utilisateur que ses données sont transmises à contact@douliacameroun.com.
  `;

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg = { role: "user", text: input };
    setMessages([...messages, userMsg]);
    setInput("");

    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const result = await model.generateContent([systemInstruction, input]);
      const response = await result.response;
      setMessages(prev => [...prev, { role: "ai", text: response.text() }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: "ai", text: "Désolé, une erreur technique est survenue. Contactez le 6 56 30 48 18." }]);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 font-sans text-slate-900">
      <header className="text-center py-8">
        <h1 className="text-3xl font-bold text-blue-900">MED SAWA</h1>
        <p className="text-slate-500">IA Hospitalière Élite</p>
      </header>

      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-xl h-[500px] flex flex-col overflow-hidden border">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <p className="text-center text-slate-400 mt-10">
              {isFirstVisit ? "Bienvenue chez MED SAWA. Comment puis-je vous aider ?" : "Heureux de vous revoir ! Comment puis-je assister votre établissement aujourd'hui ?"}
            </p>
          )}
          {messages.map((msg, i) => (
            <div key={i} className={`p-3 rounded-xl max-w-[85%] ${msg.role === 'user' ? 'bg-blue-600 text-white ml-auto' : 'bg-slate-100 text-slate-800'}`}>
              {msg.text}
            </div>
          ))}
        </div>
        <div className="p-4 border-t flex gap-2">
          <input 
            className="flex-1 p-2 border rounded-lg focus:outline-none"
            value={input} 
            onChange={(e) => setInput(e.target.value)}
            placeholder="Échangez avec MED SAWA..."
          />
          <button onClick={handleSend} className="bg-blue-900 text-white px-4 py-2 rounded-lg">Envoyer</button>
        </div>
      </div>
    </div>
  );
};

export default App;