import React, { useState, useRef } from "react";
import { createPortal } from "react-dom";
import { useAppContext } from "../../contexts/AppContext";
import { useAuth, useUserRole } from "../../hooks/integration/useAuth";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import {
  Brain,
  BarChart3,
  Shield,
  User,
  LogOut,
  Settings,
  ChevronDown,
  CheckCircle,
} from "lucide-react";

export const AppNavigation = React.memo(() => {
  const { currentView, dispatch, testHistory } = useAppContext();
  const { signOut: handleSignOut, loading: authLoading, user, authUser } = useAuth();
  const { userProfile, isAdmin, role } = useUserRole();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, right: 0 });
  const userButtonRef = useRef<HTMLButtonElement>(null);

  const navItems = [
    {
      id: "main",
      label: "Studio & Vocabolario",
      icon: Brain,
      color: "from-blue-500 to-purple-600",
      requireAuth: true,
    },
    {
      id: "stats",
      label: "Statistiche Complete",
      icon: BarChart3,
      color: "from-purple-500 to-pink-600",
      badge: testHistory.length > 0 ? testHistory.length : null,
      requireAuth: true,
    },
    ...(isAdmin
      ? [
          {
            id: "admin",
            label: "Pannello Admin",
            icon: Shield,
            color: "from-red-500 to-orange-600",
            requireAuth: true,
            requiredRole: "admin" as const,
          },
        ]
      : []),
  ];

  const handleSignOutClick = async () => {
    try {
      await handleSignOut();
      // Il router si occuperà di reindirizzare all'AuthView
    } catch (error) {
      console.error("Errore durante il logout:", error);
    }
  };

  const getDisplayName = () => {
    return (
      userProfile?.displayName || 
      user?.displayName || 
      authUser?.displayName || 
      userProfile?.email?.split("@")[0] || 
      user?.email?.split("@")[0] || 
      authUser?.email?.split("@")[0] || 
      "Utente"
    );
  };
  
  const getEmail = () => {
    return (
      userProfile?.email || 
      user?.email || 
      authUser?.email || 
      "Caricamento..."
    );
  };

  const getRoleDisplay = () => {
    return role === "admin" ? "Amministratore" : "Utente";
  };

  const toggleUserMenu = () => {
    if (!showUserMenu && userButtonRef.current) {
      const rect = userButtonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 8,
        right: window.innerWidth - rect.right
      });
    }
    setShowUserMenu(!showUserMenu);
  };

  return (
    <Card className="backdrop-blur-sm bg-white/90 dark:bg-gray-800/90 border-0 shadow-xl rounded-3xl overflow-hidden">
      <CardContent className="p-2">
        <div className="flex items-center justify-between gap-2 p-2">
          {/* Navigation Items */}
          <div className="flex gap-2 flex-1">
            {navItems.map((item) => (
              <Button
                key={item.id}
                onClick={() => dispatch({ type: "SET_VIEW", payload: item.id as any })}
                className={`flex items-center gap-2 py-4 px-4 rounded-2xl text-base font-semibold transition-all duration-300 relative ${
                  currentView === item.id
                    ? `bg-gradient-to-r ${item.color} text-white shadow-lg transform scale-105`
                    : "bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-300"
                }`}
                disabled={authLoading}
              >
                <item.icon className="w-5 h-5" />
                <span className="hidden md:inline">{item.label}</span>
                {item.badge && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {item.badge}
                  </span>
                )}
              </Button>
            ))}
          </div>

          {/* User Menu */}
          <div className="relative">
            <Button
              ref={userButtonRef}
              onClick={toggleUserMenu}
              variant="ghost"
              className="flex items-center gap-2 py-3 px-4 rounded-2xl bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 hover:from-gray-200 hover:to-gray-300 dark:hover:from-gray-600 dark:hover:to-gray-500 transition-all duration-300 border-0"
              disabled={authLoading}
            >
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                {getDisplayName().charAt(0).toUpperCase()}
              </div>
              <div className="hidden md:flex flex-col items-start">
                <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                  {getDisplayName()}
                </span>
                <span className="text-xs text-gray-600 dark:text-gray-400">
                  {getRoleDisplay()}
                </span>
              </div>
              <ChevronDown
                className={`w-4 h-4 text-gray-600 dark:text-gray-400 transition-transform duration-200 ${
                  showUserMenu ? "rotate-180" : ""
                }`}
              />
            </Button>

            {/* User Dropdown Menu - Using Portal */}
            {showUserMenu && createPortal(
              <div 
                className="fixed w-80 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 z-[9999] overflow-hidden"
                style={{
                  top: `${dropdownPosition.top}px`,
                  right: `${dropdownPosition.right}px`
                }}
              >
                {/* Header with User Info */}
                <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-6 text-white">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center text-white text-xl font-bold shadow-lg">
                      {getDisplayName().charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <div className="font-bold text-lg text-white">
                        {getDisplayName()}
                      </div>
                      <div className="text-indigo-100 text-sm">
                        {getEmail()}
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-white/20 text-white">
                          {role === "admin" ? (
                            <Shield className="w-3 h-3" />
                          ) : (
                            <User className="w-3 h-3" />
                          )}
                          {getRoleDisplay()}
                        </span>
                        {(userProfile?.emailVerified || user?.emailVerified || authUser?.emailVerified) && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-400/20 text-green-100">
                            <CheckCircle className="w-3 h-3" />
                            Verificato
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* User Stats */}
                <div className="p-4 border-b border-gray-100 dark:border-gray-700">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-indigo-600 dark:text-purple-400">
                        {testHistory.length}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">Test completati</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-indigo-600 dark:text-purple-400">
                        {(userProfile?.createdAt || user?.createdAt) ? 
                          Math.floor((Date.now() - new Date(userProfile?.createdAt || user?.createdAt!).getTime()) / (1000 * 60 * 60 * 24)) 
                          : 0
                        }
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">Giorni di studio</div>
                    </div>
                  </div>
                </div>

                {/* Menu Items */}
                <div className="p-2">
                  <Button
                    onClick={() => {
                      setShowUserMenu(false);
                      dispatch({ type: "SET_VIEW", payload: "profile" });
                    }}
                    variant="ghost"
                    className="w-full justify-start gap-3 py-3 px-3 rounded-xl font-medium text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <User className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                    <span>Il mio profilo</span>
                  </Button>

                  <Button
                    onClick={() => {
                      setShowUserMenu(false);
                      dispatch({ type: "SET_VIEW", payload: "settings" });
                    }}
                    variant="ghost"
                    className="w-full justify-start gap-3 py-3 px-3 rounded-xl font-medium text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <Settings className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                    <span>Impostazioni</span>
                  </Button>

                  {isAdmin && (
                    <Button
                      onClick={() => {
                        setShowUserMenu(false);
                        dispatch({ type: "SET_VIEW", payload: "admin" });
                      }}
                      variant="ghost"
                      className="w-full justify-start gap-3 py-3 px-3 rounded-xl font-medium text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/30"
                    >
                      <Shield className="w-4 h-4 text-purple-500 dark:text-purple-400" />
                      <span>Gestione Utenti</span>
                    </Button>
                  )}

                  <div className="border-t border-gray-100 dark:border-gray-700 mt-2 pt-2">
                    <Button
                      onClick={() => {
                        setShowUserMenu(false);
                        handleSignOutClick();
                      }}
                      variant="ghost"
                      className="w-full justify-start gap-3 py-3 px-3 rounded-xl font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-700 dark:hover:text-red-300"
                      disabled={authLoading}
                    >
                      <LogOut className="w-4 h-4" />
                      <span>
                        {authLoading ? "Disconnessione..." : "Esci"}
                      </span>
                    </Button>
                  </div>
                </div>
              </div>,
              document.body
            )}
          </div>
        </div>
      </CardContent>

      {/* Click outside to close menu - Also in Portal */}
      {showUserMenu && createPortal(
        <div
          className="fixed inset-0 z-[9998]"
          onClick={() => setShowUserMenu(false)}
        />,
        document.body
      )}
    </Card>
  );
});
