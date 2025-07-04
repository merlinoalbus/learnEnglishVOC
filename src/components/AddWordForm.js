// =====================================================
// 📁 src/components/AddWordForm.js - VERSIONE ENHANCED con campo "Difficile"
// =====================================================
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Plus, Edit3, Check, Sparkles, Loader2, Wand2, AlertTriangle } from 'lucide-react';
import { getPredefinedGroups, getCategoryStyle } from '../utils/categoryUtils';
import { useNotification } from '../contexts/NotificationContext';

const AddWordForm = ({ onAddWord, editingWord, onClearForm }) => {
  const [formData, setFormData] = useState({
    english: '',
    italian: '',
    group: '',
    sentence: '',
    notes: '',
    chapter: '',
    learned: false,
    difficult: false // ⭐ NEW: Difficult flag
  });
  const [showAdvancedForm, setShowAdvancedForm] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);

  const { showNotification, showError, showWarning, showSuccess } = useNotification();

  // Gemini API Configuration
  const GEMINI_API_KEY = 'AIzaSyCHftv0ACPTtX7unUKg6y_eqb09mBobTAM';
  const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

  // Funzione di fallback per categorizzare le parole
  const categorizeWordFallback = (word) => {
    const wordLower = word.toLowerCase();
    
    // Pattern per verbi comuni
    if (wordLower.match(/^(go|come|run|walk|eat|drink|sleep|work|play|study|read|write|speak|listen|watch|see|look|think|know|understand|love|like|hate|want|need|have|get|give|take|make|do|say|tell|ask|answer|help|try|start|stop|finish|continue|learn|teach|buy|sell|pay|cost|travel|visit)$/)) {
      return 'VERBI';
    }
    
    // Pattern per verbi irregolari comuni
    if (wordLower.match(/^(be|have|do|say|get|make|go|know|take|see|come|think|look|want|give|use|find|tell|ask|seem|feel|try|leave|call|put|mean|become|show|hear|let|begin|keep|start|grow|open|walk|win|talk|turn|move|live|believe|bring|happen|write|sit|stand|lose|pay|meet|run|drive|break|speak|eat|fall|catch|buy|cut|rise|send|choose|build|draw|kill|wear|beat|hide|shake|hang|strike|throw|fly|steal|lie|lay|bet|bite|blow|burn|burst|cost|deal|dig|dive|fight|fit|flee|forget|forgive|freeze|hurt|kneel|lead|lend|light|quit|ride|ring|seek|sell|shoot|shut|sing|sink|slide|spin|split|spread|spring|stick|sting|stink|strike|swear|sweep|swim|swing|tear|wake|weep|wind)$/)) {
      return 'VERBI_IRREGOLARI';
    }
    
    // Pattern per aggettivi
    if (wordLower.match(/^.*(ful|less|ous|ive|able|ible|ant|ent|ing|ed|er|est|ly)$/) || 
        wordLower.match(/^(good|bad|big|small|new|old|young|beautiful|ugly|happy|sad|angry|excited|tired|hungry|thirsty|hot|cold|warm|cool|fast|slow|easy|difficult|hard|soft|loud|quiet|bright|dark|clean|dirty|rich|poor|healthy|sick|strong|weak|tall|short|fat|thin|heavy|light|full|empty|open|close)$/)) {
      return 'AGGETTIVI';
    }
    
    // Pattern per tecnologia
    if (wordLower.match(/^(computer|phone|internet|website|email|software|app|technology|digital|online|smartphone|laptop|tablet|keyboard|mouse|screen|monitor|camera|video|audio|wifi|bluetooth|data|file|download|upload|social|media|network|server|database|code|programming|artificial|intelligence|robot|smart|virtual|cloud|cyber|tech|device|gadget|electronic|battery|charge|wireless)$/)) {
      return 'TECNOLOGIA';
    }
    
    // Pattern per famiglia
    if (wordLower.match(/^(mother|father|mom|dad|parent|child|children|son|daughter|brother|sister|family|grandmother|grandfather|grandma|grandpa|uncle|aunt|cousin|nephew|niece|husband|wife|spouse|baby|toddler|teenager|adult|relative|generation)$/)) {
      return 'FAMIGLIA';
    }
    
    // Pattern per emozioni positive
    if (wordLower.match(/^(happy|joy|love|excited|cheerful|delighted|pleased|satisfied|content|glad|grateful|optimistic|positive|hopeful|confident|proud|amazed|wonderful|fantastic|excellent|great|awesome|brilliant|perfect|beautiful|amazing|incredible|outstanding|superb|marvelous|terrific)$/)) {
      return 'EMOZIONI_POSITIVE';
    }
    
    // Pattern per emozioni negative
    if (wordLower.match(/^(sad|angry|mad|furious|upset|disappointed|frustrated|worried|anxious|nervous|scared|afraid|terrified|depressed|lonely|jealous|envious|guilty|ashamed|embarrassed|confused|stressed|tired|exhausted|bored|annoyed|irritated|disgusted|horrible|terrible|awful|bad|worst|hate|dislike)$/)) {
      return 'EMOZIONI_NEGATIVE';
    }
    
    // Pattern per lavoro
    if (wordLower.match(/^(job|work|career|profession|office|business|company|manager|employee|boss|colleague|team|meeting|project|task|salary|money|contract|interview|resume|skill|experience|training|promotion|department|client|customer|service|industry|market|economy|trade|commerce)$/)) {
      return 'LAVORO';
    }
    
    // Pattern per vestiti
    if (wordLower.match(/^(shirt|pants|dress|skirt|jacket|coat|sweater|hoodie|jeans|shorts|socks|shoes|boots|sneakers|sandals|hat|cap|gloves|scarf|belt|tie|suit|uniform|clothes|clothing|fashion|style|wear|outfit|underwear|pajamas|swimsuit)$/)) {
      return 'VESTITI';
    }
    
    // Default: prova a determinare se è un sostantivo
    return 'SOSTANTIVI';
  };

  useEffect(() => {
    if (editingWord) {
      setFormData({
        english: editingWord.english || '',
        italian: editingWord.italian || '',
        group: editingWord.group || '',
        sentence: editingWord.sentence || '',
        notes: editingWord.notes || '',
        chapter: editingWord.chapter || '',
        learned: editingWord.learned || false,
        difficult: editingWord.difficult || false // ⭐ NEW: Load difficult status
      });
      setShowAdvancedForm(true);
    }
  }, [editingWord]);

  const callGeminiAPI = async (englishWord) => {
    const availableGroups = getPredefinedGroups();
    const groupsList = availableGroups.join(', ');
    
    const prompt = `
Analizza la parola inglese "${englishWord}" e fornisci le seguenti informazioni in formato JSON:

{
  "italian": "traduzione principale in italiano (solo la traduzione più comune)",
  "group": "DEVE essere esattamente una di queste categorie: ${groupsList}. Scegli quella più appropriata per la parola.",
  "sentence": "frase d'esempio in inglese che usa la parola",
  "notes": "note aggiuntive con altre traduzioni, sinonimi, forme irregolari, etc. Formatta come: 'Altri Significati: ... Sinonimi: ... Verbo Irregolare: ... etc.'",
  "chapter": "lascia vuoto, sarà compilato dall'utente"
}

REGOLE IMPORTANTI:
- Rispondi SOLO con il JSON valido, nessun altro testo
- Il campo "group" DEVE essere esattamente una di queste opzioni: ${groupsList}
- Per i verbi irregolari, usa "VERBI_IRREGOLARI" e specifica le forme nel campo notes
- Per verbi regolari, usa "VERBI"
- Includi sempre almeno 2-3 significati alternativi nelle note se esistono
- La frase deve essere semplice e chiara
- Il campo "chapter" deve rimanere vuoto (stringa vuota)
- Se la parola non si adatta perfettamente a nessuna categoria, scegli quella più vicina

ESEMPI:
- "run" → group: "VERBI_IRREGOLARI" 
- "beautiful" → group: "AGGETTIVI"
- "computer" → group: "TECNOLOGIA"
- "father" → group: "FAMIGLIA"
- "happy" → group: "EMOZIONI_POSITIVE"
`;

    try {
      const response = await fetch(GEMINI_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: prompt }]
          }]
        })
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!content) {
        throw new Error('Nessuna risposta dall\'AI');
      }

      // Extract JSON from the response (remove any markdown formatting)
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Formato risposta non valido');
      }

      const parsedData = JSON.parse(jsonMatch[0]);
      
      // Validazione categoria: deve essere una delle categorie predefinite
      const availableGroups = getPredefinedGroups();
      if (parsedData.group && !availableGroups.includes(parsedData.group)) {
        console.warn(`Categoria AI "${parsedData.group}" non valida. Uso categoria di fallback.`);
        parsedData.group = categorizeWordFallback(englishWord);
      }
      
      return parsedData;

    } catch (error) {
      console.error('Gemini API Error:', error);
      throw error;
    }
  };

  const handleAiAssist = async () => {
    if (!formData.english.trim()) {
      showWarning('⚠️ Inserisci prima una parola inglese!');
      return;
    }

    setIsAiLoading(true);
    
    try {
      showNotification('🤖 L\'AI sta analizzando la parola...', 'info');
      
      const aiData = await callGeminiAPI(formData.english.trim());
      
      if (!aiData.italian) {
        throw new Error('L\'AI non ha fornito una traduzione valida');
      }
      
      setFormData(prev => ({
        ...prev,
        italian: aiData.italian || prev.italian,
        group: aiData.group || prev.group,
        sentence: aiData.sentence || prev.sentence,
        notes: aiData.notes || prev.notes,
        chapter: aiData.chapter || prev.chapter
        // learned e difficult rimangono invariati (non modificati dall'AI)
      }));

      setShowAdvancedForm(true);
      
      const availableGroups = getPredefinedGroups();
      if (aiData.group && !availableGroups.includes(aiData.group)) {
        showSuccess('✨ Dati compilati! (Categoria corretta automaticamente)');
      } else {
        showSuccess('✨ Dati compilati dall\'AI con successo!');
      }
      
    } catch (error) {
      console.error('AI Assist Error:', error);
      showError(error, 'AI Assistant');
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleSubmit = () => {
    if (!formData.english.trim() || !formData.italian.trim()) {
      showWarning('⚠️ Parola inglese e traduzione sono obbligatorie!');
      return;
    }

    try {
      onAddWord({
        english: formData.english.trim(),
        italian: formData.italian.trim(),
        group: formData.group.trim() || null,
        sentence: formData.sentence.trim() || null,
        notes: formData.notes.trim() || null,
        chapter: formData.chapter.trim() || null,
        learned: formData.learned,
        difficult: formData.difficult // ⭐ NEW: Include difficult status
      });
      
      // Reset form sempre dopo salvataggio (sia nuova parola che modifica)
      setFormData({
        english: '',
        italian: '',
        group: '',
        sentence: '',
        notes: '',
        chapter: '',
        learned: false,
        difficult: false // ⭐ NEW: Reset difficult status
      });
      setShowAdvancedForm(false);
      
    } catch (error) {
      console.error('Error adding word:', error);
      showError(error, 'Add Word');
    }
  };

  const handleClear = () => {
    setFormData({
      english: '',
      italian: '',
      group: '',
      sentence: '',
      notes: '',
      chapter: '',
      learned: false,
      difficult: false // ⭐ NEW: Reset difficult status
    });
    setShowAdvancedForm(false);
    onClearForm();
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Card data-form-section className="backdrop-blur-sm bg-white/90 border-0 shadow-xl rounded-3xl overflow-hidden">
      <CardHeader className={editingWord ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white" : ""}>
        <CardTitle className={`flex items-center justify-between ${editingWord ? "text-white" : "text-gray-800"}`}>
          {editingWord ? (
            <div className="flex items-center gap-3">
              <Edit3 className="w-6 h-6" />
              <span>Modifica Parola: {editingWord.english}</span>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Plus className="w-6 h-6 text-green-600" />
              <span className="bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                Aggiungi Nuove Parole
              </span>
            </div>
          )}
          <div className="flex gap-2">
            {editingWord && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={handleClear}
                className="text-white hover:bg-white/20"
              >
                ✕ Annulla
              </Button>
            )}
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setShowAdvancedForm(!showAdvancedForm)}
              className={editingWord ? "text-white hover:bg-white/20" : "text-gray-600 hover:bg-gray-100"}
            >
              {showAdvancedForm ? 'Forma Semplice' : 'Forma Avanzata'}
            </Button>
          </div>
        </CardTitle>
        {editingWord && (
          <div className="text-blue-100 bg-blue-600/20 p-3 rounded-xl mt-4">
            💡 Stai modificando la parola "<strong>{editingWord.english}</strong>". 
            Cambia i campi che vuoi aggiornare e clicca "Salva Modifiche".
          </div>
        )}
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              placeholder="Parola inglese *"
              value={formData.english}
              onChange={(e) => handleInputChange('english', e.target.value)}
              className="border-2 border-gray-200 rounded-xl focus:border-blue-500 transition-colors h-12"
              required
            />
            
            <Input
              placeholder="Traduzione italiana *"
              value={formData.italian}
              onChange={(e) => handleInputChange('italian', e.target.value)}
              className="border-2 border-gray-200 rounded-xl focus:border-blue-500 transition-colors h-12"
              required
            />
          </div>

          {/* AI Assistant Button */}
          <Button
            onClick={handleAiAssist}
            disabled={isAiLoading || !formData.english.trim()}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white py-4 text-lg rounded-xl shadow-lg transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {isAiLoading ? (
              <>
                <Loader2 className="w-6 h-6 mr-3 animate-spin" />
                🤖 AI sta pensando...
              </>
            ) : (
              <>
                <Sparkles className="w-6 h-6 mr-3" />
                ✨ AI Assistant - Compila Automaticamente Tutti i Campi
              </>
            )}
          </Button>

          {/* AI Notice */}
          {formData.italian && !editingWord && (
            <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 rounded-2xl">
              <div className="flex items-center gap-3">
                <Wand2 className="w-6 h-6 text-purple-600" />
                <p className="text-purple-800 font-medium">
                  💡 Usa l'AI Assistant per compilare automaticamente tutti i campi!
                </p>
              </div>
            </div>
          )}

          {/* Info sui nuovi campi */}
          {showAdvancedForm && (
            <div className="p-4 bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-200 rounded-2xl mb-4">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">📚</span>
                <h4 className="font-bold text-green-800">Gestione Avanzata Vocabolario</h4>
              </div>
              <div className="text-sm text-green-700 space-y-1">
                <p>• <strong>Capitolo:</strong> Organizza le parole per capitoli del libro (es. 1, 2A, Unit 5)</p>
                <p>• <strong>Parola Appresa:</strong> Le parole apprese rimangono nel vocabolario ma vengono saltate nei test</p>
                <p>• <strong>Parola Difficile:</strong> ⭐ Marca le parole difficili per test specifici</p>
                <p>• <strong>Selezione Test:</strong> Potrai scegliere quali capitoli includere nei test</p>
              </div>
            </div>
          )}

          {showAdvancedForm && (
            <div className="space-y-6 p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl border-2 border-blue-200 animate-fade-in">
              <h4 className="font-bold text-blue-800 text-lg flex items-center gap-2">
                <span>📋</span> Informazioni Aggiuntive
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <span>📂</span> Gruppo/Categoria
                  </label>
                  <select
                    value={formData.group}
                    onChange={(e) => handleInputChange('group', e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 transition-colors bg-white"
                  >
                    <option value="">Nessun gruppo</option>
                    {getPredefinedGroups().map(group => (
                      <option key={group} value={group}>
                        {getCategoryStyle(group).icon} {group}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <span>📖</span> Capitolo del libro
                  </label>
                  <Input
                    placeholder="es. 1, 2A, Unit 5..."
                    value={formData.chapter}
                    onChange={(e) => handleInputChange('chapter', e.target.value)}
                    className="border-2 border-gray-200 rounded-xl focus:border-blue-500 transition-colors"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <span>🎓</span> Stato Parola
                  </label>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 border-2 border-gray-200 rounded-xl bg-white">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <div 
                          onClick={() => handleInputChange('learned', !formData.learned)}
                          className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                            formData.learned 
                              ? 'bg-green-500 border-green-500 text-white' 
                              : 'border-gray-300 bg-white'
                          }`}
                        >
                          {formData.learned && <span className="text-sm">✓</span>}
                        </div>
                        <span className="text-sm font-medium text-gray-700">
                          Parola appresa
                        </span>
                      </label>
                    </div>
                    
                    {/* ⭐ NEW: Difficult flag */}
                    <div className="flex items-center gap-3 p-3 border-2 border-orange-200 rounded-xl bg-orange-50">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <div 
                          onClick={() => handleInputChange('difficult', !formData.difficult)}
                          className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                            formData.difficult 
                              ? 'bg-orange-500 border-orange-500 text-white' 
                              : 'border-orange-300 bg-white'
                          }`}
                        >
                          {formData.difficult && <AlertTriangle className="w-4 h-4" />}
                        </div>
                        <span className="text-sm font-medium text-orange-700">
                          ⭐ Parola difficile
                        </span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <span>💬</span> Frase d'esempio
                  </label>
                  <Input
                    placeholder="es. I love this beautiful song"
                    value={formData.sentence}
                    onChange={(e) => handleInputChange('sentence', e.target.value)}
                    className="border-2 border-gray-200 rounded-xl focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <span>📝</span> Note aggiuntive
                </label>
                <Textarea
                  placeholder="Altri significati, sinonimi, forme irregolari..."
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  rows={4}
                  className="border-2 border-gray-200 rounded-xl focus:border-blue-500 transition-colors"
                />
              </div>
            </div>
          )}

          <Button 
            onClick={handleSubmit}
            className={`w-full py-4 text-lg rounded-2xl shadow-xl transform hover:scale-105 transition-all duration-200 ${
              editingWord 
                ? 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700' 
                : 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600'
            } text-white`}
          >
            {editingWord ? (
              <>
                <Check className="w-5 h-5 mr-2" />
                Salva Modifiche
              </>
            ) : (
              <>
                <Plus className="w-5 h-5 mr-2" />
                Aggiungi Parola
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default AddWordForm;