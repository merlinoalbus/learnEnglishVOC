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
            
            
            {/* Traditional hint display for non-game mode */}
            {!gameMode && showHint && sentence && (
              <div className="absolute top-6 left-6 right-6">
                <div className="test-card-hint-box">
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
              </div>
            )}
            
            <div className="test-card-front-content">
              <div className="test-card-english-word">
                {word.english}
              </div>
              
              {/* Click instruction */}
              <div className="test-card-instruction">
                Clicca per vedere la traduzione
              </div>
              
              <div className="test-card-language-badge">
                <div className="test-card-language-indicator">
                  <span className="test-card-language-text">EN</span>
                </div>
              </div>
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
          
          {/* Category badge */}
          {word.group && (
            <div className="test-card-category-badge">
              <div className="test-card-category-content">
                <span>{getCategoryStyle(word.group).icon}</span>
                <span>{word.group}</span>
              </div>
            </div>
          )}
          
          
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

            {/* Contenuti organizzati in griglia */}
            <div className="test-card-content-grid">
              
              {/* Sinonimi */}
              {word.synonyms && word.synonyms.length > 0 && (
                <div className="test-card-section">
                  <div className="test-card-section-header">
                    <span className="test-card-hint-icon">🔄</span>
                    Sinonimi:
                  </div>
                  <div className="test-card-section-list">
                    {word.synonyms.join(', ')}
                  </div>
                </div>
              )}

              {/* Contrari */}
              {word.antonyms && word.antonyms.length > 0 && (
                <div className="test-card-section">
                  <div className="test-card-section-header">
                    <span className="test-card-hint-icon">⚡</span>
                    Contrari:
                  </div>
                  <div className="test-card-section-list">
                    {word.antonyms.join(', ')}
                  </div>
                </div>
              )}

              {/* Frasi di esempio */}
              {word.sentences && word.sentences.length > 0 && (
                <div className="test-card-section">
                  <div className="test-card-section-header">
                    <span className="test-card-hint-icon">💬</span>
                    Esempi:
                  </div>
                  <div className="test-card-examples-container">
                    {word.sentences.map((sentence, index) => (
                      <div key={index} className="test-card-example-item">
                        "{sentence}"
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Note */}
              {word.notes && (
                <div className="test-card-section">
                  <div className="test-card-section-header">
                    <span className="test-card-hint-icon">📝</span>
                    Note:
                  </div>
                  <div className="test-card-notes-content">
                    {formatNotes(word.notes)}
                  </div>
                </div>
              )}

            </div>

            {/* Footer */}
            <div className="test-card-footer">
              <span className="test-card-footer-text">Clicca per tornare al fronte</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestCard;