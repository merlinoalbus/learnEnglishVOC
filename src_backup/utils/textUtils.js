// /src/utils/textUtils.js
// This file contains utility functions for formatting notes and calculating test results.
// It provides functions to format notes with specific keywords and to determine the result of a vocabulary test.
// The `formatNotes` function processes notes to highlight keywords, while the `getTestResult` function evaluates test statistics to provide feedback based on the user's performance.
// These utilities are essential for enhancing the user experience in a vocabulary learning application, making it easier for users to understand notes and assess their test results.
//  * @returns {Array} An array of React elements or strings representing the formatted notes.
//  */      
//

import React from 'react';

export const formatNotes = (notes) => {
  if (!notes) return null;
  
  const keywords = [
    'Altri Significati', 'Altre Traduzioni', 'Espressioni', 'Verbo Irregolare', 
    'Pronuncia', 'Sinonimi', 'Esempi', 'Attenzione', 'Nota', 'Importante',
    'Plurale irregolare', 'Tecnologia', 'Posizione', 'Contrario', 'Espressione',
    'Verbo', 'Phrasal verbs', 'Differenza', 'Abbreviazione', 'Sinonimo',
    'Tipico britannico', 'Vestiti', 'Preposizioni', 'Avverbio', 'Sostantivo',
    'Aggettivo', 'Congiunzione', 'Interiezione', 'Participio', 'Gerundio',
    'Passato', 'Presente', 'Futuro', 'Condizionale', 'Imperativo', 'Infinito',
    'Formale', 'Informale', 'Slang', 'Americano', 'Britannico', 'Australiano',
    'Tempo', 'Luogo', 'Modo', 'Causa', 'Effetto', 'Scopo', 'Confronto',
    'Origine', 'Destinazione', 'Materiale', 'Colore', 'Forma', 'Dimensione',
    'Quantità', 'Frequenza', 'Durata', 'Velocità', 'Temperatura', 'Peso',
    'Struttura', 'Espressione fissa', 'Figurativo', 'Specificità', 'Pattern',
    'Più specifico di'
  ];
  
  let formattedText = notes;
  
  keywords.forEach(keyword => {
    const regex = new RegExp(`(${keyword})\\s*:`, 'gi');
    formattedText = formattedText.replace(regex, `**$1:**`);
  });
  
  formattedText = formattedText.replace(/^([A-Za-z\s]+):/gm, '**$1:**');
  
  const parts = formattedText.split(/(\*\*[^*]+\*\*)/g);
  
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      const boldText = part.slice(2, -2);
      return React.createElement('span', { key: index, className: 'font-bold' }, boldText);
    }
    return part;
  });
};

export const getTestResult = (stats) => {
  const total = stats.correct + stats.incorrect;
  const percentage = total > 0 ? Math.round((stats.correct / total) * 100) : 0;
  
  if (percentage >= 80) {
    return { type: 'victory', message: 'Eccellente! 🏆', color: 'text-green-600', bgColor: 'bg-green-50' };
  } else if (percentage >= 60) {
    return { type: 'good', message: 'Buon lavoro! 👍', color: 'text-blue-600', bgColor: 'bg-blue-50' };
  } else {
    return { type: 'defeat', message: 'Continua a studiare! 📚', color: 'text-red-600', bgColor: 'bg-red-50' };
  }
};