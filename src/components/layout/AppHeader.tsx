import React from 'react';
import { Card, CardHeader, CardTitle } from '../ui/card';
import { Brain, Sparkles } from 'lucide-react';

export const AppHeader: React.FC = React.memo(() => (
  <div className="text-center relative">
    <div className="app-header-blur"></div>
    <Card className="relative backdrop-blur-sm bg-white/80 dark:bg-gray-800/80 border-0 shadow-2xl rounded-3xl overflow-hidden">
      <div className="app-header-overlay"></div>
            
      <CardHeader className="relative py-8">
        <CardTitle className="app-header-title">
          <Brain className="w-10 h-10 text-blue-600" />
          Vocabulary Master
          <Sparkles className="w-8 h-8 text-purple-600" />
        </CardTitle>
        <p className="text-gray-600 dark:text-gray-400 text-lg mt-2">La tua app intelligente per imparare l'inglese</p>
      </CardHeader>
    </Card>
  </div>
));

AppHeader.displayName = 'AppHeader';