import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card';
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { Textarea } from './components/ui/textarea';
import { Plus, Trash2, Play, RotateCcw, Check, X, RefreshCw, Copy, FileDown, ChevronDown, ChevronUp, Edit3, BarChart3, TrendingUp, Calendar, Target } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import './App.css';

const VocabularyApp = () => {
  const [words, setWords] = useState([]);
  const [currentWord, setCurrentWord] = useState(null);
  const [usedWordIds, setUsedWordIds] = useState(new Set());
  const [showMeaning, setShowMeaning] = useState(false);
  const [testMode, setTestMode] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [stats, setStats] = useState({ correct: 0, incorrect: 0 });
  const [wrongWords, setWrongWords] = useState([]);
  const [newWordEn, setNewWordEn] = useState('');
  const [newWordIt, setNewWordIt] = useState('');
  const [newWordGroup, setNewWordGroup] = useState('');
  const [newWordSentence, setNewWordSentence] = useState('');
  const [newWordNotes, setNewWordNotes] = useState('');
  const [showAdvancedForm, setShowAdvancedForm] = useState(false);
  const [jsonText, setJsonText] = useState('');
  const [showConfirmClear, setShowConfirmClear] = useState(false);
  const [showJsonSection, setShowJsonSection] = useState(false);
  const [showWordsList, setShowWordsList] = useState(true);
  const [editingWord, setEditingWord] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [statusMessage, setStatusMessage] = useState('');

  // Nuovi stati per statistiche e cronologia
  const [testHistory, setTestHistory] = useState([]);
  const [showStatsSection, setShowStatsSection] = useState(false);
  const [currentView, setCurrentView] = useState('main'); // 'main', 'stats'
  const [confirmClearHistory, setConfirmClearHistory] = useState(false);

  // Gestione localStorage
  const getStorageItem = (key) => {
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.error('Errore accesso localStorage:', error);
      return null;
    }
  };

  const setStorageItem = (key, value) => {
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      console.error('Errore salvataggio localStorage:', error);
    }
  };

  // Carica le parole e la cronologia dal storage all'avvio
  useEffect(() => {
    // Carica parole
    const savedWords = getStorageItem('vocabularyWords');
    if (savedWords) {
      try {
        const parsedWords = JSON.parse(savedWords);
        setWords(parsedWords.sort((a, b) => a.english.localeCompare(b.english)));
      } catch (error) {
        console.error('Errore nel caricamento delle parole:', error);
      }
    }

    // Carica cronologia test
    const savedHistory = getStorageItem('testHistory');
    if (savedHistory) {
      try {
        const parsedHistory = JSON.parse(savedHistory);
        setTestHistory(parsedHistory);
      } catch (error) {
        console.error('Errore nel caricamento della cronologia:', error);
      }
    }
  }, []);

  // Salva le parole nel storage ogni volta che cambiano
  useEffect(() => {
    if (words.length > 0) {
      setStorageItem('vocabularyWords', JSON.stringify(words));
    }
  }, [words]);

  // Salva la cronologia nel storage ogni volta che cambia
  useEffect(() => {
    if (testHistory.length > 0) {
      setStorageItem('testHistory', JSON.stringify(testHistory));
    }
  }, [testHistory]);

  // Mostra un messaggio di status temporaneo
  const showStatus = (message) => {
    setStatusMessage(message);
    setTimeout(() => setStatusMessage(''), 3000);
  };

  // Salva un test completato nella cronologia
  const saveTestToHistory = (testStats) => {
    const testResult = {
      id: Date.now(),
      timestamp: new Date(),
      totalWords: testStats.correct + testStats.incorrect,
      correctWords: testStats.correct,
      incorrectWords: testStats.incorrect,
      percentage: Math.round((testStats.correct / (testStats.correct + testStats.incorrect)) * 100),
      wrongWords: [...wrongWords]
    };

    setTestHistory(prev => [testResult, ...prev]);
  };

  // Funzioni per gestire le statistiche
  const getOverallStats = () => {
    if (testHistory.length === 0) {
      return {
        totalTests: 0,
        averageScore: 0,
        totalWords: 0,
        totalCorrect: 0,
        totalIncorrect: 0,
        bestScore: 0,
        worstScore: 0,
        improvementTrend: 0
      };
    }

    const totalTests = testHistory.length;
    const totalCorrect = testHistory.reduce((sum, test) => sum + test.correctWords, 0);
    const totalIncorrect = testHistory.reduce((sum, test) => sum + test.incorrectWords, 0);
    const totalWords = totalCorrect + totalIncorrect;
    const averageScore = Math.round(testHistory.reduce((sum, test) => sum + test.percentage, 0) / totalTests);
    const bestScore = Math.max(...testHistory.map(test => test.percentage));
    const worstScore = Math.min(...testHistory.map(test => test.percentage));

    // Calcola trend di miglioramento (ultimi 5 test vs precedenti 5)
    let improvementTrend = 0;
    if (totalTests >= 4) {
      const recentTests = testHistory.slice(0, Math.min(5, Math.floor(totalTests / 2)));
      const olderTests = testHistory.slice(Math.min(5, Math.floor(totalTests / 2)), Math.min(10, totalTests));

      if (olderTests.length > 0) {
        const recentAvg = recentTests.reduce((sum, test) => sum + test.percentage, 0) / recentTests.length;
        const olderAvg = olderTests.reduce((sum, test) => sum + test.percentage, 0) / olderTests.length;
        improvementTrend = Math.round(recentAvg - olderAvg);
      }
    }

    return {
      totalTests,
      averageScore,
      totalWords,
      totalCorrect,
      totalIncorrect,
      bestScore,
      worstScore,
      improvementTrend
    };
  };

  // Prepara dati per i grafici
  const getChartData = () => {
    const sortedHistory = [...testHistory].reverse(); // Dal più vecchio al più recente

    return sortedHistory.map((test, index) => ({
      test: `Test ${index + 1}`,
      percentage: test.percentage,
      correct: test.correctWords,
      incorrect: test.incorrectWords,
      date: new Date(test.timestamp).toLocaleDateString('it-IT'),
      time: new Date(test.timestamp).toLocaleTimeString('it-IT', {
        hour: '2-digit',
        minute: '2-digit'
      })
    }));
  };

  // Pulisce la cronologia
  const clearTestHistory = () => {
    setTestHistory([]);
    setConfirmClearHistory(false);
    showStatus('Cronologia test eliminata con successo!');
  };

  // Ottiene i gruppi predefiniti dal categoryMap
  const getPredefinedGroups = () => {
    const categoryMap = {
      'VERBI': { color: 'from-red-400 via-red-500 to-red-600', icon: '⚡', bgColor: 'bg-red-500' },
      'VERBI_IRREGOLARI': { color: 'from-red-500 via-red-600 to-red-700', icon: '🔄', bgColor: 'bg-red-600' },
      'SOSTANTIVI': { color: 'from-blue-400 via-blue-500 to-blue-600', icon: '🏷️', bgColor: 'bg-blue-500' },
      'AGGETTIVI': { color: 'from-green-400 via-green-500 to-green-600', icon: '🎨', bgColor: 'bg-green-500' },
      'DESCRIZIONI_FISICHE': { color: 'from-teal-400 via-teal-500 to-teal-600', icon: '👤', bgColor: 'bg-teal-500' },
      'POSIZIONE_CORPO': { color: 'from-purple-400 via-purple-500 to-purple-600', icon: '🧘', bgColor: 'bg-purple-500' },
      'EMOZIONI': { color: 'from-pink-400 via-pink-500 to-pink-600', icon: '❤️', bgColor: 'bg-pink-500' },
      'EMOZIONI_POSITIVE': { color: 'from-yellow-400 via-yellow-500 to-orange-500', icon: '😊', bgColor: 'bg-yellow-500' },
      'EMOZIONI_NEGATIVE': { color: 'from-gray-400 via-gray-500 to-gray-600', icon: '😔', bgColor: 'bg-gray-500' },
      'LAVORO': { color: 'from-indigo-400 via-indigo-500 to-indigo-600', icon: '💼', bgColor: 'bg-indigo-500' },
      'FAMIGLIA': { color: 'from-pink-300 via-pink-400 to-rose-500', icon: '👨‍👩‍👧‍👦', bgColor: 'bg-pink-400' },
      'TECNOLOGIA': { color: 'from-cyan-400 via-cyan-500 to-blue-500', icon: '💻', bgColor: 'bg-cyan-500' },
      'VESTITI': { color: 'from-purple-300 via-purple-400 to-pink-500', icon: '👕', bgColor: 'bg-purple-400' }
    };

    return Object.keys(categoryMap).sort();
  };

  // Funzione per ottenere colore e icona della categoria
  const getCategoryStyle = (group) => {
    if (!group) return { color: 'from-blue-400 via-blue-500 to-blue-600', icon: '📚', bgColor: 'bg-blue-500' };

    const categoryMap = {
      'VERBI': { color: 'from-red-400 via-red-500 to-red-600', icon: '⚡', bgColor: 'bg-red-500' },
      'VERBI_IRREGOLARI': { color: 'from-red-500 via-red-600 to-red-700', icon: '🔄', bgColor: 'bg-red-600' },
      'SOSTANTIVI': { color: 'from-blue-400 via-blue-500 to-blue-600', icon: '🏷️', bgColor: 'bg-blue-500' },
      'AGGETTIVI': { color: 'from-green-400 via-green-500 to-green-600', icon: '🎨', bgColor: 'bg-green-500' },
      'DESCRIZIONI_FISICHE': { color: 'from-teal-400 via-teal-500 to-teal-600', icon: '👤', bgColor: 'bg-teal-500' },
      'POSIZIONE_CORPO': { color: 'from-purple-400 via-purple-500 to-purple-600', icon: '🧘', bgColor: 'bg-purple-500' },
      'EMOZIONI': { color: 'from-pink-400 via-pink-500 to-pink-600', icon: '❤️', bgColor: 'bg-pink-500' },
      'EMOZIONI_POSITIVE': { color: 'from-yellow-400 via-yellow-500 to-orange-500', icon: '😊', bgColor: 'bg-yellow-500' },
      'EMOZIONI_NEGATIVE': { color: 'from-gray-400 via-gray-500 to-gray-600', icon: '😔', bgColor: 'bg-gray-500' },
      'LAVORO': { color: 'from-indigo-400 via-indigo-500 to-indigo-600', icon: '💼', bgColor: 'bg-indigo-500' },
      'FAMIGLIA': { color: 'from-pink-300 via-pink-400 to-rose-500', icon: '👨‍👩‍👧‍👦', bgColor: 'bg-pink-400' },
      'TECNOLOGIA': { color: 'from-cyan-400 via-cyan-500 to-blue-500', icon: '💻', bgColor: 'bg-cyan-500' },
      'VESTITI': { color: 'from-purple-300 via-purple-400 to-pink-500', icon: '👕', bgColor: 'bg-purple-400' },
      'DEFAULT': { color: 'from-emerald-400 via-emerald-500 to-cyan-500', icon: '📚', bgColor: 'bg-blue-500' }
    };

    const upperGroup = group ? group.toUpperCase().trim() : '';
    const result = categoryMap[upperGroup] || categoryMap['DEFAULT'];
    return result;
  };

  // Funzione per formattare le note con parole chiave in grassetto
  const formatNotes = (notes) => {
    if (!notes) return null;

    const keywords = [
      'Altri Significati', 'Altre Traduzioni', 'Espressioni', 'Verbo Irregolare',
      'Pronuncia', 'Sinonimi', 'Esempi', 'Attenzione', 'Nota', 'Importante',
      'Plurale irregolare', 'Tecnologia', 'Posizione', 'Contrario', 'Espressione',
      'Verbo', 'Phrasal verbs', 'Differenza', 'Abbreviazione', 'Sinonimo',
      'Tipico britannico', 'Vestiti', 'Preposizioni', 'Avverbio', 'Sostantivo',
      'Aggettivo', 'Congiunzione', 'Interiezione', 'Participio', 'Gerundio',
      'Passato', 'Presente', 'Futuro', 'Condizionale', 'Imperativo', 'Infinito',
      'Formale', 'Informale', 'Slang', 'Americano', 'Britannico', 'Australiano',
      'Tempo', 'Luogo', 'Modo', 'Causa', 'Effetto', 'Scopo', 'Confronto',
      'Origine', 'Destinazione', 'Materiale', 'Colore', 'Forma', 'Dimensione',
      'Quantità', 'Frequenza', 'Durata', 'Velocità', 'Temperatura', 'Peso',
      'Struttura', 'Espressione fissa', 'Figurativo', 'Specificità', 'Pattern',
      'Più specifico di'
    ];

    let formattedText = notes;

    keywords.forEach(keyword => {
      const regex = new RegExp(`(${keyword})\\s*:`, 'gi');
      formattedText = formattedText.replace(regex, `**$1:**`);
    });

    formattedText = formattedText.replace(/^([A-Za-z\s]+):/gm, '**$1:**');

    const parts = formattedText.split(/(\*\*[^*]+\*\*)/g);

    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        const boldText = part.slice(2, -2);
        return React.createElement('span', { key: index, className: 'font-bold' }, boldText);
      }
      return part;
    });
  };

  // Calcola il risultato del test
  const getTestResult = () => {
    const total = stats.correct + stats.incorrect;
    const percentage = total > 0 ? Math.round((stats.correct / total) * 100) : 0;

    if (percentage >= 80) {
      return { type: 'victory', message: 'Eccellente! 🏆', color: 'text-green-600', bgColor: 'bg-green-50' };
    } else if (percentage >= 60) {
      return { type: 'good', message: 'Buon lavoro! 👍', color: 'text-blue-600', bgColor: 'bg-blue-50' };
    } else {
      return { type: 'defeat', message: 'Continua a studiare! 📚', color: 'text-red-600', bgColor: 'bg-red-50' };
    }
  };

  // Funzione per ottenere una parola casuale non ancora usata
  const getRandomUnusedWord = (wordList, usedIds) => {
    const unusedWords = wordList.filter(word => !usedIds.has(word.id));
    if (unusedWords.length === 0) return null;

    const randomIndex = Math.floor(Math.random() * unusedWords.length);
    return unusedWords[randomIndex];
  };

  // Inizia un nuovo test
  const startTest = () => {
    if (words.length === 0) {
      return;
    }

    setUsedWordIds(new Set());
    setWrongWords([]);
    const firstWord = getRandomUnusedWord(words, new Set());
    setCurrentWord(firstWord);
    setUsedWordIds(new Set([firstWord.id]));
    setShowMeaning(false);
    setTestMode(true);
    setStats({ correct: 0, incorrect: 0 });
  };

  // Prossima parola nel test
  const nextWord = () => {
    const nextRandomWord = getRandomUnusedWord(words, usedWordIds);

    if (nextRandomWord) {
      setUsedWordIds(prev => new Set([...prev, nextRandomWord.id]));
      setCurrentWord(nextRandomWord);
      setShowMeaning(false);
    } else {
      // Test completato - salva nella cronologia
      saveTestToHistory(stats);
      setTestMode(false);
      setShowResults(true);
      setCurrentWord(null);
    }
  };

  // Gestisce la risposta dell'utente
  const handleAnswer = (isCorrect) => {
    setStats(prev => ({
      correct: prev.correct + (isCorrect ? 1 : 0),
      incorrect: prev.incorrect + (isCorrect ? 0 : 1)
    }));

    if (!isCorrect && currentWord) {
      setWrongWords(prev => [...prev, currentWord]);
    }

    // Prima gira la carta se è girata
    if (showMeaning) {
      setShowMeaning(false);
      // Aspetta che l'animazione di flip finisca, poi cambia parola
      setTimeout(nextWord, 800);
    } else {
      // Se la carta è già sul fronte, cambia direttamente
      setTimeout(nextWord, 300);
    }
  };

  // Aggiunge una nuova parola o modifica una esistente
  const addWord = () => {
    if (!newWordEn.trim() || !newWordIt.trim()) {
      return;
    }

    const englishWord = newWordEn.trim().toLowerCase();

    // Controlla duplicati solo se non stiamo modificando
    if (!editingWord) {
      const wordExists = words.some(word => word.english.toLowerCase() === englishWord);
      if (wordExists) {
        return;
      }
    }

    if (editingWord) {
      // Modifica parola esistente
      const updatedWords = words.map(word =>
        word.id === editingWord.id
          ? {
              ...word,
              english: newWordEn.trim(),
              italian: newWordIt.trim(),
              group: newWordGroup.trim() || null,
              sentence: newWordSentence.trim() || null,
              notes: newWordNotes.trim() || null
            }
          : word
      );
      setWords(updatedWords.sort((a, b) => a.english.localeCompare(b.english)));
    } else {
      // Aggiungi nuova parola
      const newWord = {
        id: Date.now(),
        english: newWordEn.trim(),
        italian: newWordIt.trim(),
        group: newWordGroup.trim() || null,
        sentence: newWordSentence.trim() || null,
        notes: newWordNotes.trim() || null
      };
      setWords(prev => [...prev, newWord].sort((a, b) => a.english.localeCompare(b.english)));
    }

    clearForm();
  };

  // Pulisce il form
  const clearForm = () => {
    setNewWordEn('');
    setNewWordIt('');
    setNewWordGroup('');
    setNewWordSentence('');
    setNewWordNotes('');
    setEditingWord(null);
    setShowAdvancedForm(false);
  };

  // Carica una parola nel form per la modifica
  const editWord = (word) => {
    setNewWordEn(word.english);
    setNewWordIt(word.italian);
    setNewWordGroup(word.group || '');
    setNewWordSentence(word.sentence || '');
    setNewWordNotes(word.notes || '');
    setEditingWord(word);
    setShowAdvancedForm(true);

    // Scroll verso il form
    document.querySelector('[data-form-section]')?.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });
  };

  // Rimuove una parola
  const removeWord = (id) => {
    const wordToDelete = words.find(word => word.id === id);
    if (wordToDelete) {
      setConfirmDelete(wordToDelete);
    }
  };

  // Conferma l'eliminazione
  const confirmRemoveWord = () => {
    if (confirmDelete) {
      setWords(prev => prev.filter(word => word.id !== confirmDelete.id));
      // Se stiamo modificando questa parola, annulla la modifica
      if (editingWord && editingWord.id === confirmDelete.id) {
        clearForm();
      }
      showStatus(`Parola "${confirmDelete.english}" eliminata con successo!`);
      setConfirmDelete(null);
    }
  };

  // Annulla l'eliminazione
  const cancelRemoveWord = () => {
    setConfirmDelete(null);
  };

  // Esporta le parole
  const exportWords = () => {
    if (words.length === 0) {
      return;
    }

    try {
      const dataStr = JSON.stringify(words, null, 2);
      setJsonText(dataStr);
      setShowJsonSection(true);
    } catch (error) {
      console.error('Errore durante l\'esportazione:', error);
    }
  };

  // Importa JSON dalla textarea
  const importWords = () => {
    if (!jsonText.trim()) {
      showStatus('⚠️ Inserisci del JSON da importare!');
      return;
    }

    try {
      const importedWords = JSON.parse(jsonText.trim());

      if (!Array.isArray(importedWords)) {
        showStatus('❌ Il JSON deve contenere un array di parole!');
        return;
      }

      if (importedWords.length === 0) {
        showStatus('⚠️ L\'array delle parole è vuoto!');
        return;
      }

      const validWords = importedWords.filter(word =>
        word && word.english && word.italian
      ).map(word => ({
        id: word.id || Date.now() + Math.random(),
        english: word.english,
        italian: word.italian,
        group: word.group || null,
        sentence: word.sentence || null,
        notes: word.notes || null
      }));

      if (validWords.length > 0) {
        const existingWords = words.map(w => w.english.toLowerCase());
        const newWords = validWords.filter(word =>
          !existingWords.includes(word.english.toLowerCase())
        );

        if (newWords.length > 0) {
          setWords(prev => [...prev, ...newWords].sort((a, b) => a.english.localeCompare(b.english)));
          setJsonText('');
          showStatus(`✅ ${newWords.length} parole importate con successo!`);
        } else {
          showStatus('⚠️ Tutte le parole sono già presenti nel vocabolario!');
        }
      } else {
        showStatus('❌ Nessuna parola valida trovata nel JSON!');
      }
    } catch (error) {
      console.error('Errore nel parsing del JSON:', error);
      showStatus('❌ JSON non valido! Controlla la sintassi.');
    }
  };

  // Pulisci tutta la lista
  const clearAllWords = () => {
    if (words.length === 0) {
      return;
    }
    setShowConfirmClear(true);
  };

  const confirmClearWords = () => {
    setWords([]);
    setShowConfirmClear(false);
  };

  const cancelClearWords = () => {
    setShowConfirmClear(false);
  };

  // Reimposta il test
  const resetTest = () => {
    setTestMode(false);
    setShowResults(false);
    setCurrentWord(null);
    setUsedWordIds(new Set());
    setWrongWords([]);
    setShowMeaning(false);
    setStats({ correct: 0, incorrect: 0 });
  };

  // Inizia un nuovo test dalla schermata risultati
  const startNewTest = () => {
    setShowResults(false);
    setWrongWords([]);
    startTest();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center text-indigo-800">
              📚 App Studio Vocabolario Inglese
            </CardTitle>
          </CardHeader>
        </Card>

        {/* Messaggio di Status */}
        {statusMessage && (
          <Card className="border-green-200 bg-green-50">
            <CardContent className="py-3">
              <p className="text-green-800 text-center font-medium">
                ✅ {statusMessage}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Conferma Pulizia Cronologia */}
        {confirmClearHistory && (
          <Card className="border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="text-red-700">⚠️ Conferma Eliminazione Cronologia</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-red-800">
                Sei sicuro di voler eliminare tutta la cronologia dei test ({testHistory.length} test)?<br/>
                Questa azione non può essere annullata e perderai tutte le statistiche.
              </p>
              <div className="flex gap-3">
                <Button
                  onClick={clearTestHistory}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  Sì, elimina cronologia
                </Button>
                <Button
                  onClick={() => setConfirmClearHistory(false)}
                  variant="outline"
                >
                  Annulla
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Conferma Eliminazione Parola */}
        {confirmDelete && (
          <Card className="border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="text-red-700">⚠️ Conferma Eliminazione Parola</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-red-800">
                Sei sicuro di voler eliminare la parola <strong>"{confirmDelete.english}"</strong>?<br/>
                {confirmDelete.italian && <span>Traduzione: <strong>{confirmDelete.italian}</strong><br/></span>}
                Questa azione non può essere annullata.
              </p>
              <div className="flex gap-3">
                <Button
                  onClick={confirmRemoveWord}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  Sì, elimina parola
                </Button>
                <Button
                  onClick={cancelRemoveWord}
                  variant="outline"
                >
                  Annulla
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Conferma Pulizia Lista */}
        {showConfirmClear && (
          <Card className="border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="text-red-700">⚠️ Conferma Eliminazione</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-red-800">
                Sei sicuro di voler eliminare tutte le <strong>{words.length} parole</strong>?<br/>
                Questa azione non può essere annullata.
              </p>
              <div className="flex gap-3">
                <Button
                  onClick={confirmClearWords}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  Sì, elimina tutto
                </Button>
                <Button
                  onClick={cancelClearWords}
                  variant="outline"
                >
                  Annulla
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Modalità Test */}
        {testMode ? (
          <div className="space-y-6">
            {/* Header Test */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  Test in corso - Parola {usedWordIds.size} di {words.length}
                </CardTitle>
                <div className="flex justify-between text-sm text-gray-600">
                  <span className="text-green-600">✓ Corrette: {stats.correct}</span>
                  <span className="text-red-600">✗ Sbagliate: {stats.incorrect}</span>
                </div>
              </CardHeader>
            </Card>

            {/* Area della carta */}
            {currentWord && (
              <div className="w-full">
                <div className="relative w-full" style={{ height: '80vh' }}>
                  <div
                    className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2"
                    style={{ width: '24rem', height: '36rem' }}
                  >
                    <div
                      className="relative w-full h-full cursor-pointer"
                      style={{ perspective: '1000px' }}
                      onClick={() => setShowMeaning(!showMeaning)}
                    >
                      <div
                        className="absolute inset-0 w-full h-full transition-transform duration-700"
                        style={{
                          transformStyle: 'preserve-3d',
                          transform: showMeaning ? 'rotateY(180deg)' : 'rotateY(0deg)'
                        }}
                      >
                        {/* Fronte */}
                        <div
                          className="absolute inset-0 w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-2xl flex items-center justify-center overflow-hidden"
                          style={{ backfaceVisibility: 'hidden' }}
                        >
                          <div className="text-center text-white p-8">
                            <div className="text-4xl font-bold mb-4">
                              {currentWord.english}
                            </div>
                            <div className="text-lg opacity-80">
                              Clicca per girare la carta
                            </div>
                            <div className="mt-4 opacity-30">
                              <div className="text-2xl font-bold border-2 border-white/30 rounded-lg px-3 py-2 inline-block">
                                EN
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Retro */}
                        <div
                          className={`absolute inset-0 w-full h-full bg-gradient-to-br ${getCategoryStyle(currentWord.group).color} rounded-xl shadow-2xl overflow-hidden`}
                          style={{
                            backfaceVisibility: 'hidden',
                            transform: 'rotateY(180deg)'
                          }}
                        >
                          {currentWord.group && (
                            <div className="absolute top-2 right-2">
                              <div className={`${getCategoryStyle(currentWord.group).bgColor} text-white px-2 py-1 rounded-md text-xs font-medium flex items-center gap-1 shadow-md opacity-80`}>
                                <span className="text-xs">{getCategoryStyle(currentWord.group).icon}</span>
                                <span className="text-xs">{currentWord.group}</span>
                              </div>
                            </div>
                          )}

                          <div className="h-full flex flex-col text-white p-6">
                            {/* Header */}
                            <div className="text-center border-b border-white/30 pb-4 mb-6">
                              <div className="text-2xl font-bold text-white drop-shadow-md">
                                {currentWord.english}
                              </div>
                            </div>

                            {/* Traduzione */}
                            <div className="text-center mb-6">
                              <div
                                className="font-bold text-white drop-shadow-lg leading-tight px-4"
                                style={{
                                  fontSize: currentWord.italian.length > 25 ? '1.75rem' :
                                           currentWord.italian.length > 15 ? '2.25rem' :
                                           currentWord.italian.length > 10 ? '2.75rem' : '3rem'
                                }}
                              >
                                {currentWord.italian}
                              </div>
                            </div>

                            {/* Esempio */}
                            {currentWord.sentence && (
                              <div className="mb-4">
                                <div className="bg-black/40 rounded-xl p-4 backdrop-blur-sm">
                                  <div className="font-bold mb-2 text-sm text-white drop-shadow-sm">💬 Esempio:</div>
                                  <div className="italic text-white drop-shadow-sm text-sm leading-relaxed">"{currentWord.sentence}"</div>
                                </div>
                              </div>
                            )}

                            {/* Note */}
                            {currentWord.notes && (
                              <div className="flex-1 min-h-0">
                                <div className="bg-black/40 rounded-xl p-4 h-full flex flex-col backdrop-blur-sm">
                                  <div className="font-bold mb-2 text-sm text-white drop-shadow-sm">📝 Note:</div>
                                  <div className="overflow-y-auto flex-1 text-sm leading-relaxed whitespace-pre-line break-words pr-2 text-white drop-shadow-sm">
                                    {formatNotes(currentWord.notes)}
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Footer */}
                            <div className="text-center text-sm opacity-85 border-t border-white/30 pt-3 mt-4 text-white drop-shadow-sm">
                              Clicca per tornare al fronte
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Bottoni e istruzioni */}
                  <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 w-full max-w-2xl">
                    <div className="flex justify-center space-x-4 mb-4">
                      {showMeaning ? (
                        <>
                          <Button
                            onClick={() => handleAnswer(true)}
                            className="bg-green-500 hover:bg-green-600 text-white px-6 py-2"
                          >
                            <Check className="w-4 h-4 mr-2" />
                            Sapevo la risposta
                          </Button>
                          <Button
                            onClick={() => handleAnswer(false)}
                            className="bg-red-500 hover:bg-red-600 text-white px-6 py-2"
                          >
                            <X className="w-4 h-4 mr-2" />
                            Non la sapevo
                          </Button>
                        </>
                      ) : (
                        <div className="h-12 flex items-center">
                          <p className="text-lg text-gray-600">Clicca la carta per vedere la traduzione</p>
                        </div>
                      )}
                    </div>

                    <div className="text-center text-gray-600">
                      <p className="text-sm opacity-75">🎯 Cerca di ricordare il significato prima di girare la carta</p>
                    </div>
                  </div>

                </div>
              </div>
            )}

            {/* Controlli test */}
            <div className="flex justify-center">
              <Button onClick={resetTest} variant="outline">
                <RotateCcw className="w-4 h-4 mr-2" />
                Termina Test
              </Button>
            </div>
          </div>
        ) : showResults ? (
          /* Schermata Risultati */
          <Card className={`${getTestResult().bgColor} border-2`}>
            <CardHeader className="text-center">
              <CardTitle className={`text-3xl font-bold ${getTestResult().color}`}>
                {getTestResult().message}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center space-y-4">
                <div className="text-6xl">
                  {getTestResult().type === 'victory' ? '🏆' :
                   getTestResult().type === 'good' ? '👍' : '📚'}
                </div>

                <div className="space-y-2">
                  <div className="text-2xl font-bold">
                    {Math.round((stats.correct / (stats.correct + stats.incorrect)) * 100)}% Corretto
                  </div>
                  <div className="text-lg text-gray-600">
                    {stats.correct} corrette su {stats.correct + stats.incorrect} domande
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
                  <div className="bg-green-100 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{stats.correct}</div>
                    <div className="text-green-700">Corrette</div>
                  </div>
                  <div className="bg-red-100 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-red-600">{stats.incorrect}</div>
                    <div className="text-red-700">Sbagliate</div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-center mt-6">
                  <Button onClick={startNewTest} className="bg-indigo-500 hover:bg-indigo-600 text-white">
                    <Play className="w-4 h-4 mr-2" />
                    Nuovo Test
                  </Button>
                  <Button onClick={resetTest} variant="outline">
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Torna al Menu
                  </Button>
                </div>

                {/* Parole Sbagliate */}
                {wrongWords.length > 0 && (
                  <div className="mt-8 p-6 bg-orange-50 border border-orange-200 rounded-lg">
                    <h3 className="text-xl font-bold text-orange-800 mb-4">
                      📚 Parole da Ripassare ({wrongWords.length})
                    </h3>
                    <p className="text-orange-700 mb-4">
                      Ecco le parole che hai sbagliato. Studiale per il prossimo test!
                    </p>
                    <div className="grid gap-3">
                      {wrongWords.map((word, index) => (
                        <div
                          key={`${word.id}-${index}`}
                          className="flex justify-between items-center p-3 bg-white border border-orange-200 rounded-lg"
                        >
                          <div className="flex-1">
                            <span className="font-bold text-lg text-indigo-800">{word.english}</span>
                            <span className="mx-3 text-orange-500">→</span>
                            <span className="text-gray-700 text-lg">{word.italian}</span>

                            {word.group && (
                              <div className="mt-1">
                                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                                  📂 {word.group}
                                </span>
                              </div>
                            )}

                            {word.sentence && (
                              <div className="mt-2 p-2 bg-green-50 rounded text-xs">
                                <div className="text-green-600 font-semibold">💬 Esempio:</div>
                                <div className="text-green-800 italic">"{word.sentence}"</div>
                              </div>
                            )}

                            {word.notes && (
                              <div className="mt-2 p-2 bg-yellow-50 rounded text-xs">
                                <div className="text-yellow-600 font-semibold">📝 Note:</div>
                                <div className="text-yellow-800 whitespace-pre-line">
                                  {formatNotes(word.notes)}
                                </div>
                              </div>
                            )}
                          </div>
                          <div className="text-orange-500 font-bold">❌</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Navigazione Sezioni */}
            <Card>
              <CardContent className="py-4">
                <div className="flex gap-2 justify-center">
                  <Button
                    onClick={() => setCurrentView('main')}
                    variant={currentView === 'main' ? 'default' : 'outline'}
                    className="flex items-center gap-2"
                  >
                    <Play className="w-4 h-4" />
                    Studio & Vocabolario
                  </Button>
                  <Button
                    onClick={() => setCurrentView('stats')}
                    variant={currentView === 'stats' ? 'default' : 'outline'}
                    className="flex items-center gap-2"
                  >
                    <BarChart3 className="w-4 h-4" />
                    Statistiche ({testHistory.length})
                  </Button>
                </div>
              </CardContent>
            </Card>

            {currentView === 'stats' ? (
              /* Sezione Statistiche */
              <div className="space-y-6">
                {/* Panoramica Statistiche */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="w-5 h-5" />
                      Panoramica Statistiche
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {testHistory.length === 0 ? (
                      <div className="text-center py-12">
                        <div className="text-6xl mb-4">📊</div>
                        <h3 className="text-xl font-bold text-gray-700 mb-2">Nessun test completato</h3>
                        <p className="text-gray-600">Completa il tuo primo test per vedere le statistiche!</p>
                        <Button
                          onClick={() => setCurrentView('main')}
                          className="mt-4"
                        >
                          <Play className="w-4 h-4 mr-2" />
                          Inizia un Test
                        </Button>
                      </div>
                    ) : (
                      <>
                        {/* Cards Statistiche Generali */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                          <div className="bg-blue-50 p-4 rounded-lg text-center">
                            <div className="text-2xl font-bold text-blue-600">{getOverallStats().totalTests}</div>
                            <div className="text-blue-700 text-sm">Test Completati</div>
                          </div>
                          <div className="bg-green-50 p-4 rounded-lg text-center">
                            <div className="text-2xl font-bold text-green-600">{getOverallStats().averageScore}%</div>
                            <div className="text-green-700 text-sm">Punteggio Medio</div>
                          </div>
                          <div className="bg-purple-50 p-4 rounded-lg text-center">
                            <div className="text-2xl font-bold text-purple-600">{getOverallStats().bestScore}%</div>
                            <div className="text-purple-700 text-sm">Miglior Risultato</div>
                          </div>
                          <div className="bg-orange-50 p-4 rounded-lg text-center">
                            <div className="text-2xl font-bold text-orange-600">{getOverallStats().totalWords}</div>
                            <div className="text-orange-700 text-sm">Parole Totali</div>
                          </div>
                        </div>

                        {/* Trend di Miglioramento */}
                        {getOverallStats().improvementTrend !== 0 && (
                          <div className="mb-6 p-4 rounded-lg bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200">
                            <div className="flex items-center gap-3">
                              <TrendingUp className={`w-6 h-6 ${getOverallStats().improvementTrend > 0 ? 'text-green-500' : 'text-red-500'}`} />
                              <div>
                                <div className="font-bold text-lg">
                                  Trend di Miglioramento:
                                  <span className={`ml-2 ${getOverallStats().improvementTrend > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {getOverallStats().improvementTrend > 0 ? '+' : ''}{getOverallStats().improvementTrend}%
                                  </span>
                                </div>
                                <div className="text-gray-600 text-sm">
                                  Confronto tra test recenti e precedenti
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Grafici */}
                        {getChartData().length > 1 && (
                          <div className="space-y-6">
                            {/* Grafico Andamento Punteggio */}
                            <div className="bg-white border rounded-lg p-6">
                              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                <TrendingUp className="w-5 h-5 text-blue-500" />
                                Andamento Punteggio nel Tempo
                              </h3>
                              <ResponsiveContainer width="100%" height={300}>
                                <LineChart data={getChartData()}>
                                  <CartesianGrid strokeDasharray="3 3" />
                                  <XAxis
                                    dataKey="test"
                                    tick={{ fontSize: 12 }}
                                  />
                                  <YAxis
                                    domain={[0, 100]}
                                    tick={{ fontSize: 12 }}
                                  />
                                  <Tooltip
                                    formatter={(value, name) => [`${value}%`, 'Punteggio']}
                                    labelFormatter={(label, payload) => {
                                      const data = payload?.[0]?.payload;
                                      return data ? `${label} - ${data.date} ${data.time}` : label;
                                    }}
                                  />
                                  <Legend />
                                  <Line
                                    type="monotone"
                                    dataKey="percentage"
                                    stroke="#3b82f6"
                                    strokeWidth={3}
                                    dot={{ r: 6 }}
                                    name="Punteggio %"
                                  />
                                </LineChart>
                              </ResponsiveContainer>
                            </div>

                            {/* Grafico Parole Corrette/Sbagliate */}
                            <div className="bg-white border rounded-lg p-6">
                              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                <BarChart3 className="w-5 h-5 text-green-500" />
                                Distribuzione Risposte per Test
                              </h3>
                              <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={getChartData()}>
                                  <CartesianGrid strokeDasharray="3 3" />
                                  <XAxis
                                    dataKey="test"
                                    tick={{ fontSize: 12 }}
                                  />
                                  <YAxis tick={{ fontSize: 12 }} />
                                  <Tooltip
                                    labelFormatter={(label, payload) => {
                                      const data = payload?.[0]?.payload;
                                      return data ? `${label} - ${data.date} ${data.time}` : label;
                                    }}
                                  />
                                  <Legend />
                                  <Bar dataKey="correct" stackId="a" fill="#10b981" name="Corrette" />
                                  <Bar dataKey="incorrect" stackId="a" fill="#ef4444" name="Sbagliate" />
                                </BarChart>
                              </ResponsiveContainer>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </CardContent>
                </Card>

                {/* Cronologia Test */}
                {testHistory.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-5 h-5" />
                          Cronologia Test ({testHistory.length})
                        </div>
                        <Button
                          onClick={() => setConfirmClearHistory(true)}
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Pulisci Cronologia
                        </Button>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3 max-h-96 overflow-y-auto">
                        {testHistory.map((test, index) => (
                          <div
                            key={test.id}
                            className="p-4 bg-gray-50 rounded-lg border hover:bg-gray-100 transition-colors"
                          >
                            <div className="flex justify-between items-start mb-2">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <div className="font-bold text-lg">
                                    Test #{testHistory.length - index}
                                  </div>
                                  <div className={`px-3 py-1 rounded-full text-sm font-bold ${
                                    test.percentage >= 80 ? 'bg-green-100 text-green-700' :
                                    test.percentage >= 60 ? 'bg-blue-100 text-blue-700' :
                                    'bg-red-100 text-red-700'
                                  }`}>
                                    {test.percentage}%
                                  </div>
                                </div>

                                <div className="text-sm text-gray-600 mb-2">
                                  📅 {new Date(test.timestamp).toLocaleDateString('it-IT', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </div>

                                <div className="grid grid-cols-3 gap-4 text-sm">
                                  <div>
                                    <span className="text-blue-600 font-semibold">📊 Totale:</span>
                                    <div>{test.totalWords} parole</div>
                                  </div>
                                  <div>
                                    <span className="text-green-600 font-semibold">✅ Corrette:</span>
                                    <div>{test.correctWords}</div>
                                  </div>
                                  <div>
                                    <span className="text-red-600 font-semibold">❌ Sbagliate:</span>
                                    <div>{test.incorrectWords}</div>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Parole sbagliate nel test */}
                            {test.wrongWords && test.wrongWords.length > 0 && (
                              <div className="mt-3 p-3 bg-red-50 rounded border border-red-200">
                                <div className="text-red-600 font-semibold text-sm mb-2">
                                  Parole sbagliate in questo test:
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  {test.wrongWords.map((word, wordIndex) => (
                                    <span
                                      key={wordIndex}
                                      className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded"
                                    >
                                      {word.english} → {word.italian}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            ) : (
              /* Sezione Principale - Studio & Vocabolario */
              <>
            {/* Controlli */}
            <Card>
              <CardHeader>
                <CardTitle>Controlli</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  <Button onClick={startTest} disabled={words.length === 0}>
                    <Play className="w-4 h-4 mr-2" />
                    Inizia Test ({words.length} parole)
                  </Button>

                  <Button onClick={exportWords} variant="outline" disabled={words.length === 0}>
                    <Copy className="w-4 h-4 mr-2" />
                    Esporta JSON
                  </Button>

                  <Button onClick={importWords} variant="outline">
                    <FileDown className="w-4 h-4 mr-2" />
                    Importa JSON
                  </Button>

                  <Button
                    onClick={clearAllWords}
                    variant="outline"
                    disabled={words.length === 0}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Pulisci Lista
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* JSON Section */}
            <Card>
              <CardHeader
                className="cursor-pointer"
                onClick={() => setShowJsonSection(!showJsonSection)}
              >
                <CardTitle className="flex items-center justify-between">
                  Esporta/Importa JSON
                  {showJsonSection ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </CardTitle>
              </CardHeader>
              {showJsonSection && (
                <CardContent>
                  <div className="space-y-4">
                    <p className="text-sm text-gray-600">
                      📋 Textarea per esportare e importare JSON delle parole
                    </p>
                    <Textarea
                      placeholder="Il JSON delle parole apparirà qui dopo 'Esporta JSON', oppure incolla qui il JSON da importare..."
                      value={jsonText}
                      onChange={(e) => setJsonText(e.target.value)}
                      rows={12}
                      className="font-mono text-sm"
                    />
                  </div>
                </CardContent>
              )}
            </Card>

            {/* Aggiungi/Modifica Parole */}
            <Card data-form-section>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  {editingWord ? (
                    <div className="flex items-center gap-2">
                      <span className="text-blue-600">✏️ Modifica Parola:</span>
                      <span className="text-lg font-bold text-indigo-800">{editingWord.english}</span>
                    </div>
                  ) : (
                    'Aggiungi Nuove Parole'
                  )}
                  <div className="flex gap-2">
                    {editingWord && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearForm}
                        className="text-gray-600 hover:text-gray-800"
                      >
                        ✕ Annulla
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowAdvancedForm(!showAdvancedForm)}
                    >
                      {showAdvancedForm ? 'Forma Semplice' : 'Forma Avanzata'}
                    </Button>
                  </div>
                </CardTitle>
                {editingWord && (
                  <div className="text-sm text-blue-600 bg-blue-50 p-3 rounded-lg">
                    💡 Stai modificando la parola "<strong>{editingWord.english}</strong>".
                    Cambia i campi che vuoi aggiornare e clicca "Salva Modifiche".
                  </div>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      placeholder="Parola inglese *"
                      value={newWordEn}
                      onChange={(e) => setNewWordEn(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addWord()}
                    />
                    <Input
                      placeholder="Traduzione italiana *"
                      value={newWordIt}
                      onChange={(e) => setNewWordIt(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addWord()}
                    />
                  </div>

                  {showAdvancedForm && (
                    <div className="space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <h4 className="font-semibold text-blue-800">📋 Informazioni Aggiuntive</h4>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Gruppo/Categoria */}
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-700">Gruppo/Categoria</label>
                          <select
                            value={newWordGroup}
                            onChange={(e) => setNewWordGroup(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">Nessun gruppo</option>
                            {getPredefinedGroups().map(group => (
                              <option key={group} value={group}>
                                {getCategoryStyle(group).icon} {group}
                              </option>
                            ))}
                          </select>
                        </div>

                        <Input
                          placeholder="Frase d'esempio"
                          value={newWordSentence}
                          onChange={(e) => setNewWordSentence(e.target.value)}
                        />
                      </div>

                      <Textarea
                        placeholder="Note aggiuntive"
                        value={newWordNotes}
                        onChange={(e) => setNewWordNotes(e.target.value)}
                        rows={3}
                      />
                    </div>
                  )}

                  <Button onClick={addWord} className="w-full">
                    {editingWord ? (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        Salva Modifiche
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4 mr-2" />
                        Aggiungi Parola
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Lista Parole */}
            <Card>
              <CardHeader
                className="cursor-pointer"
                onClick={() => setShowWordsList(!showWordsList)}
              >
                <CardTitle className="flex items-center justify-between">
                  Lista Parole ({words.length})
                  {showWordsList ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </CardTitle>
              </CardHeader>
              {showWordsList && (
                <CardContent>
                  {words.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">
                      Nessuna parola presente. Aggiungi parole per iniziare.
                    </p>
                  ) : (
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {words.map((word) => (
                        <div
                          key={word.id}
                          className="p-4 bg-gray-50 rounded-lg border hover:bg-gray-100 transition-colors"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-bold text-lg text-indigo-800">{word.english}</span>
                                <span className="text-gray-400">→</span>
                                <span className="text-gray-700 text-lg">{word.italian}</span>
                              </div>

                              {word.group && (
                                <div className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full inline-block mb-2">
                                  📂 {word.group}
                                </div>
                              )}
                            </div>

                            <div className="flex gap-1">
                              <Button
                                onClick={() => editWord(word)}
                                variant="ghost"
                                size="sm"
                                className="text-blue-500 hover:text-blue-700 hover:bg-blue-50 flex-shrink-0"
                                title="Modifica parola"
                              >
                                <Edit3 className="w-4 h-4" />
                              </Button>
                              <Button
                                onClick={() => removeWord(word.id)}
                                variant="ghost"
                                size="sm"
                                className="text-red-500 hover:text-red-700 hover:bg-red-50 flex-shrink-0"
                                title="Elimina parola"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>

                          {word.sentence && (
                            <div className="mb-2 p-2 bg-green-50 rounded border border-green-200">
                              <div className="text-xs text-green-600 font-semibold">💬 Esempio:</div>
                              <div className="text-sm text-green-800 italic">"{word.sentence}"</div>
                            </div>
                          )}

                          {word.notes && (
                            <div className="p-2 bg-yellow-50 rounded border border-yellow-200">
                              <div className="text-xs text-yellow-600 font-semibold">📝 Note:</div>
                              <div className="text-xs text-yellow-800 whitespace-pre-line">
                                {formatNotes(word.notes)}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              )}
            </Card>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default VocabularyApp;