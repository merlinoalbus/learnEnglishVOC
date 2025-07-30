// ===================================================== 
// 📁 src/components/stats/components/WordDetailSection.tsx - REFACTORED Presentation Only
// =====================================================
import React, { useMemo } from 'react';
import type { Word, TestHistoryItem } from '../../../types';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card'; 
import { Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ComposedChart, Bar } from 'recharts'; 
import { Award, TrendingUp, Target, X } from 'lucide-react';
import TimelineReconstructionService from '../../../services/TimelineReconstructionService';

interface WordDetailSectionProps {
  wordId: string;
  getWordAnalysis: (wordId: string) => any;
  testHistory: TestHistoryItem[];
  wordInfo: any;
  localRefresh: number | string;
  wordPerformance?: Record<string, any>; // ⭐ NUOVO: Dati performance dalla collezione
  onClose?: () => void; // ⭐ NUOVO: Funzione per chiudere il componente
}

interface AttemptData {
  timestamp: string;
  correct: boolean;
  usedHint: boolean;
  timeSpent: number;
  testId?: string;
}

interface ChartDataPoint {
  attempt: string;
  attemptNumber: number;
  success: number;
  globalPrecision: number;
  hint: number;
  time: number;
  fullDate: string;
  isCorrect: boolean;
  usedHint: boolean;
  timestamp: string;
  hintsInThisTest?: number;
  totalHintsForWord?: number;
}

interface TooltipPayload {
  payload: ChartDataPoint;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayload[];
  label?: string;
}

const WordDetailSection: React.FC<WordDetailSectionProps> = ({ wordId, getWordAnalysis, testHistory, wordInfo, localRefresh, wordPerformance, onClose }) => {
  // ⭐ NEW: Service instance for business logic
  const timelineService = useMemo(() => new TimelineReconstructionService(), []);

  // ⭐ REFACTORED: Get word information from props only
  const finalWordInfo = useMemo(() => {
    if (wordInfo) {
      return {
        english: wordInfo.english || 'N/A',
        italian: wordInfo.italian || 'N/A',
        chapter: wordInfo.chapter || null
      };
    }
     
    const wordAnalysis = getWordAnalysis ? getWordAnalysis(wordId) : null;
    if (wordAnalysis?.english) {
      return {
        english: wordAnalysis.english,
        italian: wordAnalysis.italian,
        chapter: wordAnalysis.chapter
      };
    }
    
    return {
      english: 'N/A',
      italian: 'N/A', 
      chapter: null
    };
  }, [wordInfo, getWordAnalysis, wordId]);

  // ⭐ REFACTORED: Service decide la strategia migliore
  const timelineData = useMemo(() => {
    const result = timelineService.getOptimalTimelineData(wordId, testHistory, finalWordInfo, wordPerformance);
    
    return result;
  }, [wordId, testHistory, finalWordInfo, timelineService, wordPerformance]);

  // ⭐ REFACTORED: Early return if no data
  if (!timelineData.hasData) {
    return (
      <Card className="bg-white border-0 shadow-xl rounded-3xl overflow-hidden">
        <CardContent className="text-center py-16">
          <div className="text-6xl mb-4">📊</div>
          <h3 className="text-xl font-bold text-gray-700 mb-2">Nessun tentativo trovato</h3>
          <p className="text-gray-600">
            La parola "{finalWordInfo.english}" non è ancora stata testata o non è stata trovata nella cronologia test.
          </p>
          <div className="mt-4 p-3 bg-gray-50 rounded-lg text-sm text-gray-500">
            <div>Capitolo: {finalWordInfo.chapter || 'Nessun capitolo'}</div>
            <div>Cronologia disponibile: {testHistory.length} test</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // ⭐ REFACTORED: Extract data from service
  const { attempts, chartData, reconstructedStats, recentStats, recommendations, status } = timelineData;

  // ⭐ ENHANCED: Custom tooltip for better data display
  const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-bold text-gray-800">{`Data: ${label}`}</p>
          <p className="text-sm text-gray-600">{`Dettaglio: ${data.fullDate}`}</p>
          <div className="mt-2 space-y-1">
            <p className={`text-sm font-medium ${data.isCorrect ? 'text-green-600' : 'text-red-600'}`}>
              {`Risultato: ${data.isCorrect ? '✅ Corretto' : '❌ Sbagliato'}`}
            </p>
            <p className="text-sm text-blue-600 font-bold">
              {`Accuratezza Globale: ${data.globalPrecision}%`}
            </p>
            {(data.hintsInThisTest || 0) > 0 && (
              <p className="text-sm text-orange-600">
                💡 {data.hintsInThisTest === 1 ? '1 aiuto utilizzato' : `${data.hintsInThisTest} aiuti utilizzati`} {data.hint > 0 ? `(${data.hint}% del totale)` : ''}
              </p>
            )}
            <p className="text-sm text-purple-600">
              {`Tempo: ${data.time}s`}
            </p>
            <p className="text-xs text-gray-500">
              {`Tentativo #${data.attemptNumber} di ${attempts.length}`}
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="bg-white border-0 shadow-xl rounded-3xl overflow-hidden" key={`detail-${wordId}-${localRefresh}`}>
      <CardHeader className="bg-gradient-to-r from-green-500 to-emerald-500 text-white">
        <CardTitle className="flex items-center justify-between text-white">
          <div className="flex items-center gap-3">
            <Award className="w-6 h-6" />
            Analisi Statistiche di dettaglio parola: "{finalWordInfo.english}"
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 hover:bg-white/20 rounded-full transition-colors"
              title="Chiudi analisi dettagliata"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </CardTitle>
        <p className="text-green-100 text-sm">
          Ultimi {chartData.length} tentativi • Accuratezza finale: {reconstructedStats.accuracy}% • Totale tentativi: {reconstructedStats.totalAttempts}
        </p>
      </CardHeader>
       
      <CardContent className="p-6">
        {/* ⭐ ENHANCED: Quick stats overview */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="text-center p-3 bg-blue-50 rounded-xl">
            <div className="text-xl font-bold text-blue-600">{recentStats.totalAttempts}</div>
            <div className="text-blue-700 text-sm">Tentativi Totali</div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-xl">
            <div className="text-xl font-bold text-green-600">{reconstructedStats.accuracy}%</div>
            <div className="text-green-700 text-sm">Accuratezza Finale</div>
          </div>
          <div className="text-center p-3 bg-orange-50 rounded-xl">
            <div className="text-xl font-bold text-orange-600">{recentStats.recentHints}</div>
            <div className="text-orange-700 text-sm">Aiuti Recenti</div>
          </div>
          <div className="text-center p-3 bg-purple-50 rounded-xl">
            <div className="text-xl font-bold text-purple-600">{recentStats.avgRecentTime}s</div>
            <div className="text-purple-700 text-sm">Tempo Medio</div>
          </div>
          <div className="text-center p-3 bg-indigo-50 rounded-xl">
            <div className={`text-xl font-bold ${recentStats.trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {recentStats.trend >= 0 ? '+' : ''}{recentStats.trend}%
            </div>
            <div className="text-indigo-700 text-sm">Trend Recente</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* ⭐ FIXED: Timeline Chart with REAL Dates */}
          <div>
            <h4 className="font-bold text-lg text-gray-800 mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Andamento Temporale ({chartData.length} tentativi recenti)
            </h4>
             
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={chartData} key={`word-chart-${wordId}-${localRefresh}`}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0e4e7" />
                  <XAxis 
                    dataKey="attempt"
                    tick={{ fontSize: 11 }}
                    interval={0}
                    angle={-45}
                    textAnchor="end"
                    height={70}
                    label={{ value: 'Date (DD/MM)', position: 'insideBottom', offset: -5, style: { fontSize: '12px' } }}
                  />
                  <YAxis 
                    yAxisId="left"
                    domain={[0, 100]}
                    tick={{ fontSize: 12 }}
                    label={{ value: 'Percentuale (%)', angle: -90, position: 'insideLeft' }}
                  />
                  <YAxis 
                    yAxisId="right"
                    orientation="right"
                    domain={[0, 'dataMax + 10']}
                    tick={{ fontSize: 12 }}
                    label={{ value: 'Tempo (s)', angle: 90, position: 'insideRight' }}
                  />
                   
                  <Tooltip content={<CustomTooltip />} />
                   
                  {/* ⭐ CRITICAL: Precisione Globale (cumulative) - PRIMARY LINE */}
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="globalPrecision"
                    stroke="#2563eb"
                    strokeWidth={4}
                    name="Accuratezza Globale"
                    dot={{ fill: '#2563eb', strokeWidth: 2, r: 6 }}
                    connectNulls={false}
                  />
                   
                  {/* ⭐ Individual success/failure points */}
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="success"
                    stroke="#10b981"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    name="Risultato Singolo"
                    dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                    connectNulls={false}
                  />
                   
                  {/* ⭐ Hints as bars */}
                  <Bar
                    yAxisId="left"
                    dataKey="hint"
                    fill="#f59e0b"
                    fillOpacity={0.6}
                    name="Aiuti Utilizzati"
                    minPointSize={5}
                    barSize={40}
                    radius={[2, 2, 0, 0]}
                  />
                   
                  {/* ⭐ Time as secondary line */}
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="time"
                    stroke="#8b5cf6"
                    strokeWidth={2}
                    strokeDasharray="10 5"
                    name="Tempo (s)"
                    dot={{ fill: '#8b5cf6', strokeWidth: 1, r: 3 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>Nessun tentativo disponibile per il grafico</p>
                <p className="text-sm mt-2">Completare alcuni test per vedere l'andamento</p>
              </div>
            )}

            {/* ⭐ ENHANCED: Legend explanation */}
            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-4 h-1 bg-blue-600 rounded"></div>
                <span>Accuratezza Globale (linea principale)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-1 bg-green-500 rounded border-dashed border"></div>
                <span>Risultato Singolo (✅/❌)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-3 bg-yellow-500 rounded opacity-60"></div>
                <span>Aiuti Utilizzati (barre)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-1 bg-purple-500 rounded" style={{borderTop: '2px dashed #8b5cf6'}}></div>
                <span>Tempo Risposta (asse destro)</span>
              </div>
            </div>

            {/* ⭐ REFACTORED: Timeline info using props data */}
            <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <h5 className="font-semibold text-sm text-blue-800 mb-2">📋 Informazioni Timeline</h5>
              <div className="text-xs text-blue-700 space-y-1">
                <div>Parola: <span className="font-medium">"{finalWordInfo.english}" → "{finalWordInfo.italian}"</span></div>
                <div>Capitolo: <span className="font-medium">{finalWordInfo.chapter || 'Nessun capitolo'}</span></div>
                <div>Tentativi ricostruiti: <span className="font-medium">{attempts.length}</span></div>
                <div>Tentativi corretti: <span className="font-medium text-green-600">{reconstructedStats.correctAttempts}</span></div>
                <div>Accuratezza finale: <span className="font-medium text-blue-600">{reconstructedStats.accuracy}%</span></div>
                <div>Punti mostrati nel grafico: <span className="font-medium">{chartData.length}</span></div>
                <div>Test totali caricati: <span className="font-medium">{testHistory.length}</span></div>
                <div>Aggiornamento locale: <span className="font-medium" title="Identificatore per forzare il refresh dei dati">{localRefresh}</span></div>
                <div>Analisi parola originale - Tentativi: <span className="font-medium">{getWordAnalysis ? (getWordAnalysis(wordId)?.attempts?.length || 0) : 0}</span>, Accuratezza: <span className="font-medium">{getWordAnalysis ? (getWordAnalysis(wordId)?.accuracy || 0) : 0}%</span></div>
                {attempts.length > 0 && (
                  <>
                    <div>Primo tentativo: <span className="font-medium">
                      {new Date(attempts[0].timestamp).toLocaleDateString('it-IT')}
                    </span></div>
                    <div>Ultimo tentativo: <span className="font-medium">
                      {new Date(attempts[attempts.length - 1].timestamp).toLocaleDateString('it-IT')}
                    </span></div>
                  </>
                )}
                 
                <div className="flex gap-2 mt-2">
                </div>
                 
                {testHistory.length > 0 && (
                  <div className="mt-2 p-2 bg-gray-100 rounded text-xs">
                    <div className="font-semibold">Ultimi 3 test:</div>
                    {testHistory.slice(0, 3).map((test, index) => (
                      <div key={test.id} className="truncate">
                        {index + 1}. {new Date(test.timestamp).toLocaleDateString('it-IT')} alle {new Date(test.timestamp).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* ⭐ NEW: Timeline info */}
            {chartData.length > 0 && (
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <h5 className="font-semibold text-sm text-gray-700 mb-2">📅 Periodo Analizzato</h5>
                <div className="text-xs text-gray-600 space-y-1">
                  <div>Dal: <span className="font-medium">{chartData[0]?.fullDate}</span></div>
                  <div>Al: <span className="font-medium">{chartData[chartData.length - 1]?.fullDate}</span></div>
                  <div>Tentativi mostrati: <span className="font-medium">{chartData.length}</span> su {attempts.length} totali</div>
                </div>
              </div>
            )}
          </div>
           
          {/* ⭐ ENHANCED: Detailed Statistics (rest of the component remains the same) */}
          <div>
            <h4 className="font-bold text-lg text-gray-800 mb-4 flex items-center gap-2">
              <Target className="w-5 h-5" />
              Statistiche Dettagliate
            </h4>
             
            <div className="space-y-4">
              {/* Current Status */}
              <div className="p-4 bg-gray-50 rounded-xl">
                <h5 className="font-bold text-gray-800 mb-3">📊 Stato Attuale</h5>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-xl font-bold text-blue-600">{reconstructedStats.accuracy}%</div>
                    <div className="text-blue-700 text-sm">Accuratezza Complessiva</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-orange-600">{reconstructedStats.hintsPercentage}%</div>
                    <div className="text-orange-700 text-sm">% Aiuti</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-green-600">{reconstructedStats.currentStreak}</div>
                    <div className="text-green-700 text-sm">Serie Consecutiva</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-purple-600">{reconstructedStats.avgTime}s</div>
                    <div className="text-purple-700 text-sm">Tempo Medio</div>
                  </div>
                </div>
              </div>
               
              {/* Performance Analysis */}
              <div className="p-4 bg-blue-50 rounded-xl">
                <h5 className="font-bold text-blue-800 mb-3">🎯 Analisi Performance</h5>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-700">Tentativi totali:</span>
                    <span className="font-bold">{reconstructedStats.totalAttempts}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">Risposte corrette:</span>
                    <span className="font-bold text-green-600">{reconstructedStats.correctAttempts}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">Aiuti utilizzati:</span>
                    <span className="font-bold text-orange-600">{reconstructedStats.hintsUsed}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">Accuratezza finale:</span>
                    <span className="font-bold text-blue-600">{reconstructedStats.accuracy}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">Serie consecutiva corrente:</span>
                    <span className="font-bold text-green-600">{reconstructedStats.currentStreak}</span>
                  </div>
                </div>
              </div>
               
              {/* ⭐ REFACTORED: Status Badge from service */}
              <div className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-200">
                <h5 className="font-bold text-indigo-800 mb-2">🏷️ Stato Parola (Ricostruito)</h5>
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-full text-white text-sm font-medium ${
                    status === 'Critica' ? 'bg-red-500' :
                    status === 'Difficile' ? 'bg-orange-500' :
                    status === 'In miglioramento' ? 'bg-yellow-500' :
                    status === 'Buona' ? 'bg-blue-500' :
                    status === 'Consolidata' ? 'bg-emerald-500' : 'bg-green-500'
                  }`}>
                    {status === 'Critica' ? '🔴' : 
                     status === 'Difficile' ? '🟠' :
                     status === 'In miglioramento' ? '🟡' :
                     status === 'Buona' ? '🔵' :
                     status === 'Consolidata' ? '✅' : '🟢'} {status}
                  </span>
                   
                  {recentStats.trend !== 0 && (
                    <span className={`text-sm font-medium ${recentStats.trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {recentStats.trend > 0 ? '📈' : '📉'} 
                      {recentStats.trend > 0 ? '+' : ''}{recentStats.trend}% trend
                    </span>
                  )}
                </div>
              </div>
               
              {/* ⭐ REFACTORED: Recommendations from service */}
              <div className="p-4 bg-yellow-50 rounded-xl border border-yellow-200">
                <h5 className="font-bold text-yellow-800 mb-2">💡 Raccomandazioni</h5>
                <div className="text-sm text-yellow-700 space-y-1">
                  {recommendations.map((recommendation, index) => (
                    <p key={index}>• {recommendation}</p>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default WordDetailSection;