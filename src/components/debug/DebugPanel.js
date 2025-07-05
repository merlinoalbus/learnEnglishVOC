// =====================================================
// 📁 src/components/debug/DebugPanel.js - Error Detector
// =====================================================

import React from 'react';

export const DebugPanel = () => {
  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  const checkFirebaseSetup = () => {
    const checks = [];

    // Check Firebase config
    try {
      const firebase = require('../../config/firebase');
      checks.push({ name: 'Firebase Config', status: '✅', detail: 'Loaded' });
    } catch (error) {
      checks.push({ name: 'Firebase Config', status: '❌', detail: error.message });
    }

    // Check Firebase Service
    try {
      const { firebaseService } = require('../../services/firebaseService');
      checks.push({ name: 'Firebase Service', status: '✅', detail: 'Loaded' });
    } catch (error) {
      checks.push({ name: 'Firebase Service', status: '❌', detail: error.message });
    }

    // Check Auth Hook
    try {
      const { useFirebaseAuth } = require('../../hooks/useFirebaseAuth');
      checks.push({ name: 'Auth Hook', status: '✅', detail: 'Loaded' });
    } catch (error) {
      checks.push({ name: 'Auth Hook', status: '❌', detail: error.message });
    }

    // Check Words Hook
    try {
      const { useFirebaseWords } = require('../../hooks/useFirebaseWords');
      checks.push({ name: 'Words Hook', status: '✅', detail: 'Loaded' });
    } catch (error) {
      checks.push({ name: 'Words Hook', status: '❌', detail: error.message });
    }

    return checks;
  };

  const checks = checkFirebaseSetup();

  return (
    <div className="fixed top-0 left-0 right-0 bg-red-600 text-white p-2 z-50">
      <div className="max-w-7xl mx-auto">
        <div className="font-bold">🚨 Debug Panel - Firebase Setup Status</div>
        <div className="text-sm mt-1 flex gap-4">
          {checks.map((check, index) => (
            <span key={index}>
              {check.status} {check.name}: {check.detail}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};
