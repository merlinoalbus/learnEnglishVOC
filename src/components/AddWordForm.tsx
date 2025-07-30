// =====================================================
// 📁 src/components/AddWordForm.tsx - TypeScript Migration
// =====================================================

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Plus, Edit3, Check, Sparkles, Brain, AlertTriangle, RefreshCw } from 'lucide-react';
import { getPredefinedGroups, getCategoryStyle } from '../utils/categoryUtils';
import { useNotification } from '../contexts/NotificationContext';
import { aiService } from '../services/aiService';
import { useAILoading } from '../hooks/useLoadingState';
import { SmartLoadingIndicator, ErrorWithRetry } from '../components/LoadingComponents';
import { AIServiceErrorBoundary, FormErrorBoundary } from '../components/ErrorBoundaries';
import { Word, CreateWordInput, UpdateWordInput } from '../types/entities/Word.types';
import { useWords } from '../hooks/data/useWords';

// =====================================================
// 🔧 TYPES & INTERFACES
// =====================================================

// ⭐ ARRAY INPUT COMPONENT - Definito FUORI per evitare re-creazione
interface ArrayInputProps {
  label: string;
  icon: string;
  values: string[];
  placeholder: string;
  onArrayChange: (index: number, value: string) => void;
  onAddItem: () => void;
  onRemoveItem: (index: number) => void;
  maxItems?: number;
  description?: string;
}

const ArrayInput: React.FC<ArrayInputProps> = ({ 
  label, 
  icon, 
  values, 
  placeholder, 
  onArrayChange, 
  onAddItem, 
  onRemoveItem, 
  maxItems = 5, 
  description 
}) => (
  <div className="space-y-2">
    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
      <span>{icon}</span> {label}
      {description && <span className="text-xs text-gray-500">({description})</span>}
    </label>
    <div className="space-y-2">
      {values.map((value, index) => (
        <div key={index} className="flex gap-2">
          <Input
            placeholder={`${placeholder} ${index + 1}`}
            value={value}
            onChange={(e) => onArrayChange(index, e.target.value)}
            className="border-2 border-gray-200 dark:border-gray-600 rounded-xl flex-1"
          />
          {values.length > 1 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onRemoveItem(index)}
              className="text-red-500 hover:text-red-700 hover:bg-red-50 px-3"
              title="Rimuovi elemento"
            >
              ✕
            </Button>
          )}
        </div>
      ))}
      {values.length < maxItems && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onAddItem}
          className="w-full border-dashed border-2 border-gray-300 hover:border-gray-400 text-gray-600 hover:text-gray-800"
        >
          <Plus className="w-4 h-4 mr-2" />
          Aggiungi {label.toLowerCase()}
        </Button>
      )}
    </div>
  </div>
);

interface FormData {
  english: string;
  italian: string;
  group: string;
  sentences: string[];     // AGGIORNATO: array di frasi
  synonyms: string[];      // NUOVO: array di sinonimi
  antonyms: string[];      // NUOVO: array di contrari
  notes: string;
  chapter: string;
  learned: boolean;
  difficult: boolean;
}

interface JsonFormData {
  jsonInput: string;
  showJsonInput: boolean;
}

interface FormValidation {
  [key: string]: string;
}

interface AIServiceStatus {
  health: 'healthy' | 'degraded' | 'down' | 'unknown';
  configured: boolean;
  consecutiveFailures: number;
}

interface AddWordFormProps {
  onAddWord: (word: CreateWordInput) => Promise<void>;
  onUpdateWord: (word: UpdateWordInput) => Promise<void>;
  editingWord?: Word | null;
  onClearForm: () => void;
}

// =====================================================
// 🎯 MAIN COMPONENT
// =====================================================

const AddWordForm: React.FC<AddWordFormProps> = ({ 
  onAddWord, 
  onUpdateWord,
  editingWord, 
  onClearForm 
}) => {
  const [formData, setFormData] = useState<FormData>({
    english: '',
    italian: '',
    group: '',
    sentences: [''],         // AGGIORNATO: array con una frase vuota
    synonyms: [''],          // NUOVO: array con un sinonimo vuoto
    antonyms: [''],          // NUOVO: array con un contrario vuoto
    notes: '',
    chapter: '',
    learned: false,
    difficult: false
  });
  const [jsonFormData, setJsonFormData] = useState<JsonFormData>({
    jsonInput: '',
    showJsonInput: false
  });
  const [showAdvancedForm, setShowAdvancedForm] = useState<boolean>(false);
  const [aiServiceStatus, setAiServiceStatus] = useState<AIServiceStatus | null>(null);
  const [formValidation, setFormValidation] = useState<FormValidation>({});
  const [isRefreshingStatus, setIsRefreshingStatus] = useState<boolean>(false);
  
  const { showNotification, showError, showWarning, showSuccess } = useNotification();
  const aiLoading = useAILoading();
  const { words } = useWords(); // Per controllare i duplicati

  // ⭐ DUPLICATE CHECK HELPER
  const checkForDuplicate = useCallback((englishWord: string, excludeId?: string): Word | null => {
    if (!englishWord || !words) return null;
    
    const normalizedEnglish = englishWord.toLowerCase().trim();
    const existingWord = words.find(word => 
      word.english.toLowerCase().trim() === normalizedEnglish && 
      word.id !== excludeId && // Escludi la parola che stiamo modificando
      !word.firestoreMetadata?.deleted // Solo parole non cancellate
    );
    
    return existingWord || null;
  }, [words]);

  // ⭐ PASSIVE AI STATUS CHECK - NO API CALLS
  const checkAIServiceStatus = useCallback(() => {
    try {
      // ⭐ ONLY get status, NO health check calls
      const currentStatus = aiService.getServiceStatus();
      setAiServiceStatus(currentStatus);
      
      
    } catch (error) {
      console.error('❌ Failed to get AI status:', error);
      setAiServiceStatus(prev => ({ 
        ...prev, 
        health: 'down',
        configured: false,
        consecutiveFailures: (prev?.consecutiveFailures || 0) + 1
      }));
    }
  }, []);

  // ⭐ MANUAL REFRESH - COSTS MONEY (user initiated)
  const handleRefreshStatus = useCallback(async () => {
    if (isRefreshingStatus) return;
    
    if (!window.confirm('🚨 ATTENZIONE: Questa operazione costa denaro (chiamata API Google). Continuare?')) {
      return;
    }
    
    setIsRefreshingStatus(true);
    setAiServiceStatus(prev => ({ ...prev, health: 'unknown' } as AIServiceStatus));
    
    try {
      const isHealthy = await aiService.checkHealth();
      const updatedStatus = aiService.getServiceStatus();
      setAiServiceStatus(updatedStatus);
      
      if (isHealthy) {
        showSuccess('✅ AI Service verificato come disponibile');
      } else {
        showWarning('⚠️ AI Service non risponde correttamente');
      }
      
    } catch (error) {
      console.error('❌ Manual health check failed:', error);
      showError(error instanceof Error ? error : new Error(String(error)), 'AI Health Check');
      setAiServiceStatus(prev => ({ 
        ...prev, 
        health: 'down' 
      } as AIServiceStatus));
    } finally {
      setIsRefreshingStatus(false);
    }
  }, [isRefreshingStatus, showSuccess, showWarning, showError]);

  // ⭐ VALIDATION with visual feedback
  const validateForm = useCallback((): boolean => {
    const errors: FormValidation = {};
    
    if (!formData.english.trim()) {
      errors.english = 'Parola inglese obbligatoria';
    } else if (formData.english.trim().length < 2) {
      errors.english = 'Parola troppo corta (min 2 caratteri)';
    } else if (!/^[a-zA-ZÀ-ÿ\s'-]+$/.test(formData.english.trim())) {
      errors.english = 'Solo caratteri inglesi consentiti (a-z, spazi, apostrofi)';
    }
    
    if (!formData.italian.trim()) {
      errors.italian = 'Traduzione italiana obbligatoria';
    } else if (formData.italian.trim().length < 2) {
      errors.italian = 'Traduzione troppo corta (min 2 caratteri)';
    }
    
    if (formData.group && !getPredefinedGroups().includes(formData.group as any)) {
      errors.group = 'Categoria non valida';
    }
    
    setFormValidation(errors);
    return Object.keys(errors).length === 0;
  }, [formData]);

  // ⭐ INPUT CHANGE
  const handleInputChange = useCallback((field: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    if (formValidation[field]) {
      setFormValidation(prev => {
        const newValidation = { ...prev };
        delete newValidation[field];
        return newValidation;
      });
    }
  }, [formValidation]);

  // ⭐ ARRAY HELPERS - Per gestire sentences, synonyms, antonyms
  const handleArrayChange = useCallback((arrayField: 'sentences' | 'synonyms' | 'antonyms', index: number, value: string) => {
    setFormData(prev => {
      const newArray = [...prev[arrayField]];
      newArray[index] = value;
      return { ...prev, [arrayField]: newArray };
    });
  }, []);

  const addArrayItem = useCallback((arrayField: 'sentences' | 'synonyms' | 'antonyms') => {
    setFormData(prev => ({
      ...prev,
      [arrayField]: [...prev[arrayField], '']
    }));
  }, []);

  const removeArrayItem = useCallback((arrayField: 'sentences' | 'synonyms' | 'antonyms', index: number) => {
    setFormData(prev => {
      const newArray = prev[arrayField].filter((_, i) => i !== index);
      // Mantieni almeno un elemento vuoto se l'array diventa vuoto
      return {
        ...prev,
        [arrayField]: newArray.length === 0 ? [''] : newArray
      };
    });
  }, []);

  // ⭐ CALLBACKS SPECIFICI PER OGNI ARRAY - Memorizzati per evitare re-render
  const handleSentencesChange = useCallback((index: number, value: string) => {
    handleArrayChange('sentences', index, value);
  }, [handleArrayChange]);

  const handleSynonymsChange = useCallback((index: number, value: string) => {
    handleArrayChange('synonyms', index, value);
  }, [handleArrayChange]);

  const handleAntonymsChange = useCallback((index: number, value: string) => {
    handleArrayChange('antonyms', index, value);
  }, [handleArrayChange]);

  const addSentence = useCallback(() => addArrayItem('sentences'), [addArrayItem]);
  const addSynonym = useCallback(() => addArrayItem('synonyms'), [addArrayItem]);
  const addAntonym = useCallback(() => addArrayItem('antonyms'), [addArrayItem]);

  const removeSentence = useCallback((index: number) => removeArrayItem('sentences', index), [removeArrayItem]);
  const removeSynonym = useCallback((index: number) => removeArrayItem('synonyms', index), [removeArrayItem]);
  const removeAntonym = useCallback((index: number) => removeArrayItem('antonyms', index), [removeArrayItem]);

  // ⭐ FIELD BLUR - trigger validation
  const handleFieldBlur = useCallback((field: keyof FormData) => {
    const errors: FormValidation = {};
    
    if (field === 'english') {
      if (!formData.english.trim()) {
        errors.english = 'Parola inglese obbligatoria';
      } else if (formData.english.trim().length < 2) {
        errors.english = 'Parola troppo corta';
      } else if (!/^[a-zA-ZÀ-ÿ\s'-]+$/.test(formData.english.trim())) {
        errors.english = 'Solo caratteri inglesi consentiti';
      }
    }
    
    if (field === 'italian') {
      if (!formData.italian.trim()) {
        errors.italian = 'Traduzione italiana obbligatoria';
      } else if (formData.italian.trim().length < 2) {
        errors.italian = 'Traduzione troppo corta';
      }
    }
    
    setFormValidation(prev => ({ ...prev, ...errors }));
  }, [formData]);

  // ⭐ AI ASSIST - This WILL cost money (user action)
  const handleAiAssist = useCallback(async () => {
    if (!formData.english.trim()) {
      showWarning('⚠️ Inserisci prima una parola inglese!');
      return;
    }

    if (!aiServiceStatus?.configured) {
      showError(new Error('🔑 AI Service non configurato'), 'AI Configuration');
      return;
    }

    try {
      showNotification('🤖 L\'AI sta analizzando la parola...', 'info');
      
      const aiData = await aiLoading.executeAIOperation(
        () => aiService.analyzeWordWithFallback(formData.english.trim()),
        `Analisi di "${formData.english}"`
      );
      
      // ⭐ UPDATE STATUS after real usage (no extra cost)
      const updatedStatus = aiService.getServiceStatus();
      setAiServiceStatus(updatedStatus);
      
      if (aiData._aiError) {
        showWarning(`🤖 ${aiData.notes}`);
        setFormData(prev => ({
          ...prev,
          group: aiData.group || prev.group,
          notes: aiData.notes || prev.notes
        }));
      } else {
        setFormData(prev => {
          const newFormData = {
            ...prev,
            italian: aiData.italian || prev.italian,
            group: aiData.group || prev.group,
            sentences: (aiData.sentences && aiData.sentences.length > 0) 
              ? aiData.sentences 
              : aiData.sentence 
              ? [aiData.sentence] 
              : prev.sentences,
            synonyms: (aiData.synonyms && aiData.synonyms.length > 0) 
              ? aiData.synonyms 
              : prev.synonyms,
            antonyms: (aiData.antonyms && aiData.antonyms.length > 0) 
              ? aiData.antonyms 
              : prev.antonyms,
            notes: aiData.notes || prev.notes,
            chapter: aiData.chapter || prev.chapter
          };
          
          return newFormData;
        });
        
        if (aiData.italian) {
          showSuccess('✨ Dati compilati dall\'AI!');
        } else {
          showWarning('🤖 AI ha fornito dati parziali');
        }
      }
      
      setShowAdvancedForm(true);
      
    } catch (error) {
      console.error('AI Assist Error:', error);
      
      // Update status after failure (no extra cost)
      const updatedStatus = aiService.getServiceStatus();
      setAiServiceStatus(updatedStatus);
      
      const fallbackGroup = aiService.categorizeWordFallback(formData.english.trim());
      setFormData(prev => ({
        ...prev,
        group: prev.group || fallbackGroup,
        notes: prev.notes || `🤖 AI non disponibile. Gruppo suggerito: ${fallbackGroup}`
      }));
      setShowAdvancedForm(true);
    }
  }, [formData.english, aiServiceStatus, aiLoading, showNotification, showWarning, showSuccess, showError]);

  // ⭐ JSON PARSING AND SUBMISSION
  const handleJsonSubmit = useCallback(async () => {
    if (!jsonFormData.jsonInput.trim()) {
      showWarning('⚠️ Inserisci il JSON della parola');
      return;
    }

    try {
      // Parse JSON
      const jsonData = JSON.parse(jsonFormData.jsonInput.trim());
      
      // Validate required fields
      if (!jsonData.english || !jsonData.italian) {
        showWarning('⚠️ I campi "english" e "italian" sono obbligatori nel JSON');
        return;
      }

      if (typeof jsonData.english !== 'string' || typeof jsonData.italian !== 'string') {
        showWarning('⚠️ I campi "english" e "italian" devono essere stringhe');
        return;
      }

      // Validate english field (min 2 characters)
      if (jsonData.english.trim().length < 2) {
        showWarning('⚠️ Il campo "english" deve avere almeno 2 caratteri');
        return;
      }

      // Validate italian field (min 2 characters)
      if (jsonData.italian.trim().length < 2) {
        showWarning('⚠️ Il campo "italian" deve avere almeno 2 caratteri');
        return;
      }

      // Check for duplicates
      const duplicateWord = checkForDuplicate(jsonData.english);
      if (duplicateWord) {
        showWarning(`⚠️ La parola "${jsonData.english}" esiste già nel tuo vocabolario.`);
        return;
      }

      // Validate group if provided
      if (jsonData.group && !getPredefinedGroups().includes(jsonData.group)) {
        showWarning(`⚠️ Categoria "${jsonData.group}" non valida. Usa una delle categorie disponibili.`);
        return;
      }

      // Helper per filtrare e validare array
      const filterAndValidateArray = (arr: any, maxLength: number, maxItemLength?: number, fieldName?: string) => {
        if (!Array.isArray(arr)) return [];
        
        const filtered = arr.filter(s => s && typeof s === 'string' && s.trim()).map(s => s.trim());
        
        if (filtered.length > maxLength) {
          throw new Error(`${fieldName} può contenere massimo ${maxLength} elementi`);
        }
        
        if (maxItemLength) {
          for (const item of filtered) {
            if (item.length > maxItemLength) {
              throw new Error(`Ogni elemento di ${fieldName} può avere massimo ${maxItemLength} caratteri`);
            }
          }
        }
        
        return filtered;
      };

      // Validate arrays with limits
      const sentences = filterAndValidateArray(jsonData.sentences || [], 5, 500, 'sentences');
      const synonyms = filterAndValidateArray(jsonData.synonyms || [], 10, 50, 'synonyms');
      const antonyms = filterAndValidateArray(jsonData.antonyms || [], 10, 50, 'antonyms');

      // Validate notes length
      if (jsonData.notes && typeof jsonData.notes === 'string' && jsonData.notes.length > 1000) {
        showWarning('⚠️ Il campo "notes" può avere massimo 1000 caratteri');
        return;
      }

      // Create word data from JSON with defaults
      const wordData: CreateWordInput = {
        english: jsonData.english.trim(),
        italian: jsonData.italian.trim(),
        group: jsonData.group || undefined,
        chapter: jsonData.chapter || undefined,
        sentences: sentences,
        synonyms: synonyms,
        antonyms: antonyms,
        notes: jsonData.notes || undefined,
        difficult: Boolean(jsonData.difficult || false)
      };

      await onAddWord(wordData);
      
      // Reset only JSON input, keep JSON mode active
      setJsonFormData(prev => ({
        ...prev,
        jsonInput: ''
      }));
      
      showSuccess('✅ Parola aggiunta da JSON!');
      
    } catch (error) {
      if (error instanceof SyntaxError) {
        showError(new Error('JSON non valido. Controlla la sintassi.'), 'JSON Parse Error');
      } else {
        console.error('Error adding word from JSON:', error);
        showError(error instanceof Error ? error : new Error(String(error)), 'Add Word from JSON');
      }
    }
  }, [jsonFormData.jsonInput, onAddWord, showWarning, showError, showSuccess, checkForDuplicate]);

  // ⭐ SUBMIT
  const handleSubmit = useCallback(async () => {
    if (!validateForm()) {
      showWarning('⚠️ Correggi gli errori nel form');
      return;
    }

    // Check for duplicates when adding new word (not when editing)
    if (!editingWord) {
      const duplicateWord = checkForDuplicate(formData.english);
      if (duplicateWord) {
        showWarning(`⚠️ La parola "${formData.english}" esiste già nel tuo vocabolario.`);
        return;
      }
    }

    try {
      // Helper per filtrare array in modo sicuro
      const filterArray = (arr: string[]) => {
        if (!Array.isArray(arr)) return [];
        return arr.filter(s => s && typeof s === 'string' && s.trim()).map(s => s.trim());
      };

      const sentences = filterArray(formData.sentences);
      const synonyms = filterArray(formData.synonyms);
      const antonyms = filterArray(formData.antonyms);

      if (editingWord) {
        // EDITING MODE - Update existing word
        const updateData: UpdateWordInput = {
          id: editingWord.id,
          english: formData.english.trim(),
          italian: formData.italian.trim(),
          group: formData.group.trim() || undefined,
          chapter: formData.chapter.trim() || undefined,
          sentences: sentences.length > 0 ? sentences : [],
          synonyms: synonyms.length > 0 ? synonyms : [],
          antonyms: antonyms.length > 0 ? antonyms : [],
          notes: formData.notes.trim() || undefined,
          difficult: formData.difficult,
          learned: formData.learned
        };

        await onUpdateWord(updateData);
      } else {
        // ADD MODE - Create new word
        const wordData: CreateWordInput = {
          english: formData.english.trim(),
          italian: formData.italian.trim(),
          group: formData.group.trim() || undefined,
          chapter: formData.chapter.trim() || undefined,
          sentences: sentences.length > 0 ? sentences : [],
          synonyms: synonyms.length > 0 ? synonyms : [],
          antonyms: antonyms.length > 0 ? antonyms : [],
          notes: formData.notes.trim() || undefined,
          difficult: formData.difficult
        };

        await onAddWord(wordData);
      }
      
      // Reset form
      setFormData({
        english: '',
        italian: '',
        group: '',
        sentences: [''],
        synonyms: [''],
        antonyms: [''],
        notes: '',
        chapter: '',
        learned: false,
        difficult: false
      });
      setShowAdvancedForm(false);
      setFormValidation({});
      
    } catch (error) {
      console.error('Error adding word:', error);
      showError(error instanceof Error ? error : new Error(String(error)), 'Add Word');
    }
  }, [formData, validateForm, onAddWord, onUpdateWord, editingWord, showWarning, showError, checkForDuplicate]);

  // ⭐ CLEAR FORM
  const handleClear = useCallback(() => {
    const hasData = formData.english.trim() || formData.italian.trim() || 
                    formData.sentences.some(s => s.trim()) || 
                    formData.synonyms.some(s => s.trim()) || 
                    formData.antonyms.some(s => s.trim()) || 
                    formData.notes.trim() || formData.group.trim() || formData.chapter.trim() ||
                    formData.learned || formData.difficult || jsonFormData.jsonInput.trim();
    
    if (hasData && !window.confirm('🗑️ Cancellare tutti i dati?')) {
      return;
    }
    
    setFormData({
      english: '',
      italian: '',
      group: '',
      sentences: [''],
      synonyms: [''],
      antonyms: [''],
      notes: '',
      chapter: '',
      learned: false,
      difficult: false
    });
    setJsonFormData(prev => ({
      ...prev,
      jsonInput: ''
    }));
    setShowAdvancedForm(false);
    setFormValidation({});
    onClearForm();
  }, [formData, jsonFormData, onClearForm]);

  // ⭐ EFFECTS - NO AUTO PING
  useEffect(() => {
    // ⭐ ONLY passive status check on mount (NO API CALLS)
    checkAIServiceStatus();
    
    // ⭐ NO automatic interval! Only manual refresh
  }, [checkAIServiceStatus]);

  useEffect(() => {
    if (editingWord) {
      setFormData({
        english: editingWord.english || '',
        italian: editingWord.italian || '',
        group: editingWord.group || '',
        sentences: editingWord.sentences && editingWord.sentences.length > 0 ? editingWord.sentences : [''],
        synonyms: editingWord.synonyms && editingWord.synonyms.length > 0 ? editingWord.synonyms : [''],
        antonyms: editingWord.antonyms && editingWord.antonyms.length > 0 ? editingWord.antonyms : [''],
        notes: editingWord.notes || '',
        chapter: editingWord.chapter || '',
        learned: editingWord.learned || false,
        difficult: editingWord.difficult || false
      });
      setShowAdvancedForm(true);
    }
  }, [editingWord]);

  // ⭐ AI STATUS INDICATOR
  const renderAIStatusIndicator = () => {
    if (!aiServiceStatus) return null;

    const statusConfig = {
      healthy: { color: 'text-green-600 dark:text-green-400', icon: '🟢', message: 'AI disponibile' },
      degraded: { color: 'text-orange-600 dark:text-orange-400', icon: '🟡', message: 'AI instabile' },
      down: { color: 'text-red-600 dark:text-red-400', icon: '🔴', message: 'AI non disponibile' },
      unknown: { color: 'text-gray-600 dark:text-gray-400', icon: '⚪', message: 'AI sconosciuto' }
    };

    const config = statusConfig[aiServiceStatus.health] || statusConfig.unknown;

    return (
      <div className={`flex items-center gap-2 text-xs ${config.color}`}>
        <span>{config.icon}</span>
        <span>{config.message}</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRefreshStatus}
          disabled={isRefreshingStatus}
          className="h-6 px-2 text-xs hover:bg-orange-100 dark:hover:bg-orange-900/30"
          title="⚠️ ATTENZIONE: Verifica manuale - COSTA DENARO!"
        >
          <RefreshCw className={`w-3 h-3 ${isRefreshingStatus ? 'animate-spin' : ''}`} />
          {isRefreshingStatus ? '💰' : '💰'}
        </Button>
      </div>
    );
  };


  // Check if form is valid
  const isFormValid = formData.english.trim().length >= 2 && 
                     formData.italian.trim().length >= 2 &&
                     /^[a-zA-ZÀ-ÿ\s'-]+$/.test(formData.english.trim()) &&
                     Object.keys(formValidation).length === 0;

  return (
    <FormErrorBoundary formName="AddWord" onFormError={(error) => showError(error instanceof Error ? error : new Error(String(error)), 'Word Form')}>
      <Card className="backdrop-blur-sm bg-white/90 dark:bg-gray-800/90 border-0 shadow-xl rounded-3xl overflow-hidden">
        <CardHeader className={editingWord ? "add-word-form-header-editing" : "add-word-form-header-default"}>
          <CardTitle className={`flex items-center justify-between ${editingWord ? "text-white" : "text-gray-900 dark:text-gray-100"}`}>
            {editingWord ? (
              <div className="flex items-center gap-3">
                <Edit3 className="w-6 h-6" />
                <span>Modifica: {editingWord.english}</span>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Plus className="w-6 h-6 text-green-600 dark:text-green-400" />
                <span className="add-word-form-title-ai">
                  Aggiungi Nuove Parole
                </span>
              </div>
            )}
            <div className="flex flex-col gap-2">
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
                  className={editingWord ? "text-white hover:bg-white/20" : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"}
                >
                  {showAdvancedForm ? 'Semplice' : 'Avanzato'}
                </Button>
                {!editingWord && (
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setJsonFormData(prev => ({ ...prev, showJsonInput: !prev.showJsonInput }))}
                    className="text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    {jsonFormData.showJsonInput ? '📝 Form' : '🔧 JSON'}
                  </Button>
                )}
              </div>
              {!editingWord && renderAIStatusIndicator()}
            </div>
          </CardTitle>
          {editingWord && (
            <div className="text-blue-100 bg-blue-600/20 p-3 rounded-xl mt-4">
              💡 Modificando "<strong>{editingWord.english}</strong>". 
              Cambia i campi e clicca "Salva Modifiche".
            </div>
          )}
        </CardHeader>
        
        <CardContent className="p-6">
          <div className="space-y-6">
            {/* Main Fields with validation - Hide when JSON input is active */}
            {!jsonFormData.showJsonInput && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Input
                  placeholder="Parola inglese *"
                  value={formData.english}
                  onChange={(e) => handleInputChange('english', e.target.value)}
                  onBlur={() => handleFieldBlur('english')}
                  className={`border-2 rounded-xl h-12 transition-colors ${
                    formValidation.english ? 'border-red-300 bg-red-50 dark:border-red-700 dark:bg-red-900/30 focus:border-red-400 dark:focus:border-red-500' : 'border-gray-200 dark:border-gray-600 focus:border-blue-500 dark:focus:border-purple-500'
                  }`}
                />
                {formValidation.english && (
                  <p className="text-red-600 dark:text-red-400 text-xs flex items-center gap-1 animate-fade-in">
                    <AlertTriangle className="w-3 h-3" />
                    {formValidation.english}
                  </p>
                )}
              </div>
              
              <div className="space-y-1">
                <Input
                  placeholder="Traduzione italiana *"
                  value={formData.italian}
                  onChange={(e) => handleInputChange('italian', e.target.value)}
                  onBlur={() => handleFieldBlur('italian')}
                  className={`border-2 rounded-xl h-12 transition-colors ${
                    formValidation.italian ? 'border-red-300 bg-red-50 dark:border-red-700 dark:bg-red-900/30 focus:border-red-400 dark:focus:border-red-500' : 'border-gray-200 dark:border-gray-600 focus:border-blue-500 dark:focus:border-purple-500'
                  }`}
                />
                {formValidation.italian && (
                  <p className="text-red-600 dark:text-red-400 text-xs flex items-center gap-1 animate-fade-in">
                    <AlertTriangle className="w-3 h-3" />
                    {formValidation.italian}
                  </p>
                )}
              </div>
              </div>
            )}

            {/* AI Assistant - Hide when JSON input is active */}
            {!jsonFormData.showJsonInput && (
              <AIServiceErrorBoundary onAIError={(error) => showError(error instanceof Error ? error : new Error(String(error)), 'AI Assistant')}>
                {aiLoading.isLoading ? (
                <div className="p-4 bg-purple-50 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-700 rounded-xl">
                  <SmartLoadingIndicator 
                    isLoading={true}
                    operation={aiLoading.operation || undefined}
                    duration={aiLoading.duration}
                    customIcon={Brain}
                  />
                </div>
              ) : aiLoading.error ? (
                <ErrorWithRetry
                  error={aiLoading.error}
                  onRetry={() => aiLoading.retry(() => handleAiAssist())}
                  canRetry={aiLoading.canRetry}
                  retryCount={aiLoading.retryCount}
                  maxRetries={2}
                  isRetrying={aiLoading.isLoading}
                />
              ) : (
                <Button
                  onClick={handleAiAssist}
                  disabled={!formData.english.trim() || !aiServiceStatus?.configured || aiLoading.isLoading}
                  className="add-word-ai-special-button"
                  title="💰 Questa operazione costa denaro (chiamata API Google)"
                >
                  <Sparkles className="w-6 h-6 mr-3" />
                  💰 AI Assistant - Compila Automaticamente
                </Button>
              )}
              </AIServiceErrorBoundary>
            )}

            {/* JSON Input Section */}
            {jsonFormData.showJsonInput && !editingWord && (
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-2 border-blue-200 dark:border-blue-700 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-2xl">🔧</span>
                  <h4 className="font-bold text-blue-800 dark:text-blue-200">Inserimento da JSON</h4>
                </div>
                
                <div className="bg-blue-100 dark:bg-blue-900/30 p-4 rounded-lg mb-4">
                  <h5 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">📋 Formato Richiesto:</h5>
                  <div className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                    <p><strong>Obbligatori:</strong> "english" e "italian" (min 2 caratteri)</p>
                    <p><strong>Opzionali:</strong> "group", "chapter", "sentences" (max 5), "synonyms" (max 10), "antonyms" (max 10), "notes" (max 1000 caratteri), "difficult"</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <Textarea
                    placeholder={`Esempio:\n{\n  "english": "beautiful",\n  "italian": "bello/bella",\n  "group": "AGGETTIVI_BASE",\n  "chapter": "1",\n  "sentences": ["She has a beautiful smile"],\n  "synonyms": ["pretty", "lovely"],\n  "antonyms": ["ugly"],\n  "notes": "Cambia forma in base al genere",\n  "difficult": false\n}`}
                    value={jsonFormData.jsonInput}
                    onChange={(e) => setJsonFormData(prev => ({ ...prev, jsonInput: e.target.value }))}
                    rows={12}
                    className="border-2 border-blue-200 dark:border-blue-600 rounded-xl font-mono text-sm"
                  />
                  
                  <div className="flex gap-3">
                    <Button
                      onClick={handleJsonSubmit}
                      disabled={!jsonFormData.jsonInput.trim()}
                      className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Aggiungi da JSON
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setJsonFormData(prev => ({ ...prev, jsonInput: '' }))}
                      disabled={!jsonFormData.jsonInput.trim()}
                      className="border-blue-300 text-blue-600 hover:bg-blue-50 dark:border-blue-600 dark:text-blue-400 dark:hover:bg-blue-900/20"
                    >
                      Pulisci
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Advanced Form */}
            {showAdvancedForm && !jsonFormData.showJsonInput && (
              <div className="add-word-advanced-section">
                <div className="add-word-info-box">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">📚</span>
                    <h4 className="font-bold text-green-800 dark:text-green-200">Gestione Avanzata</h4>
                  </div>
                  <div className="text-sm text-green-700 dark:text-green-300 space-y-1">
                    <p>• <strong>Capitolo:</strong> Organizza per capitoli (es. 1, 2A, Unit 5)</p>
                    <p>• <strong>Frasi di Contesto:</strong> 🎯 Per suggerimenti durante i test</p>
                    <p>• <strong>Sinonimi/Contrari:</strong> 🎯 Per aiuti intelligenti durante i test</p>
                    <p>• <strong>Appresa:</strong> Rimane ma viene saltata nei test</p>
                    <p>• <strong>Difficile:</strong> ⭐ Per test specifici su parole difficili</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Group */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                      <span>📂</span> Categoria
                    </label>
                    <select
                      value={formData.group}
                      onChange={(e) => handleInputChange('group', e.target.value)}
                      className="w-full px-4 py-3 border-2 rounded-xl bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 focus:border-blue-500 dark:focus:border-blue-400"
                    >
                      <option value="">Nessun gruppo</option>
                      {getPredefinedGroups().map(group => (
                        <option key={group} value={group}>
                          {getCategoryStyle(group).icon} {group}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  {/* Chapter */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                      <span>📖</span> Capitolo
                    </label>
                    <Input
                      placeholder="es. 1, 2A, Unit 5"
                      value={formData.chapter}
                      onChange={(e) => handleInputChange('chapter', e.target.value)}
                      className="border-2 border-gray-200 dark:border-gray-600 rounded-xl"
                    />
                  </div>

                  {/* Status */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                      <span>🎓</span> Stato
                    </label>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 p-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-800">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <div 
                            onClick={() => handleInputChange('learned', !formData.learned)}
                            className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                              formData.learned 
                                ? 'bg-green-500 border-green-500 text-white' 
                                : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800'
                            }`}
                          >
                            {formData.learned && <span className="text-sm">✓</span>}
                          </div>
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Appresa</span>
                        </label>
                      </div>
                      
                      <div className="flex items-center gap-3 p-3 border-2 border-orange-200 dark:border-orange-700 rounded-xl bg-orange-50 dark:bg-orange-900/30">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <div 
                            onClick={() => handleInputChange('difficult', !formData.difficult)}
                            className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                              formData.difficult 
                                ? 'bg-orange-500 border-orange-500 text-white' 
                                : 'border-orange-300 dark:border-orange-600 bg-white dark:bg-gray-800'
                            }`}
                          >
                            {formData.difficult && <AlertTriangle className="w-4 h-4" />}
                          </div>
                          <span className="text-sm font-medium text-orange-700 dark:text-orange-300">⭐ Difficile</span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Array Inputs per Test Mode */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Frasi di Contesto */}
                  <ArrayInput
                    label="Frasi di Contesto"
                    icon="💬"
                    values={formData.sentences}
                    placeholder="es. I love this beautiful song"
                    onArrayChange={handleSentencesChange}
                    onAddItem={addSentence}
                    onRemoveItem={removeSentence}
                    maxItems={5}
                    description="per suggerimenti Test"
                  />
                  
                  {/* Sinonimi */}
                  <ArrayInput
                    label="Sinonimi"
                    icon="🔄"
                    values={formData.synonyms}
                    placeholder="es. beautiful, pretty"
                    onArrayChange={handleSynonymsChange}
                    onAddItem={addSynonym}
                    onRemoveItem={removeSynonym}
                    maxItems={8}
                    description="per suggerimenti Test"
                  />
                  
                  {/* Contrari */}
                  <ArrayInput
                    label="Contrari"
                    icon="↔️"
                    values={formData.antonyms}
                    placeholder="es. ugly, bad"
                    onArrayChange={handleAntonymsChange}
                    onAddItem={addAntonym}
                    onRemoveItem={removeAntonym}
                    maxItems={8}
                    description="per suggerimenti Test"
                  />
                </div>
                
                {/* Notes */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <span>📝</span> Note Aggiuntive
                  </label>
                  <Textarea
                    placeholder="Forme irregolari, pronuncia, note grammaticali..."
                    value={formData.notes}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleInputChange('notes', e.target.value)}
                    rows={3}
                    className="border-2 border-gray-200 dark:border-gray-600 rounded-xl"
                  />
                </div>
              </div>
            )}

            {/* Submit - Hide when JSON input is active */}
            {!jsonFormData.showJsonInput && (
              <Button 
                onClick={handleSubmit}
                disabled={!isFormValid}
                className={`w-full py-4 text-lg rounded-2xl shadow-xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none ${
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
            )}
          </div>
        </CardContent>
      </Card>
    </FormErrorBoundary>
  );
};

export default AddWordForm;