import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import {
  Users,
  Shield,
  Download,
  Upload,
  RotateCcw,
  Trash2,
  Search,
  Filter,
  MoreVertical,
  CheckCircle,
  XCircle,
  Mail,
  Calendar,
} from "lucide-react";
import { useAuth, useUserRole } from "../../hooks/integration/useAuth";
import {
  User as UserProfile,
  UserManagementFilters,
  UserExportData,
  UserRole,
} from "../../types/entities/User.types";
import {
  getAllUsers,
  toggleUserStatus,
  resetUserPassword,
  deleteUserData as deleteUser,
} from "../../services/authService";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";

export const AdminPanel: React.FC = () => {
  // CORRECTED: Use useUserRole hook properly
  const { userProfile, isAdmin, role } = useUserRole();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [operationLoading, setOperationLoading] = useState<string | null>(null);

  // ===================================================
  // Data Management Functions - CORRECTED NAMES
  // ===================================================

  const exportData = async (user: UserProfile) => {
    try {
      setOperationLoading(`export-${user.id}`);

      // Implementation stub for export functionality
      const exportData: UserExportData = {
        profile: user,
        words: [], // Would be fetched from service
        testHistory: [], // Would be fetched from service
        statistics: [], // Would be fetched from service
        exportedAt: new Date(),
        exportedBy: userProfile?.id || "unknown",
      };

      // Create and download JSON file
      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `user-data-${user.email}-${
        new Date().toISOString().split("T")[0]
      }.json`;
      a.click();
      URL.revokeObjectURL(url);

    } catch (error) {
      console.error("Error exporting user data:", error);
    } finally {
      setOperationLoading(null);
    }
  };

  const importData = async (file: File) => {
    try {
      setOperationLoading("import");

      const text = await file.text();
      const data = JSON.parse(text);

      // Implementation stub for import functionality

      // Would implement actual import logic here
    } catch (error) {
      console.error("Error importing data:", error);
    } finally {
      setOperationLoading(null);
    }
  };

  // ===================================================
  // User Management Functions
  // ===================================================

  const handleToggleUserStatus = async (user: UserProfile) => {
    try {
      setOperationLoading(`toggle-${user.id}`);
      // CORRECTED: Added adminId parameter
      await toggleUserStatus(
        user.id,
        !user.isActive,
        userProfile?.id || "unknown"
      );
      await loadUsers();
    } catch (error) {
      console.error("Error toggling user status:", error);
    } finally {
      setOperationLoading(null);
    }
  };

  const handleResetPassword = async (user: UserProfile) => {
    try {
      setOperationLoading(`reset-${user.id}`);
      // CORRECTED: Added adminId parameter
      await resetUserPassword(user.email, userProfile?.id || "unknown");
    } catch (error) {
      console.error("Error resetting password:", error);
    } finally {
      setOperationLoading(null);
    }
  };

  const handleExportUserData = async (user: UserProfile) => {
    await exportData(user); // CORRECTED: Now calls exportData instead of exportUserData
  };

  const handleImportUserData = async (file: File) => {
    await importData(file); // CORRECTED: Now calls importData instead of importUserData
  };

  const handleDeleteUser = async (user: UserProfile) => {
    if (
      !window.confirm(`Are you sure you want to delete user ${user.email}?`)
    ) {
      return;
    }

    try {
      setOperationLoading(`delete-${user.id}`);
      // CORRECTED: Added adminId parameter
      await deleteUser(user.id, userProfile?.id || "unknown");
      await loadUsers();
    } catch (error) {
      console.error("Error deleting user:", error);
    } finally {
      setOperationLoading(null);
    }
  };

  const loadUsers = async () => {
    try {
      setLoading(true);
      const usersList = await getAllUsers();
      setUsers(usersList);
    } catch (error) {
      console.error("Error loading users:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      loadUsers();
    }
  }, [isAdmin]);

  // ===================================================
  // User Filtering
  // ===================================================

  const filteredUsers = users.filter((user) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      user.email.toLowerCase().includes(searchLower) ||
      user.displayName?.toLowerCase().includes(searchLower) ||
      user.id.toLowerCase().includes(searchLower)
    );
  });

  // ===================================================
  // Access Control Check
  // ===================================================

  if (!isAdmin) {
    return (
      <Card className="w-96 mx-auto mt-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <Shield className="w-6 h-6" />
            Accesso Negato
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">
            Non hai i permessi necessari per accedere al pannello di
            amministrazione.
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Contatta l'amministratore per maggiori informazioni.
          </p>
        </CardContent>
      </Card>
    );
  }

  // ===================================================
  // Admin Panel UI
  // ===================================================

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-6 h-6" />
            Pannello di Amministrazione
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Badge variant="default">
              Role: {role as UserRole}{" "}
              {/* CORRECTED: Proper UserRole type usage */}
            </Badge>
            <Badge variant="outline">Users: {users.length}</Badge>
            <Badge variant="outline">
              Active: {users.filter((u) => u.isActive).length}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Cerca per email, nome o ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users List */}
      <Card>
        <CardHeader>
          <CardTitle>Lista Utenti</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <p>Caricamento utenti...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Nessun utente trovato</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium">
                        {user.displayName?.charAt(0) || user.email.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-medium">
                        {user.displayName || "N/A"}
                      </h4>
                      <p className="text-sm text-gray-500">{user.email}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge
                          variant={
                            user.role === "admin" ? "default" : "secondary"
                          }
                        >
                          {user.role}
                        </Badge>
                        <Badge
                          variant={user.isActive ? "default" : "destructive"}
                        >
                          {user.isActive ? "Attivo" : "Disabilitato"}
                        </Badge>
                        {user.emailVerified && (
                          <Badge variant="outline">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Verificato
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem
                          onClick={() => handleToggleUserStatus(user)}
                          disabled={operationLoading === `toggle-${user.id}`}
                        >
                          {user.isActive ? "Disabilita" : "Attiva"}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleResetPassword(user)}
                          disabled={operationLoading === `reset-${user.id}`}
                        >
                          Reset Password
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleExportUserData(user)}
                          disabled={operationLoading === `export-${user.id}`}
                        >
                          Esporta Dati
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleDeleteUser(user)}
                          disabled={operationLoading === `delete-${user.id}`}
                          className="text-red-600"
                        >
                          Elimina Utente
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
