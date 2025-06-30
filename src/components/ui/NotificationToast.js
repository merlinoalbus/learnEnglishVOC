import React from 'react';
import { useNotification } from '../../contexts/NotificationContext';

export const NotificationToast = React.memo(() => {
  const { notifications } = useNotification();

  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-6 right-6 z-50 space-y-2">
      {notifications.map(notification => (
        <NotificationItem 
          key={notification.id} 
          notification={notification} 
        />
      ))}
    </div>
  );
});

const NotificationItem = React.memo(({ notification }) => {
  const typeStyles = {
    success: 'bg-gradient-to-r from-green-500 to-emerald-500',
    error: 'bg-gradient-to-r from-red-500 to-pink-500',
    warning: 'bg-gradient-to-r from-orange-500 to-yellow-500',
    info: 'bg-gradient-to-r from-blue-500 to-cyan-500'
  };

  const icons = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️'
  };

  return (
    <div className={`${typeStyles[notification.type]} text-white px-6 py-4 rounded-2xl shadow-2xl backdrop-blur-sm border border-white/20 animate-slide-in max-w-md`}>
      <div className="flex items-center gap-3">
        <span className="text-lg">{icons[notification.type]}</span>
        <span className="font-medium">{notification.message}</span>
      </div>
    </div>
  );
});