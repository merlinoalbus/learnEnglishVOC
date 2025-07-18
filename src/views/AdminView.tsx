import React, { useState, useEffect } from "react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Alert, AlertDescription } from "../components/ui/alert";
import {
  Shield,
  Users,
  Search,
  Edit2,
  Trash2,
  Ban,
  CheckCircle,
  AlertCircle,
  Key,
  Mail,
  Filter,
  Download,
  UserPlus,
  Eye,
  EyeOff,
} from "lucide-react";
import { useAuth, useUserRole } from "../hooks/integration/useAuth";
import { getAllUsers, deleteUserData, updateUserRole, updateUserStatus } from "../services/authService";
import { createUserAsAdmin, resetPasswordAsAdmin, generateSecurePassword, getPendingUserCreationsCount, type CreateUserRequest } from "../services/adminService";
import type { User } from "../types/entities/User.types";

// Using User interface from types

export const AdminView: React.FC = () => {
  const { isAdmin, userProfile } = useUserRole();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<"edit" | "delete" | "password" | "create">("edit");
  const [formData, setFormData] = useState({
    email: "",
    displayName: "",
    role: "user" as "user" | "admin",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [pendingCount, setPendingCount] = useState<number>(0);

  // Load real users data from Firebase and pending count
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        const [realUsers, pending] = await Promise.all([
          getAllUsers(),
          getPendingUserCreationsCount()
        ]);
        setUsers(realUsers);
        setPendingCount(pending);
      } catch (err) {
        console.error('Error loading data:', err);
        setError('Errore nel caricamento dati');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.displayName || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenModal = (type: typeof modalType, user?: User) => {
    setModalType(type);
    setSelectedUser(user || null);
    
    if (user) {
      setFormData({
        email: user.email,
        displayName: user.displayName || "",
        role: user.role,
        password: "",
        confirmPassword: "",
      });
    } else {
      setFormData({
        email: "",
        displayName: "",
        role: "user",
        password: "",
        confirmPassword: "",
      });
    }
    
    setShowModal(true);
    setMessage(null);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedUser(null);
    setFormData({
      email: "",
      displayName: "",
      role: "user",
      password: "",
      confirmPassword: "",
    });
    setMessage(null);
  };

  const handleToggleUserStatus = async (userId: string) => {
    if (!userProfile?.id) return;
    
    try {
      const user = users.find(u => u.id === userId);
      if (!user) return;
      
      await updateUserStatus(userId, !user.isActive, userProfile.id);
      
      setUsers(prev => prev.map(u => 
        u.id === userId ? { ...u, isActive: !u.isActive } : u
      ));
      setMessage({
        type: "success",
        text: `Utente ${user.isActive ? 'disattivato' : 'attivato'} con successo`
      });
    } catch (error) {
      setMessage({
        type: "error",
        text: "Errore nell'aggiornamento dello stato utente"
      });
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!userProfile?.id) return;
    
    // Prevent admin from deleting their own account
    if (userId === userProfile.id) {
      setMessage({
        type: "error",
        text: "Non puoi eliminare il tuo stesso account"
      });
      return;
    }
    
    try {
      await deleteUserData(userId, userProfile.id);
      
      setUsers(prev => prev.filter(user => user.id !== userId));
      setMessage({ type: "success", text: "Utente eliminato con successo" });
      handleCloseModal();
    } catch (error) {
      setMessage({
        type: "error",
        text: "Errore nell'eliminazione dell'utente"
      });
    }
  };

  const handleUpdateUser = async () => {
    if (!selectedUser || !userProfile?.id) return;

    try {
      // Update role if changed
      if (selectedUser.role !== formData.role) {
        await updateUserRole(selectedUser.id, formData.role, userProfile.id);
      }
      
      // Update display name if changed (through service layer)
      if (selectedUser.displayName !== formData.displayName) {
        // Note: This should be handled by a service function
        // For now keeping the direct update but ideally would be:
        // await updateUserDisplayName(selectedUser.id, formData.displayName);
      }

      setUsers(prev => prev.map(user => 
        user.id === selectedUser.id ? {
          ...user,
          displayName: formData.displayName,
          role: formData.role,
        } : user
      ));
      setMessage({ type: "success", text: "Utente aggiornato con successo" });
      handleCloseModal();
    } catch (error) {
      setMessage({
        type: "error",
        text: "Errore nell'aggiornamento dell'utente"
      });
    }
  };

  const handleCreateUser = async () => {
    if (!formData.email || !formData.displayName || !formData.password) {
      setMessage({ type: "error", text: "Email, nome e password sono obbligatori" });
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setMessage({ type: "error", text: "Le password non corrispondono" });
      return;
    }

    if (formData.password.length < 6) {
      setMessage({ type: "error", text: "La password deve contenere almeno 6 caratteri" });
      return;
    }

    try {
      setLoading(true);
      const userData: CreateUserRequest = {
        email: formData.email,
        displayName: formData.displayName,
        role: formData.role,
        password: formData.password,
      };

      const success = await createUserAsAdmin(userData, userProfile?.id || '');

      if (success) {
        setPendingCount(prev => prev + 1);
        setMessage({ 
          type: "success", 
          text: `Utente ${userData.displayName} aggiunto alla coda di creazione. Verrà creato al prossimo login dell'admin.` 
        });
        handleCloseModal();
      }
    } catch (error: any) {
      console.error("Error creating user:", error);
      let errorMessage = "Errore nella creazione dell'utente";
      
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = "Email già in uso da un altro account";
      } else if (error.code === 'auth/weak-password') {
        errorMessage = "Password troppo debole";
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = "Email non valida";
      }
      
      setMessage({
        type: "error",
        text: errorMessage
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!selectedUser?.email) {
      setMessage({ type: "error", text: "Email utente non trovata" });
      return;
    }

    try {
      setLoading(true);
      setMessage(null);
      
      const success = await resetPasswordAsAdmin(selectedUser.email);
      
      if (success) {
        setMessage({ 
          type: "success", 
          text: `Email di reset password inviata a ${selectedUser.email}. L'utente riceverà le istruzioni per reimpostare la password.` 
        });
        handleCloseModal();
      }
    } catch (error: any) {
      console.error("Error sending password reset email:", error);
      
      let errorMessage = "Errore nell'invio dell'email di reset";
      if (error.code === 'auth/user-not-found') {
        errorMessage = "Utente non trovato";
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = "Email non valida";
      }
      
      setMessage({
        type: "error",
        text: errorMessage
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: Date | undefined) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('it-IT', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-96">
          <CardContent className="p-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">Accesso Negato</h2>
            <p className="text-gray-600 dark:text-gray-400">Non hai i permessi per accedere a questa sezione.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Caricamento utenti...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-96">
          <CardContent className="p-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">Errore di Caricamento</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>
              Ricarica Pagina
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Shield className="w-8 h-8 text-purple-600" />
            Gestione Utenti
          </h1>
          <p className="text-gray-600 dark:text-gray-400">Amministra gli utenti registrati nella piattaforma</p>
        </div>
        <Button
          onClick={() => handleOpenModal("create")}
          className="bg-indigo-600 hover:bg-indigo-700"
        >
          <UserPlus className="w-4 h-4 mr-2" />
          Nuovo Utente
        </Button>
      </div>

      {/* Pending Users Alert */}
      {pendingCount > 0 && (
        <Alert className="border-orange-200 bg-orange-50">
          <UserPlus className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            Ci sono <strong>{pendingCount}</strong> utenti in coda di creazione. Verranno creati al prossimo logout/login dell'admin.
          </AlertDescription>
        </Alert>
      )}

      {/* Message */}
      {message && (
        <Alert className={message.type === "success" ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
          {message.type === "success" ? (
            <CheckCircle className="h-4 w-4 text-green-600" />
          ) : (
            <AlertCircle className="h-4 w-4 text-red-600" />
          )}
          <AlertDescription className={message.type === "success" ? "text-green-800" : "text-red-800"}>
            {message.text}
          </AlertDescription>
        </Alert>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Totale Utenti</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{users.length}</p>
              </div>
              <Users className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Utenti Attivi</p>
                <p className="text-2xl font-bold text-green-600">{users.filter(u => u.isActive).length}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Amministratori</p>
                <p className="text-2xl font-bold text-purple-600">{users.filter(u => u.role === "admin").length}</p>
              </div>
              <Shield className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Utenti in Coda</p>
                <p className="text-2xl font-bold text-orange-600">{pendingCount}</p>
              </div>
              <UserPlus className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and User List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Lista Utenti
            </CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Cerca utenti..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              <Button variant="outline" size="sm">
                <Filter className="w-4 h-4 mr-2" />
                Filtri
              </Button>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Esporta
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 font-medium text-gray-900 dark:text-gray-100">Utente</th>
                  <th className="text-left p-3 font-medium text-gray-900 dark:text-gray-100">Ruolo</th>
                  <th className="text-left p-3 font-medium text-gray-900 dark:text-gray-100">Stato</th>
                  <th className="text-left p-3 font-medium text-gray-900 dark:text-gray-100">Registrato</th>
                  <th className="text-left p-3 font-medium text-gray-900 dark:text-gray-100">Ultimo Login</th>
                  <th className="text-center p-3 font-medium text-gray-900 dark:text-gray-100">Azioni</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                          {(user.displayName || user.email).charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900 dark:text-gray-100">{user.displayName || "Utente"}</div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                        user.role === "admin" 
                          ? "bg-purple-100 text-purple-700" 
                          : "bg-blue-100 text-blue-700"
                      }`}>
                        {user.role === "admin" ? <Shield className="w-3 h-3" /> : <Users className="w-3 h-3" />}
                        {user.role === "admin" ? "Admin" : "Utente"}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                          user.isActive 
                            ? "bg-green-100 text-green-700" 
                            : "bg-red-100 text-red-700"
                        }`}>
                          {user.isActive ? "Attivo" : "Disattivo"}
                        </span>
                        {user.emailVerified && (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        )}
                      </div>
                    </td>
                    <td className="p-3 text-sm text-gray-600 dark:text-gray-400">
                      {formatDate(user.createdAt)}
                    </td>
                    <td className="p-3 text-sm text-gray-600 dark:text-gray-400">
                      {formatDate(user.lastLoginAt)}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center justify-center gap-2">
                        <Button
                          onClick={() => handleOpenModal("edit", user)}
                          variant="ghost"
                          size="sm"
                          title="Modifica utente"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          onClick={() => handleOpenModal("password", user)}
                          variant="ghost"
                          size="sm"
                          title="Reimposta password"
                        >
                          <Key className="w-4 h-4" />
                        </Button>
                        <Button
                          onClick={() => handleToggleUserStatus(user.id)}
                          variant="ghost"
                          size="sm"
                          title={user.isActive ? "Disattiva utente" : "Attiva utente"}
                        >
                          <Ban className="w-4 h-4" />
                        </Button>
                        <Button
                          onClick={() => handleOpenModal("delete", user)}
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                          title={user.id === userProfile?.id ? "Non puoi eliminare il tuo account" : "Elimina utente"}
                          disabled={user.id === userProfile?.id}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">
              {modalType === "create" && "Crea Nuovo Utente"}
              {modalType === "edit" && "Modifica Utente"}
              {modalType === "password" && "Reimposta Password"}
              {modalType === "delete" && "Elimina Utente"}
            </h3>

            {modalType === "delete" ? (
              <div className="space-y-4">
                <p className="text-gray-600 dark:text-gray-400">
                  Sei sicuro di voler eliminare l'utente <strong>{selectedUser?.displayName}</strong>?
                  Questa azione non può essere annullata.
                </p>
                <div className="flex justify-end gap-2">
                  <Button onClick={handleCloseModal} variant="outline">
                    Annulla
                  </Button>
                  <Button 
                    onClick={() => handleDeleteUser(selectedUser?.id || "")}
                    variant="destructive"
                  >
                    Elimina
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {(modalType === "create" || modalType === "edit") && (
                  <>
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                        disabled={modalType === "edit"}
                      />
                    </div>
                    <div>
                      <Label htmlFor="displayName">Nome</Label>
                      <Input
                        id="displayName"
                        value={formData.displayName}
                        onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="role">Ruolo</Label>
                      <select
                        id="role"
                        value={formData.role}
                        onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value as "user" | "admin" }))}
                        className="w-full p-2 border border-gray-300 rounded-md"
                      >
                        <option value="user">Utente</option>
                        <option value="admin">Amministratore</option>
                      </select>
                    </div>
                  </>
                )}

                {modalType === "create" && (
                  <>
                    <div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="password">Password</Label>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const newPassword = generateSecurePassword();
                            setFormData(prev => ({ 
                              ...prev, 
                              password: newPassword,
                              confirmPassword: newPassword
                            }));
                          }}
                        >
                          Genera
                        </Button>
                      </div>
                      <div className="relative">
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          value={formData.password}
                          onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                          className="pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-gray-400"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="confirmPassword">Conferma Password</Label>
                      <Input
                        id="confirmPassword"
                        type={showPassword ? "text" : "password"}
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      />
                    </div>
                  </>
                )}

                {modalType === "password" && (
                  <div className="space-y-4">
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                      <div className="flex items-start space-x-3">
                        <Mail className="w-5 h-5 text-blue-600 mt-0.5" />
                        <div>
                          <h4 className="font-medium text-blue-900 dark:text-blue-100">Reset Password</h4>
                          <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                            Verrà inviata un'email di reset password a <strong>{selectedUser?.email}</strong>.
                            L'utente riceverà un link sicuro per impostare una nuova password.
                          </p>
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Questa operazione invierà immediatamente un'email con le istruzioni per il reset della password.
                      L'utente potrà scegliere liberamente la nuova password seguendo il link ricevuto.
                    </p>
                  </div>
                )}


                {message && (
                  <Alert className={message.type === "success" ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
                    <AlertDescription className={message.type === "success" ? "text-green-800" : "text-red-800"}>
                      {message.text}
                    </AlertDescription>
                  </Alert>
                )}

                <div className="flex justify-end gap-2">
                  <Button onClick={handleCloseModal} variant="outline">
                    Annulla
                  </Button>
                  <Button 
                    onClick={() => {
                      if (modalType === "create") handleCreateUser();
                      else if (modalType === "edit") handleUpdateUser();
                      else if (modalType === "password") handleResetPassword();
                    }}
                  >
                    {modalType === "create" && "Crea"}
                    {modalType === "edit" && "Salva"}
                    {modalType === "password" && "Reimposta"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};