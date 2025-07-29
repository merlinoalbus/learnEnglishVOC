// =====================================================
// 📊 src/components/stats/sections/ChaptersSection.tsx - REFACTORED
// Architettura: DB → types → services → hooks → components
// =====================================================

import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Line,
  ComposedChart
} from 'recharts';
import { BookOpen, TrendingUp, Award, Target, Info } from 'lucide-react';
import { useStats } from '../../../hooks/data/useStats';
import type { 
  ChapterCalculationResult,
  ChapterTrendData
} from '../../../types/entities/Test.types';

interface ChaptersSectionProps {
  // Il componente è puramente presentational
  // I dati vengono automaticamente dagli hooks che si collegano al DB
}

const ChaptersSection: React.FC<ChaptersSectionProps> = () => {
  const [selectedChapterForTrend, setSelectedChapterForTrend] = useState<string | null>(null);
  
  // ⭐ ARCHITETTURA CORRETTA: Usa hook integrato con service layer
  const { calculateChapterAnalysis, getChapterTrend } = useStats();
  
  // ⭐ CALCOLO ANALISI: Service layer gestisce tutta la business logic automaticamente
  const chapterCalculationResult: ChapterCalculationResult = useMemo(() => {
    return calculateChapterAnalysis();
  }, [calculateChapterAnalysis]);
  
  const { analysis, overviewStats, topChapters, strugglingChapters } = chapterCalculationResult;
  const { processedData: chapterData } = analysis;

  // ⭐ TREND DATA: Service layer gestisce il calcolo cronologico
  const selectedChapterTrendData: ChapterTrendData[] = useMemo(() => {
    if (!selectedChapterForTrend) {
      return [];
    }
    return getChapterTrend(selectedChapterForTrend);
  }, [selectedChapterForTrend, getChapterTrend]);

  // ⭐ DATI PRONTI: Service layer ha già calcolato tutto
  // overviewStats, topChapters, strugglingChapters vengono dal ChapterCalculationResult

  return (
    <div className="space-y-8">
      
      {/* ⭐ OVERVIEW CARDS: Dati dal service mantenendo layout originale */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <CardContent className="p-4 text-center">
            <BookOpen className="w-8 h-8 mx-auto mb-2" />
            <div className="text-2xl font-bold">{overviewStats.totalChapters}</div>
            <div className="text-blue-100 text-sm">Capitoli Totali</div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
          <CardContent className="p-4 text-center">
            <Award className="w-8 h-8 mx-auto mb-2" />
            <div className="text-2xl font-bold">{overviewStats.bestEfficiency}%</div>
            <div className="text-green-100 text-sm">Miglior Efficienza</div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <CardContent className="p-4 text-center">
            <Target className="w-8 h-8 mx-auto mb-2" />
            <div className="text-2xl font-bold">{overviewStats.averageCompletion}%</div>
            <div className="text-purple-100 text-sm">Completamento Medio</div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
          <CardContent className="p-4 text-center">
            <TrendingUp className="w-8 h-8 mx-auto mb-2" />
            <div className="text-2xl font-bold">{overviewStats.testedChapters}</div>
            <div className="text-orange-100 text-sm">Capitoli Testati</div>
          </CardContent>
        </Card>
      </div>

      {/* ⭐ PERFORMANCE CHART: Dati dal service mantenendo layout originale */}
      <Card className="bg-white border-0 shadow-xl rounded-3xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
          <CardTitle className="flex items-center gap-3 text-white">
            <BarChart className="w-6 h-6" />
            Analisi Performance Dettagliata per Capitolo
          </CardTitle>
          <div className="text-blue-100 text-sm space-y-1">
            <p><strong>Efficienza = Precisione - Aiuti utilizzati.</strong> Verde = Ottimo, Giallo = Buono, Rosso = Da migliorare</p>
            <p>📊 Aiuti stimati proporzionalmente dai test. Capitoli ordinati per primo test cronologico.</p>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <ResponsiveContainer width="100%" height={400}>
            <ComposedChart 
              data={chapterData.filter(c => c.testsPerformed > 0)} 
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e4e7" />
              <XAxis dataKey="chapter" tick={{ fontSize: 12 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
              <Tooltip 
                formatter={(value, name) => [
                  `${value}%`,
                  name === 'accuracy' ? 'Precisione' :
                  name === 'hintsPercentage' ? 'Aiuti Stimati' :
                  name === 'efficiency' ? 'Efficienza Netta' :
                  name === 'completionRate' ? 'Completamento' : name
                ]}
                labelFormatter={(label) => `Capitolo: ${label}`}
                contentStyle={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}
                labelStyle={{ fontWeight: 'bold' }}
              />
              <Bar dataKey="accuracy" fill="#3b82f6" name="accuracy" />
              <Bar dataKey="hintsPercentage" fill="#f59e0b" name="hintsPercentage" />
              <Bar dataKey="efficiency" fill="#10b981" name="efficiency" />
              <Line type="monotone" dataKey="completionRate" stroke="#8b5cf6" strokeWidth={3} name="completionRate" />
            </ComposedChart>
          </ResponsiveContainer>
          
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-center text-sm">
            <div className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 bg-blue-500 rounded"></div>
              <span>Precisione %</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 bg-yellow-500 rounded"></div>
              <span>Aiuti Stimati %</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 bg-green-500 rounded"></div>
              <span>Efficienza Netta</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 bg-purple-500 rounded"></div>
              <span>Completamento</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ⭐ TREND ANALYSIS: Dati dal service mantenendo layout originale */}
      {selectedChapterForTrend && selectedChapterTrendData.length > 0 && (
        <Card className="bg-white border-0 shadow-xl rounded-3xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-green-500 to-emerald-500 text-white">
            <CardTitle className="flex items-center gap-3 text-white">
              <TrendingUp className="w-6 h-6" />
              Andamento Temporale: {selectedChapterForTrend === 'Senza Capitolo' ? 'Senza Cap.' : `Cap. ${selectedChapterForTrend}`}
            </CardTitle>
            <div className="flex items-center gap-4 text-sm text-green-100">
              <span>Ultimi {selectedChapterTrendData.length} test del capitolo (cronologici)</span>
              <span>•</span>
              <span>
                Dal {selectedChapterTrendData[0]?.date} al {selectedChapterTrendData[selectedChapterTrendData.length - 1]?.date}
              </span>
              <button 
                onClick={() => setSelectedChapterForTrend(null)}
                className="px-3 py-1 bg-white/20 rounded-full hover:bg-white/30 transition-colors"
              >
                ✕ Chiudi
              </button>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={selectedChapterTrendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 11 }}
                  angle={-45}
                  textAnchor="end"
                  height={70}
                />
                <YAxis domain={[0, 100]} />
                <Tooltip 
                  labelFormatter={(label, payload) => {
                    if (payload && payload.length > 0) {
                      return `Data: ${payload[0].payload.fullDate}`;
                    }
                    return `Data: ${label}`;
                  }}
                  formatter={(value, name) => [
                    name === 'accuracy' ? `${value}%` : value,
                    name === 'accuracy' ? 'Precisione' :
                    name === 'correct' ? 'Corrette' :
                    name === 'incorrect' ? 'Sbagliate' : name
                  ]}
                />
                <Line 
                  type="monotone" 
                  dataKey="accuracy" 
                  stroke="#3b82f6" 
                  strokeWidth={3}
                  name="accuracy"
                  dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                />
                <Bar dataKey="correct" fill="#10b981" name="correct" opacity={0.7} />
                <Bar dataKey="incorrect" fill="#ef4444" name="incorrect" opacity={0.7} />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* ⭐ PERFORMANCE COMPARISON: Dati dal service mantenendo layout originale */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Top Performing */}
        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200">
          <CardHeader className="bg-gradient-to-r from-green-500 to-emerald-500 text-white">
            <CardTitle className="flex items-center gap-3">
              <Award className="w-6 h-6" />
              🏆 Top Capitoli Performer
            </CardTitle>
            <div className="flex items-center gap-2 text-green-100">
              <Info className="w-4 h-4" />
              <span className="text-sm">Efficienza = Precisione - % Aiuti Stimati</span>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              {topChapters.length > 0 ? topChapters.map((chapter, index) => (
                <div key={chapter.fullChapter} className="flex items-center justify-between p-4 bg-white rounded-xl border border-green-200">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                      index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : 'bg-orange-500'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-bold text-gray-800">{chapter.chapter}</div>
                      <div className="text-sm text-gray-600">
                        {chapter.totalWords} parole • {chapter.testsPerformed} test • {chapter.totalAnswers} risposte
                      </div>
                      <div className="text-xs text-gray-500">
                        Precisione: {chapter.accuracy}% • Aiuti: {chapter.hintsPercentage}%
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-green-600">{chapter.efficiency}%</div>
                    <div className="text-sm text-green-700">Efficienza</div>
                  </div>
                </div>
              )) : (
                <div className="text-center py-8 text-gray-500">
                  <p>Nessun capitolo testato ancora</p>
                  <p className="text-sm">Completa alcuni test per vedere i top performer</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Struggling Chapters */}
        <Card className="bg-gradient-to-br from-orange-50 to-red-50 border-2 border-orange-200">
          <CardHeader className="bg-gradient-to-r from-orange-500 to-red-500 text-white">
            <CardTitle className="flex items-center gap-3">
              <Target className="w-6 h-6" />
              📚 Capitoli da Migliorare
            </CardTitle>
            <div className="text-orange-100 text-sm">
              Capitoli con almeno 3 test e bassa efficienza
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              {strugglingChapters.length > 0 ? strugglingChapters.map((chapter, index) => (
                <div key={chapter.fullChapter} className="p-4 bg-white rounded-xl border border-orange-200">
                  <div className="flex items-center justify-between mb-3">
                    <div className="font-bold text-gray-800">{chapter.chapter}</div>
                    <div className="text-xl font-bold text-red-600">{chapter.efficiency}%</div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2 text-sm mb-3">
                    <div className="text-center">
                      <div className="font-bold text-blue-600">{chapter.accuracy}%</div>
                      <div className="text-blue-700 text-xs">Precisione</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-orange-600">{chapter.hintsPercentage}%</div>
                      <div className="text-orange-700 text-xs">Aiuti Stimati</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-purple-600">{chapter.difficultyRate}%</div>
                      <div className="text-purple-700 text-xs">Difficili</div>
                    </div>
                  </div>
                  
                  <div className="text-xs text-gray-600 mb-2">
                    {chapter.totalAnswers} risposte in {chapter.testsPerformed} test • 
                    Aiuti stimati: {chapter.estimatedHints}
                  </div>
                  
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <p className="text-xs text-orange-800">
                      💡 <strong>Suggerimento:</strong> 
                      {chapter.hintsPercentage > 30 ? ' Riduci l\'uso degli aiuti.' : ''}
                      {chapter.difficultyRate > 50 ? ' Ripassa le parole difficili.' : ''}
                      {chapter.accuracy < 60 ? ' Concentrati su questo capitolo.' : ''}
                      {chapter.hintsPercentage <= 30 && chapter.difficultyRate <= 50 && chapter.accuracy >= 60 ? ' Continua così, stai migliorando!' : ''}
                    </p>
                  </div>
                </div>
              )) : (
                <div className="text-center py-8 text-gray-500">
                  <p>Nessun capitolo in difficoltà</p>
                  <p className="text-sm">Ottimo lavoro! Tutti i capitoli testati hanno buone performance</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ⭐ ENHANCED: Detailed Chapter Breakdown with Interactive Trend */}
      <Card className="bg-white border-0 shadow-xl rounded-3xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white">
          <CardTitle className="flex items-center gap-3 text-white">
            <BookOpen className="w-6 h-6" />
            Analisi Dettagliata Tutti i Capitoli
          </CardTitle>
          <div className="text-indigo-100 text-sm">
            Clicca su un capitolo per vedere l'andamento temporale • Ordinati per primo test cronologico
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-2 font-bold">Capitolo</th>
                  <th className="text-center py-3 px-2 font-bold">Parole</th>
                  <th className="text-center py-3 px-2 font-bold">Test</th>
                  <th className="text-center py-3 px-2 font-bold">Risposte</th>
                  <th className="text-center py-3 px-2 font-bold">Precisione</th>
                  <th className="text-center py-3 px-2 font-bold">Aiuti Est.</th>
                  <th className="text-center py-3 px-2 font-bold">Efficienza</th>
                  <th className="text-center py-3 px-2 font-bold">Completamento</th>
                  <th className="text-center py-3 px-2 font-bold">Status</th>
                </tr>
              </thead>
              <tbody>
                {chapterData.map((chapter, index) => (
                  <tr 
                    key={chapter.fullChapter} 
                    className={`border-b border-gray-100 transition-colors ${
                      index % 2 === 0 ? 'bg-gray-50' : 'bg-white'
                    } ${
                      chapter.testsPerformed > 0 ? 'hover:bg-blue-50 cursor-pointer' : ''
                    } ${
                      selectedChapterForTrend === chapter.fullChapter ? 'bg-blue-100 border-blue-300' : ''
                    }`}
                    onClick={() => {
                      if (chapter.testsPerformed > 0) {
                        setSelectedChapterForTrend(
                          selectedChapterForTrend === chapter.fullChapter ? null : chapter.fullChapter as any
                        );
                      }
                    }}
                  >
                    <td className="py-3 px-2 font-medium">{chapter.chapter}</td>
                    <td className="text-center py-3 px-2">
                      <span className="inline-flex items-center gap-1">
                        {chapter.totalWords}
                        {chapter.difficultWords > 0 && (
                          <span className="text-xs bg-red-100 text-red-700 px-1 rounded">
                            {chapter.difficultWords}⭐
                          </span>
                        )}
                      </span>
                    </td>
                    <td className="text-center py-3 px-2">{chapter.testsPerformed}</td>
                    <td className="text-center py-3 px-2">
                      <span className="text-xs">
                        {chapter.totalAnswers}
                        {chapter.testsPerformed > 0 && (
                          <div className="text-gray-500">
                            ({Math.round(chapter.totalAnswers / chapter.testsPerformed)}/test)
                          </div>
                        )}
                      </span>
                    </td>
                    <td className="text-center py-3 px-2">
                      <span className={`font-bold ${
                        chapter.accuracy >= 80 ? 'text-green-600' : 
                        chapter.accuracy >= 60 ? 'text-blue-600' : 'text-red-600'
                      }`}>
                        {chapter.accuracy}%
                      </span>
                    </td>
                    <td className="text-center py-3 px-2">
                      <span className={`font-bold ${
                        chapter.hintsPercentage <= 20 ? 'text-green-600' : 
                        chapter.hintsPercentage <= 40 ? 'text-orange-600' : 'text-red-600'
                      }`}>
                        {chapter.hintsPercentage}%
                      </span>
                      <div className="text-xs text-gray-500">
                        ({chapter.estimatedHints})
                      </div>
                    </td>
                    <td className="text-center py-3 px-2">
                      <span className={`font-bold ${
                        chapter.efficiency >= 70 ? 'text-green-600' : 
                        chapter.efficiency >= 50 ? 'text-orange-600' : 'text-red-600'
                      }`}>
                        {chapter.efficiency}%
                      </span>
                    </td>
                    <td className="text-center py-3 px-2">
                      <div className="flex items-center justify-center">
                        <div className="w-12 bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${
                              chapter.completionRate >= 80 ? 'bg-green-500' : 
                              chapter.completionRate >= 50 ? 'bg-blue-500' : 'bg-orange-500'
                            }`}
                            style={{ width: `${Math.min(100, chapter.completionRate)}%` }}
                          ></div>
                        </div>
                        <span className="ml-2 text-xs font-bold">{chapter.completionRate}%</span>
                      </div>
                    </td>
                    <td className="text-center py-3 px-2">
                      {chapter.testsPerformed === 0 ? (
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">Non testato</span>
                      ) : chapter.efficiency >= 70 ? (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">🏆 Eccellente</span>
                      ) : chapter.efficiency >= 50 ? (
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">👍 Buono</span>
                      ) : (
                        <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full">📚 Da migliorare</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {chapterData.some(c => c.testsPerformed > 0) && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-800">
                💡 <strong>Suggerimento:</strong> Clicca su un capitolo testato per visualizzare il suo andamento temporale dettagliato.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ChaptersSection;