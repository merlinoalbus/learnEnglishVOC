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
  Area,
  ComposedChart,
  AreaChart,
  Legend
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
  
  // ⭐ ARCHITETTURA CORRETTA: Usa hook integrato con service layer + DATI REALI
  const { 
    calculateChapterAnalysis, 
    getChapterTrend,
    detailedSessions,
    getAllWordsPerformance,
    testHistory,
    isLoading
  } = useStats();
  
  
  // ⭐ CALCOLO ANALISI: Con debounce per evitare re-render eccessivi
  const chapterCalculationResult: ChapterCalculationResult = useMemo(() => {
    const result = calculateChapterAnalysis();
    return result;
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

      {/* ⭐ ENHANCED: Performance Chart with Radar/Spider visualization and correct ordering */}
      <Card className="bg-white dark:bg-gray-800 border-0 shadow-xl rounded-3xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
          <CardTitle className="flex items-center gap-3 text-white">
            <BarChart className="w-6 h-6" />
            Analisi Performance Dettagliata per Capitolo
          </CardTitle>
          <div className="text-blue-100 text-sm space-y-1">
            <p><strong>Logica corretta implementata:</strong> Precisione per parola, Aiuti su precisione, Efficienza media parole, Completamento learned%</p>
            <p>📊 Capitoli ordinati numericamente crescente. Solo capitoli testati mostrati.</p>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {(() => {
            // ⭐ ORDINAMENTO CORRETTO: Numerico crescente
            const sortedTestedChapters = chapterData
              .filter(c => c.hasTests) // Solo capitoli testati
              .sort((a, b) => {
                const aChapter = a.fullChapter === 'Senza Capitolo' ? '999' : a.fullChapter;
                const bChapter = b.fullChapter === 'Senza Capitolo' ? '999' : b.fullChapter;
                
                const aNum = parseInt(aChapter);
                const bNum = parseInt(bChapter);
                
                // Se entrambi sono numeri, ordina numericamente
                if (!isNaN(aNum) && !isNaN(bNum)) {
                  return aNum - bNum;
                }
                
                // Altrimenti ordina alfabeticamente
                return aChapter.localeCompare(bChapter);
              });


            return (
              <>
                {/* Grid di card per ogni capitolo testato */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                  {sortedTestedChapters.map((chapter) => (
                    <Card 
                      key={chapter.fullChapter} 
                      className={`border-2 transition-all duration-300 hover:shadow-lg ${
                        chapter.efficiency >= 75 ? 'border-green-300 bg-green-50 dark:border-green-600 dark:bg-green-900/20' :
                        chapter.efficiency >= 50 ? 'border-blue-300 bg-blue-50 dark:border-blue-600 dark:bg-blue-900/20' :
                        'border-orange-300 bg-orange-50 dark:border-orange-600 dark:bg-orange-900/20'
                      }`}
                    >
                      <CardHeader className={`pb-3 ${
                        chapter.efficiency >= 75 ? 'bg-gradient-to-r from-green-500 to-green-600' :
                        chapter.efficiency >= 50 ? 'bg-gradient-to-r from-blue-500 to-blue-600' :
                        'bg-gradient-to-r from-orange-500 to-orange-600'
                      } text-white`}>
                        <CardTitle className="text-lg flex items-center justify-between">
                          <span>{chapter.chapter}</span>
                          <span className="text-2xl font-bold">{chapter.efficiency}%</span>
                        </CardTitle>
                        <div className="text-sm opacity-90">
                          {chapter.totalWords} parole • {chapter.testedWords} testate
                        </div>
                      </CardHeader>
                      <CardContent className="p-4">
                        {/* Metriche principali */}
                        <div className="space-y-3">
                          {/* Precisione */}
                          <div>
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-sm font-medium">🎯 Precisione</span>
                              <span className="font-bold text-blue-600">{chapter.accuracy}%</span>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                              <div 
                                className="h-2 rounded-full bg-blue-500"
                                style={{ width: `${chapter.accuracy}%` }}
                              ></div>
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              Media precisione {chapter.testedWords} parole testate
                            </div>
                          </div>

                          {/* Aiuti % */}
                          <div>
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-sm font-medium">💡 Aiuti %</span>
                              <span className="font-bold text-orange-600">{chapter.hintsPercentage}%</span>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                              <div 
                                className="h-2 rounded-full bg-orange-500"
                                style={{ width: `${chapter.hintsPercentage}%` }}
                              ></div>
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              Incidenza aiuti su risposte corrette
                            </div>
                          </div>

                          {/* Completamento */}
                          <div>
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-sm font-medium">✅ Completamento</span>
                              <span className="font-bold text-green-600">{chapter.completionRate}%</span>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                              <div 
                                className="h-2 rounded-full bg-green-500"
                                style={{ width: `${chapter.completionRate}%` }}
                              ></div>
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {chapter.learnedWords}/{chapter.totalWords} parole learned
                            </div>
                          </div>

                          {/* Parole non testate */}
                          <div>
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-sm font-medium">⚪ Non Testate</span>
                              <span className="font-bold text-gray-600">{chapter.untestedPercentage}%</span>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                              <div 
                                className="h-2 rounded-full bg-gray-400 dark:bg-gray-500"
                                style={{ width: `${chapter.untestedPercentage}%` }}
                              ></div>
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {chapter.untestedWords}/{chapter.totalWords} mai testate
                            </div>
                          </div>
                        </div>

                        {/* Footer con dettagli */}
                        <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-600">
                          <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 dark:text-gray-400">
                            <div>Tentativi: {chapter.totalAnswers}</div>
                            <div>Difficili: {chapter.difficultWords}</div>
                          </div>
                          <div className={`mt-2 text-xs text-center px-2 py-1 rounded-full ${
                            chapter.efficiency >= 75 ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' :
                            chapter.efficiency >= 50 ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' :
                            'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300'
                          }`}>
                            {chapter.efficiency >= 75 ? '🏆 Eccellente' :
                             chapter.efficiency >= 50 ? '👍 Buono' : '📚 Da migliorare'}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Grafico comparativo per overview rapida */}
                <div className="mt-8">
                  <h4 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-blue-600" />
                    Overview Comparativa (Capitoli Ordinati)
                  </h4>
                  <ResponsiveContainer width="100%" height={300}>
                    <ComposedChart 
                      data={sortedTestedChapters}
                      margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e0e4e7" />
                      <XAxis 
                        dataKey="chapter" 
                        tick={{ fontSize: 11 }}
                        angle={-45}
                        textAnchor="end"
                        height={60}
                      />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                      <Tooltip 
                        formatter={(value, name) => [
                          `${value}%`,
                          name === 'accuracy' ? 'Precisione' :
                          name === 'hintsPercentage' ? 'Aiuti %' :
                          name === 'efficiency' ? 'Efficienza' :
                          name === 'completionRate' ? 'Completamento' :
                          name === 'untestedPercentage' ? 'Non Testate' : name
                        ]}
                        labelFormatter={(label) => `${label}`}
                        contentStyle={{ 
                          backgroundColor: 'var(--tooltip-bg, #f8fafc)', 
                          border: '1px solid var(--tooltip-border, #e2e8f0)',
                          color: 'var(--tooltip-text, #1f2937)'
                        }}
                      />
                      {/* Efficienza come area principale */}
                      <Area 
                        type="monotone" 
                        dataKey="efficiency" 
                        fill="#10b981" 
                        fillOpacity={0.3}
                        stroke="#10b981" 
                        strokeWidth={3}
                        name="efficiency"
                      />
                      {/* Precisione come linea */}
                      <Line 
                        type="monotone" 
                        dataKey="accuracy" 
                        stroke="#3b82f6" 
                        strokeWidth={2}
                        name="accuracy"
                        dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                      />
                      {/* Completamento come linea tratteggiata */}
                      <Line 
                        type="monotone" 
                        dataKey="completionRate" 
                        stroke="#8b5cf6" 
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        name="completionRate"
                        dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 3 }}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                  
                  <div className="mt-4 grid grid-cols-3 gap-4 text-center text-sm">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 bg-green-500 rounded opacity-70"></div>
                      <span>Efficienza (Area)</span>
                    </div>
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 bg-blue-500 rounded"></div>
                      <span>Precisione (Linea)</span>
                    </div>
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-purple-500 bg-white rounded"></div>
                      <span>Completamento (Tratteggiata)</span>
                    </div>
                  </div>
                </div>
              </>
            );
          })()}
        </CardContent>
      </Card>

      {/* ⭐ TREND ANALYSIS: Dati dal service mantenendo layout originale */}
      {selectedChapterForTrend && selectedChapterTrendData.length > 0 && (
        <Card className="bg-white dark:bg-gray-800 border-0 shadow-xl rounded-3xl overflow-hidden">
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

      {/* ⭐ ENHANCED: Smart Insights - Suggerimenti Intelligenti Basati sui Dati */}
      <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border-2 border-indigo-200 dark:border-indigo-700">
        <CardHeader className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
          <CardTitle className="flex items-center gap-3">
            <Target className="w-6 h-6" />
            🧠 Insights Intelligenti & Raccomandazioni
          </CardTitle>
          <div className="text-indigo-100 text-sm">
            Analisi automatica dei tuoi pattern di apprendimento
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {(() => {
            const sortedTestedChapters = chapterData
              .filter(c => c.hasTests)
              .sort((a, b) => {
                const aChapter = a.fullChapter === 'Senza Capitolo' ? '999' : a.fullChapter;
                const bChapter = b.fullChapter === 'Senza Capitolo' ? '999' : b.fullChapter;
                const aNum = parseInt(aChapter);
                const bNum = parseInt(bChapter);
                if (!isNaN(aNum) && !isNaN(bNum)) return aNum - bNum;
                return aChapter.localeCompare(bChapter);
              });

            if (sortedTestedChapters.length === 0) {
              return (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  <Target className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-bold mb-2">Inizia a testare i capitoli</h3>
                  <p>Completa alcuni test per ricevere insights personalizzati</p>
                </div>
              );
            }

            // Calcola insights
            const bestChapter = sortedTestedChapters.reduce((best, chapter) => 
              chapter.efficiency > best.efficiency ? chapter : best
            );
            
            const worstChapter = sortedTestedChapters.reduce((worst, chapter) => 
              chapter.efficiency < worst.efficiency ? chapter : worst
            );

            const highHintChapters = sortedTestedChapters.filter(c => c.hintsPercentage > 40);
            const lowCompletionChapters = sortedTestedChapters.filter(c => c.completionRate < 30);
            const untestedWordsTotal = sortedTestedChapters.reduce((sum, c) => sum + c.untestedWords, 0);
            const avgEfficiency = Math.round(
              sortedTestedChapters.reduce((sum, c) => sum + c.efficiency, 0) / sortedTestedChapters.length
            );

            const insights = [];

            // Insight 1: Performance generale
            if (avgEfficiency >= 75) {
              insights.push({
                type: 'success',
                icon: '🏆',
                title: 'Eccellenti Performance!',
                description: `Efficienza media del ${avgEfficiency}%. Continua così e considera di aumentare la difficoltà.`,
                action: null
              });
            } else if (avgEfficiency >= 50) {
              insights.push({
                type: 'info',
                icon: '📈',
                title: 'Buone Performance',
                description: `Efficienza media del ${avgEfficiency}%. Lavora sulla consistenza per migliorare.`,
                action: `Focus su: ${worstChapter.chapter}`
              });
            } else {
              insights.push({
                type: 'warning',
                icon: '⚠️',
                title: 'Performance da Migliorare',
                description: `Efficienza media del ${avgEfficiency}%. Concentrati sui capitoli con bassa efficienza.`,
                action: `Priorità: ${worstChapter.chapter} (${worstChapter.efficiency}%)`
              });
            }

            // Insight 2: Dipendenza da aiuti
            if (highHintChapters.length > 0) {
              insights.push({
                type: 'warning',
                icon: '💡',
                title: 'Alta Dipendenza da Aiuti',
                description: `${highHintChapters.length} capitoli con aiuti >40%. Prova a rispondere senza aiuti per migliorare l'autonomia.`,
                action: `Capitoli: ${highHintChapters.map(c => c.chapter).join(', ')}`
              });
            } else {
              insights.push({
                type: 'success',
                icon: '🎯',
                title: 'Ottima Autonomia',
                description: 'Uso degli aiuti sotto controllo in tutti i capitoli. Eccellente!',
                action: null
              });
            }

            // Insight 3: Completamento
            if (lowCompletionChapters.length > 0) {
              insights.push({
                type: 'info',
                icon: '✅',
                title: 'Opportunità di Completamento',
                description: `${lowCompletionChapters.length} capitoli con basso completamento. Segna come "learned" le parole che conosci bene.`,
                action: `Focus: ${lowCompletionChapters.map(c => c.chapter).join(', ')}`
              });
            }

            // Insight 4: Parole non testate
            if (untestedWordsTotal > 10) {
              insights.push({
                type: 'info',
                icon: '🎲',
                title: 'Nuove Sfide Disponibili',
                description: `${untestedWordsTotal} parole mai testate. Prova test misti per scoprire nuove parole.`,
                action: 'Crea un test con parole casuali'
              });
            }

            return (
              <div className="space-y-4">
                {insights.map((insight, index) => (
                  <div 
                    key={index}
                    className={`p-4 rounded-xl border-2 ${
                      insight.type === 'success' ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-700' :
                      insight.type === 'warning' ? 'bg-orange-50 border-orange-200 dark:bg-orange-900/20 dark:border-orange-700' :
                      'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-700'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="text-2xl">{insight.icon}</div>
                      <div className="flex-1">
                        <h4 className={`font-bold mb-1 ${
                          insight.type === 'success' ? 'text-green-800 dark:text-green-300' :
                          insight.type === 'warning' ? 'text-orange-800 dark:text-orange-300' :
                          'text-blue-800 dark:text-blue-300'
                        }`}>
                          {insight.title}
                        </h4>
                        <p className={`text-sm mb-2 ${
                          insight.type === 'success' ? 'text-green-700 dark:text-green-400' :
                          insight.type === 'warning' ? 'text-orange-700 dark:text-orange-400' :
                          'text-blue-700 dark:text-blue-400'
                        }`}>
                          {insight.description}
                        </p>
                        {insight.action && (
                          <div className={`text-xs font-medium ${
                            insight.type === 'success' ? 'text-green-600 dark:text-green-400' :
                            insight.type === 'warning' ? 'text-orange-600 dark:text-orange-400' :
                            'text-blue-600 dark:text-blue-400'
                          }`}>
                            💡 {insight.action}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {/* Quick Stats Summary */}
                <div className="mt-6 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-600">
                  <h4 className="font-bold text-gray-800 dark:text-gray-200 mb-3 flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-indigo-600" />
                    Riepilogo Rapido
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{bestChapter.chapter}</div>
                      <div className="text-green-700 dark:text-green-400">Miglior Capitolo</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{bestChapter.efficiency}% efficienza</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">{worstChapter.chapter}</div>
                      <div className="text-orange-700 dark:text-orange-400">Da Migliorare</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{worstChapter.efficiency}% efficienza</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{avgEfficiency}%</div>
                      <div className="text-blue-700 dark:text-blue-400">Media Efficienza</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{sortedTestedChapters.length} capitoli</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">{untestedWordsTotal}</div>
                      <div className="text-purple-700 dark:text-purple-400">Parole da Scoprire</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Mai testate</div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
        </CardContent>
      </Card>

      {/* ⭐ PROFESSIONAL: Deep Analytics Dashboard - Analisi Professionale Approfondita */}
      <Card className="bg-white dark:bg-gray-800 border-0 shadow-xl rounded-3xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-slate-600 to-gray-700 text-white">
          <CardTitle className="flex items-center gap-3 text-white">
            <Target className="w-6 h-6" />
            📊 Analytics Dashboard Professionale
          </CardTitle>
          <div className="text-slate-200 text-sm">
            Analisi statistica approfondita sui pattern di test, copertura delle parole e progressione dell'apprendimento
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {(() => {
            const sortedTestedChapters = chapterData
              .filter(c => c.hasTests)
              .sort((a, b) => {
                const aChapter = a.fullChapter === 'Senza Capitolo' ? '999' : a.fullChapter;
                const bChapter = b.fullChapter === 'Senza Capitolo' ? '999' : b.fullChapter;
                const aNum = parseInt(aChapter);
                const bNum = parseInt(bChapter);
                if (!isNaN(aNum) && !isNaN(bNum)) return aNum - bNum;
                return aChapter.localeCompare(bChapter);
              });

            // ⭐ LOADING STATE: Mostra loading se i dati non sono pronti
            if (isLoading) {
              return (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  <Target className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-bold mb-2">Caricamento analytics...</h3>
                  <p>Caricamento dati per analytics professionali</p>
                </div>
              );
            }
            
            if (sortedTestedChapters.length === 0) {
              return (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  <Target className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-bold mb-2">Analytics non disponibili</h3>
                  <p>Completa alcuni test per accedere alle analytics professionali</p>
                </div>
              );
            }


            // ⭐ DATI DAL SERVICE: Usa calculateChapterAnalysis per ottenere tutti i dati
            const { analytics, sessionStats } = calculateChapterAnalysis();
            const realAnalyticsData = analytics.processedData.filter((c: any) => c.hasTests);
            const realStats = sessionStats;

            return (
              <div className="space-y-8">
                
                {/* ⭐ 1. EXECUTIVE SUMMARY - DATI REALI */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 rounded-xl border border-blue-200 dark:border-blue-700">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">{realStats.totalSessions}</div>
                      <div className="text-blue-600 dark:text-blue-400 font-medium">Sessioni Test Reali</div>
                      <div className="text-xs text-blue-500 dark:text-blue-400 mt-1">Totale effettivo</div>
                    </div>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 rounded-xl border border-green-200 dark:border-green-700">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-700 dark:text-green-300">{realStats.avgWordsPerSession}</div>
                      <div className="text-green-600 dark:text-green-400 font-medium">Parole per Sessione</div>
                      <div className="text-xs text-green-500 dark:text-green-400 mt-1">Media reale dal timing</div>
                    </div>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/30 rounded-xl border border-purple-200 dark:border-purple-700">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">{realStats.avgTimePerWord}s</div>
                      <div className="text-purple-600 dark:text-purple-400 font-medium">Tempo per Parola</div>
                      <div className="text-xs text-purple-500 dark:text-purple-400 mt-1">Dai tempi effettivi</div>
                    </div>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/30 dark:to-orange-800/30 rounded-xl border border-orange-200 dark:border-orange-700">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-700 dark:text-orange-300">{realStats.preferredTimeSlot}</div>
                      <div className="text-orange-600 dark:text-orange-400 font-medium">Orario Preferito</div>
                      <div className="text-xs text-orange-500 dark:text-orange-400 mt-1">Pattern temporale reale</div>
                    </div>
                  </div>
                </div>

                {/* ⭐ 2. ANALISI REALE DELLE PERFORMANCE - Dati dal DB */}
                <div>
                  <h4 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
                    <BookOpen className="w-6 h-6 text-slate-600 dark:text-slate-400" />
                    Analisi Performance Reale per Capitolo (Dai Dati di Test)
                  </h4>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    
                    {/* Grafico Performance Reali */}
                    <div>
                      <h5 className="font-bold text-gray-700 dark:text-gray-300 mb-3">📈 Coverage vs Difficoltà Reale</h5>
                      <ResponsiveContainer width="100%" height={300}>
                        <ComposedChart data={realAnalyticsData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis 
                            dataKey="chapter" 
                            tick={{ fontSize: 10 }}
                            angle={-45}
                            textAnchor="end"
                            height={60}
                          />
                          <YAxis 
                            yAxisId="left" 
                            domain={[0, 100]} 
                            label={{ value: 'Percentuale (%)', angle: -90, position: 'insideLeft' }}
                            tick={{ fill: '#666' }}
                          />
                          <YAxis 
                            yAxisId="right" 
                            orientation="right" 
                            domain={[0, 'dataMax + 2']} 
                            label={{ value: 'Test per Parola', angle: 90, position: 'insideRight' }}
                            tick={{ fill: '#8b5cf6' }}
                          />
                          <Tooltip 
                            formatter={(value, name) => [
                              name === 'precisionRate' ? `${value}%` : 
                              name === 'hintDependency' ? `${value}%` :
                              name === 'coverageRate' ? `${value}%` :
                              name === 'testsPerWord' ? `${value} test/parola` : value,
                              name === 'precisionRate' ? 'Precisione' :
                              name === 'hintDependency' ? 'Aiuti %' :
                              name === 'coverageRate' ? 'Copertura' :
                              name === 'testsPerWord' ? 'Test per Parola' : name
                            ]}
                            labelFormatter={(label) => `${label}`}
                          />
                          <Legend 
                            formatter={(value: string) => {
                              switch(value) {
                                case 'completionRate': return 'Completamento (%)';
                                case 'accuracy': return 'Precisione (%)';
                                case 'hintsPercentage': return 'Aiuti (%)';
                                case 'efficiency': return 'Efficienza (%)';
                                default: return value;
                              }
                            }}
                          />
                          <Bar yAxisId="left" dataKey="coverageRate" fill="#3b82f6" name="coverageRate" opacity={0.8} />
                          <Line 
                            yAxisId="left" 
                            type="monotone" 
                            dataKey="precisionRate" 
                            stroke="#10b981" 
                            strokeWidth={3} 
                            name="precisionRate"
                            dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                            activeDot={{ r: 6 }}
                          />
                          <Line 
                            yAxisId="left" 
                            type="monotone" 
                            dataKey="hintDependency" 
                            stroke="#f59e0b" 
                            strokeWidth={2} 
                            name="hintDependency"
                            dot={{ fill: '#f59e0b', strokeWidth: 2, r: 3 }}
                            activeDot={{ r: 5 }}
                          />
                          <Line 
                            yAxisId="right" 
                            type="monotone" 
                            dataKey="testsPerWord" 
                            stroke="#8b5cf6" 
                            strokeWidth={2} 
                            strokeDasharray="5 5" 
                            name="testsPerWord"
                            dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 3 }}
                            activeDot={{ r: 5 }}
                          />
                        </ComposedChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Tabella Dettagli REALI */}
                    <div>
                      <h5 className="font-bold text-gray-700 dark:text-gray-300 mb-3">📊 Metriche Reali</h5>
                      <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 max-h-80 overflow-y-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="text-xs text-gray-600 dark:text-gray-400 border-b dark:border-gray-600">
                              <th className="text-left py-2">Capitolo</th>
                              <th className="text-center py-2">Copertura</th>
                              <th className="text-center py-2">Precisione</th>
                              <th className="text-center py-2">Aiuti</th>
                              <th className="text-center py-2">Test/Parola</th>
                            </tr>
                          </thead>
                          <tbody>
                            {realAnalyticsData.map((item: any, index: number) => (
                              <tr key={item.fullChapter} className={index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-700'}>
                                <td className="py-2 font-medium">{item.chapter}</td>
                                <td className="text-center py-2">
                                  <span className={`font-bold ${
                                    item.coverageRate >= 70 ? 'text-green-600' :
                                    item.coverageRate >= 30 ? 'text-blue-600' : 'text-red-600'
                                  }`}>
                                    {item.coverageRate}%
                                  </span>
                                  <div className="text-xs text-gray-500 dark:text-gray-400">{item.uniqueWordsTested}/{item.totalVocabularyWords}</div>
                                </td>
                                <td className="text-center py-2">
                                  <span className={`font-bold ${
                                    item.precisionRate >= 80 ? 'text-green-600' :
                                    item.precisionRate >= 60 ? 'text-blue-600' : 'text-red-600'
                                  }`}>
                                    {item.precisionRate}%
                                  </span>
                                  <div className="text-xs text-gray-500 dark:text-gray-400">{item.totalAttempts} tent.</div>
                                </td>
                                <td className="text-center py-2">
                                  <span className={`font-bold ${
                                    item.hintDependency <= 30 ? 'text-green-600' :
                                    item.hintDependency <= 60 ? 'text-orange-600' : 'text-red-600'
                                  }`}>
                                    {item.hintDependency}%
                                  </span>
                                  <div className="text-xs text-gray-500 dark:text-gray-400">{item.hintsUsed} hint</div>
                                </td>
                                <td className="text-center py-2">
                                  <span className={`font-bold ${
                                    item.testsPerWord <= 2 ? 'text-green-600' :
                                    item.testsPerWord <= 4 ? 'text-blue-600' : 'text-orange-600'
                                  }`}>
                                    {item.testsPerWord}
                                  </span>
                                  <div className="text-xs text-gray-500 dark:text-gray-400">test/parola</div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ⭐ 3. INSIGHTS REALI DAL DATABASE - Analisi Pattern Comportamentali */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Pattern Comportamentali Reali */}
                  <div className="p-6 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl border border-indigo-200 dark:border-indigo-700">
                    <h5 className="font-bold text-indigo-800 dark:text-indigo-300 mb-4 flex items-center gap-2">
                      <TrendingUp className="w-5 h-5" />
                      Pattern Comportamentali Rilevati
                    </h5>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between items-center">
                        <span>🕐 Preferenza oraria studio:</span>
                        <span className="font-bold text-orange-600">{realStats.preferredTimeSlot}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>⚡ Sessioni intensive (≥15 parole):</span>
                        <span className="font-bold text-green-600">{realStats.sessionIntensity.intensive}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>📚 Sessioni medie (8-14 parole):</span>
                        <span className="font-bold text-blue-600">{realStats.sessionIntensity.medium}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>🔍 Sessioni leggere (&lt;8 parole):</span>
                        <span className="font-bold text-gray-600">{realStats.sessionIntensity.light}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>⏱️ Tempo medio per parola:</span>
                        <span className="font-bold text-purple-600">{realStats.avgTimePerWord}s</span>
                      </div>
                    </div>
                  </div>

                  {/* Raccomandazioni Basate su Dati Reali */}
                  <div className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl border border-green-200 dark:border-green-700">
                    <h5 className="font-bold text-green-800 dark:text-green-300 mb-4 flex items-center gap-2">
                      <Award className="w-5 h-5" />
                      Raccomandazioni Data-Driven
                    </h5>
                    <div className="space-y-3 text-sm text-green-700 dark:text-green-400">
                      {realAnalyticsData.filter((c: any) => c.coverageRate < 50).length > 0 && (
                        <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded border border-yellow-300 dark:border-yellow-700">
                          <strong>🎯 Copertura Bassa:</strong> {realAnalyticsData.filter((c: any) => c.coverageRate < 50).length} capitoli 
                          hanno copertura &lt;50%. Focus su più parole.
                        </div>
                      )}
                      {realAnalyticsData.filter((c: any) => c.hintDependency > 60).length > 0 && (
                        <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded border border-orange-300 dark:border-orange-700">
                          <strong>💡 Dipendenza Aiuti:</strong> {realAnalyticsData.filter((c: any) => c.hintDependency > 60).length} capitoli 
                          usano molti aiuti. Prova senza aiuti.
                        </div>
                      )}
                      {realStats.avgTimePerWord > 10 && (
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded border border-blue-300 dark:border-blue-700">
                          <strong>⏱️ Velocità:</strong> {realStats.avgTimePerWord}s/parola è sopra media. 
                          Esercitati per risposte più rapide.
                        </div>
                      )}
                      {realStats.sessionIntensity.intensive > realStats.sessionIntensity.light && (
                        <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded border border-green-300 dark:border-green-700">
                          <strong>✅ Pattern Positivo:</strong> Preferisci sessioni intensive. 
                          Ottimo per consolidamento memoria!
                        </div>
                      )}
                      {realAnalyticsData.filter((c: any) => c.precisionRate < 60).length > 0 && (
                        <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded border border-red-300 dark:border-red-700">
                          <strong>⏰ Bassa Precisione:</strong> {realAnalyticsData.filter((c: any) => c.precisionRate < 60).length} capitoli 
                          hanno precisione &lt;60%. Rivedere approccio.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
        </CardContent>
      </Card>
    </div>
  );
};

export default ChaptersSection;