// =====================================================
// 📁 src/components/TestCard.tsx - TypeScript Migration
// =====================================================

import React from 'react';
import { getCategoryStyle } from '../utils/categoryUtils';
import { formatNotes } from '../utils/textUtils';
import { Word } from '../types/entities/Word.types';

// =====================================================
// 🔧 TYPES & INTERFACES
// =====================================================

interface TestCardProps {
  word: Word;
  showMeaning: boolean;
  onFlip: () => void;
  showHint: boolean;
  hintUsed: boolean;
}

// =====================================================
// 🎯 MAIN COMPONENT
// =====================================================

const TestCard: React.FC<TestCardProps> = ({ word, showMeaning, onFlip, showHint, hintUsed }) => {
  // Get the first sentence if available
  const sentence = word.sentences && word.sentences.length > 0 ? word.sentences[0] : undefined;
  
  return (
    <div 
      className="relative cursor-pointer transform transition-transform duration-300 hover:scale-105"
      style={{ width: '26rem', height: '38rem', perspective: '1000px' }}
      onClick={onFlip}
    >
      <div 
        className="absolute inset-0 w-full h-full transition-transform duration-700 preserve-3d"
        style={{ 
          transformStyle: 'preserve-3d',
          transform: showMeaning ? 'rotateY(180deg)' : 'rotateY(0deg)'
        }}
      >
        {/* Front Card */}
        <div 
          className="absolute inset-0 w-full h-full rounded-3xl shadow-2xl overflow-hidden backface-hidden"
          style={{ backfaceVisibility: 'hidden' }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-500"></div>
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="relative h-full flex flex-col items-center justify-center text-white p-8">
            
            {/* ⭐ FIXED: Suggerimento spostato in alto */}
            {showHint && sentence && (
              <div className="absolute top-6 left-6 right-6">
                <div className="bg-white/20 backdrop-blur-md rounded-2xl p-4 border border-white/30 animate-fade-in">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">💡</span>
                    <span className="text-sm font-bold text-white/90">Suggerimento:</span>
                    {hintUsed && (
                      <span className="text-xs bg-orange-400/80 text-white px-2 py-1 rounded-full">
                        Conteggiato
                      </span>
                    )}
                  </div>
                  <div className="text-sm italic text-white/90 leading-relaxed">
                    "{sentence}"
                  </div>
                </div>
              </div>
            )}
            
            <div className="text-center space-y-6 flex-1 flex flex-col justify-center">
              <div className="text-5xl font-bold drop-shadow-lg">
                {word.english}
              </div>
              <div className="text-xl opacity-90 animate-pulse">
                Clicca per vedere la traduzione
              </div>
              <div className="mt-8">
                <div className="inline-flex items-center justify-center w-16 h-16 border-2 border-white/30 rounded-2xl backdrop-blur-sm">
                  <span className="text-2xl font-bold">EN</span>
                </div>
              </div>
            </div>
            
            {/* Animated particles */}
            <div className="absolute top-4 right-4 w-2 h-2 bg-white/50 rounded-full animate-ping"></div>
            <div className="absolute bottom-8 left-8 w-1 h-1 bg-white/30 rounded-full animate-pulse"></div>
            <div className="absolute top-1/3 left-4 w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce"></div>
          </div>
        </div>

        {/* Back Card */}
        <div 
          className={`absolute inset-0 w-full h-full rounded-3xl shadow-2xl overflow-hidden backface-hidden ${getCategoryStyle(word.group)?.bgGradient || 'bg-gradient-to-br from-emerald-500 to-cyan-600'}`}
          style={{ 
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)'
          }}
        >
          <div className="absolute inset-0 bg-black/20"></div>
          
          {/* Category badge */}
          {word.group && (
            <div className="absolute top-4 right-4 z-10">
              <div className="bg-white/20 backdrop-blur-sm text-white px-3 py-2 rounded-xl text-sm font-medium flex items-center gap-2 shadow-lg">
                <span>{getCategoryStyle(word.group).icon}</span>
                <span>{word.group}</span>
              </div>
            </div>
          )}
          
          {/* ⭐ ENHANCED: Hint indicator sul retro se usato */}
          {hintUsed && (
            <div className="absolute top-4 left-4 z-10">
              <div className="bg-orange-500/80 backdrop-blur-sm text-white px-3 py-2 rounded-xl text-sm font-medium flex items-center gap-2 shadow-lg">
                <span>💡</span>
                <span>Aiuto usato</span>
              </div>
            </div>
          )}
          
          <div className="relative h-full flex flex-col text-white p-8">
            {/* Header */}
            <div className="text-center border-b border-white/30 pb-6 mb-6">
              <div className="text-2xl font-bold drop-shadow-md">
                {word.english}
              </div>
            </div>

            {/* Main translation */}
            <div className="text-center mb-8">
              <div 
                className="font-bold drop-shadow-lg leading-tight"
                style={{
                  fontSize: word.italian.length > 25 ? '2rem' : 
                           word.italian.length > 15 ? '2.5rem' : 
                           word.italian.length > 10 ? '3rem' : '3.5rem'
                }}
              >
                {word.italian}
              </div>
            </div>

            {/* Example */}
            {sentence && (
              <div className="mb-6">
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
                  <div className="font-bold mb-2 text-sm flex items-center gap-2">
                    <span className="text-lg">💬</span>
                    Esempio:
                  </div>
                  <div className="italic text-sm leading-relaxed">
                    "{sentence}"
                  </div>
                </div>
              </div>
            )}

            {/* Notes */}
            {word.notes && (
              <div className="flex-1 min-h-0">
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 h-full flex flex-col border border-white/20">
                  <div className="font-bold mb-3 text-sm flex items-center gap-2">
                    <span className="text-lg">📝</span>
                    Note:
                  </div>
                  <div className="overflow-y-auto flex-1 text-sm leading-relaxed whitespace-pre-line">
                    {formatNotes(word.notes)}
                  </div>
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="text-center text-sm opacity-90 border-t border-white/30 pt-4 mt-6">
              <span className="animate-pulse">Clicca per tornare al fronte</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestCard;