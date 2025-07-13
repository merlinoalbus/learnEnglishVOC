import React, { useState } from "react";
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
  const { signOut: handleSignOut, loading: authLoading } = useAuth();
  const { userProfile, isAdmin, role } = useUserRole();
  const [showUserMenu, setShowUserMenu] = useState(false);

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
      userProfile?.displayName || userProfile?.email?.split("@")[0] || "Utente"
    );
  };

  const getRoleDisplay = () => {
    return role === "admin" ? "Amministratore" : "Utente";
  };

  const toggleUserMenu = () => {
    setShowUserMenu(!showUserMenu);
  };

  return (
    <Card className="backdrop-blur-sm bg-white/90 border-0 shadow-xl rounded-3xl overflow-hidden">
      <CardContent className="p-2">
        <div className="flex items-center justify-between gap-2 p-2">
          {/* Navigation Items */}
          <div className="flex gap-2 flex-1">
            {navItems.map((item) => (
              <Button
                key={item.id}
                onClick={() => dispatch({ type: "SET_VIEW", payload: item.id })}
                className={`flex items-center gap-2 py-4 px-4 rounded-2xl text-base font-semibold transition-all duration-300 relative ${
                  currentView === item.id
                    ? `bg-gradient-to-r ${item.color} text-white shadow-lg transform scale-105`
                    : "bg-gray-100 hover:bg-gray-200 text-gray-700"
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
              onClick={toggleUserMenu}
              className="flex items-center gap-2 py-3 px-4 rounded-2xl bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 text-gray-700 transition-all duration-300"
              disabled={authLoading}
            >
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                {getDisplayName().charAt(0).toUpperCase()}
              </div>
              <div className="hidden md:flex flex-col items-start">
                <span className="text-sm font-semibold">
                  {getDisplayName()}
                </span>
                <span className="text-xs text-gray-500">
                  {getRoleDisplay()}
                </span>
              </div>
              <ChevronDown
                className={`w-4 h-4 transition-transform duration-200 ${
                  showUserMenu ? "rotate-180" : ""
                }`}
              />
            </Button>

            {/* User Dropdown Menu */}
            {showUserMenu && (
              <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-xl border border-gray-200 z-50">
                <div className="p-4 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-lg font-bold">
                      {getDisplayName().charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">
                        {getDisplayName()}
                      </h4>
                      <p className="text-sm text-gray-500">
                        {userProfile?.email}
                      </p>
                      <div className="flex items-center gap-1 mt-1">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                            role === "admin"
                              ? "bg-red-100 text-red-700"
                              : "bg-blue-100 text-blue-700"
                          }`}
                        >
                          {role === "admin" ? (
                            <Shield className="w-3 h-3" />
                          ) : (
                            <User className="w-3 h-3" />
                          )}
                          {getRoleDisplay()}
                        </span>
                        {userProfile?.emailVerified && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                            <CheckCircle className="w-3 h-3" />
                            Verificato
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-2">
                  <Button
                    onClick={() => {
                      setShowUserMenu(false);
                      // Qui potresti aggiungere una vista profilo in futuro
                    }}
                    className="w-full justify-start gap-3 py-3 px-3 rounded-xl bg-transparent hover:bg-gray-50 text-gray-700"
                  >
                    <Settings className="w-4 h-4" />
                    Impostazioni Profilo
                  </Button>

                  <Button
                    onClick={() => {
                      setShowUserMenu(false);
                      handleSignOutClick();
                    }}
                    className="w-full justify-start gap-3 py-3 px-3 rounded-xl bg-transparent hover:bg-red-50 text-red-600"
                    disabled={authLoading}
                  >
                    <LogOut className="w-4 h-4" />
                    {authLoading ? "Disconnessione..." : "Esci"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>

      {/* Click outside to close menu */}
      {showUserMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowUserMenu(false)}
        />
      )}
    </Card>
  );
});
