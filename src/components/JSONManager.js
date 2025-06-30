// /src/components/JSONManager.js
// +// This file contains the JSONManager component, which allows users to export and import vocabulary words in JSON format.
// +// It provides functionality to export the current vocabulary as a JSON string, display it in a textarea, and import words from a JSON string.
// +// The component includes buttons for exporting and importing JSON, and it handles notifications for successful operations or errors.
// +// The JSONManager component is designed to help users back up their vocabulary or share it between devices, making it easier to manage their vocabulary data.
// +// It is styled using Tailwind CSS for a modern and responsive design.

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { FileDown, ChevronDown, ChevronUp } from 'lucide-react';

const JSONManager = ({ words, onImportWords, showNotification }) => {
  const [jsonText, setJsonText] = useState('');
  const [showSection, setShowSection] = useState(false);

  const handleExport = () => {
    if (words.length === 0) {
      showNotification('⚠️ Nessuna parola da esportare!');
      return;
    }

    try {
      const dataStr = JSON.stringify(words, null, 2);
      setJsonText(dataStr);
      setShowSection(true);
      showNotification('✅ Parole esportate con successo!');
    } catch (error) {
      console.error('Error exporting words:', error);
      showNotification('❌ Errore durante l\'esportazione!');
    }
  };

  const handleImport = () => {
    if (!jsonText.trim()) {
      showNotification('⚠️ Inserisci del JSON da importare!');
      return;
    }

    try {
      const newWordsCount = onImportWords(jsonText.trim());
      setJsonText('');
      showNotification(`✅ ${newWordsCount} parole importate con successo!`);
    } catch (error) {
      const errorMessage = error.message.includes('JSON') ? 
        '❌ JSON non valido! Controlla la sintassi.' : 
        `❌ ${error.message}`;
      showNotification(errorMessage);
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
          </div>
        </CardContent>
      )}
    </Card>
  );
};

export default JSONManager;