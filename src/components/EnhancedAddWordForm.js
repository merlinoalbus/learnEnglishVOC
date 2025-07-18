// =====================================================
// 📁 src/components/EnhancedAddWordForm.js - NO AUTO PING VERSION
// =====================================================
import React from 'react';
import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Plus, Edit3, Check, Sparkles, Brain, AlertTriangle, RefreshCw } from 'lucide-react';
import { getPredefinedGroups, getCategoryStyle } from '../utils/categoryUtils';
import { useNotification } from '../contexts/NotificationContext';
import { enhancedAIService } from '../services/enhancedAIService';
import { useAILoading } from '../hooks/useLoadingState';
import { SmartLoadingIndicator, ErrorWithRetry } from '../components/LoadingComponents';
import { AIServiceErrorBoundary, FormErrorBoundary } from '../components/ErrorBoundaries';

const EnhancedAddWordForm = ({ onAddWord, editingWord, onClearForm }) => {
  const [formData, setFormData] = useState({
    english: '',
    italian: '',
    group: '',
    sentence: '',
    notes: '',
    chapter: '',
    learned: false,
    difficult: false
  });
  const [showAdvancedForm, setShowAdvancedForm] = useState(false);
  const [aiServiceStatus, setAiServiceStatus] = useState(null);
  const [formValidation, setFormValidation] = useState({});
  const [isRefreshingStatus, setIsRefreshingStatus] = useState(false);
  
  const { showNotification, showError, showWarning, showSuccess } = useNotification();
  const aiLoading = useAILoading();

  // ⭐ PASSIVE AI STATUS CHECK - NO API CALLS
  const checkAIServiceStatus = useCallback(() => {
    try {
      // ⭐ ONLY get status, NO health check calls
      const currentStatus = enhancedAIService.getServiceStatus();
      setAiServiceStatus(currentStatus);
      
      console.log('📊 AI Status (passive):', { 
        health: currentStatus.health,
        configured: currentStatus.configured,
        consecutiveFailures: currentStatus.consecutiveFailures 
      });
      
    } catch (error) {
      console.error('❌ Failed to get AI status:', error);
      setAiServiceStatus(prev => ({ 
        ...prev, 
        health: 'down',
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
    setAiServiceStatus(prev => ({ ...prev, health: 'unknown' }));
    
    try {
      console.log('💰 Manual AI health check (COSTS MONEY) - User confirmed');
      const isHealthy = await enhancedAIService.checkHealth();
      const updatedStatus = enhancedAIService.getServiceStatus();
      setAiServiceStatus(updatedStatus);
      
      if (isHealthy) {
        showSuccess('✅ AI Service verificato come disponibile');
      } else {
        showWarning('⚠️ AI Service non risponde correttamente');
      }
      
    } catch (error) {
      console.error('❌ Manual health check failed:', error);
      showError(error, 'AI Health Check');
      setAiServiceStatus(prev => ({ 
        ...prev, 
        health: 'down' 
      }));
    } finally {
      setIsRefreshingStatus(false);
    }
  }, [isRefreshingStatus, showSuccess, showWarning, showError]);

  // ⭐ VALIDATION with visual feedback
  const validateForm = useCallback(() => {
    const errors = {};
    
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
    
    if (formData.group && !getPredefinedGroups().includes(formData.group)) {
      errors.group = 'Categoria non valida';
    }
    
    setFormValidation(errors);
    return Object.keys(errors).length === 0;
  }, [formData]);

  // ⭐ INPUT CHANGE
  const handleInputChange = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    if (formValidation[field]) {
      setFormValidation(prev => {
        const newValidation = { ...prev };
        delete newValidation[field];
        return newValidation;
      });
    }
  }, [formValidation]);

  // ⭐ FIELD BLUR - trigger validation
  const handleFieldBlur = useCallback((field) => {
    const errors = {};
    
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
        () => enhancedAIService.analyzeWordWithFallback(formData.english.trim()),
        `Analisi di "${formData.english}"`
      );
      
      // ⭐ UPDATE STATUS after real usage (no extra cost)
      const updatedStatus = enhancedAIService.getServiceStatus();
      setAiServiceStatus(updatedStatus);
      
      if (aiData._aiError) {
        showWarning(`🤖 ${aiData.notes}`);
        setFormData(prev => ({
          ...prev,
          group: aiData.group || prev.group,
          notes: aiData.notes || prev.notes
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          italian: aiData.italian || prev.italian,
          group: aiData.group || prev.group,
          sentence: aiData.sentence || prev.sentence,
          notes: aiData.notes || prev.notes,
          chapter: aiData.chapter || prev.chapter
        }));
        
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
      const updatedStatus = enhancedAIService.getServiceStatus();
      setAiServiceStatus(updatedStatus);
      
      const fallbackGroup = enhancedAIService.categorizeWordFallback(formData.english.trim());
      setFormData(prev => ({
        ...prev,
        group: prev.group || fallbackGroup,
        notes: prev.notes || `🤖 AI non disponibile. Gruppo suggerito: ${fallbackGroup}`
      }));
      setShowAdvancedForm(true);
    }
  }, [formData.english, aiServiceStatus, aiLoading, showNotification, showWarning, showSuccess, showError]);

  // ⭐ SUBMIT
  const handleSubmit = useCallback(async () => {
    if (!validateForm()) {
      showWarning('⚠️ Correggi gli errori nel form');
      return;
    }

    try {
      await onAddWord({
        english: formData.english.trim(),
        italian: formData.italian.trim(),
        group: formData.group.trim() || null,
        sentence: formData.sentence.trim() || null,
        notes: formData.notes.trim() || null,
        chapter: formData.chapter.trim() || null,
        learned: formData.learned,
        difficult: formData.difficult
      });
      
      // Reset form
      setFormData({
        english: '',
        italian: '',
        group: '',
        sentence: '',
        notes: '',
        chapter: '',
        learned: false,
        difficult: false
      });
      setShowAdvancedForm(false);
      setFormValidation({});
      
    } catch (error) {
      console.error('Error adding word:', error);
      showError(error, 'Add Word');
    }
  }, [formData, validateForm, onAddWord, showWarning, showError]);

  // ⭐ CLEAR FORM
  const handleClear = useCallback(() => {
    const hasData = Object.values(formData).some(value => 
      typeof value === 'string' ? value.trim() : value
    );
    
    if (hasData && !window.confirm('🗑️ Cancellare tutti i dati?')) {
      return;
    }
    
    setFormData({
      english: '',
      italian: '',
      group: '',
      sentence: '',
      notes: '',
      chapter: '',
      learned: false,
      difficult: false
    });
    setShowAdvancedForm(false);
    setFormValidation({});
    onClearForm();
  }, [formData, onClearForm]);

  // ⭐ EFFECTS - NO AUTO PING
  useEffect(() => {
    // ⭐ ONLY passive status check on mount (NO API CALLS)
    checkAIServiceStatus();
    
    // ⭐ NO automatic interval! Only manual refresh
    console.log('🔒 AI Status: Manual refresh only (no automatic pings)');
  }, [checkAIServiceStatus]);

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
      degraded: { color: 'text-yellow-600 dark:text-yellow-400', icon: '🟡', message: 'AI instabile' },
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
          className="h-6 px-2 text-xs hover:bg-yellow-100 dark:hover:bg-yellow-900/30"
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
    <FormErrorBoundary formName="AddWord" onFormError={(error) => showError(error, 'Word Form')}>
      <Card className="backdrop-blur-sm bg-white/90 dark:bg-gray-800/90 border-0 shadow-xl rounded-3xl overflow-hidden">
        <CardHeader className={editingWord ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white" : ""}>
          <CardTitle className={`flex items-center justify-between ${editingWord ? "text-white" : "text-gray-800 dark:text-gray-200"}`}>
            {editingWord ? (
              <div className="flex items-center gap-3">
                <Edit3 className="w-6 h-6" />
                <span>Modifica: {editingWord.english}</span>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Plus className="w-6 h-6 text-green-600 dark:text-green-400" />
                <span className="bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
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
            {/* Main Fields with validation */}
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

            {/* AI Assistant */}
            <AIServiceErrorBoundary onAIError={(error) => showError(error, 'AI Assistant')}>
              {aiLoading.isLoading ? (
                <div className="p-4 bg-purple-50 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-700 rounded-xl">
                  <SmartLoadingIndicator 
                    isLoading={true}
                    operation={aiLoading.operation}
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
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white py-4 text-lg rounded-xl shadow-lg transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  title="💰 Questa operazione costa denaro (chiamata API Google)"
                >
                  <Sparkles className="w-6 h-6 mr-3" />
                  💰 AI Assistant - Compila Automaticamente
                </Button>
              )}
            </AIServiceErrorBoundary>

            {/* Advanced Form */}
            {showAdvancedForm && (
              <div className="space-y-6 p-6 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/30 dark:to-purple-900/30 rounded-2xl border-2 border-blue-200 dark:border-blue-700">
                <div className="p-4 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/30 dark:to-blue-900/30 border-2 border-green-200 dark:border-green-700 rounded-2xl">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">📚</span>
                    <h4 className="font-bold text-green-800 dark:text-green-200">Gestione Avanzata</h4>
                  </div>
                  <div className="text-sm text-green-700 dark:text-green-300 space-y-1">
                    <p>• <strong>Capitolo:</strong> Organizza per capitoli (es. 1, 2A, Unit 5)</p>
                    <p>• <strong>Appresa:</strong> Rimane ma viene saltata nei test</p>
                    <p>• <strong>Difficile:</strong> ⭐ Per test specifici</p>
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
                      className="w-full px-4 py-3 border-2 rounded-xl bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 dark:text-gray-100"
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
                      <div className="flex items-center gap-3 p-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800">
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
                
                {/* Sentence */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <span>💬</span> Frase d'esempio
                  </label>
                  <Input
                    placeholder="es. I love this beautiful song"
                    value={formData.sentence}
                    onChange={(e) => handleInputChange('sentence', e.target.value)}
                    className="border-2 border-gray-200 dark:border-gray-600 rounded-xl"
                  />
                </div>
                
                {/* Notes */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <span>📝</span> Note
                  </label>
                  <Textarea
                    placeholder="Altri significati, sinonimi, forme irregolari..."
                    value={formData.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    rows={4}
                    className="border-2 border-gray-200 dark:border-gray-600 rounded-xl"
                  />
                </div>
              </div>
            )}

            {/* Submit */}
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
          </div>
        </CardContent>
      </Card>
    </FormErrorBoundary>
  );
};

export default EnhancedAddWordForm;