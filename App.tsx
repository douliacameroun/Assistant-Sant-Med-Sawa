import React, { useState, useEffect } from 'react';
// On utilise maintenant la librairie stable qui ne plante pas sur Vercel
import { GoogleGenerativeAI } from "@google/generative-ai";

// ⚠️ COLLE TA CLÉ API ICI (Celle qui commence par AIza...)
const API_KEY = "AIzaSyAsrP_cMNKJqDvBv9_4LFReEP8fEPi6ew0"; 

const App = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isFirstVisit, setIsFirstVisit] = useState(true);

  // Initialisation standard et stable
  const genAI = new GoogleGenerativeAI(API_KEY);

  useEffect(() => {
    // Mémoire du client
    const hasVisited = localStorage.getItem('med_sawa_visited');
    if (hasVisited) {
      setIsFirstVisit(false);
    } else {
      localStorage.setItem('med_sawa_visited', 'true');
    }
  }, []);

  const systemInstruction = `
    Rôle : Tu es MED SAWA, l'IA hospitalière d'élite de DOULIA.
    Mission : Assister les hôpitaux (DOULIA Connect, Process, Insight).
    Comportement : 
    1. Si le client revient, accueille-le comme un partenaire connu.
    2. Négociation : Sois un expert. Traite les objections calmement.
    3. Vente : Propose subtilement des audits IA et formations pour le personnel.
    4. Sécurité : Si tu ne sais pas, donne ces numéros : (+237) 6 56 30 48 18 ou 6 73 04 31 27.
    5. Contact : Dis toujours que les données sont transmises à contact@douliacameroun.com.
  `;

  const handleSend = async () => {
    if (!input.trim()) return;
    
    // Ajout du message utilisateur
    const newMessages = [...messages, { role: "user", text: input }];
    setMessages(newMessages);
    setInput("");

    try {
      const model = genAI.getGenerativeModel({ model: "gemini-pro" });
      
      // Construction de l'historique pour l'IA
      let promptContext = systemInstruction + "\n\n";
      newMessages.forEach(msg => {
        promptContext += `${msg.role === 'user' ? 'Client' : 'Med Sawa'}: ${msg.text}\n`;
      });

      const result = await model.generateContent(promptContext);
      const response = await result.response;
      const text = response.text();
      
      setMessages([...newMessages, { role: "ai", text: text }]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: "ai", text: "Je rencontre une difficulté technique. Merci de contacter le support au 6 56 30 48 18." }]);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center p-4 font-sans text-slate-800">
      <header className="py-6 text-center">
        <h1 className="text-3xl font-bold text-[#1B3B66]">MED SAWA</h1>
        <p className="text-[#C07D38] font-medium">Assistant Hospitalier Élite</p>
      </header>

      <div className="w-full max-w-2xl bg-white shadow-xl rounded-xl h-[500px] flex flex-col border border-slate-200">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="text-center mt-20">
              <p className="text-lg font-medium text-slate-600">
                {isFirstVisit ? "Bienvenue sur l'interface MED SAWA." : "Ravi de vous revoir parmi nous."}
              </p>
              <p className="text-sm text-slate-400 mt-2">Comment puis-je optimiser votre service aujourd'hui ?</p>
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} className={`p-3 rounded-lg max-w-[85%] text-sm ${m.role === 'user' ? 'bg-[#1B3B66] text-white self-end ml-auto' : 'bg-slate-100 text-slate-800'}`}>
              {m.text}
            </div>
          ))}
        </div>

        <div className="p-4 border-t bg-slate-50 rounded-b-xl flex gap-2">
          <input 
            className="flex-1 p-3 border border-slate-300 rounded-lg focus:outline-none focus:border-[#C07D38]"
            value={input} 
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()} 
            placeholder="Décrivez votre besoin..." 
          />
          <button onClick={handleSend} className="bg-[#C07D38] text-white px-6 py-3 rounded-lg font-bold hover:bg-[#a66a2e] transition">
            Envoyer
          </button>
        </div>
      </div>
    </div>
  );
};

export default App;