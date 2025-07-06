// =====================================================
// 📁 src/components/AddWordForm.js - VERSIONE REFACTORED con aiService
// =====================================================
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Plus, Edit3, Check, Sparkles, Loader2, Wand2, AlertTriangle } from 'lucide-react';
import { getPredefinedGroups, getCategoryStyle } from '../utils/categoryUtils';
import { useNotification } from '../contexts/NotificationContext';
import { aiService } from '../services/aiService';

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

  const handleAiAssist = async () => {
    if (!formData.english.trim()) {
      showWarning('⚠️ Inserisci prima una parola inglese!');
      return;
    }

    setIsAiLoading(true);
    
    try {
      showNotification('🤖 L\'AI sta analizzando la parola...', 'info');
      
      const aiData = await aiService.analyzeWord(formData.english.trim());
      
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
      showSuccess('✨ Dati compilati dall\'AI con successo!');
      
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