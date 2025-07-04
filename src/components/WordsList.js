import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Plus, Trash2, Edit3, ChevronDown, ChevronUp, BookOpen, CheckCircle, Circle, Filter, AlertTriangle } from 'lucide-react';

// Simulated utility functions (replace with your actual imports)
const getCategoryStyle = (group) => {
  const categoryMap = {
    'VERBI': { icon: '⚡', bgColor: 'bg-red-500' },
    'VERBI_IRREGOLARI': { icon: '🔄', bgColor: 'bg-red-600' },
    'SOSTANTIVI': { icon: '🏷️', bgColor: 'bg-blue-500' },
    'AGGETTIVI': { icon: '🎨', bgColor: 'bg-green-500' },
    'FAMIGLIA': { icon: '👨‍👩‍👧‍👦', bgColor: 'bg-pink-400' },
    'TECNOLOGIA': { icon: '💻', bgColor: 'bg-cyan-500' },
    'LAVORO': { icon: '💼', bgColor: 'bg-indigo-500' },
    'DEFAULT': { icon: '📚', bgColor: 'bg-gray-500' }
  };
  return categoryMap[group?.toUpperCase()] || categoryMap['DEFAULT'];
};

const formatNotes = (notes) => {
  if (!notes) return null;
  const keywords = ['Altri Significati', 'Sinonimi', 'Verbo Irregolare', 'Pronuncia', 'Esempi'];
  let formattedText = notes;
  keywords.forEach(keyword => {
    const regex = new RegExp(`(${keyword})\\s*:`, 'gi');
    formattedText = formattedText.replace(regex, `**$1:**`);
  });
  
  return formattedText.split(/(\*\*[^*]+\*\*)/).map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return React.createElement('span', { key: index, className: 'font-bold' }, part.slice(2, -2));
    }
    return part;
  });
};

const WordsList = ({ words, onEditWord, onRemoveWord, onToggleLearned, onToggleDifficult, showWordsList, setShowWordsList }) => {
  const [filterChapter, setFilterChapter] = useState('');
  const [filterLearned, setFilterLearned] = useState('all'); // 'all', 'learned', 'not_learned'
  const [filterDifficult, setFilterDifficult] = useState('all'); // ⭐ NEW: 'all', 'difficult', 'not_difficult'
  const [filterGroup, setFilterGroup] = useState('');

  // Calcolo dati derivati all'inizio per evitare problemi di scope
  const availableChapters = React.useMemo(() => {
    const chapters = new Set();
    words.forEach(word => {
      if (word.chapter) chapters.add(word.chapter);
    });
    return Array.from(chapters).sort((a, b) => {
      const aNum = parseInt(a);
      const bNum = parseInt(b);
      return !isNaN(aNum) && !isNaN(bNum) ? aNum - bNum : a.localeCompare(b);
    });
  }, [words]);

  const availableGroups = React.useMemo(() => {
    const groups = new Set();
    words.forEach(word => {
      if (word.group) groups.add(word.group);
    });
    return Array.from(groups).sort();
  }, [words]);

  const wordsWithoutChapter = React.useMemo(() => {
    return words.filter(word => !word.chapter);
  }, [words]);

  // ⭐ ENHANCED: Filtra le parole includendo filtro difficoltà
  const filteredWords = words.filter(word => {
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
    
    // ⭐ NEW: Filtro per stato difficile
    if (filterDifficult === 'difficult' && !word.difficult) return false;
    if (filterDifficult === 'not_difficult' && word.difficult) return false;
    
    return true;
  });

  // Raggruppa le parole per capitolo
  const groupedWords = filteredWords.reduce((groups, word) => {
    const chapter = word.chapter || 'Senza Capitolo';
    if (!groups[chapter]) groups[chapter] = [];
    groups[chapter].push(word);
    return groups;
  }, {});

  // ⭐ ENHANCED: Statistiche con parole difficili
  const stats = {
    total: words.length,
    learned: words.filter(w => w.learned).length,
    notLearned: words.filter(w => !w.learned).length,
    difficult: words.filter(w => w.difficult).length, // ⭐ NEW
    withChapter: words.filter(w => w.chapter).length,
    filtered: filteredWords.length
  };

  const clearFilters = () => {
    setFilterChapter('');
    setFilterLearned('all');
    setFilterDifficult('all'); // ⭐ NEW
    setFilterGroup('');
  };

  return (
    <Card className="backdrop-blur-sm bg-white/90 border-0 shadow-xl rounded-3xl overflow-hidden">
      <CardHeader 
        className="cursor-pointer hover:bg-gray-50 transition-colors" 
        onClick={() => setShowWordsList(!showWordsList)}
      >
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📚</span>
            <div className="flex flex-col">
              <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Il Tuo Vocabolario ({stats.total} parole)
              </span>
              <div className="flex gap-4 text-sm text-gray-600 mt-1">
                <span>✅ {stats.learned} apprese</span>
                <span>📖 {stats.notLearned} da studiare</span>
                <span>⭐ {stats.difficult} difficili</span> {/* ⭐ NEW */}
                <span>📚 {stats.withChapter} con capitolo</span>
              </div>
            </div>
          </div>
          {showWordsList ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
        </CardTitle>
      </CardHeader>
      
      {showWordsList && (
        <CardContent className="animate-fade-in">
          {words.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-8xl mb-6">📚</div>
              <h3 className="text-2xl font-bold text-gray-700 mb-4">Il tuo vocabolario è vuoto</h3>
              <p className="text-gray-600 text-lg mb-8">Aggiungi la tua prima parola per iniziare a studiare!</p>
              <div className="flex justify-center">
                <Button className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white px-8 py-4 text-lg rounded-2xl shadow-xl">
                  <Plus className="w-5 h-5 mr-2" />
                  Aggiungi Prima Parola
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* ⭐ ENHANCED: Filtri con difficoltà */}
              <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Filter className="w-5 h-5 text-blue-600" />
                    Filtri ({stats.filtered} parole mostrate)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">Capitolo</label>
                      <select
                        value={filterChapter}
                        onChange={(e) => setFilterChapter(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 bg-white"
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
                      <label className="text-sm font-medium text-gray-700 mb-2 block">Stato Apprendimento</label>
                      <select
                        value={filterLearned}
                        onChange={(e) => setFilterLearned(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 bg-white"
                      >
                        <option value="all">Tutte le parole</option>
                        <option value="learned">✅ Solo apprese</option>
                        <option value="not_learned">📖 Solo da studiare</option>
                      </select>
                    </div>
                    
                    {/* ⭐ NEW: Filtro difficoltà */}
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">Difficoltà</label>
                      <select
                        value={filterDifficult}
                        onChange={(e) => setFilterDifficult(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 bg-white"
                      >
                        <option value="all">Tutte le parole</option>
                        <option value="difficult">⭐ Solo difficili</option>
                        <option value="not_difficult">📚 Solo normali</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">Categoria</label>
                      <select
                        value={filterGroup}
                        onChange={(e) => setFilterGroup(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 bg-white"
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

              {/* ⭐ ENHANCED: Statistiche Generali con difficoltà */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-2xl border border-blue-200">
                  <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
                  <div className="text-blue-700 text-sm">Totale Parole</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-2xl border border-green-200">
                  <div className="text-2xl font-bold text-green-600">{stats.learned}</div>
                  <div className="text-green-700 text-sm">Apprese</div>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-2xl border border-orange-200">
                  <div className="text-2xl font-bold text-orange-600">{stats.notLearned}</div>
                  <div className="text-orange-700 text-sm">Da Studiare</div>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-2xl border border-red-200">
                  <div className="text-2xl font-bold text-red-600">{stats.difficult}</div>
                  <div className="text-red-700 text-sm">⭐ Difficili</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-2xl border border-purple-200">
                  <div className="text-2xl font-bold text-purple-600">{availableChapters.length}</div>
                  <div className="text-purple-700 text-sm">Capitoli</div>
                </div>
              </div>

              {/* Lista Parole Raggruppate per Capitolo */}
              <div className="space-y-6 max-h-96 overflow-y-auto scrollbar-thin">
                {Object.entries(groupedWords)
                  .sort(([a], [b]) => {
                    if (a === 'Senza Capitolo') return 1;
                    if (b === 'Senza Capitolo') return -1;
                    const aNum = parseInt(a);
                    const bNum = parseInt(b);
                    return !isNaN(aNum) && !isNaN(bNum) ? aNum - bNum : a.localeCompare(b);
                  })
                  .map(([chapter, chapterWords]) => (
                    <div key={chapter} className="space-y-3">
                      {/* Header Capitolo Enhanced */}
                      <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-indigo-100 to-purple-100 rounded-2xl border border-indigo-200">
                        <BookOpen className="w-5 h-5 text-indigo-600" />
                        <h3 className="font-bold text-indigo-800 text-lg">
                          {chapter === 'Senza Capitolo' ? '📋 Senza Capitolo' : `📖 Capitolo ${chapter}`}
                        </h3>
                        <span className="text-sm text-indigo-600 bg-indigo-200 px-3 py-1 rounded-full">
                          {chapterWords.length} parole
                        </span>
                        <span className="text-sm text-green-600 bg-green-200 px-3 py-1 rounded-full">
                          {chapterWords.filter(w => w.learned).length} apprese
                        </span>
                        {/* ⭐ NEW: Difficili counter */}
                        <span className="text-sm text-red-600 bg-red-200 px-3 py-1 rounded-full">
                          {chapterWords.filter(w => w.difficult).length} difficili
                        </span>
                      </div>
                      
                      {/* Parole del Capitolo */}
                      <div className="space-y-3">
                        {chapterWords.map((word) => (
                          <WordCard 
                            key={word.id} 
                            word={word} 
                            onEdit={() => onEditWord(word)}
                            onRemove={() => onRemoveWord(word.id)}
                            onToggleLearned={() => onToggleLearned(word.id)}
                            onToggleDifficult={() => onToggleDifficult(word.id)} // ⭐ NEW
                          />
                        ))}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
};

// ⭐ ENHANCED: WordCard con gestione difficoltà
const WordCard = ({ word, onEdit, onRemove, onToggleLearned, onToggleDifficult }) => (
  <div className={`p-6 rounded-2xl border-2 hover:shadow-lg transition-all duration-300 hover-lift ${
    word.learned 
      ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200' 
      : word.difficult
        ? 'bg-gradient-to-r from-red-50 to-orange-50 border-red-200'
        : 'bg-gradient-to-r from-white to-gray-50 border-gray-100 hover:border-gray-200'
  }`}>
    <div className="flex justify-between items-start">
      <div className="flex-1">
        <div className="flex items-center gap-3 mb-3">
          <span className={`text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent ${
            word.learned ? 'opacity-75' : ''
          }`}>
            {word.english}
          </span>
          <span className="text-gray-400 text-xl">→</span>
          <span className={`text-xl font-medium ${
            word.learned ? 'text-gray-600' : 'text-gray-700'
          }`}>
            {word.italian}
          </span>
          
          {/* Stato Appreso */}
          <div 
            onClick={onToggleLearned}
            className="cursor-pointer"
            title={word.learned ? "Segna come non appresa" : "Segna come appresa"}
          >
            {word.learned ? (
              <CheckCircle className="w-6 h-6 text-green-500 hover:text-green-600 transition-colors" />
            ) : (
              <Circle className="w-6 h-6 text-gray-400 hover:text-green-500 transition-colors" />
            )}
          </div>
          
          {/* ⭐ NEW: Stato Difficile */}
          <div 
            onClick={onToggleDifficult}
            className="cursor-pointer"
            title={word.difficult ? "Rimuovi da parole difficili" : "Segna come difficile"}
          >
            {word.difficult ? (
              <AlertTriangle className="w-6 h-6 text-red-500 hover:text-red-600 transition-colors fill-current" />
            ) : (
              <AlertTriangle className="w-6 h-6 text-gray-400 hover:text-red-500 transition-colors" />
            )}
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2 mb-3">
          {word.group && (
            <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium text-white shadow-lg ${getCategoryStyle(word.group).bgColor}`}>
              <span>{getCategoryStyle(word.group).icon}</span>
              {word.group}
            </span>
          )}
          
          {word.chapter && (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-700">
              <BookOpen className="w-4 h-4" />
              Cap. {word.chapter}
            </span>
          )}
          
          {word.learned && (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-700">
              <CheckCircle className="w-4 h-4" />
              Appresa
            </span>
          )}
          
          {/* ⭐ NEW: Badge parola difficile */}
          {word.difficult && (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-700">
              <AlertTriangle className="w-4 h-4" />
              ⭐ Difficile
            </span>
          )}
        </div>

        {word.sentence && (
          <div className="mb-3 p-4 bg-green-50 rounded-xl border border-green-200">
            <div className="text-green-600 font-semibold text-sm mb-1 flex items-center gap-2">
              <span>💬</span> Esempio:
            </div>
            <div className="text-green-800 italic">"{word.sentence}"</div>
          </div>
        )}

        {word.notes && (
          <div className="p-4 bg-yellow-50 rounded-xl border border-yellow-200">
            <div className="text-yellow-600 font-semibold text-sm mb-1 flex items-center gap-2">
              <span>📝</span> Note:
            </div>
            <div className="text-yellow-800 text-sm whitespace-pre-line">
              {formatNotes(word.notes)}
            </div>
          </div>
        )}
      </div>
      
      <div className="flex gap-2 ml-4">
        <Button
          onClick={onEdit}
          variant="ghost"
          size="sm"
          className="text-blue-500 hover:text-blue-700 hover:bg-blue-50 p-3 rounded-xl transition-colors"
          title="Modifica parola"
        >
          <Edit3 className="w-5 h-5" />
        </Button>
        <Button
          onClick={onRemove}
          variant="ghost"
          size="sm"
          className="text-red-500 hover:text-red-700 hover:bg-red-50 p-3 rounded-xl transition-colors"
          title="Elimina parola"
        >
          <Trash2 className="w-5 h-5" />
        </Button>
      </div>
    </div>
  </div>
);

export default WordsList;
