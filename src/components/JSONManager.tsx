// =====================================================
// 📁 src/components/JSONManager.tsx - TypeScript Migration
// =====================================================

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { FileDown, ChevronDown, ChevronUp, Upload, Download } from 'lucide-react';
import { useNotification } from '../contexts/NotificationContext';
import { Word, WordExportData } from '../types/entities/Word.types';

// =====================================================
// 🔧 TYPES & INTERFACES
// =====================================================

interface JSONManagerProps {
  words: Word[];
  onImportWords: (jsonData: string) => Promise<number>;
}

interface ExportData {
  words: Word[];
  exportDate: string;
  totalWords: number;
  version: string;
  appName: string;
  metadata: {
    chapters: string[];
    groups: string[];
    learnedCount: number;
    difficultCount: number;
  };
}

interface ImportData {
  words?: Word[];
  exportDate?: string;
  version?: string;
  metadata?: {
    chapters?: string[];
    groups?: string[];
    learnedCount?: number;
    difficultCount?: number;
  };
}

// =====================================================
// 🎯 MAIN COMPONENT
// =====================================================

const JSONManager: React.FC<JSONManagerProps> = ({ words, onImportWords }) => {
  const [jsonText, setJsonText] = useState<string>('');
  const [showSection, setShowSection] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const { showSuccess, showError, showWarning } = useNotification();

  const handleExport = (): void => {
    if (words.length === 0) {
      showWarning('⚠️ Nessuna parola da esportare!');
      return;
    }

    try {
      setIsProcessing(true);
      
      // ⭐ ENHANCED: Create comprehensive export data
      const exportData: ExportData = {
        words: words,
        exportDate: new Date().toISOString(),
        totalWords: words.length,
        version: '2.0',
        appName: 'Vocabulary Master',
        metadata: {
          chapters: [...new Set(words.map(w => w.chapter).filter(Boolean))] as string[],
          groups: [...new Set(words.map(w => w.group).filter(Boolean))] as string[],
          learnedCount: words.filter(w => w.learned).length,
          difficultCount: words.filter(w => w.difficult).length
        }
      };

      const dataStr = JSON.stringify(exportData, null, 2);
      setJsonText(dataStr);
      setShowSection(true);
      showSuccess(`✅ ${words.length} parole esportate con successo!`);
    } catch (error) {
      console.error('Export error:', error);
      showError(error instanceof Error ? error : new Error(String(error)), 'Export JSON');
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadAsFile = (): void => {
    if (!jsonText.trim()) {
      showWarning('⚠️ Nessun JSON da scaricare! Esporta prima i dati.');
      return;
    }

    try {
      const blob = new Blob([jsonText], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `vocabulary-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      showSuccess('✅ File scaricato con successo!');
    } catch (error) {
      console.error('Download error:', error);
      showError(error instanceof Error ? error : new Error(String(error)), 'Download File');
    }
  };

  const handleImport = async (): Promise<void> => {
    if (!jsonText.trim()) {
      showWarning('⚠️ Inserisci del JSON da importare!');
      return;
    }

    try {
      setIsProcessing(true);
      
      // ⭐ FIXED: Better JSON validation and parsing
      let parsedData: ImportData | Word[];
      try {
        parsedData = JSON.parse(jsonText.trim());
      } catch (parseError) {
        throw new Error('JSON non valido! Controlla la sintassi.');
      }

      // ⭐ FIXED: Handle different import formats
      let wordsToImport: Word[];
      
      if (Array.isArray(parsedData)) {
        // Direct array of words
        wordsToImport = parsedData;
      } else if (parsedData.words && Array.isArray(parsedData.words)) {
        // Export format with metadata
        wordsToImport = parsedData.words;
        
        if (parsedData.metadata) {
          const exportDate = parsedData.exportDate ? new Date(parsedData.exportDate).toLocaleDateString() : 'legacy';
          showSuccess(`📊 Rilevato backup ${parsedData.version || 'legacy'} del ${exportDate}`);
        }
      } else {
        throw new Error('Formato JSON non valido. Atteso array di parole o oggetto con campo "words".');
      }

      // ⭐ FIXED: Validate words structure
      if (!wordsToImport || wordsToImport.length === 0) {
        throw new Error('Nessuna parola trovata nel JSON.');
      }

      // ⭐ FIXED: Validate word structure
      const validWords = wordsToImport.filter((word: any) => {
        return word && 
               typeof word === 'object' && 
               word.english && 
               word.italian &&
               typeof word.english === 'string' &&
               typeof word.italian === 'string';
      });

      if (validWords.length === 0) {
        throw new Error('Nessuna parola valida trovata. Ogni parola deve avere almeno "english" e "italian".');
      }

      if (validWords.length < wordsToImport.length) {
        showWarning(`⚠️ ${wordsToImport.length - validWords.length} parole saltate perché non valide.`);
      }

      // ⭐ FIXED: Call import function and handle response
      const importedCount = await onImportWords(JSON.stringify(validWords));
      
      // ⭐ FIXED: Clear text after successful import
      setJsonText('');
      setShowSection(true); // Keep section open to show success
      
      showSuccess(`✅ ${importedCount} nuove parole importate con successo!`);
      
    } catch (error) {
      console.error('Import error:', error);
      
      // ⭐ ENHANCED: Better error handling
      if (error instanceof Error) {
        if (error.message.includes('JSON') || error.message.includes('syntax')) {
          showError(new Error('❌ JSON non valido! Controlla la sintassi.'), 'Import JSON');
        } else if (error.message.includes('already exist')) {
          showWarning('⚠️ Tutte le parole sono già presenti nel vocabolario.');
        } else {
          showError(error, 'Import JSON');
        }
      } else {
        showError(new Error('Errore sconosciuto durante l\'importazione'), 'Import JSON');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  // ⭐ NEW: Handle file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>): void => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/json' && !file.name.endsWith('.json')) {
      showWarning('⚠️ Seleziona un file JSON valido.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        setJsonText(content);
        setShowSection(true);
        showSuccess('📁 File caricato! Verifica il contenuto e clicca "Importa JSON".');
      } catch (error) {
        showError(error instanceof Error ? error : new Error(String(error)), 'File Reading');
      }
    };
    reader.onerror = () => {
      showError(new Error('Errore nella lettura del file'), 'File Reading');
    };
    reader.readAsText(file);
  };

  // ⭐ Format detection helper
  const detectJSONFormat = (): string => {
    try {
      const parsed = JSON.parse(jsonText);
      
      if (Array.isArray(parsed)) {
        const hasWords = parsed.length > 0;
        const firstItem = hasWords ? parsed[0] : null;
        const hasEnglishItalian = firstItem && firstItem.english && firstItem.italian;
        
        if (hasEnglishItalian) {
          return `Array di ${parsed.length} parole (✅ Formato valido)`;
        } else if (hasWords) {
          return `Array con ${parsed.length} elementi (⚠️ Verificare formato)`;
        } else {
          return 'Array vuoto (❌ Nessuna parola)';
        }
      } else if (parsed.words && Array.isArray(parsed.words)) {
        return `Backup Export v${parsed.version || '1.0'} con ${parsed.words.length} parole (✅ Formato valido)`;
      } else {
        return 'Oggetto JSON (⚠️ Array o campo "words" richiesto)';
      }
    } catch {
      return 'JSON non valido (❌ Errore sintassi)';
    }
  };

  // ⭐ Preview words helper
  const renderPreviewWords = (): React.ReactNode => {
    try {
      const parsed = JSON.parse(jsonText);
      let wordsArray: Word[] = Array.isArray(parsed) ? parsed : parsed.words;
      
      if (wordsArray && wordsArray.length > 0) {
        const sampleWords = wordsArray.slice(0, 3);
        return (
          <div className="p-3 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-xl">
            <p className="text-blue-800 dark:text-blue-200 text-sm font-bold mb-2">👀 Anteprima prime parole:</p>
            <div className="space-y-1">
              {sampleWords.map((word, idx) => (
                <div key={idx} className="text-xs text-blue-700 dark:text-blue-300 font-mono">
                  • {word.english} → {word.italian}
                  {word.chapter && ` (Cap. ${word.chapter})`}
                  {word.group && ` [${word.group}]`}
                </div>
              ))}
              {wordsArray.length > 3 && (
                <div className="text-xs text-blue-600 dark:text-blue-400">
                  ... e altre {wordsArray.length - 3} parole
                </div>
              )}
            </div>
          </div>
        );
      }
    } catch {
      return null;
    }
    return null;
  };

  return (
    <Card className="backdrop-blur-sm bg-white/90 dark:bg-gray-800/90 border-0 shadow-xl rounded-3xl overflow-hidden">
      <CardHeader 
        className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        onClick={() => setShowSection(!showSection)}
      >
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileDown className="w-6 h-6 text-indigo-600 dark:text-purple-400" />
            <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Gestione Dati JSON
            </span>
          </div>
          {showSection ? <ChevronUp className="w-5 h-5 text-gray-400 dark:text-gray-500" /> : <ChevronDown className="w-5 h-5 text-gray-400 dark:text-gray-500" />}
        </CardTitle>
      </CardHeader>
      {showSection && (
        <CardContent className="animate-fade-in">
          <div className="space-y-6">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/30 rounded-2xl border border-blue-200 dark:border-blue-700">
              <p className="text-blue-800 dark:text-blue-200 text-sm flex items-center gap-2">
                <span className="text-lg">💡</span>
                Usa questa sezione per fare backup del tuo vocabolario o condividerlo tra dispositivi
              </p>
            </div>
            
            {/* ⭐ ENHANCED: Action buttons grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <Button
                onClick={handleExport}
                disabled={words.length === 0 || isProcessing}
                className="border-2 border-blue-300 dark:border-blue-700 hover:border-blue-400 dark:hover:border-blue-600 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-600 dark:text-blue-400 flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                📤 Esporta JSON
              </Button>
              
              <Button
                onClick={downloadAsFile}
                disabled={!jsonText.trim() || isProcessing}
                className="border-2 border-green-300 dark:border-green-700 hover:border-green-400 dark:hover:border-green-600 bg-green-50 dark:bg-green-900/30 hover:bg-green-100 dark:hover:bg-green-900/50 text-green-600 dark:text-green-400 flex items-center justify-center gap-2"
              >
                <FileDown className="w-4 h-4" />
                💾 Scarica File
              </Button>
              
              <div className="relative">
                <input
                  type="file"
                  accept=".json,application/json"
                  onChange={handleFileUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  disabled={isProcessing}
                />
                <Button
                  disabled={isProcessing}
                  className="w-full bg-orange-500 hover:bg-orange-600 dark:bg-orange-600 dark:hover:bg-orange-700 text-white border-0 flex items-center justify-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  📁 Carica File
                </Button>
              </div>
              
              <Button
                onClick={handleImport}
                disabled={!jsonText.trim() || isProcessing}
                className="w-full bg-purple-500 hover:bg-purple-600 dark:bg-purple-600 dark:hover:bg-purple-700 text-white border-0 flex items-center justify-center gap-2"
              >
                <Upload className="w-4 h-4" />
                📥 Importa JSON
              </Button>
            </div>
            
            <Textarea
              placeholder="Il JSON delle parole apparirà qui dopo 'Esporta JSON', oppure incolla/carica qui il JSON da importare..."
              value={jsonText}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setJsonText(e.target.value)}
              rows={12}
              className="font-mono text-sm border-2 border-gray-200 dark:border-gray-600 rounded-2xl focus:border-blue-500 dark:focus:border-purple-500 transition-colors dark:bg-gray-800 dark:text-gray-100"
              disabled={isProcessing}
            />
            
            {/* ⭐ ENHANCED: Status indicators */}
            {jsonText && (
              <div className="space-y-2">
                <div className="p-3 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 rounded-xl">
                  <p className="text-green-800 dark:text-green-200 text-sm">
                    💾 <strong>Formato rilevato:</strong> {detectJSONFormat()}
                  </p>
                </div>
                
                {/* ⭐ NEW: Import preview */}
                {renderPreviewWords()}
              </div>
            )}
            
            {/* ⭐ NEW: Processing indicator */}
            {isProcessing && (
              <div className="flex items-center justify-center p-4 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-700 rounded-xl">
                <div className="animate-spin w-5 h-5 border-2 border-yellow-500 border-t-transparent rounded-full mr-3"></div>
                <span className="text-yellow-800 dark:text-yellow-200 font-medium">Elaborazione in corso...</span>
              </div>
            )}
            
            {/* ⭐ ENHANCED: Usage instructions */}
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
              <h4 className="font-bold text-gray-800 dark:text-gray-200 mb-2">📖 Come usare:</h4>
              <div className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                <p><strong>1. Esportare:</strong> Clicca "Esporta JSON" per vedere i tuoi dati</p>
                <p><strong>2. Scaricare:</strong> Clicca "Scarica File" per salvare un file .json</p>
                <p><strong>3. Importare:</strong> Carica un file .json o incolla il contenuto, poi clicca "Importa JSON"</p>
                <p><strong>4. Formati supportati:</strong> Array di parole o oggetto con campo "words"</p>
              </div>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
};

export default JSONManager;