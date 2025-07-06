import React from 'react';
import { Card, CardHeader, CardTitle } from '../ui/card';
import { Brain, Sparkles } from 'lucide-react';

export const AppHeader = React.memo(() => (
  <div className="text-center relative">
    <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl blur-3xl opacity-20"></div>
    <Card className="relative backdrop-blur-sm bg-white/80 border-0 shadow-2xl rounded-3xl overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10"></div>
            
      <CardHeader className="relative py-8">
        <CardTitle className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent flex items-center justify-center gap-3">
          <Brain className="w-10 h-10 text-blue-600" />
          Vocabulary Master
          <Sparkles className="w-8 h-8 text-purple-600" />
        </CardTitle>
        <p className="text-gray-600 text-lg mt-2">La tua app intelligente per imparare l'inglese</p>
      </CardHeader>
    </Card>
  </div>
));