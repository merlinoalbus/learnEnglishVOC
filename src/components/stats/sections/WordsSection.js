import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Input } from '../../ui/input';
import { Search } from 'lucide-react';
import { useAppContext } from '../../../contexts/AppContext';
import WordPerformanceCard from '../components/WordPerformanceCard';
import WordDetailSection from '../components/WordDetailSection';

const WordsSection = ({ localRefresh }) => {
  const [searchWord, setSearchWord] = useState('');
  const [selectedChapter, setSelectedChapter] = useState('all');
  const [selectedWordId, setSelectedWordId] = useState(null);

  const { getAllWordsPerformance, getWordAnalysis } = useAppContext();

  const wordsData = React.useMemo(() => {
    if (!getAllWordsPerformance) return [];
    
    const wordsPerformance = getAllWordsPerformance();
    return wordsPerformance.filter(word => {
      if (searchWord && !word.english.toLowerCase().includes(searchWord.toLowerCase())) {
        return false;
      }
      if (selectedChapter !== 'all' && word.chapter !== selectedChapter) {
        return false;
      }
      return true;
    });
  }, [getAllWordsPerformance, searchWord, selectedChapter]);

  const availableChapters = [...new Set(wordsData.map(w => w.chapter).filter(Boolean))].sort();

  return (
    <div className="space-y-8" key={`words-${localRefresh}`}>
      {/* Search and Filter */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">🔍 Cerca Parola</label>
              <Input
                placeholder="Scrivi la parola inglese..."
                value={searchWord}
                onChange={(e) => setSearchWord(e.target.value)}
                className="border-2 border-blue-300 rounded-xl focus:border-blue-500"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">📚 Filtra per Capitolo</label>
              <select
                value={selectedChapter}
                onChange={(e) => setSelectedChapter(e.target.value)}
                className="w-full px-3 py-2 border-2 border-blue-300 rounded-xl focus:border-blue-500 bg-white"
              >
                <option value="all">Tutti i capitoli</option>
                {availableChapters.map(chapter => (
                  <option key={chapter} value={chapter}>📖 {chapter}</option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Words Performance List */}
      <Card className="bg-white border-0 shadow-xl rounded-3xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white">
          <CardTitle className="flex items-center gap-3 text-white">
            <Search className="w-6 h-6" />
            Performance Parole ({wordsData.length} parole)
          </CardTitle>
          <p className="text-indigo-100 text-sm">Clicca su una parola per vedere il grafico dell'andamento temporale</p>
        </CardHeader>
        <CardContent className="p-6">
          {wordsData.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-6xl mb-4">🔍</div>
              <p className="text-gray-600">Nessuna parola trovata con i filtri attuali</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {wordsData.map((word) => (
                <WordPerformanceCard 
                  key={word.wordId} 
                  word={word} 
                  isSelected={selectedWordId === word.wordId}
                  onClick={() => setSelectedWordId(selectedWordId === word.wordId ? null : word.wordId)}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Selected Word Detail */}
      {selectedWordId && (
        <WordDetailSection 
          wordId={selectedWordId}
          getWordAnalysis={getWordAnalysis}
          localRefresh={localRefresh}
        />
      )}
    </div>
  );
};

export default WordsSection;