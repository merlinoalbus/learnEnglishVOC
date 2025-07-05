// =====================================================
// 📁 src/components/debug/LocalStorageInspector.js
// =====================================================

import React, { useState, useEffect } from 'react';

export const LocalStorageInspector = () => {
  const [storageData, setStorageData] = useState({});
  const [analysis, setAnalysis] = useState(null);

  useEffect(() => {
    inspectLocalStorage();
  }, []);

  const inspectLocalStorage = () => {
    const data = {};
    const keys = Object.keys(localStorage);
    
    console.log('🔍 ALL LOCALSTORAGE KEYS:', keys);
    
    keys.forEach(key => {
      try {
        const value = localStorage.getItem(key);
        let parsed = null;
        let type = 'string';
        let size = value ? value.length : 0;
        
        // Try to parse JSON
        try {
          parsed = JSON.parse(value);
          type = Array.isArray(parsed) ? 'array' : typeof parsed;
          
          if (Array.isArray(parsed)) {
            size = parsed.length;
          } else if (typeof parsed === 'object' && parsed !== null) {
            size = Object.keys(parsed).length;
          }
        } catch (e) {
          // Not JSON, keep as string
          parsed = value;
        }
        
        data[key] = {
          type,
          size,
          raw: value,
          parsed,
          preview: getPreview(parsed, type)
        };
      } catch (error) {
        data[key] = {
          type: 'error',
          size: 0,
          error: error.message
        };
      }
    });
    
    setStorageData(data);
    analyzeVocabularyData(data);
  };

  const getPreview = (parsed, type) => {
    if (type === 'array') {
      if (parsed.length === 0) return 'Empty array';
      const first = parsed[0];
      if (first && first.english && first.italian) {
        return `Words: ${first.english} → ${first.italian}...`;
      }
      return `Array with ${parsed.length} items`;
    } else if (type === 'object') {
      const keys = Object.keys(parsed);
      return `Object: ${keys.slice(0, 3).join(', ')}${keys.length > 3 ? '...' : ''}`;
    } else {
      return String(parsed).substring(0, 50) + (String(parsed).length > 50 ? '...' : '');
    }
  };

  const analyzeVocabularyData = (data) => {
    const analysis = {
      possibleWordsKeys: [],
      possibleStatsKeys: [],
      possibleHistoryKeys: [],
      possiblePerformanceKeys: [],
      totalWords: 0,
      recommendations: []
    };

    // Find potential vocabulary keys
    Object.entries(data).forEach(([key, info]) => {
      const keyLower = key.toLowerCase();
      
      // Check for words
      if (keyLower.includes('word') || keyLower.includes('vocab')) {
        if (info.type === 'array' && info.size > 0) {
          // Check if first item looks like a word
          const firstItem = info.parsed[0];
          if (firstItem && firstItem.english && firstItem.italian) {
            analysis.possibleWordsKeys.push({
              key,
              count: info.size,
              confidence: 'high',
              reason: 'Array with english/italian properties'
            });
            analysis.totalWords = Math.max(analysis.totalWords, info.size);
          } else {
            analysis.possibleWordsKeys.push({
              key,
              count: info.size,
              confidence: 'low',
              reason: 'Array but items might not be words'
            });
          }
        }
      }
      
      // Check for stats
      if (keyLower.includes('stat') && info.type === 'object') {
        analysis.possibleStatsKeys.push({
          key,
          confidence: 'medium',
          reason: 'Object with stats-like name'
        });
      }
      
      // Check for history
      if (keyLower.includes('history') || keyLower.includes('test')) {
        if (info.type === 'array') {
          analysis.possibleHistoryKeys.push({
            key,
            count: info.size,
            confidence: 'medium',
            reason: 'Array with test/history name'
          });
        }
      }
      
      // Check for performance
      if (keyLower.includes('performance')) {
        analysis.possiblePerformanceKeys.push({
          key,
          confidence: 'medium',
          reason: 'Performance-related key'
        });
      }
    });

    // Generate recommendations
    if (analysis.possibleWordsKeys.length === 0) {
      analysis.recommendations.push('❌ No vocabulary words found in localStorage');
    } else if (analysis.possibleWordsKeys.length === 1) {
      analysis.recommendations.push(`✅ Found words at key: ${analysis.possibleWordsKeys[0].key}`);
    } else {
      analysis.recommendations.push(`⚠️ Multiple possible word keys found - need to identify correct one`);
    }

    if (analysis.totalWords !== 86) {
      analysis.recommendations.push(`⚠️ Expected 86 words but found ${analysis.totalWords} - data might be incomplete`);
    }

    setAnalysis(analysis);
  };

  const copyKeyValue = (key) => {
    const value = localStorage.getItem(key);
    navigator.clipboard.writeText(value);
    alert(`Copied ${key} to clipboard`);
  };

  const testKey = (key) => {
    const value = localStorage.getItem(key);
    try {
      const parsed = JSON.parse(value);
      console.log(`🧪 Testing key "${key}":`, parsed);
      
      if (Array.isArray(parsed)) {
        console.log(`📊 Array length: ${parsed.length}`);
        if (parsed.length > 0) {
          console.log(`📝 First item:`, parsed[0]);
          console.log(`📝 Last item:`, parsed[parsed.length - 1]);
        }
      } else if (typeof parsed === 'object') {
        console.log(`📊 Object keys:`, Object.keys(parsed));
      }
      
      alert(`Check console for details about "${key}"`);
    } catch (error) {
      alert(`Error parsing "${key}": ${error.message}`);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg max-h-screen overflow-auto">
      <h2 className="text-2xl font-bold mb-4 text-blue-800">
        🔍 LocalStorage Inspector
      </h2>

      {analysis && (
        <div className="mb-6 space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-800 mb-2">📊 Analysis Summary</h3>
            <div className="space-y-2">
              <div>Total Words Found: <strong>{analysis.totalWords}</strong> (Expected: 86)</div>
              <div>Possible Word Keys: <strong>{analysis.possibleWordsKeys.length}</strong></div>
              <div>Possible Stats Keys: <strong>{analysis.possibleStatsKeys.length}</strong></div>
              <div>Possible History Keys: <strong>{analysis.possibleHistoryKeys.length}</strong></div>
            </div>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="font-semibold text-green-800 mb-2">💡 Recommendations</h3>
            <ul className="space-y-1">
              {analysis.recommendations.map((rec, index) => (
                <li key={index} className="text-sm">{rec}</li>
              ))}
            </ul>
          </div>

          {analysis.possibleWordsKeys.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="font-semibold text-yellow-800 mb-2">📝 Possible Word Keys</h3>
              <div className="space-y-2">
                {analysis.possibleWordsKeys.map((item, index) => (
                  <div key={index} className="flex items-center justify-between bg-white p-2 rounded">
                    <div>
                      <strong>{item.key}</strong> ({item.count} items, {item.confidence} confidence)
                      <div className="text-xs text-gray-600">{item.reason}</div>
                    </div>
                    <div className="space-x-2">
                      <button 
                        onClick={() => testKey(item.key)}
                        className="px-3 py-1 bg-blue-500 text-white rounded text-sm"
                      >
                        Test
                      </button>
                      <button 
                        onClick={() => copyKeyValue(item.key)}
                        className="px-3 py-1 bg-green-500 text-white rounded text-sm"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">All LocalStorage Keys:</h3>
        
        {Object.entries(storageData).map(([key, info]) => (
          <div key={key} className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="font-medium text-gray-800">{key}</div>
              <div className="flex items-center space-x-2">
                <span className={`px-2 py-1 rounded text-xs ${
                  info.type === 'array' ? 'bg-green-100 text-green-800' :
                  info.type === 'object' ? 'bg-blue-100 text-blue-800' :
                  info.type === 'error' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {info.type} ({info.size})
                </span>
                
                <button 
                  onClick={() => testKey(key)}
                  className="px-2 py-1 bg-blue-500 text-white rounded text-xs"
                >
                  Test
                </button>
                
                <button 
                  onClick={() => copyKeyValue(key)}
                  className="px-2 py-1 bg-green-500 text-white rounded text-xs"
                >
                  Copy
                </button>
              </div>
            </div>
            
            <div className="text-sm text-gray-600 bg-gray-50 rounded p-2">
              {info.error ? (
                <span className="text-red-600">Error: {info.error}</span>
              ) : (
                info.preview
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 pt-4 border-t border-gray-200">
        <button 
          onClick={inspectLocalStorage}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          🔄 Refresh Analysis
        </button>
      </div>
    </div>
  );
};