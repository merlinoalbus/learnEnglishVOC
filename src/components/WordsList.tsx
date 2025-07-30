// =====================================================
// 📁 src/components/WordsList.tsx - TypeScript Migration
// =====================================================

import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Plus, Trash2, Edit3, ChevronDown, ChevronUp, BookOpen, CheckCircle, Circle, Filter, AlertTriangle, Eye, EyeOff } from 'lucide-react';
import { Word } from '../types/entities/Word.types';

// =====================================================
// 🔧 TYPES & INTERFACES
// =====================================================

interface WordListProps {
  words: Word[];
  onEditWord: (word: Word) => void;
  onRemoveWord: (wordId: string) => void;
  onToggleLearned: (wordId: string) => void;
  onToggleDifficult: (wordId: string) => void;
  showWordsList: boolean;
  setShowWordsList: (show: boolean) => void;
}

interface WordCardProps {
  word: Word;
  onEdit: () => void;
  onRemove: () => void;
  onToggleLearned: () => void;
  onToggleDifficult: () => void;
}

interface CategoryStyle {
  icon: string;
  bgColor: string;
}

interface WordStats {
  total: number;
  learned: number;
  notLearned: number;
  difficult: number;
  withChapter: number;
  filtered: number;
}

type FilterLearned = 'all' | 'learned' | 'not_learned';
type FilterDifficult = 'all' | 'difficult' | 'not_difficult';

// =====================================================
// 🎨 UTILITY FUNCTIONS
// =====================================================

const getCategoryStyle = (group?: string): CategoryStyle => {
  const categoryMap: Record<string, CategoryStyle> = {
    'VERBI': { icon: '⚡', bgColor: 'bg-red-500' },
    'VERBI_IRREGOLARI': { icon: '🔄', bgColor: 'bg-red-600' },
    'SOSTANTIVI': { icon: '🏷️', bgColor: 'bg-blue-500' },
    'AGGETTIVI': { icon: '🎨', bgColor: 'bg-green-500' },
    'FAMIGLIA': { icon: '👨‍👩‍👧‍👦', bgColor: 'bg-pink-400' },
    'TECNOLOGIA': { icon: '💻', bgColor: 'bg-cyan-500' },
    'LAVORO': { icon: '💼', bgColor: 'bg-indigo-500' },
    'DEFAULT': { icon: '📚', bgColor: 'bg-gray-500' }
  };
  return categoryMap[group?.toUpperCase() || 'DEFAULT'] || categoryMap['DEFAULT'];
};

const formatNotes = (notes?: string): React.ReactNode => {
  if (!notes) return null;
  
  const keywords = ['Altri Significati', 'Sinonimi', 'Verbo Irregolare', 'Pronuncia', 'Esempi'];
  let formattedText = notes;
  
  keywords.forEach(keyword => {
    const regex = new RegExp(`(${keyword})\\s*:`, 'gi');
    formattedText = formattedText.replace(regex, `**$1:**`);
  });
  
  return formattedText.split(/(\*\*[^*]+\*\*)/).map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <span key={index} className="font-bold">{part.slice(2, -2)}</span>;
    }
    return part;
  });
};

// =====================================================
// 🃏 WORD CARD COMPONENT - COMPATTO ED ESPANDIBILE
// =====================================================

const WordCard: React.FC<WordCardProps> = ({ word, onEdit, onRemove, onToggleLearned, onToggleDifficult }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Conteggi per preview compatto
  const sentencesCount = word.sentences?.length || 0;
  const synonymsCount = word.synonyms?.length || 0;
  const antonymsCount = word.antonyms?.length || 0;
  const hasExtraContent = sentencesCount > 0 || synonymsCount > 0 || antonymsCount > 0 || word.notes;

  return (
    <div className={`rounded-2xl border-2 hover:shadow-lg transition-all duration-300 ${
      word.learned 
        ? 'bg-gradient-to-r from-green-50 to-emerald-50 dark:bg-gradient-to-r dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-700' 
        : word.difficult
          ? 'bg-gradient-to-r from-red-50 to-orange-50 dark:bg-gradient-to-r dark:from-red-900/20 dark:to-orange-900/20 border-red-200 dark:border-red-700'
          : 'bg-gradient-to-r from-white to-gray-50 dark:bg-gradient-to-r dark:from-gray-800 dark:to-gray-900 border-gray-100 dark:border-gray-700 hover:border-gray-200 dark:hover:border-gray-600'
    }`}>
      <div className="p-4">
        {/* Header Compatto - Sempre Visibile */}
        <div className="flex justify-between items-center">
          {/* Info Principale */}
          <div className="flex items-center gap-3 flex-1">
            <span className={`words-list-title ${
              word.learned ? 'opacity-75' : ''
            }`}>
              {word.english}
            </span>
            <span className="text-gray-600 dark:text-gray-400">→</span>
            <span className={`text-lg font-medium ${word.learned ? 'text-gray-600 dark:text-gray-400' : 'text-gray-900 dark:text-gray-100'}`}>
              {word.italian}
            </span>
            
            {/* Status Icons Compact */}
            <div className="flex items-center gap-1 ml-2">
              <div onClick={onToggleLearned} className="cursor-pointer" title={word.learned ? "Segna come non appresa" : "Segna come appresa"}>
                {word.learned ? (
                  <CheckCircle className="w-5 h-5 text-green-500 hover:text-green-600 transition-colors" />
                ) : (
                  <Circle className="w-5 h-5 text-gray-600 dark:text-gray-400 hover:text-green-500 transition-colors" />
                )}
              </div>
              <div onClick={onToggleDifficult} className="cursor-pointer" title={word.difficult ? "Rimuovi da parole difficili" : "Segna come difficile"}>
                {word.difficult ? (
                  <AlertTriangle className="w-5 h-5 text-red-500 hover:text-red-600 transition-colors fill-current" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-gray-600 dark:text-gray-400 hover:text-red-500 transition-colors" />
                )}
              </div>
            </div>
          </div>

          {/* Actions Compatte */}
          <div className="flex items-center gap-1">
            {/* Content Preview Badges */}
            {hasExtraContent && (
              <div className="flex items-center gap-1 mr-3">
                {sentencesCount > 0 && (
                  <span className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300 border">
                    💬 {sentencesCount}
                  </span>
                )}
                {synonymsCount > 0 && (
                  <span className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border">
                    🔄 {synonymsCount}
                  </span>
                )}
                {antonymsCount > 0 && (
                  <span className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 border">
                    ↔️ {antonymsCount}
                  </span>
                )}
                {word.notes && (
                  <span className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border">
                    📝
                  </span>
                )}
              </div>
            )}

            {/* Expand/Collapse Button */}
            {hasExtraContent && (
              <Button
                onClick={() => setIsExpanded(!isExpanded)}
                variant="ghost"
                size="sm"
                className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:text-gray-100"
                title={isExpanded ? "Chiudi dettagli" : "Mostra dettagli"}
              >
                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </Button>
            )}

            <Button onClick={onEdit} variant="ghost" size="sm" className="p-2 text-blue-500 hover:text-blue-700" title="Modifica">
              <Edit3 className="w-4 h-4" />
            </Button>
            <Button onClick={onRemove} variant="ghost" size="sm" className="p-2 text-red-500 hover:text-red-700" title="Elimina">
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Tags compatti - Sempre visibili */}
        <div className="flex flex-wrap gap-1 mt-2">
          {word.group && (
            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium text-white ${getCategoryStyle(word.group).bgColor}`}>
              <span>{getCategoryStyle(word.group).icon}</span>
              {word.group}
            </span>
          )}
          {word.chapter && (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300">
              <BookOpen className="w-3 h-3" />
              Cap. {word.chapter}
            </span>
          )}
          {word.learned && (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300">
              <CheckCircle className="w-3 h-3" />
              Appresa
            </span>
          )}
          {word.difficult && (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300">
              <AlertTriangle className="w-3 h-3" />
              Difficile
            </span>
          )}
        </div>
      </div>

      {/* Contenuto Espandibile */}
      {isExpanded && hasExtraContent && (
        <div className="border-t border-gray-200 mt-4">
          <div className="p-4 space-y-4">
            {/* Frasi di Contesto */}
            {word.sentences && word.sentences.length > 0 && (
              <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-700">
                <div className="text-green-600 dark:text-green-400 font-semibold text-sm mb-2 flex items-center gap-2">
                  <span>💬</span> Frasi di Contesto ({word.sentences.length}):
                </div>
                <div className="space-y-1">
                  {word.sentences.map((sentence, index) => (
                    <div key={index} className="text-green-800 dark:text-green-300 italic text-sm">
                      {index + 1}. "{sentence}"
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Sinonimi */}
            {word.synonyms && word.synonyms.length > 0 && (
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-700">
                <div className="text-blue-600 dark:text-blue-400 font-semibold text-sm mb-2 flex items-center gap-2">
                  <span>🔄</span> Sinonimi ({word.synonyms.length}):
                </div>
                <div className="flex flex-wrap gap-2">
                  {word.synonyms.map((synonym, index) => (
                    <span key={index} className="inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700">
                      {synonym}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Contrari */}
            {word.antonyms && word.antonyms.length > 0 && (
              <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-200 dark:border-purple-700">
                <div className="text-purple-600 dark:text-purple-400 font-semibold text-sm mb-2 flex items-center gap-2">
                  <span>↔️</span> Contrari ({word.antonyms.length}):
                </div>
                <div className="flex flex-wrap gap-2">
                  {word.antonyms.map((antonym, index) => (
                    <span key={index} className="inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-700">
                      {antonym}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Note */}
            {word.notes && (
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-700">
                <div className="text-blue-600 dark:text-blue-400 font-semibold text-sm mb-1 flex items-center gap-2">
                  <span>📝</span> Note:
                </div>
                <div className="text-blue-800 dark:text-blue-300 text-sm whitespace-pre-line">
                  {formatNotes(word.notes)}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// =====================================================
// 🎯 MAIN COMPONENT
// =====================================================

const WordsList: React.FC<WordListProps> = ({ 
  words, 
  onEditWord, 
  onRemoveWord, 
  onToggleLearned, 
  onToggleDifficult, 
  showWordsList, 
  setShowWordsList 
}) => {
  const [filterChapter, setFilterChapter] = useState<string>('');
  const [filterLearned, setFilterLearned] = useState<FilterLearned>('all');
  const [filterDifficult, setFilterDifficult] = useState<FilterDifficult>('all');
  const [filterGroup, setFilterGroup] = useState<string>('');
  const [collapsedChapters, setCollapsedChapters] = useState<Set<string>>(new Set());

  // Calcolo dati derivati all'inizio per evitare problemi di scope
  const availableChapters = useMemo(() => {
    const chapters = new Set<string>();
    words.forEach(word => {
      if (word.chapter) chapters.add(word.chapter);
    });
    return Array.from(chapters).sort((a, b) => {
      const aNum = parseInt(a);
      const bNum = parseInt(b);
      return !isNaN(aNum) && !isNaN(bNum) ? aNum - bNum : a.localeCompare(b);
    });
  }, [words]);

  const availableGroups = useMemo(() => {
    const groups = new Set<string>();
    words.forEach(word => {
      if (word.group) groups.add(word.group);
    });
    return Array.from(groups).sort();
  }, [words]);

  // ⭐ FIX: Inizializza tutti i capitoli come chiusi SOLO al primo caricamento
  useEffect(() => {
    if (availableChapters.length > 0 && collapsedChapters.size === 0) {
      setCollapsedChapters(new Set(availableChapters));
    }
  }, [availableChapters.length]); // Solo quando il numero di capitoli cambia, non il contenuto

  // Funzione per toggleare il collasso dei capitoli
  const toggleChapterCollapse = (chapter: string) => {
    const newCollapsed = new Set(collapsedChapters);
    if (newCollapsed.has(chapter)) {
      newCollapsed.delete(chapter);
    } else {
      newCollapsed.add(chapter);
    }
    setCollapsedChapters(newCollapsed);
  };

  const wordsWithoutChapter = useMemo(() => {
    return words.filter(word => !word.chapter);
  }, [words]);

  // Filtra le parole includendo filtro difficoltà
  const filteredWords = useMemo(() => {
    return words.filter(word => {
      // Filtro per capitolo
      if (filterChapter !== '') {
        if (filterChapter === 'no-chapter') {
          if (word.chapter) return false;
        } else {
          if (word.chapter !== filterChapter) return false;
        }
      }
      
      // Filtro per gruppo
      if (filterGroup && word.group !== filterGroup) return false;
      
      // Filtro per stato appreso
      if (filterLearned === 'learned' && !word.learned) return false;
      if (filterLearned === 'not_learned' && word.learned) return false;
      
      // Filtro per stato difficile
      if (filterDifficult === 'difficult' && !word.difficult) return false;
      if (filterDifficult === 'not_difficult' && word.difficult) return false;
      
      return true;
    });
  }, [words, filterChapter, filterGroup, filterLearned, filterDifficult]);

  // Raggruppa le parole per capitolo
  const groupedWords = useMemo(() => {
    return filteredWords.reduce((groups, word) => {
      const chapter = word.chapter || 'Senza Capitolo';
      if (!groups[chapter]) groups[chapter] = [];
      groups[chapter].push(word);
      return groups;
    }, {} as Record<string, Word[]>);
  }, [filteredWords]);

  // Statistiche con parole difficili
  const stats: WordStats = useMemo(() => ({
    total: words.length,
    learned: words.filter(w => w.learned).length,
    notLearned: words.filter(w => !w.learned).length,
    difficult: words.filter(w => w.difficult).length,
    withChapter: words.filter(w => w.chapter).length,
    filtered: filteredWords.length
  }), [words, filteredWords]);

  const clearFilters = () => {
    setFilterChapter('');
    setFilterLearned('all');
    setFilterDifficult('all');
    setFilterGroup('');
  };

  return (
    <Card className="backdrop-blur-sm bg-white/90 dark:bg-gray-800/90 border-0 dark:border-0 shadow-xl rounded-3xl overflow-hidden mb-12">
      <CardHeader 
        className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors" 
        onClick={() => setShowWordsList(!showWordsList)}
      >
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📚</span>
            <div className="flex flex-col">
              <span className="words-list-header-title">
                Il Tuo Vocabolario ({stats.total} parole)
              </span>
              <div className="flex gap-4 text-sm text-gray-600 dark:text-gray-400 mt-1">
                <span>✅ {stats.learned} apprese</span>
                <span>📖 {stats.notLearned} da studiare</span>
                <span>⭐ {stats.difficult} difficili</span>
                <span>📚 {stats.withChapter} con capitolo</span>
              </div>
            </div>
          </div>
          {showWordsList ? <ChevronUp className="w-5 h-5 text-gray-400 dark:text-gray-600 dark:text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400 dark:text-gray-600 dark:text-gray-400" />}
        </CardTitle>
      </CardHeader>
      
      {showWordsList && (
        <CardContent className="animate-fade-in">
          {words.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-8xl mb-6">📚</div>
              <h3 className="words-list-empty-title mb-4">Il tuo vocabolario è vuoto</h3>
              <p className="text-gray-600 dark:text-gray-600 dark:text-gray-400 text-lg mb-8">Aggiungi la tua prima parola per iniziare a studiare!</p>
              <div className="flex justify-center">
                <Button className="words-list-add-button">
                  <Plus className="w-5 h-5 mr-2" />
                  Aggiungi Prima Parola
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Filtri con difficoltà */}
              <Card className="words-list-filter-card">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Filter className="w-5 h-5 text-blue-600 dark:text-purple-400" />
                    Filtri ({stats.filtered} parole mostrate)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-900 dark:text-gray-100 mb-2 block">Capitolo</label>
                      <select
                        value={filterChapter}
                        onChange={(e) => setFilterChapter(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:border-blue-500 dark:focus:border-blue-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                      >
                        <option value="">Tutti i capitoli</option>
                        {availableChapters.map(chapter => (
                          <option key={chapter} value={chapter}>📖 {chapter}</option>
                        ))}
                        {wordsWithoutChapter.length > 0 && (
                          <option value="no-chapter">📋 Senza capitolo</option>
                        )}
                      </select>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-900 dark:text-gray-100 mb-2 block">Stato Apprendimento</label>
                      <select
                        value={filterLearned}
                        onChange={(e) => setFilterLearned(e.target.value as FilterLearned)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:border-blue-500 dark:focus:border-blue-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                      >
                        <option value="all">Tutte le parole</option>
                        <option value="learned">✅ Solo apprese</option>
                        <option value="not_learned">📖 Solo da studiare</option>
                      </select>
                    </div>
                    
                    {/* Filtro difficoltà */}
                    <div>
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-900 dark:text-gray-100 mb-2 block">Difficoltà</label>
                      <select
                        value={filterDifficult}
                        onChange={(e) => setFilterDifficult(e.target.value as FilterDifficult)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:border-blue-500 dark:focus:border-blue-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                      >
                        <option value="all">Tutte le parole</option>
                        <option value="difficult">⭐ Solo difficili</option>
                        <option value="not_difficult">📚 Solo normali</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-900 dark:text-gray-100 mb-2 block">Categoria</label>
                      <select
                        value={filterGroup}
                        onChange={(e) => setFilterGroup(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:border-blue-500 dark:focus:border-blue-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                      >
                        <option value="">Tutte le categorie</option>
                        {availableGroups.map(group => (
                          <option key={group} value={group}>
                            {getCategoryStyle(group).icon} {group}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="flex items-end">
                      <Button 
                        onClick={clearFilters}
                        variant="outline"
                        className="w-full"
                      >
                        Cancella Filtri
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Statistiche Generali con difficoltà */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-200 dark:border-blue-700">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.total}</div>
                  <div className="text-blue-700 dark:text-blue-300 text-sm">Totale Parole</div>
                </div>
                <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-2xl border border-green-200 dark:border-green-700">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.learned}</div>
                  <div className="text-green-700 dark:text-green-300 text-sm">Apprese</div>
                </div>
                <div className="text-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-2xl border border-orange-200 dark:border-orange-700">
                  <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">{stats.notLearned}</div>
                  <div className="text-orange-700 dark:text-orange-300 text-sm">Da Studiare</div>
                </div>
                <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-2xl border border-red-200 dark:border-red-700">
                  <div className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.difficult}</div>
                  <div className="text-red-700 dark:text-red-300 text-sm">⭐ Difficili</div>
                </div>
                <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-2xl border border-purple-200 dark:border-purple-700">
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{availableChapters.length}</div>
                  <div className="text-purple-700 dark:text-purple-300 text-sm">Capitoli</div>
                </div>
              </div>

              {/* Lista Parole Raggruppate per Capitolo */}
              <div className="space-y-6 max-h-96 overflow-y-auto custom-scrollbar">
                {Object.entries(groupedWords)
                  .sort(([a], [b]) => {
                    if (a === 'Senza Capitolo') return 1;
                    if (b === 'Senza Capitolo') return -1;
                    const aNum = parseInt(a);
                    const bNum = parseInt(b);
                    return !isNaN(aNum) && !isNaN(bNum) ? aNum - bNum : a.localeCompare(b);
                  })
                  .map(([chapter, chapterWords]) => {
                    const isCollapsed = collapsedChapters.has(chapter);
                    return (
                      <div key={chapter} className="space-y-3">
                        {/* Header Capitolo Enhanced - Cliccabile */}
                        <div 
                          className="words-list-chapter-section cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors rounded-lg p-3"
                          onClick={() => toggleChapterCollapse(chapter)}
                        >
                          <div className="flex items-center gap-3">
                            {isCollapsed ? (
                              <ChevronDown className="w-5 h-5 text-indigo-600 dark:text-purple-400" />
                            ) : (
                              <ChevronUp className="w-5 h-5 text-indigo-600 dark:text-purple-400" />
                            )}
                            <BookOpen className="w-5 h-5 text-indigo-600 dark:text-purple-400" />
                            <h3 className="words-list-chapter-title">
                              {chapter === 'Senza Capitolo' ? '📋 Senza Capitolo' : `📖 Capitolo ${chapter}`}
                            </h3>
                            <span className="text-sm text-indigo-600 dark:text-blue-300 bg-indigo-200 dark:bg-blue-900/20 px-3 py-1 rounded-full">
                              {chapterWords.length} parole
                            </span>
                            <span className="text-sm text-green-600 dark:text-green-300 bg-green-200 dark:bg-green-900/20 px-3 py-1 rounded-full">
                              {chapterWords.filter(w => w.learned).length} apprese
                            </span>
                            {/* Difficili counter */}
                            <span className="text-sm text-red-600 dark:text-red-300 bg-red-200 dark:bg-red-900/20 px-3 py-1 rounded-full">
                              {chapterWords.filter(w => w.difficult).length} difficili
                            </span>
                          </div>
                        </div>
                        
                        {/* Parole del Capitolo - Collassabili */}
                        {!isCollapsed && (
                          <div className="space-y-3 animate-fade-in">
                            {chapterWords.map((word) => (
                              <WordCard 
                                key={word.id} 
                                word={word} 
                                onEdit={() => onEditWord(word)}
                                onRemove={() => onRemoveWord(word.id)}
                                onToggleLearned={() => onToggleLearned(word.id)}
                                onToggleDifficult={() => onToggleDifficult(word.id)}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
};

export default WordsList;