import React from 'react';
import { useAppContext } from '../../contexts/AppContext';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Brain, BarChart3, Settings } from 'lucide-react';

export const AppNavigation = React.memo(() => {
  const { currentView, dispatch, testHistory, stats } = useAppContext();

  const navItems = [
    {
      id: 'main',
      label: 'Studio & Vocabolario',
      icon: Brain,
      color: 'from-blue-500 to-purple-600'
    },
    {
      id: 'stats',
      label: 'Statistiche',
      icon: BarChart3,
      color: 'from-purple-500 to-pink-600',
      badge: testHistory.length > 0 ? testHistory.length : null
    },
    {
      id: 'stats-manager',
      label: 'Gestisci Stats',
      icon: Settings,
      color: 'from-emerald-500 to-teal-600',
      badge: stats.testsCompleted > 0 ? stats.testsCompleted : null
    }
  ];

  return (
    <Card className="backdrop-blur-sm bg-white/90 border-0 shadow-xl rounded-3xl overflow-hidden">
      <CardContent className="p-2">
        <div className="flex gap-2 p-2">
          {navItems.map(item => (
            <Button
              key={item.id}
              onClick={() => dispatch({ type: 'SET_VIEW', payload: item.id })}
              className={`flex-1 py-4 px-6 rounded-2xl text-lg font-semibold transition-all duration-300 ${
                currentView === item.id 
                  ? `bg-gradient-to-r ${item.color} text-white shadow-lg transform scale-105` 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <item.icon className="w-6 h-6 mr-3" />
              {item.label}
              {item.badge && (
                <span className="ml-2 bg-white/20 text-white px-2 py-1 rounded-full text-sm">
                  {item.badge}
                </span>
              )}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
});
