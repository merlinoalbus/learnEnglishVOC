// =====================================================
// 🔧 FIX 3: components/EmptyState.js CORRETTO
// =====================================================
// src/components/stats/components/EmptyState.js

import React from 'react';
import { Card, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Play, Database } from 'lucide-react';
import { useAppContext } from '../../../contexts/AppContext';
interface EmptyStateProps {
  onGoToMain: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({ onGoToMain }) => {
  const { dispatch } = useAppContext();
  return (
    <Card className="backdrop-blur-sm bg-white/90 dark:bg-gray-800/90 border-0 shadow-2xl rounded-3xl overflow-hidden">
      <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-1">
        <div className="bg-white dark:bg-gray-800 rounded-3xl p-6">
          <div className="flex justify-between items-center mb-6">
            <CardTitle className="flex items-center gap-3 text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Statistiche e Analisi
              <span className="text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded-full">
                0 test
              </span>
            </CardTitle>
            
            <Button
              onClick={() => dispatch({ type: 'SET_VIEW', payload: 'data-management' })}
              className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white px-4 py-2 rounded-xl"
            >
              <Database className="w-4 h-4 mr-2" />
              Gestione Dati
            </Button>
          </div>


          <div className="text-center py-16">
            <div className="text-8xl mb-6">📊</div>
            <h3 className="text-2xl font-bold text-gray-700 dark:text-gray-200 mb-4">Nessun test completato</h3>
            <p className="text-gray-600 dark:text-gray-400 text-lg mb-8">Completa il tuo primo test per vedere le statistiche dettagliate!</p>
            <Button 
              onClick={onGoToMain} 
              className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white px-8 py-4 text-lg rounded-2xl shadow-xl"
            >
              <Play className="w-5 h-5 mr-2" />
              Inizia il Primo Test
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default EmptyState;