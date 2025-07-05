// =====================================================
// 📁 src/components/DualSystemTester.js - COMPONENTE OPZIONALE per test manuali
// =====================================================
// Usa questo componente per testare manualmente operazioni sul dual-system

import React from 'react';
import { useStoreBridge } from '../hooks/useStoreBridge';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';

const DualSystemTester = () => {
  const bridge = useStoreBridge({ 
    enableComparison: true, 
    logDifferences: true 
  });

  const [testResults, setTestResults] = React.useState([]);

  // Test manuale: Aggiungi parola
  const testAddWord = async () => {
    console.log('🧪 Testing: Add Word Operation');
    
    const testWord = {
      english: 'test' + Date.now(),
      italian: 'prova',
      group: 'SOSTANTIVI',
      sentence: 'This is a test sentence',
      notes: 'Test notes',
      chapter: '1',
      learned: false,
      difficult: false
    };

    try {
      // Aggiungi su entrambi i sistemi
      bridge.systems.old.app.addWord(testWord);
      bridge.systems.new.app.addWord(testWord);
      
      // Verifica risultati
      const oldWords = bridge.systems.old.app.words;
      const newWords = bridge.systems.new.app.words;
      
      const result = {
        operation: 'addWord',
        timestamp: new Date().toLocaleTimeString(),
        success: oldWords.length === newWords.length,
        oldCount: oldWords.length,
        newCount: newWords.length,
        identical: bridge.comparison.identical
      };
      
      setTestResults(prev => [result, ...prev.slice(0, 9)]); // Keep last 10 results
      console.log('🧪 Add Word Test Result:', result);
      
    } catch (error) {
      console.error('🧪 Add Word Test Failed:', error);
    }
  };

  // Test manuale: Toggle learned
  const testToggleLearned = async () => {
    console.log('🧪 Testing: Toggle Learned Operation');
    
    if (bridge.systems.old.app.words.length === 0) {
      alert('Aggiungi prima una parola per testare toggle learned');
      return;
    }

    try {
      const wordId = bridge.systems.old.app.words[0].id;
      
      // Toggle su entrambi i sistemi
      bridge.systems.old.app.toggleWordLearned(wordId);
      bridge.systems.new.app.toggleWordLearned(wordId);
      
      const result = {
        operation: 'toggleLearned',
        timestamp: new Date().toLocaleTimeString(),
        success: true,
        wordId,
        identical: bridge.comparison.identical
      };
      
      setTestResults(prev => [result, ...prev.slice(0, 9)]);
      console.log('🧪 Toggle Learned Test Result:', result);
      
    } catch (error) {
      console.error('🧪 Toggle Learned Test Failed:', error);
    }
  };

  // Test manuale: Notification
  const testNotification = async () => {
    console.log('🧪 Testing: Notification Operation');
    
    try {
      const message = `Test notification ${Date.now()}`;
      
      // Mostra su entrambi i sistemi
      bridge.systems.old.notifications.showSuccess(message);
      bridge.systems.new.notifications.showSuccess(message);
      
      const result = {
        operation: 'showNotification',
        timestamp: new Date().toLocaleTimeString(),
        success: true,
        message,
        oldCount: bridge.systems.old.notifications.notifications?.length || 0,
        newCount: bridge.systems.new.notifications.notifications?.length || 0,
        identical: bridge.comparison.identical
      };
      
      setTestResults(prev => [result, ...prev.slice(0, 9)]);
      console.log('🧪 Notification Test Result:', result);
      
    } catch (error) {
      console.error('🧪 Notification Test Failed:', error);
    }
  };

  // Validate current state
  const validateState = () => {
    const validation = bridge.validateCurrentState();
    setTestResults(prev => [{
      operation: 'validation',
      timestamp: new Date().toLocaleTimeString(),
      success: validation.summary.systemsInSync,
      differences: validation.summary.totalDifferences,
      identical: validation.summary.systemsInSync
    }, ...prev.slice(0, 9)]);
  };

  return (
    <Card className="mb-4 border-2 border-purple-200 bg-purple-50">
      <CardHeader className="bg-purple-100">
        <CardTitle className="text-purple-800">
          🧪 Dual-System Manual Tester
        </CardTitle>
        <div className="text-sm text-purple-600">
          Status: {bridge.comparison.identical ? '✅ Sincronizzati' : '⚠️ NON Sincronizzati'}
        </div>
      </CardHeader>
      <CardContent className="p-4">
        {/* Test Buttons */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
          <Button 
            onClick={testAddWord}
            className="bg-blue-500 hover:bg-blue-600 text-white"
            size="sm"
          >
            🧪 Test Add Word
          </Button>
          
          <Button 
            onClick={testToggleLearned}
            className="bg-green-500 hover:bg-green-600 text-white"
            size="sm"
          >
            🧪 Test Toggle
          </Button>
          
          <Button 
            onClick={testNotification}
            className="bg-orange-500 hover:bg-orange-600 text-white"
            size="sm"
          >
            🧪 Test Notification
          </Button>
          
          <Button 
            onClick={validateState}
            className="bg-purple-500 hover:bg-purple-600 text-white"
            size="sm"
          >
            🔍 Validate
          </Button>
        </div>

        {/* Current State */}
        <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
          <div className="bg-white p-3 rounded border">
            <div className="font-bold text-blue-600">Old System</div>
            <div>Words: {bridge.systems.old.app.words.length}</div>
            <div>Notifications: {bridge.systems.old.notifications.notifications?.length || 0}</div>
            <div>View: {bridge.systems.old.app.currentView}</div>
          </div>
          
          <div className="bg-white p-3 rounded border">
            <div className="font-bold text-green-600">New System</div>
            <div>Words: {bridge.systems.new.app.words.length}</div>
            <div>Notifications: {bridge.systems.new.notifications.notifications?.length || 0}</div>
            <div>View: {bridge.systems.new.app.currentView}</div>
          </div>
        </div>

        {/* Test Results */}
        <div className="bg-white p-3 rounded border max-h-40 overflow-y-auto">
          <div className="font-bold mb-2">Test Results:</div>
          {testResults.length === 0 ? (
            <div className="text-gray-500 text-sm">Nessun test eseguito ancora</div>
          ) : (
            testResults.map((result, index) => (
              <div key={index} className={`text-xs p-2 mb-1 rounded ${
                result.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                <span className="font-mono">{result.timestamp}</span> - 
                <span className="font-bold"> {result.operation}</span>
                {result.success ? ' ✅' : ' ❌'}
                {result.identical !== undefined && (
                  <span> | Sync: {result.identical ? '✅' : '⚠️'}</span>
                )}
              </div>
            ))
          )}
        </div>

        {/* Performance Metrics */}
        <div className="mt-4 text-xs text-gray-600">
          <div>Performance: Old={bridge.performanceMetrics.oldSystem.methodCount} methods, 
               New={bridge.performanceMetrics.newSystem.methodCount} methods</div>
          <div>Memory: Old={Math.round(bridge.performanceMetrics.oldSystem.memoryFootprint/1024)}KB, 
               New={Math.round(bridge.performanceMetrics.newSystem.memoryFootprint/1024)}KB</div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DualSystemTester;