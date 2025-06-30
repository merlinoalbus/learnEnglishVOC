// =====================================================
// 📁 src/components/JSONManager.js - SOSTITUISCE il file esistente
// =====================================================
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { FileDown, ChevronDown, ChevronUp } from 'lucide-react';
import { useNotification } from '../contexts/NotificationContext';

const JSONManager = ({ words, onImportWords }) => {
  const [jsonText, setJsonText] = useState('');
  const [showSection, setShowSection] = useState(false);

  // ⭐ AGGIORNATO: Usa il context invece della prop
  const { showSuccess, showError, showWarning } = useNotification();

  const handleExport = () => {
    if (words.length === 0) {
      // ⭐ AGGIORNATO: Usa showWarning dal context
      showWarning('⚠️ Nessuna parola da esportare!');
      return;
    }

    try {
      const dataStr = JSON.stringify(words, null, 2);
      setJsonText(dataStr);
      setShowSection(true);
      // ⭐ AGGIORNATO: Usa showSuccess dal context
      showSuccess('✅ Parole esportate con successo!');
    } catch (error) {
      console.error('Error exporting words:', error);
      // ⭐ AGGIORNATO: Usa showError dal context per gestione centralizzata
      showError(error, 'Export JSON');
    }
  };

  const handleImport = () => {
    if (!jsonText.trim()) {
      // ⭐ AGGIORNATO: Usa showWarning dal context
      showWarning('⚠️ Inserisci del JSON da importare!');
      return;
    }

    try {
      const newWordsCount = onImportWords(jsonText.trim());
      setJsonText('');
      // ⭐ AGGIORNATO: Usa showSuccess dal context
      showSuccess(`✅ ${newWordsCount} parole importate con successo!`);
    } catch (error) {
      console.error('Error importing words:', error);
      
      // ⭐ AGGIORNATO: Gestione errori migliorata con context
      const errorMessage = error.message.includes('JSON') ? 
        '❌ JSON non valido! Controlla la sintassi.' : 
        `❌ ${error.message}`;
      
      // Usa showError per errori gravi, showWarning per problemi di formato
      if (error.message.includes('JSON') || error.message.includes('Invalid')) {
        showWarning(errorMessage);
      } else {
        showError(error, 'Import JSON');
      }
    }
  };

  return (
    <Card className="backdrop-blur-sm bg-white/90 border-0 shadow-xl rounded-3xl overflow-hidden">
      <CardHeader 
        className="cursor-pointer hover:bg-gray-50 transition-colors" 
        onClick={() => setShowSection(!showSection)}
      >
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileDown className="w-6 h-6 text-indigo-600" />
            <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Gestione Dati JSON
            </span>
          </div>
          {showSection ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
        </CardTitle>
      </CardHeader>
      {showSection && (
        <CardContent className="animate-fade-in">
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-2xl border border-blue-200">
              <p className="text-blue-800 text-sm flex items-center gap-2">
                <span className="text-lg">💡</span>
                Usa questa sezione per fare backup del tuo vocabolario o condividerlo tra dispositivi
              </p>
            </div>
            
            <div className="flex gap-2">
              <Button 
                onClick={handleExport} 
                variant="outline" 
                disabled={words.length === 0}
                className="border-2 border-blue-300 hover:border-blue-400 bg-blue-50 hover:bg-blue-100 text-blue-600"
              >
                📤 Esporta JSON
              </Button>
              <Button 
                onClick={handleImport} 
                variant="outline"
                className="border-2 border-purple-300 hover:border-purple-400 bg-purple-50 hover:bg-purple-100 text-purple-600"
              >
                📥 Importa JSON
              </Button>
            </div>
            
            <Textarea
              placeholder="Il JSON delle parole apparirà qui dopo 'Esporta JSON', oppure incolla qui il JSON da importare..."
              value={jsonText}
              onChange={(e) => setJsonText(e.target.value)}
              rows={12}
              className="font-mono text-sm border-2 border-gray-200 rounded-2xl focus:border-blue-500 transition-colors"
            />
            
            {/* ⭐ AGGIUNTO: Info sui formati supportati */}
            {jsonText && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-xl">
                <p className="text-green-800 text-sm">
                  💾 <strong>Formato rilevato:</strong> {
                    (() => {
                      try {
                        const parsed = JSON.parse(jsonText);
                        const isArray = Array.isArray(parsed);
                        const hasWords = isArray && parsed.length > 0;
                        const firstItem = hasWords ? parsed[0] : null;
                        const hasEnglishItalian = firstItem && firstItem.english && firstItem.italian;
                        
                        if (hasEnglishItalian) {
                          return `Array di ${parsed.length} parole (✅ Formato valido)`;
                        } else if (isArray) {
                          return `Array con ${parsed.length} elementi (⚠️ Verificare formato)`;
                        } else {
                          return 'Oggetto JSON (⚠️ Array richiesto)';
                        }
                      } catch {
                        return 'JSON non valido (❌ Errore sintassi)';
                      }
                    })()
                  }
                </p>
              </div>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
};

export default JSONManager;