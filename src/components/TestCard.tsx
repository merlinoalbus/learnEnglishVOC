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
  gameMode?: boolean;
  gameHints?: {
    synonym?: string[];
    antonym?: string[];
    context?: string[];
  };
  onGameHintRequest?: (type: 'synonym' | 'antonym' | 'context') => void;
}

// =====================================================
// 🎯 MAIN COMPONENT
// =====================================================

const TestCard: React.FC<TestCardProps> = ({ 
  word, 
  showMeaning, 
  onFlip, 
  showHint, 
  hintUsed,
  gameMode = false,
  gameHints = {},
  onGameHintRequest
}) => {
  // Get the first sentence if available
  const sentence = word.sentences && word.sentences.length > 0 ? word.sentences[0] : undefined;
  
  // Note: Helper functions for game mode hints are available if needed for future implementation
  
  return (
    <div className="test-card-outer-container">
      {/* Hint container - always present with fixed height */}
      {!gameMode && (
        <div className="test-card-hint-container-wrapper">
          {sentence && (
            <div className={`test-card-hint-box ${!showHint ? 'test-card-hint-box-hidden' : ''} ${showMeaning ? 'test-card-hint-box-disabled' : ''}`}>
              <div className="test-card-hint-header">
                <span className="test-card-hint-icon">💡</span>
                <span className="test-card-hint-label">Suggerimento:</span>
                {hintUsed && (
                  <span className="test-card-hint-badge">
                    Conteggiato
                  </span>
                )}
              </div>
              <div className="test-card-hint-text">
                "{sentence}"
              </div>
            </div>
          )}
        </div>
      )}
      
      <div 
        className="test-card-container interactive-scale"
        onClick={onFlip}
      >
        <div 
          className={`test-card-flip-wrapper ${showMeaning ? 'flipped' : ''}`}
        >
          {/* Front Card */}
          <div className="test-card-face test-card-face-front">
            <div className="test-card-content">
              <div className="test-card-word">
                <h2 className="test-card-word-text">
                  {word.english}
                </h2>
              </div>
            
            {/* Animated particles */}
            <div className="test-card-particle-top-right"></div>
            <div className="test-card-particle-bottom-left"></div>
            <div className="test-card-particle-mid-left"></div>
          </div>
        </div>

        {/* Back Card */}
        <div 
          className={`test-card-face ${getCategoryStyle(word.group)?.bgGradient || 'test-card-face-back'}`}
          style={{ 
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)'
          }}
        >
          <div className="test-card-back-overlay"></div>
          
          <div className="test-card-content">
            {/* Header */}
            <div className="test-card-header">
              <div className="test-card-title">
                {word.english}
              </div>
            </div>

            {/* Main translation */}
            <div className="test-card-main-translation">
              <div 
                className="test-card-italian-word"
                style={{
                  fontSize: word.italian.length > 25 ? '1.8rem' : 
                           word.italian.length > 15 ? '2.2rem' : 
                           word.italian.length > 10 ? '2.5rem' : '3rem'
                }}
              >
                {word.italian}
              </div>
            </div>

            {/* Contenuto compatto */}
            <div className="test-card-compact-content">
              {word.synonyms && word.synonyms.length > 0 && (
                <div className="test-card-info-line">
                  <span className="test-card-info-icon">🔄</span>
                  <span className="test-card-info-label">Sinonimi:</span>
                  <span className="test-card-info-value">{word.synonyms.join(', ')}</span>
                </div>
              )}

              {word.antonyms && word.antonyms.length > 0 && (
                <div className="test-card-info-line">
                  <span className="test-card-info-icon">⚡</span>
                  <span className="test-card-info-label">Contrari:</span>
                  <span className="test-card-info-value">{word.antonyms.join(', ')}</span>
                </div>
              )}

              {word.sentences && word.sentences.length > 0 && (
                <div className="test-card-info-block">
                  <div className="test-card-info-line">
                    <span className="test-card-info-icon">💬</span>
                    <span className="test-card-info-label">Esempi:</span>
                  </div>
                  <div className="test-card-examples-compact">
                    {word.sentences.map((sentence, index) => (
                      <div key={index} className="test-card-example-compact">
                        • "{sentence}"
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {word.notes && (
                <div className="test-card-info-line">
                  <span className="test-card-info-icon">📝</span>
                  <span className="test-card-info-label">Note:</span>
                  <span className="test-card-info-value">{formatNotes(word.notes)}</span>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="test-card-footer">
              <span className="test-card-footer-text">Clicca per tornare al fronte</span>
            </div>

            {/* Category badge - below footer */}
            {word.group && (
              <div className="test-card-category-badge-bottom">
                <div className="test-card-category-content-bottom">
                  <span>{getCategoryStyle(word.group).icon}</span>
                  <span>{word.group}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      </div>
    </div>
  );
};

export default TestCard;