import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Switch } from "./ui/switch";
import { Separator } from "./ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog";
import { 
  User, 
  Mail, 
  Phone, 
  Building2, 
  Bell, 
  Lock, 
  Palette,
  Save,
  AlertCircle,
  Users,
  Settings2,
  Wrench,
  Plus,
  Pencil,
  Trash2,
  ShieldCheck
} from "lucide-react";
import { useState, useEffect } from "react";
import { apiService } from "../services/api";
import { Loader2 } from "lucide-react";

type UserRole = "Approver" | "NPD" | "Maintenance" | "Spares" | "Indentor";

interface SettingsProps {
  userRole: UserRole;
  activeSection?: string;
}

interface PartNumberConfig {
  id: string;
  prefix: string;
  format: string;
  example: string;
  autoIncrement: boolean;
  createdAt: string;
}

interface ToolNumberConfig {
  id: string;
  prefix: string;
  format: string;
  example: string;
  autoIncrement: boolean;
  createdAt: string;
}

export function Settings({ userRole, activeSection = "settings-user-management" }: SettingsProps) {
  // Map settings-* IDs to section names
  const sectionMap: { [key: string]: string } = {
    "settings": "user-management",
    "settings-user-management": "user-management",
    "settings-enterprise": "enterprise",
    "settings-configuration": "configuration",
    "settings-preferences": "preferences",
  };
  
  const activeTab = sectionMap[activeSection] || "user-management";

  // Configuration sub-tab state
  const [configTab, setConfigTab] = useState<"part-number" | "tool-number" | "bom">("part-number");

  // Dialog states
  const [partNumberDialogOpen, setPartNumberDialogOpen] = useState(false);
  const [toolNumberDialogOpen, setToolNumberDialogOpen] = useState(false);
  const [addUserDialogOpen, setAddUserDialogOpen] = useState(false);
  const [editUserDialogOpen, setEditUserDialogOpen] = useState(false);
  const [addRoleDialogOpen, setAddRoleDialogOpen] = useState(false);
  const [addDepartmentDialogOpen, setAddDepartmentDialogOpen] = useState(false);
  const [editDepartmentDialogOpen, setEditDepartmentDialogOpen] = useState(false);
  const [addBomDialogOpen, setAddBomDialogOpen] = useState(false);
  const [editBomDialogOpen, setEditBomDialogOpen] = useState(false);
  const [editPartNumberDialogOpen, setEditPartNumberDialogOpen] = useState(false);
  const [editToolNumberDialogOpen, setEditToolNumberDialogOpen] = useState(false);

  // Loading and error states
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  
  // Roles state
  const [roles, setRoles] = useState<any[]>([]);
  const [isLoadingRoles, setIsLoadingRoles] = useState(false);
  const [rolesError, setRolesError] = useState<string | null>(null);
  const [editRoleDialogOpen, setEditRoleDialogOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<any>(null);

  // Form states for Part Number
  const [newPartPrefix, setNewPartPrefix] = useState("");
  const [newPartFormat, setNewPartFormat] = useState("");
  const [newPartAutoIncrement, setNewPartAutoIncrement] = useState(true);

  // Form states for Tool Number
  const [newToolPrefix, setNewToolPrefix] = useState("");
  const [newToolFormat, setNewToolFormat] = useState("");
  const [newToolAutoIncrement, setNewToolAutoIncrement] = useState(true);

  // Form states for Edit Part Number
  const [editPartNumberId, setEditPartNumberId] = useState<string | null>(null);
  const [editPartPrefix, setEditPartPrefix] = useState("");
  const [editPartFormat, setEditPartFormat] = useState("");
  const [editPartAutoIncrement, setEditPartAutoIncrement] = useState(true);

  // Form states for Edit Tool Number
  const [editToolNumberId, setEditToolNumberId] = useState<string | null>(null);
  const [editToolPrefix, setEditToolPrefix] = useState("");
  const [editToolFormat, setEditToolFormat] = useState("");
  const [editToolAutoIncrement, setEditToolAutoIncrement] = useState(true);

  // Form states for Add User
  const [newUserFirstName, setNewUserFirstName] = useState("");
  const [newUserLastName, setNewUserLastName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserRole, setNewUserRole] = useState<UserRole>("NPD");
  const [newUserEmployeeId, setNewUserEmployeeId] = useState("");
  const [newUserPhone, setNewUserPhone] = useState("");
  const [newUserDepartment, setNewUserDepartment] = useState("");

  // Form states for Edit User
  const [editUserFirstName, setEditUserFirstName] = useState("");
  const [editUserLastName, setEditUserLastName] = useState("");
  const [editUserPhone, setEditUserPhone] = useState("");
  const [editUserDepartment, setEditUserDepartment] = useState("");
  const [editUserRole, setEditUserRole] = useState<UserRole>("NPD");
  const [editUserStatus, setEditUserStatus] = useState("Active");

  // Form states for Add Role
  const [newRoleName, setNewRoleName] = useState("");
  const [newRoleDescription, setNewRoleDescription] = useState("");
  const [newRolePermissions, setNewRolePermissions] = useState("");

  // Form states for Edit Role
  const [editRoleName, setEditRoleName] = useState("");
  const [editRoleDescription, setEditRoleDescription] = useState("");
  const [editRolePermissions, setEditRolePermissions] = useState("");
  const [editRoleStatus, setEditRoleStatus] = useState("Active");

  // Form states for Add Department
  const [newDepartmentName, setNewDepartmentName] = useState("");
  const [newDepartmentHead, setNewDepartmentHead] = useState("");
  const [newDepartmentDescription, setNewDepartmentDescription] = useState("");

  // Form states for Edit Department
  const [editDepartmentId, setEditDepartmentId] = useState<string | null>(null);
  const [editDepartmentName, setEditDepartmentName] = useState("");
  const [editDepartmentHead, setEditDepartmentHead] = useState("");
  const [editDepartmentDescription, setEditDepartmentDescription] = useState("");

  // Form states for Add BOM Item
  const [newBomItemName, setNewBomItemName] = useState("");
  const [newBomCategory, setNewBomCategory] = useState("");
  const [newBomUnit, setNewBomUnit] = useState("");
  const [newBomUnitPrice, setNewBomUnitPrice] = useState("");
  const [newBomSupplier, setNewBomSupplier] = useState("");
  const [newBomPartNumber, setNewBomPartNumber] = useState("");
  const [newBomToolNumber, setNewBomToolNumber] = useState("");

  // Form states for Edit BOM Item
  const [editBomId, setEditBomId] = useState<string | null>(null);
  const [editBomItemName, setEditBomItemName] = useState("");
  const [editBomCategory, setEditBomCategory] = useState("");
  const [editBomUnit, setEditBomUnit] = useState("");
  const [editBomUnitPrice, setEditBomUnitPrice] = useState("");
  const [editBomSupplier, setEditBomSupplier] = useState("");
  const [editBomPartNumber, setEditBomPartNumber] = useState("");
  const [editBomToolNumber, setEditBomToolNumber] = useState("");

  // User Management state
  const [users, setUsers] = useState<any[]>([]);

  // Departments state
  const [departments, setDepartments] = useState<any[]>([]);
  const [isLoadingDepartments, setIsLoadingDepartments] = useState(false);
  const [departmentsError, setDepartmentsError] = useState<string | null>(null);

  // Part Number Configuration state
  const [partNumberConfig, setPartNumberConfig] = useState<PartNumberConfig[]>([]);
  const [isLoadingPartNumberConfig, setIsLoadingPartNumberConfig] = useState(false);
  const [partNumberConfigError, setPartNumberConfigError] = useState<string | null>(null);

  // Tool Number Configuration state
  const [toolNumberConfig, setToolNumberConfig] = useState<ToolNumberConfig[]>([]);
  const [isLoadingToolNumberConfig, setIsLoadingToolNumberConfig] = useState(false);
  const [toolNumberConfigError, setToolNumberConfigError] = useState<string | null>(null);

  // BOM items state
  const [bomItems, setBomItems] = useState<any[]>([]);
  const [isLoadingBomItems, setIsLoadingBomItems] = useState(false);
  const [bomItemsError, setBomItemsError] = useState<string | null>(null);

  // User Preferences state
  const [preferences, setPreferences] = useState<any>({
    emailNotifications: true,
    newPrCreation: true,
    quotationUpdates: true,
    approvalRequests: true,
    lowStockAlerts: true,
    compactView: true,
    showCurrencyAsINR: true,
    autoRefreshDashboard: true,
  });
  const [isLoadingPreferences, setIsLoadingPreferences] = useState(false);
  const [isSavingPreferences, setIsSavingPreferences] = useState(false);
  const [preferencesError, setPreferencesError] = useState<string | null>(null);

  // Helper function to generate example from format
  const generateExample = (format: string, prefix: string) => {
    const year = new Date().getFullYear();
    return format.replace(prefix, prefix).replace("YYYY", year.toString()).replace("XXXX", "0001");
  };

  // Handle Add Part Number
  const handleAddPartNumber = async () => {
    if (!newPartPrefix || !newPartFormat) {
      alert('Please fill in all required fields (Prefix and Format)');
      return;
    }

    setIsLoadingPartNumberConfig(true);
    setPartNumberConfigError(null);
    try {
      const configData = {
        prefix: newPartPrefix,
        format: newPartFormat,
        autoIncrement: newPartAutoIncrement,
      };

      await apiService.createPartNumberConfig(configData);
      
      // Refresh part number configs list
      const fetchedConfigs = await apiService.getPartNumberConfigs();
      setPartNumberConfig(fetchedConfigs);
      
      setPartNumberDialogOpen(false);
      setNewPartPrefix("");
      setNewPartFormat("");
      setNewPartAutoIncrement(true);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create part number configuration';
      setPartNumberConfigError(errorMessage);
      alert(errorMessage);
      console.error('Error creating part number configuration:', err);
    } finally {
      setIsLoadingPartNumberConfig(false);
    }
  };

  // Handle Add Tool Number
  const handleAddToolNumber = async () => {
    if (!newToolPrefix || !newToolFormat) {
      alert('Please fill in all required fields (Prefix and Format)');
      return;
    }

    setIsLoadingToolNumberConfig(true);
    setToolNumberConfigError(null);
    try {
      const configData = {
        prefix: newToolPrefix,
        format: newToolFormat,
        autoIncrement: newToolAutoIncrement,
      };

      await apiService.createToolNumberConfig(configData);
      
      // Refresh tool number configs list
      const fetchedConfigs = await apiService.getToolNumberConfigs();
      setToolNumberConfig(fetchedConfigs);
      
      setToolNumberDialogOpen(false);
      setNewToolPrefix("");
      setNewToolFormat("");
      setNewToolAutoIncrement(true);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create tool number configuration';
      setToolNumberConfigError(errorMessage);
      alert(errorMessage);
      console.error('Error creating tool number configuration:', err);
    } finally {
      setIsLoadingToolNumberConfig(false);
    }
  };

  // Handle Delete Part Number
  const handleDeletePartNumber = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this part number configuration?')) {
      return;
    }

    setIsLoadingPartNumberConfig(true);
    setPartNumberConfigError(null);
    try {
      await apiService.deletePartNumberConfig(id);
      
      // Refresh part number configs list
      const fetchedConfigs = await apiService.getPartNumberConfigs();
      setPartNumberConfig(fetchedConfigs);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete part number configuration';
      setPartNumberConfigError(errorMessage);
      alert(errorMessage);
      console.error('Error deleting part number configuration:', err);
    } finally {
      setIsLoadingPartNumberConfig(false);
    }
  };

  // Handle Delete Tool Number
  const handleDeleteToolNumber = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this tool number configuration?')) {
      return;
    }

    setIsLoadingToolNumberConfig(true);
    setToolNumberConfigError(null);
    try {
      await apiService.deleteToolNumberConfig(id);
      
      // Refresh tool number configs list
      const fetchedConfigs = await apiService.getToolNumberConfigs();
      setToolNumberConfig(fetchedConfigs);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete tool number configuration';
      setToolNumberConfigError(errorMessage);
      alert(errorMessage);
      console.error('Error deleting tool number configuration:', err);
    } finally {
      setIsLoadingToolNumberConfig(false);
    }
  };

  // Handle Edit Part Number
  const handleEditPartNumber = (config: PartNumberConfig) => {
    setEditPartNumberId(config.id);
    setEditPartPrefix(config.prefix);
    setEditPartFormat(config.format);
    setEditPartAutoIncrement(config.autoIncrement);
    setEditPartNumberDialogOpen(true);
  };

  const handleSavePartNumber = async () => {
    if (!editPartPrefix || !editPartFormat || editPartNumberId === null) {
      alert('Please fill in all required fields');
      return;
    }

    setIsLoadingPartNumberConfig(true);
    setPartNumberConfigError(null);
    try {
      const configData = {
        prefix: editPartPrefix,
        format: editPartFormat,
        autoIncrement: editPartAutoIncrement,
      };

      await apiService.updatePartNumberConfig(editPartNumberId, configData);
      
      // Refresh part number configs list
      const fetchedConfigs = await apiService.getPartNumberConfigs();
      setPartNumberConfig(fetchedConfigs);
      
      setEditPartNumberDialogOpen(false);
      setEditPartNumberId(null);
      setEditPartPrefix("");
      setEditPartFormat("");
      setEditPartAutoIncrement(true);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update part number configuration';
      setPartNumberConfigError(errorMessage);
      alert(errorMessage);
      console.error('Error updating part number configuration:', err);
    } finally {
      setIsLoadingPartNumberConfig(false);
    }
  };

  // Handle Edit Tool Number
  const handleEditToolNumber = (config: ToolNumberConfig) => {
    setEditToolNumberId(config.id);
    setEditToolPrefix(config.prefix);
    setEditToolFormat(config.format);
    setEditToolAutoIncrement(config.autoIncrement);
    setEditToolNumberDialogOpen(true);
  };

  const handleSaveToolNumber = async () => {
    if (!editToolPrefix || !editToolFormat || editToolNumberId === null) {
      alert('Please fill in all required fields');
      return;
    }

    setIsLoadingToolNumberConfig(true);
    setToolNumberConfigError(null);
    try {
      const configData = {
        prefix: editToolPrefix,
        format: editToolFormat,
        autoIncrement: editToolAutoIncrement,
      };

      await apiService.updateToolNumberConfig(editToolNumberId, configData);
      
      // Refresh tool number configs list
      const fetchedConfigs = await apiService.getToolNumberConfigs();
      setToolNumberConfig(fetchedConfigs);
      
      setEditToolNumberDialogOpen(false);
      setEditToolNumberId(null);
      setEditToolPrefix("");
      setEditToolFormat("");
      setEditToolAutoIncrement(true);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update tool number configuration';
      setToolNumberConfigError(errorMessage);
      alert(errorMessage);
      console.error('Error updating tool number configuration:', err);
    } finally {
      setIsLoadingToolNumberConfig(false);
    }
  };

  // Fetch users on mount
  useEffect(() => {
    const fetchUsers = async () => {
      if (userRole !== "Approver") return; // Only Approvers can manage users
      
      setIsLoadingUsers(true);
      setUsersError(null);
      try {
        const fetchedUsers = await apiService.getUsers(true); // Include inactive users
        setUsers(fetchedUsers);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch users';
        setUsersError(errorMessage);
        console.error('Error fetching users:', err);
      } finally {
        setIsLoadingUsers(false);
      }
    };

    if (activeTab === "user-management") {
      fetchUsers();
    }
  }, [activeTab, userRole]);

  // Fetch roles on mount
  useEffect(() => {
    const fetchRoles = async () => {
      if (userRole !== "Approver") return; // Only Approvers can manage roles
      
      setIsLoadingRoles(true);
      setRolesError(null);
      try {
        const fetchedRoles = await apiService.getRoles(true); // Include inactive roles
        setRoles(fetchedRoles);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch roles';
        setRolesError(errorMessage);
        console.error('Error fetching roles:', err);
      } finally {
        setIsLoadingRoles(false);
      }
    };

    if (activeTab === "user-management") {
      fetchRoles();
    }
  }, [activeTab, userRole]);

  // Fetch departments on mount
  useEffect(() => {
    const fetchDepartments = async () => {
      setIsLoadingDepartments(true);
      setDepartmentsError(null);
      try {
        const fetchedDepartments = await apiService.getDepartments();
        setDepartments(fetchedDepartments);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch departments';
        setDepartmentsError(errorMessage);
        console.error('Error fetching departments:', err);
      } finally {
        setIsLoadingDepartments(false);
      }
    };

    if (activeTab === "enterprise") {
      fetchDepartments();
    }
  }, [activeTab]);

  // Fetch part number configs when configuration tab is active
  useEffect(() => {
    const fetchPartNumberConfigs = async () => {
      if (activeTab !== "configuration" || configTab !== "part-number") return;
      
      setIsLoadingPartNumberConfig(true);
      setPartNumberConfigError(null);
      try {
        const fetchedConfigs = await apiService.getPartNumberConfigs();
        setPartNumberConfig(fetchedConfigs);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch part number configurations';
        setPartNumberConfigError(errorMessage);
        console.error('Error fetching part number configurations:', err);
      } finally {
        setIsLoadingPartNumberConfig(false);
      }
    };

    fetchPartNumberConfigs();
  }, [activeTab, configTab]);

  // Fetch tool number configs when configuration tab is active
  useEffect(() => {
    const fetchToolNumberConfigs = async () => {
      if (activeTab !== "configuration" || configTab !== "tool-number") return;
      
      setIsLoadingToolNumberConfig(true);
      setToolNumberConfigError(null);
      try {
        const fetchedConfigs = await apiService.getToolNumberConfigs();
        setToolNumberConfig(fetchedConfigs);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch tool number configurations';
        setToolNumberConfigError(errorMessage);
        console.error('Error fetching tool number configurations:', err);
      } finally {
        setIsLoadingToolNumberConfig(false);
      }
    };

    fetchToolNumberConfigs();
  }, [activeTab, configTab]);

  // Fetch BOM items when configuration tab is active
  useEffect(() => {
    const fetchBomItems = async () => {
      if (activeTab !== "configuration" || configTab !== "bom") return;
      
      setIsLoadingBomItems(true);
      setBomItemsError(null);
      try {
        const fetchedItems = await apiService.getBomItems();
        setBomItems(fetchedItems);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch BOM items';
        setBomItemsError(errorMessage);
        console.error('Error fetching BOM items:', err);
      } finally {
        setIsLoadingBomItems(false);
      }
    };

    fetchBomItems();
  }, [activeTab, configTab]);

  // Fetch user preferences when preferences tab is active
  useEffect(() => {
    const fetchPreferences = async () => {
      if (activeTab !== "preferences") return;
      
      setIsLoadingPreferences(true);
      setPreferencesError(null);
      try {
        const fetchedPreferences = await apiService.getUserPreferences();
        setPreferences(fetchedPreferences);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch preferences';
        setPreferencesError(errorMessage);
        console.error('Error fetching preferences:', err);
      } finally {
        setIsLoadingPreferences(false);
      }
    };

    fetchPreferences();
  }, [activeTab]);

  // Handle Save Preferences
  const handleSavePreferences = async () => {
    setIsSavingPreferences(true);
    setPreferencesError(null);
    try {
      const updatedPreferences = await apiService.updateUserPreferences(preferences);
      setPreferences(updatedPreferences);
      alert('Preferences saved successfully!');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save preferences';
      setPreferencesError(errorMessage);
      alert(errorMessage);
      console.error('Error saving preferences:', err);
    } finally {
      setIsSavingPreferences(false);
    }
  };

  // Handle Reset Preferences
  const handleResetPreferences = async () => {
    if (!window.confirm('Are you sure you want to reset all preferences to default values?')) {
      return;
    }

    setIsSavingPreferences(true);
    setPreferencesError(null);
    try {
      const resetPreferences = await apiService.resetUserPreferences();
      setPreferences(resetPreferences);
      alert('Preferences reset to defaults successfully!');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to reset preferences';
      setPreferencesError(errorMessage);
      alert(errorMessage);
      console.error('Error resetting preferences:', err);
    } finally {
      setIsSavingPreferences(false);
    }
  };

  // Transform backend user to frontend format
  const transformUser = (backendUser: any) => {
    return {
      id: backendUser.id,
      name: `${backendUser.firstName || ''} ${backendUser.lastName || ''}`.trim(),
      firstName: backendUser.firstName || '',
      lastName: backendUser.lastName || '',
      email: backendUser.email || '',
      role: backendUser.role || '',
      department: backendUser.department || '',
      status: backendUser.isActive ? 'Active' : 'Inactive',
      phone: backendUser.phone || '',
      employeeId: backendUser.employeeId || '',
    };
  };

  // Handle Add User
  const handleAddUser = async () => {
    if (!newUserFirstName || !newUserLastName || !newUserEmail || !newUserPassword) {
      alert('Please fill in all required fields (First Name, Last Name, Email, Password)');
      return;
    }

    setIsLoadingUsers(true);
    setUsersError(null);
    try {
      const userData = {
        firstName: newUserFirstName,
        lastName: newUserLastName,
        email: newUserEmail,
        password: newUserPassword,
        role: newUserRole,
        employeeId: newUserEmployeeId || undefined,
        phone: newUserPhone || undefined,
        department: newUserDepartment || undefined,
      };

      await apiService.createUser(userData);
      
      // Refresh users list
      const fetchedUsers = await apiService.getUsers(true);
      setUsers(fetchedUsers);
      
      setAddUserDialogOpen(false);
      setNewUserFirstName("");
      setNewUserLastName("");
      setNewUserEmail("");
      setNewUserPassword("");
      setNewUserRole("NPD");
      setNewUserEmployeeId("");
      setNewUserPhone("");
      setNewUserDepartment("");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create user';
      setUsersError(errorMessage);
      alert(errorMessage);
      console.error('Error creating user:', err);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  // Handle Edit User
  const handleEditUser = (user: any) => {
    setSelectedUser(user);
    setEditUserFirstName(user.firstName || '');
    setEditUserLastName(user.lastName || '');
    setEditUserPhone(user.phone || '');
    setEditUserDepartment(user.department || '');
    setEditUserRole(user.role as UserRole);
    setEditUserStatus(user.status || 'Active');
    setEditUserDialogOpen(true);
  };

  const handleSaveEditUser = async () => {
    if (!selectedUser || !editUserFirstName || !editUserLastName) {
      alert('Please fill in all required fields');
      return;
    }

    setIsLoadingUsers(true);
    setUsersError(null);
    try {
      const userData: any = {
        firstName: editUserFirstName,
        lastName: editUserLastName,
        phone: editUserPhone || undefined,
        department: editUserDepartment || undefined,
      };

      // Only update role and status if user is Approver
      if (userRole === "Approver") {
        userData.role = editUserRole;
        userData.isActive = editUserStatus === 'Active';
      }

      await apiService.updateUser(selectedUser.id, userData);
      
      // Refresh users list
      const fetchedUsers = await apiService.getUsers(true);
      setUsers(fetchedUsers);
      
      setEditUserDialogOpen(false);
      setSelectedUser(null);
      setEditUserFirstName("");
      setEditUserLastName("");
      setEditUserPhone("");
      setEditUserDepartment("");
      setEditUserRole("NPD");
      setEditUserStatus("Active");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update user';
      setUsersError(errorMessage);
      alert(errorMessage);
      console.error('Error updating user:', err);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  // Handle Delete/Deactivate User
  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm("Are you sure you want to deactivate this user? They will not be able to log in.")) {
      return;
    }

    setIsLoadingUsers(true);
    setUsersError(null);
    try {
      await apiService.deactivateUser(userId);
      
      // Refresh users list
      const fetchedUsers = await apiService.getUsers(true);
      setUsers(fetchedUsers);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to deactivate user';
      setUsersError(errorMessage);
      alert(errorMessage);
      console.error('Error deactivating user:', err);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  // Handle Add Role
  const handleAddRole = async () => {
    if (!newRoleName) {
      alert('Please enter a role name');
      return;
    }

    setIsLoadingRoles(true);
    setRolesError(null);
    try {
      const permissions = newRolePermissions 
        ? newRolePermissions.split(',').map(p => p.trim()).filter(p => p)
        : [];

      const roleData = {
        name: newRoleName,
        description: newRoleDescription || undefined,
        permissions: permissions.length > 0 ? permissions : undefined,
      };

      await apiService.createRole(roleData);
      
      // Refresh roles list
      const fetchedRoles = await apiService.getRoles(true);
      setRoles(fetchedRoles);
      
      setAddRoleDialogOpen(false);
      setNewRoleName("");
      setNewRoleDescription("");
      setNewRolePermissions("");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create role';
      setRolesError(errorMessage);
      alert(errorMessage);
      console.error('Error creating role:', err);
    } finally {
      setIsLoadingRoles(false);
    }
  };

  // Handle Edit Role
  const handleEditRole = (role: any) => {
    setSelectedRole(role);
    setEditRoleName(role.name || '');
    setEditRoleDescription(role.description || '');
    setEditRolePermissions(role.permissions ? role.permissions.join(', ') : '');
    setEditRoleStatus(role.isActive ? 'Active' : 'Inactive');
    setEditRoleDialogOpen(true);
  };

  const handleSaveEditRole = async () => {
    if (!selectedRole || !editRoleName) {
      alert('Please fill in all required fields');
      return;
    }

    setIsLoadingRoles(true);
    setRolesError(null);
    try {
      const permissions = editRolePermissions 
        ? editRolePermissions.split(',').map(p => p.trim()).filter(p => p)
        : [];

      const roleData: any = {
        name: editRoleName,
        description: editRoleDescription || undefined,
        permissions: permissions.length > 0 ? permissions : [],
        isActive: editRoleStatus === 'Active',
      };

      await apiService.updateRole(selectedRole.id, roleData);
      
      // Refresh roles list
      const fetchedRoles = await apiService.getRoles(true);
      setRoles(fetchedRoles);
      
      setEditRoleDialogOpen(false);
      setSelectedRole(null);
      setEditRoleName("");
      setEditRoleDescription("");
      setEditRolePermissions("");
      setEditRoleStatus("Active");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update role';
      setRolesError(errorMessage);
      alert(errorMessage);
      console.error('Error updating role:', err);
    } finally {
      setIsLoadingRoles(false);
    }
  };

  // Handle Delete Role
  const handleDeleteRole = async (roleId: string, roleName: string) => {
    if (!window.confirm(`Are you sure you want to delete the role "${roleName}"? This action cannot be undone.`)) {
      return;
    }

    setIsLoadingRoles(true);
    setRolesError(null);
    try {
      await apiService.deleteRole(roleId);
      
      // Refresh roles list
      const fetchedRoles = await apiService.getRoles(true);
      setRoles(fetchedRoles);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete role';
      setRolesError(errorMessage);
      alert(errorMessage);
      console.error('Error deleting role:', err);
    } finally {
      setIsLoadingRoles(false);
    }
  };

  // Get role badge color
  const getRoleBadgeColor = (roleName: string) => {
    const colorMap: { [key: string]: string } = {
      'Approver': 'bg-gradient-to-r from-purple-600 to-pink-600',
      'NPD': 'bg-gradient-to-r from-blue-600 to-cyan-600',
      'Maintenance': 'bg-gradient-to-r from-orange-600 to-red-600',
      'Spares': 'bg-gradient-to-r from-green-600 to-teal-600',
      'Indentor': 'bg-gradient-to-r from-yellow-600 to-orange-600',
    };
    return colorMap[roleName] || 'bg-gradient-to-r from-gray-600 to-gray-700';
  };

  // Handle Add Department
  const handleAddDepartment = async () => {
    if (!newDepartmentName || !newDepartmentHead) {
      alert('Please fill in all required fields (Name and Head)');
      return;
    }

    setIsLoadingDepartments(true);
    setDepartmentsError(null);
    try {
      const departmentData = {
        name: newDepartmentName,
        head: newDepartmentHead,
        description: newDepartmentDescription || undefined,
      };

      await apiService.createDepartment(departmentData);
      
      // Refresh departments list
      const fetchedDepartments = await apiService.getDepartments();
      setDepartments(fetchedDepartments);
      
      setAddDepartmentDialogOpen(false);
      setNewDepartmentName("");
      setNewDepartmentHead("");
      setNewDepartmentDescription("");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create department';
      setDepartmentsError(errorMessage);
      alert(errorMessage);
      console.error('Error creating department:', err);
    } finally {
      setIsLoadingDepartments(false);
    }
  };

  // Handle Edit Department
  const handleEditDepartment = (dept: any) => {
    setEditDepartmentId(dept.id);
    setEditDepartmentName(dept.name);
    setEditDepartmentHead(dept.head);
    setEditDepartmentDescription(dept.description || "");
    setEditDepartmentDialogOpen(true);
  };

  // Handle Save Edit Department
  const handleSaveEditDepartment = async () => {
    if (!editDepartmentName || !editDepartmentHead || editDepartmentId === null) {
      alert('Please fill in all required fields');
      return;
    }

    setIsLoadingDepartments(true);
    setDepartmentsError(null);
    try {
      const departmentData = {
        name: editDepartmentName,
        head: editDepartmentHead,
        description: editDepartmentDescription || undefined,
      };

      await apiService.updateDepartment(editDepartmentId, departmentData);
      
      // Refresh departments list
      const fetchedDepartments = await apiService.getDepartments();
      setDepartments(fetchedDepartments);
      
      setEditDepartmentDialogOpen(false);
      setEditDepartmentId(null);
      setEditDepartmentName("");
      setEditDepartmentHead("");
      setEditDepartmentDescription("");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update department';
      setDepartmentsError(errorMessage);
      alert(errorMessage);
      console.error('Error updating department:', err);
    } finally {
      setIsLoadingDepartments(false);
    }
  };

  // Handle Delete Department
  const handleDeleteDepartment = async (departmentId: string, departmentName: string) => {
    if (!window.confirm(`Are you sure you want to delete the department "${departmentName}"? This action cannot be undone.`)) {
      return;
    }

    setIsLoadingDepartments(true);
    setDepartmentsError(null);
    try {
      await apiService.deleteDepartment(departmentId);
      
      // Refresh departments list
      const fetchedDepartments = await apiService.getDepartments();
      setDepartments(fetchedDepartments);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete department';
      setDepartmentsError(errorMessage);
      alert(errorMessage);
      console.error('Error deleting department:', err);
    } finally {
      setIsLoadingDepartments(false);
    }
  };

  // Handle Add BOM Item
  const handleAddBomItem = async () => {
    if (!newBomItemName || !newBomCategory || !newBomUnit || !newBomUnitPrice) {
      alert('Please fill in all required fields (Item Name, Category, Unit, Unit Price)');
      return;
    }

    setIsLoadingBomItems(true);
    setBomItemsError(null);
    try {
      const itemData = {
        itemName: newBomItemName,
        category: newBomCategory,
        unit: newBomUnit,
        unitPrice: newBomUnitPrice,
        supplier: newBomSupplier || undefined,
        partNumber: newBomPartNumber || undefined,
        toolNumber: newBomToolNumber || undefined,
      };

      await apiService.createBomItem(itemData);
      
      // Refresh BOM items list
      const fetchedItems = await apiService.getBomItems();
      setBomItems(fetchedItems);
      
      setAddBomDialogOpen(false);
      setNewBomItemName("");
      setNewBomCategory("");
      setNewBomUnit("");
      setNewBomUnitPrice("");
      setNewBomSupplier("");
      setNewBomPartNumber("");
      setNewBomToolNumber("");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create BOM item';
      setBomItemsError(errorMessage);
      alert(errorMessage);
      console.error('Error creating BOM item:', err);
    } finally {
      setIsLoadingBomItems(false);
    }
  };

  // Handle Edit BOM Item
  const handleEditBomItem = (item: any) => {
    setEditBomId(item.id);
    setEditBomItemName(item.itemName);
    setEditBomCategory(item.category);
    setEditBomUnit(item.unit);
    setEditBomUnitPrice(item.unitPrice);
    setEditBomSupplier(item.supplier);
    setEditBomPartNumber(item.partNumber);
    setEditBomToolNumber(item.toolNumber);
    setEditBomDialogOpen(true);
  };

  // Handle Save Edit BOM Item
  const handleSaveEditBomItem = async () => {
    if (!editBomItemName || !editBomCategory || editBomId === null) {
      alert('Please fill in all required fields');
      return;
    }

    setIsLoadingBomItems(true);
    setBomItemsError(null);
    try {
      const itemData = {
        itemName: editBomItemName,
        category: editBomCategory,
        unit: editBomUnit,
        unitPrice: editBomUnitPrice,
        supplier: editBomSupplier || undefined,
        partNumber: editBomPartNumber || undefined,
        toolNumber: editBomToolNumber || undefined,
      };

      await apiService.updateBomItem(editBomId, itemData);
      
      // Refresh BOM items list
      const fetchedItems = await apiService.getBomItems();
      setBomItems(fetchedItems);
      
      setEditBomDialogOpen(false);
      setEditBomId(null);
      setEditBomItemName("");
      setEditBomCategory("");
      setEditBomUnit("");
      setEditBomUnitPrice("");
      setEditBomSupplier("");
      setEditBomPartNumber("");
      setEditBomToolNumber("");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update BOM item';
      setBomItemsError(errorMessage);
      alert(errorMessage);
      console.error('Error updating BOM item:', err);
    } finally {
      setIsLoadingBomItems(false);
    }
  };

  // Handle Delete BOM Item
  const handleDeleteBomItem = async (id: string, itemName: string) => {
    if (!window.confirm(`Are you sure you want to delete the BOM item "${itemName}"?`)) {
      return;
    }

    setIsLoadingBomItems(true);
    setBomItemsError(null);
    try {
      await apiService.deleteBomItem(id);
      
      // Refresh BOM items list
      const fetchedItems = await apiService.getBomItems();
      setBomItems(fetchedItems);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete BOM item';
      setBomItemsError(errorMessage);
      alert(errorMessage);
      console.error('Error deleting BOM item:', err);
    } finally {
      setIsLoadingBomItems(false);
    }
  };

  // Helper function to get section title
  const getSectionTitle = () => {
    switch (activeTab) {
      case "user-management":
        return { title: "User Management", description: "Manage users, roles, and permissions" };
      case "enterprise":
        return { title: "Enterprise Settings", description: "Manage organizational departments and teams" };
      case "configuration":
        return { title: "Configuration", description: "Configure part numbers, tool numbers, and BOM database" };
      case "preferences":
        return { title: "Preferences", description: "Customize notifications and display settings" };
      default:
        return { title: "Settings", description: "Manage your account settings and preferences" };
    }
  };

  const sectionInfo = getSectionTitle();

  return (
    <div className="flex-1 overflow-auto p-4">
      <div className="max-w-7xl mx-auto space-y-4">
        {/* Header */}
        <div>
          <h1 className="text-xl font-bold text-gray-900">{sectionInfo.title}</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            {sectionInfo.description}
          </p>
        </div>

        {/* User Management Section */}
        {activeTab === "user-management" && (
          <div className="space-y-4">
            {userRole !== "Approver" ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <AlertCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-sm text-gray-600">
                    Only Approvers can manage users.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2 text-base">
                        <Users className="w-4 h-4" />
                        User Management
                      </CardTitle>
                      <CardDescription className="text-xs">
                        Manage user accounts and assign roles
                      </CardDescription>
                    </div>
                    <Button className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 h-8 text-xs" onClick={() => setAddUserDialogOpen(true)}>
                      <Plus className="w-3.5 h-3.5 mr-1.5" />
                      Add User
                    </Button>
                  </div>
                </CardHeader>
              <CardContent className="p-4 pt-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Name</TableHead>
                      <TableHead className="text-xs">Email</TableHead>
                      <TableHead className="text-xs">Role</TableHead>
                      <TableHead className="text-xs">Department</TableHead>
                      <TableHead className="text-xs">Status</TableHead>
                      <TableHead className="text-xs text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoadingUsers ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-xs py-8">
                          Loading users...
                        </TableCell>
                      </TableRow>
                    ) : usersError ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-xs py-8 text-red-600">
                          Error: {usersError}
                        </TableCell>
                      </TableRow>
                    ) : users.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-xs py-8 text-gray-500">
                          No users found
                        </TableCell>
                      </TableRow>
                    ) : (
                      users.map((user) => {
                        const transformedUser = transformUser(user);
                        return (
                          <TableRow key={user.id}>
                            <TableCell className="text-xs font-medium">{transformedUser.name}</TableCell>
                            <TableCell className="text-xs">{transformedUser.email}</TableCell>
                            <TableCell className="text-xs">
                              <Badge variant={transformedUser.role === "Approver" ? "default" : "secondary"} className="text-xs">
                                {transformedUser.role}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-xs">{transformedUser.department}</TableCell>
                            <TableCell className="text-xs">
                              <Badge variant={transformedUser.status === "Active" ? "default" : "secondary"} className="text-xs">
                                {transformedUser.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-7 w-7 p-0"
                                  onClick={() => handleEditUser(user)}
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                  onClick={() => handleDeleteUser(user.id)}
                                  disabled={isLoadingUsers}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
            )}
            
            {/* Role Management */}
            {userRole === "Approver" && (
            <Card>
              <CardHeader className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <ShieldCheck className="w-4 h-4" />
                      Role Management
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Configure roles and permissions
                    </CardDescription>
                  </div>
                  <Button className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 h-8 text-xs" onClick={() => setAddRoleDialogOpen(true)}>
                    <Plus className="w-3.5 h-3.5 mr-1.5" />
                    Add Role
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Role</TableHead>
                      <TableHead className="text-xs">Description</TableHead>
                      <TableHead className="text-xs">Users</TableHead>
                      <TableHead className="text-xs">Permissions</TableHead>
                      <TableHead className="text-xs text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoadingRoles ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-xs py-8">
                          <Loader2 className="w-4 h-4 animate-spin inline-block mr-2" />
                          Loading roles...
                        </TableCell>
                      </TableRow>
                    ) : rolesError ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-xs py-8 text-red-600">
                          Error: {rolesError}
                        </TableCell>
                      </TableRow>
                    ) : roles.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-xs py-8 text-gray-500">
                          No roles found. Click "Add Role" to create one.
                        </TableCell>
                      </TableRow>
                    ) : (
                      roles.map((role) => (
                        <TableRow key={role.id}>
                          <TableCell className="text-xs font-medium">
                            <Badge className={`${getRoleBadgeColor(role.name)} text-white text-xs`}>
                              {role.name}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs">{role.description || '-'}</TableCell>
                          <TableCell className="text-xs">{role.userCount || 0}</TableCell>
                          <TableCell className="text-xs">
                            {role.permissions && role.permissions.length > 0 
                              ? role.permissions.join(', ') 
                              : 'No permissions'}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-7 text-xs"
                                onClick={() => handleEditRole(role)}
                                disabled={isLoadingRoles}
                              >
                                <Pencil className="w-3.5 h-3.5 mr-1" />
                                Edit
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                onClick={() => handleDeleteRole(role.id, role.name)}
                                disabled={isLoadingRoles}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
            )}
          </div>
        )}

        {/* Enterprise Settings Section */}
        {activeTab === "enterprise" && (
          <div className="space-y-4">
            <Card>
              <CardHeader className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Building2 className="w-4 h-4" />
                      Department Management
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Manage organizational departments and teams
                    </CardDescription>
                  </div>
                  {userRole === "Approver" && (
                    <Button className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 h-8 text-xs" onClick={() => setAddDepartmentDialogOpen(true)}>
                      <Plus className="w-3.5 h-3.5 mr-1.5" />
                      Add Department
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Department Name</TableHead>
                      <TableHead className="text-xs">Department Head</TableHead>
                      <TableHead className="text-xs">Members</TableHead>
                      <TableHead className="text-xs">Description</TableHead>
                      {userRole === "Approver" && (
                        <TableHead className="text-xs text-right">Actions</TableHead>
                      )}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoadingDepartments ? (
                      <TableRow>
                        <TableCell colSpan={userRole === "Approver" ? 5 : 4} className="text-center text-xs py-8">
                          Loading departments...
                        </TableCell>
                      </TableRow>
                    ) : departmentsError ? (
                      <TableRow>
                        <TableCell colSpan={userRole === "Approver" ? 5 : 4} className="text-center text-xs py-8 text-red-600">
                          Error: {departmentsError}
                        </TableCell>
                      </TableRow>
                    ) : departments.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={userRole === "Approver" ? 5 : 4} className="text-center text-xs py-8 text-gray-500">
                          No departments found
                        </TableCell>
                      </TableRow>
                    ) : (
                      departments.map((dept) => (
                        <TableRow key={dept.id}>
                          <TableCell className="text-xs font-medium">{dept.name}</TableCell>
                          <TableCell className="text-xs">{dept.head}</TableCell>
                          <TableCell className="text-xs">
                            <Badge variant="secondary" className="text-xs">{dept.members || 0}</Badge>
                          </TableCell>
                          <TableCell className="text-xs">{dept.description || '-'}</TableCell>
                          {userRole === "Approver" && (
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-7 w-7 p-0" 
                                  onClick={() => handleEditDepartment(dept)}
                                  disabled={isLoadingDepartments}
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                  onClick={() => handleDeleteDepartment(dept.id, dept.name)}
                                  disabled={isLoadingDepartments}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              </div>
                            </TableCell>
                          )}
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Configuration Section */}
        {activeTab === "configuration" && (
          <div className="space-y-4">
            {/* Configuration Sub-Tabs */}
            <div className="flex items-center gap-1 border-b border-gray-200">
              <button
                onClick={() => setConfigTab("part-number")}
                className={`px-4 py-2 text-xs font-medium border-b-2 transition-colors ${
                  configTab === "part-number"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-600 hover:text-gray-900"
                }`}
              >
                Part Number
              </button>
              <button
                onClick={() => setConfigTab("tool-number")}
                className={`px-4 py-2 text-xs font-medium border-b-2 transition-colors ${
                  configTab === "tool-number"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-600 hover:text-gray-900"
                }`}
              >
                Tool Number
              </button>
              <button
                onClick={() => setConfigTab("bom")}
                className={`px-4 py-2 text-xs font-medium border-b-2 transition-colors ${
                  configTab === "bom"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-600 hover:text-gray-900"
                }`}
              >
                BOM
              </button>
            </div>

            {/* Part Number Configuration Tab */}
            {configTab === "part-number" && (
            <Card>
              <CardHeader className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Settings2 className="w-4 h-4" />
                      Part Number Configuration
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Configure part number format and auto-increment settings
                    </CardDescription>
                  </div>
                  <Button className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 h-8 text-xs" onClick={() => setPartNumberDialogOpen(true)}>
                    <Plus className="w-3.5 h-3.5 mr-1.5" />
                    Add Part Number
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-0 space-y-3">
                {/* Part Number List */}
                {partNumberConfig.length > 0 && (
                  <div>
                    <Label className="text-xs font-semibold mb-2 block">Configured Part Numbers</Label>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-xs">Prefix</TableHead>
                          <TableHead className="text-xs">Format</TableHead>
                          <TableHead className="text-xs">Example</TableHead>
                          <TableHead className="text-xs">Auto Increment</TableHead>
                          <TableHead className="text-xs">Created Date</TableHead>
                          <TableHead className="text-xs text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {partNumberConfig.map((config) => (
                          <TableRow key={config.id}>
                            <TableCell className="text-xs font-medium">{config.prefix}</TableCell>
                            <TableCell className="text-xs">{config.format}</TableCell>
                            <TableCell className="text-xs text-gray-600">{config.example}</TableCell>
                            <TableCell className="text-xs">
                              <Badge variant={config.autoIncrement ? "default" : "secondary"} className="text-xs">
                                {config.autoIncrement ? "Yes" : "No"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-xs">{config.createdAt}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-7 w-7 p-0"
                                  onClick={() => handleEditPartNumber(config)}
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                  onClick={() => handleDeletePartNumber(config.id)}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
                {partNumberConfig.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Settings2 className="w-12 h-12 mx-auto mb-2 opacity-30" />
                    <p className="text-xs">No part number configurations yet</p>
                    <p className="text-xs">Click "Add Part Number" to create one</p>
                  </div>
                )}
              </CardContent>
            </Card>
            )}

            {/* Tool Number Configuration Tab */}
            {configTab === "tool-number" && (
            <Card>
              <CardHeader className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Wrench className="w-4 h-4" />
                      Tool Number Configuration
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Configure tool number format and auto-increment settings
                    </CardDescription>
                  </div>
                  <Button className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 h-8 text-xs" onClick={() => setToolNumberDialogOpen(true)}>
                    <Plus className="w-3.5 h-3.5 mr-1.5" />
                    Add Tool Number
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-0 space-y-3">
                {/* Tool Number List */}
                {toolNumberConfig.length > 0 && (
                  <div>
                    <Label className="text-xs font-semibold mb-2 block">Configured Tool Numbers</Label>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-xs">Prefix</TableHead>
                          <TableHead className="text-xs">Format</TableHead>
                          <TableHead className="text-xs">Example</TableHead>
                          <TableHead className="text-xs">Auto Increment</TableHead>
                          <TableHead className="text-xs">Created Date</TableHead>
                          <TableHead className="text-xs text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {toolNumberConfig.map((config) => (
                          <TableRow key={config.id}>
                            <TableCell className="text-xs font-medium">{config.prefix}</TableCell>
                            <TableCell className="text-xs">{config.format}</TableCell>
                            <TableCell className="text-xs text-gray-600">{config.example}</TableCell>
                            <TableCell className="text-xs">
                              <Badge variant={config.autoIncrement ? "default" : "secondary"} className="text-xs">
                                {config.autoIncrement ? "Yes" : "No"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-xs">{config.createdAt}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-7 w-7 p-0"
                                  onClick={() => handleEditToolNumber(config)}
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                  onClick={() => handleDeleteToolNumber(config.id)}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
                {toolNumberConfig.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Wrench className="w-12 h-12 mx-auto mb-2 opacity-30" />
                    <p className="text-xs">No tool number configurations yet</p>
                    <p className="text-xs">Click "Add Tool Number" to create one</p>
                  </div>
                )}
              </CardContent>
            </Card>
            )}

            {/* Bill of Materials Configuration Tab */}
            {configTab === "bom" && (
            <Card>
              <CardHeader className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Settings2 className="w-4 h-4" />
                      Bill of Materials (BOM) Database
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Configure BOM items with pricing information (INR)
                    </CardDescription>
                  </div>
                  <Button className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 h-8 text-xs" onClick={() => setAddBomDialogOpen(true)}>
                    <Plus className="w-3.5 h-3.5 mr-1.5" />
                    Add BOM Item
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Item Name</TableHead>
                      <TableHead className="text-xs">Part Number</TableHead>
                      <TableHead className="text-xs">Tool Number</TableHead>
                      <TableHead className="text-xs">Category</TableHead>
                      <TableHead className="text-xs">Unit</TableHead>
                      <TableHead className="text-xs">Unit Price (INR)</TableHead>
                      <TableHead className="text-xs">Supplier</TableHead>
                      <TableHead className="text-xs text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bomItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="text-xs font-medium">{item.itemName}</TableCell>
                        <TableCell className="text-xs">
                          <Badge variant="outline" className="text-xs font-mono">{item.partNumber}</Badge>
                        </TableCell>
                        <TableCell className="text-xs">
                          <Badge variant="outline" className="text-xs font-mono">{item.toolNumber}</Badge>
                        </TableCell>
                        <TableCell className="text-xs">
                          <Badge variant="secondary" className="text-xs">{item.category}</Badge>
                        </TableCell>
                        <TableCell className="text-xs">{item.unit}</TableCell>
                        <TableCell className="text-xs font-medium text-green-700">{item.unitPrice}</TableCell>
                        <TableCell className="text-xs">{item.supplier}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-7 w-7 p-0" 
                              onClick={() => handleEditBomItem(item)}
                              disabled={isLoadingBomItems}
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => handleDeleteBomItem(item.id, item.itemName)}
                              disabled={isLoadingBomItems}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
            )}
          </div>
        )}

        {/* Preferences Section */}
        {activeTab === "preferences" && (
          <div className="space-y-4">
            {/* Notification Settings */}
            <Card>
              <CardHeader className="p-4">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Bell className="w-4 h-4" />
                  Notification Preferences
                </CardTitle>
                <CardDescription className="text-xs">
                  Configure how you want to receive notifications
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 pt-0 space-y-3">
                <div className="flex items-center justify-between py-1.5">
                  <div className="space-y-0.5">
                    <Label className="text-xs">Email Notifications</Label>
                    <p className="text-xs text-gray-500">
                      Receive email updates for important activities
                    </p>
                  </div>
                  <Switch 
                    checked={preferences.emailNotifications ?? true} 
                    onCheckedChange={(checked) => setPreferences({...preferences, emailNotifications: checked})}
                    disabled={isLoadingPreferences || isSavingPreferences}
                  />
                </div>
                <Separator />

                <div className="flex items-center justify-between py-1.5">
                  <div className="space-y-0.5">
                    <Label className="text-xs">New PR Creation</Label>
                    <p className="text-xs text-gray-500">
                      Get notified when a new PR is created
                    </p>
                  </div>
                  <Switch 
                    checked={preferences.newPrCreation ?? true} 
                    onCheckedChange={(checked) => setPreferences({...preferences, newPrCreation: checked})}
                    disabled={isLoadingPreferences || isSavingPreferences}
                  />
                </div>
                <Separator />

                <div className="flex items-center justify-between py-1.5">
                  <div className="space-y-0.5">
                    <Label className="text-xs">Quotation Updates</Label>
                    <p className="text-xs text-gray-500">
                      Receive updates on quotation submissions and evaluations
                    </p>
                  </div>
                  <Switch 
                    checked={preferences.quotationUpdates ?? true} 
                    onCheckedChange={(checked) => setPreferences({...preferences, quotationUpdates: checked})}
                    disabled={isLoadingPreferences || isSavingPreferences}
                  />
                </div>
                <Separator />

                <div className="flex items-center justify-between py-1.5">
                  <div className="space-y-0.5">
                    <Label className="text-xs">Approval Requests</Label>
                    <p className="text-xs text-gray-500">
                      Get notified when approval is required
                    </p>
                  </div>
                  <Switch 
                    checked={preferences.approvalRequests ?? true} 
                    onCheckedChange={(checked) => setPreferences({...preferences, approvalRequests: checked})}
                    disabled={isLoadingPreferences || isSavingPreferences}
                  />
                </div>
                <Separator />

                <div className="flex items-center justify-between py-1.5">
                  <div className="space-y-0.5">
                    <Label className="text-xs">Low Stock Alerts</Label>
                    <p className="text-xs text-gray-500">
                      Receive alerts when spare inventory is running low
                    </p>
                  </div>
                  <Switch 
                    checked={preferences.lowStockAlerts ?? true} 
                    onCheckedChange={(checked) => setPreferences({...preferences, lowStockAlerts: checked})}
                    disabled={isLoadingPreferences || isSavingPreferences}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Display Preferences */}
            <Card>
              <CardHeader className="p-4">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Palette className="w-4 h-4" />
                  Display Preferences
                </CardTitle>
                <CardDescription className="text-xs">
                  Customize your dashboard appearance
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 pt-0 space-y-3">
                <div className="flex items-center justify-between py-1.5">
                  <div className="space-y-0.5">
                    <Label className="text-xs">Compact View</Label>
                    <p className="text-xs text-gray-500">
                      Use a more compact layout for tables and lists
                    </p>
                  </div>
                  <Switch 
                    checked={preferences.compactView ?? true} 
                    onCheckedChange={(checked) => setPreferences({...preferences, compactView: checked})}
                    disabled={isLoadingPreferences || isSavingPreferences}
                  />
                </div>
                <Separator />

                <div className="flex items-center justify-between py-1.5">
                  <div className="space-y-0.5">
                    <Label className="text-xs">Show Currency as INR (₹)</Label>
                    <p className="text-xs text-gray-500">
                      Display all prices in Indian Rupees
                    </p>
                  </div>
                  <Switch 
                    checked={preferences.showCurrencyAsINR ?? true} 
                    onCheckedChange={(checked) => setPreferences({...preferences, showCurrencyAsINR: checked})}
                    disabled={isLoadingPreferences || isSavingPreferences}
                  />
                </div>
                <Separator />

                <div className="flex items-center justify-between py-1.5">
                  <div className="space-y-0.5">
                    <Label className="text-xs">Auto-refresh Dashboard</Label>
                    <p className="text-xs text-gray-500">
                      Automatically refresh dashboard data every 5 minutes
                    </p>
                  </div>
                  <Switch 
                    checked={preferences.autoRefreshDashboard ?? true} 
                    onCheckedChange={(checked) => setPreferences({...preferences, autoRefreshDashboard: checked})}
                    disabled={isLoadingPreferences || isSavingPreferences}
                  />
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end gap-2 pb-4">
              <Button 
                variant="outline" 
                className="h-8 text-xs"
                onClick={handleResetPreferences}
                disabled={isLoadingPreferences || isSavingPreferences}
              >
                {isSavingPreferences ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                    Resetting...
                  </>
                ) : (
                  'Reset to Default'
                )}
              </Button>
              <Button 
                className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 h-8 text-xs"
                onClick={handleSavePreferences}
                disabled={isLoadingPreferences || isSavingPreferences}
              >
                {isSavingPreferences ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5 mr-1.5" />
                    Save All Changes
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Part Number Dialog */}
        <Dialog open={partNumberDialogOpen} onOpenChange={setPartNumberDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-base">Add Part Number Configuration</DialogTitle>
              <DialogDescription className="text-xs">
                Configure a new part number format
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 mt-4">
              <div className="space-y-1.5">
                <Label htmlFor="newPartPrefix" className="text-xs">Prefix</Label>
                <Input 
                  id="newPartPrefix" 
                  placeholder="e.g. PN, PART" 
                  value={newPartPrefix}
                  onChange={(e) => setNewPartPrefix(e.target.value)}
                  className="h-8 text-xs" 
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="newPartFormat" className="text-xs">Format</Label>
                <Input 
                  id="newPartFormat" 
                  placeholder="e.g. PN-YYYY-XXXX" 
                  value={newPartFormat}
                  onChange={(e) => setNewPartFormat(e.target.value)}
                  className="h-8 text-xs" 
                />
                <p className="text-xs text-gray-500">Use YYYY for year, XXXX for sequence number</p>
              </div>
              <div className="flex items-center justify-between py-1.5">
                <div className="space-y-0.5">
                  <Label className="text-xs">Auto Increment</Label>
                  <p className="text-xs text-gray-500">
                    Automatically increment sequence numbers
                  </p>
                </div>
                <Switch 
                  checked={newPartAutoIncrement}
                  onCheckedChange={setNewPartAutoIncrement}
                />
              </div>
            </div>
            <DialogFooter className="mt-4">
              <Button variant="outline" className="h-8 text-xs" onClick={() => setPartNumberDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 h-8 text-xs"
                onClick={handleAddPartNumber}
              >
                <Plus className="w-3.5 h-3.5 mr-1.5" />
                Add Part Number
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Part Number Dialog */}
        <Dialog open={editPartNumberDialogOpen} onOpenChange={setEditPartNumberDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-base">Edit Part Number Configuration</DialogTitle>
              <DialogDescription className="text-xs">
                Modify part number format settings
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 mt-4">
              <div className="space-y-1.5">
                <Label htmlFor="editPartPrefix" className="text-xs">Prefix</Label>
                <Input 
                  id="editPartPrefix" 
                  placeholder="e.g. PN, PART" 
                  value={editPartPrefix}
                  onChange={(e) => setEditPartPrefix(e.target.value)}
                  className="h-8 text-xs" 
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="editPartFormat" className="text-xs">Format</Label>
                <Input 
                  id="editPartFormat" 
                  placeholder="e.g. PN-YYYY-XXXX" 
                  value={editPartFormat}
                  onChange={(e) => setEditPartFormat(e.target.value)}
                  className="h-8 text-xs" 
                />
                <p className="text-xs text-gray-500">Use YYYY for year, XXXX for sequence number</p>
              </div>
              <div className="flex items-center justify-between py-1.5">
                <div className="space-y-0.5">
                  <Label className="text-xs">Auto Increment</Label>
                  <p className="text-xs text-gray-500">
                    Automatically increment sequence numbers
                  </p>
                </div>
                <Switch 
                  checked={editPartAutoIncrement}
                  onCheckedChange={setEditPartAutoIncrement}
                />
              </div>
            </div>
            <DialogFooter className="mt-4">
              <Button variant="outline" className="h-8 text-xs" onClick={() => setEditPartNumberDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 h-8 text-xs"
                onClick={handleSavePartNumber}
              >
                <Save className="w-3.5 h-3.5 mr-1.5" />
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Tool Number Dialog */}
        <Dialog open={toolNumberDialogOpen} onOpenChange={setToolNumberDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-base">Add Tool Number Configuration</DialogTitle>
              <DialogDescription className="text-xs">
                Configure a new tool number format
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 mt-4">
              <div className="space-y-1.5">
                <Label htmlFor="newToolPrefix" className="text-xs">Prefix</Label>
                <Input 
                  id="newToolPrefix" 
                  placeholder="e.g. TN, TOOL" 
                  value={newToolPrefix}
                  onChange={(e) => setNewToolPrefix(e.target.value)}
                  className="h-8 text-xs" 
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="newToolFormat" className="text-xs">Format</Label>
                <Input 
                  id="newToolFormat" 
                  placeholder="e.g. TN-YYYY-XXXX" 
                  value={newToolFormat}
                  onChange={(e) => setNewToolFormat(e.target.value)}
                  className="h-8 text-xs" 
                />
                <p className="text-xs text-gray-500">Use YYYY for year, XXXX for sequence number</p>
              </div>
              <div className="flex items-center justify-between py-1.5">
                <div className="space-y-0.5">
                  <Label className="text-xs">Auto Increment</Label>
                  <p className="text-xs text-gray-500">
                    Automatically increment sequence numbers
                  </p>
                </div>
                <Switch 
                  checked={newToolAutoIncrement}
                  onCheckedChange={setNewToolAutoIncrement}
                />
              </div>
            </div>
            <DialogFooter className="mt-4">
              <Button variant="outline" className="h-8 text-xs" onClick={() => setToolNumberDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 h-8 text-xs"
                onClick={handleAddToolNumber}
              >
                <Plus className="w-3.5 h-3.5 mr-1.5" />
                Add Tool Number
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Tool Number Dialog */}
        <Dialog open={editToolNumberDialogOpen} onOpenChange={setEditToolNumberDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-base">Edit Tool Number Configuration</DialogTitle>
              <DialogDescription className="text-xs">
                Modify tool number format settings
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 mt-4">
              <div className="space-y-1.5">
                <Label htmlFor="editToolPrefix" className="text-xs">Prefix</Label>
                <Input 
                  id="editToolPrefix" 
                  placeholder="e.g. TN, TOOL" 
                  value={editToolPrefix}
                  onChange={(e) => setEditToolPrefix(e.target.value)}
                  className="h-8 text-xs" 
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="editToolFormat" className="text-xs">Format</Label>
                <Input 
                  id="editToolFormat" 
                  placeholder="e.g. TN-YYYY-XXXX" 
                  value={editToolFormat}
                  onChange={(e) => setEditToolFormat(e.target.value)}
                  className="h-8 text-xs" 
                />
                <p className="text-xs text-gray-500">Use YYYY for year, XXXX for sequence number</p>
              </div>
              <div className="flex items-center justify-between py-1.5">
                <div className="space-y-0.5">
                  <Label className="text-xs">Auto Increment</Label>
                  <p className="text-xs text-gray-500">
                    Automatically increment sequence numbers
                  </p>
                </div>
                <Switch 
                  checked={editToolAutoIncrement}
                  onCheckedChange={setEditToolAutoIncrement}
                />
              </div>
            </div>
            <DialogFooter className="mt-4">
              <Button variant="outline" className="h-8 text-xs" onClick={() => setEditToolNumberDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 h-8 text-xs"
                onClick={handleSaveToolNumber}
              >
                <Save className="w-3.5 h-3.5 mr-1.5" />
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Add User Dialog */}
        <Dialog open={addUserDialogOpen} onOpenChange={setAddUserDialogOpen}>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-base">Add User</DialogTitle>
              <DialogDescription className="text-xs">
                Add a new user to the system. Fields marked with * are required.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 mt-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="newUserFirstName" className="text-xs">First Name *</Label>
                  <Input 
                    id="newUserFirstName" 
                    placeholder="John" 
                    value={newUserFirstName}
                    onChange={(e) => setNewUserFirstName(e.target.value)}
                    className="h-8 text-xs" 
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="newUserLastName" className="text-xs">Last Name *</Label>
                  <Input 
                    id="newUserLastName" 
                    placeholder="Doe" 
                    value={newUserLastName}
                    onChange={(e) => setNewUserLastName(e.target.value)}
                    className="h-8 text-xs" 
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="newUserEmail" className="text-xs">Email *</Label>
                <Input 
                  id="newUserEmail" 
                  type="email"
                  placeholder="john.doe@company.com" 
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  className="h-8 text-xs" 
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="newUserPassword" className="text-xs">Password *</Label>
                <Input 
                  id="newUserPassword" 
                  type="password"
                  placeholder="Minimum 8 characters" 
                  value={newUserPassword}
                  onChange={(e) => setNewUserPassword(e.target.value)}
                  className="h-8 text-xs" 
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="newUserRole" className="text-xs">Role *</Label>
                <Select
                  value={newUserRole}
                  onValueChange={(value) => setNewUserRole(value as UserRole)}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent className="text-xs">
                    <SelectItem value="Approver">Approver</SelectItem>
                    <SelectItem value="NPD">NPD</SelectItem>
                    <SelectItem value="Maintenance">Maintenance</SelectItem>
                    <SelectItem value="Spares">Spares</SelectItem>
                    <SelectItem value="Indentor">Indentor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="newUserEmployeeId" className="text-xs">Employee ID</Label>
                <Input 
                  id="newUserEmployeeId" 
                  placeholder="e.g. EMP001" 
                  value={newUserEmployeeId}
                  onChange={(e) => setNewUserEmployeeId(e.target.value)}
                  className="h-8 text-xs" 
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="newUserPhone" className="text-xs">Phone</Label>
                <Input 
                  id="newUserPhone" 
                  type="tel"
                  placeholder="+91 98765 43210" 
                  value={newUserPhone}
                  onChange={(e) => setNewUserPhone(e.target.value)}
                  className="h-8 text-xs" 
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="newUserDepartment" className="text-xs">Department</Label>
                <Input 
                  id="newUserDepartment" 
                  placeholder="e.g. NPD Team" 
                  value={newUserDepartment}
                  onChange={(e) => setNewUserDepartment(e.target.value)}
                  className="h-8 text-xs" 
                />
              </div>
            </div>
            <DialogFooter className="mt-4">
              <Button variant="outline" className="h-8 text-xs" onClick={() => setAddUserDialogOpen(false)} disabled={isLoadingUsers}>
                Cancel
              </Button>
              <Button 
                className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 h-8 text-xs"
                onClick={handleAddUser}
                disabled={isLoadingUsers}
              >
                {isLoadingUsers ? (
                  <>Loading...</>
                ) : (
                  <>
                    <Plus className="w-3.5 h-3.5 mr-1.5" />
                    Add User
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit User Dialog */}
        <Dialog open={editUserDialogOpen} onOpenChange={setEditUserDialogOpen}>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-base">Edit User</DialogTitle>
              <DialogDescription className="text-xs">
                Update user information. Fields marked with * are required.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 mt-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="editUserFirstName" className="text-xs">First Name *</Label>
                  <Input 
                    id="editUserFirstName" 
                    placeholder="John" 
                    value={editUserFirstName}
                    onChange={(e) => setEditUserFirstName(e.target.value)}
                    className="h-8 text-xs" 
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="editUserLastName" className="text-xs">Last Name *</Label>
                  <Input 
                    id="editUserLastName" 
                    placeholder="Doe" 
                    value={editUserLastName}
                    onChange={(e) => setEditUserLastName(e.target.value)}
                    className="h-8 text-xs" 
                  />
                </div>
              </div>
              {userRole === "Approver" && (
                <>
                  <div className="space-y-1.5">
                    <Label htmlFor="editUserRole" className="text-xs">Role *</Label>
                    <Select
                      value={editUserRole}
                      onValueChange={(value) => setEditUserRole(value as UserRole)}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                      <SelectContent className="text-xs">
                        <SelectItem value="Approver">Approver</SelectItem>
                        <SelectItem value="NPD">NPD</SelectItem>
                        <SelectItem value="Maintenance">Maintenance</SelectItem>
                        <SelectItem value="Spares">Spares</SelectItem>
                        <SelectItem value="Indentor">Indentor</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="editUserStatus" className="text-xs">Status</Label>
                    <Select
                      value={editUserStatus}
                      onValueChange={(value) => setEditUserStatus(value)}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Select a status" />
                      </SelectTrigger>
                      <SelectContent className="text-xs">
                        <SelectItem value="Active">Active</SelectItem>
                        <SelectItem value="Inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
              <div className="space-y-1.5">
                <Label htmlFor="editUserPhone" className="text-xs">Phone</Label>
                <Input 
                  id="editUserPhone" 
                  type="tel"
                  placeholder="+91 98765 43210" 
                  value={editUserPhone}
                  onChange={(e) => setEditUserPhone(e.target.value)}
                  className="h-8 text-xs" 
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="editUserDepartment" className="text-xs">Department</Label>
                <Input 
                  id="editUserDepartment" 
                  placeholder="e.g. NPD Team" 
                  value={editUserDepartment}
                  onChange={(e) => setEditUserDepartment(e.target.value)}
                  className="h-8 text-xs" 
                />
              </div>
            </div>
            <DialogFooter className="mt-4">
              <Button variant="outline" className="h-8 text-xs" onClick={() => setEditUserDialogOpen(false)} disabled={isLoadingUsers}>
                Cancel
              </Button>
              <Button 
                className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 h-8 text-xs"
                onClick={handleSaveEditUser}
                disabled={isLoadingUsers}
              >
                {isLoadingUsers ? (
                  <>Saving...</>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5 mr-1.5" />
                    Save Changes
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Add Role Dialog */}
        <Dialog open={addRoleDialogOpen} onOpenChange={setAddRoleDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-base">Add Role</DialogTitle>
              <DialogDescription className="text-xs">
                Add a new role to the system. Fields marked with * are required.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 mt-4">
              <div className="space-y-1.5">
                <Label htmlFor="newRoleName" className="text-xs">Role Name *</Label>
                <Input 
                  id="newRoleName" 
                  placeholder="e.g. Approver" 
                  value={newRoleName}
                  onChange={(e) => setNewRoleName(e.target.value)}
                  className="h-8 text-xs" 
                  disabled={isLoadingRoles}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="newRoleDescription" className="text-xs">Description</Label>
                <Input 
                  id="newRoleDescription" 
                  placeholder="e.g. Project approval and creation" 
                  value={newRoleDescription}
                  onChange={(e) => setNewRoleDescription(e.target.value)}
                  className="h-8 text-xs" 
                  disabled={isLoadingRoles}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="newRolePermissions" className="text-xs">Permissions</Label>
                <Input 
                  id="newRolePermissions" 
                  placeholder="e.g. Full Access, PR Management, Quotations (comma-separated)" 
                  value={newRolePermissions}
                  onChange={(e) => setNewRolePermissions(e.target.value)}
                  className="h-8 text-xs" 
                  disabled={isLoadingRoles}
                />
                <p className="text-xs text-gray-500">Enter permissions separated by commas</p>
              </div>
            </div>
            <DialogFooter className="mt-4">
              <Button variant="outline" className="h-8 text-xs" onClick={() => setAddRoleDialogOpen(false)} disabled={isLoadingRoles}>
                Cancel
              </Button>
              <Button 
                className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 h-8 text-xs"
                onClick={handleAddRole}
                disabled={isLoadingRoles}
              >
                {isLoadingRoles ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <Plus className="w-3.5 h-3.5 mr-1.5" />
                    Add Role
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Role Dialog */}
        <Dialog open={editRoleDialogOpen} onOpenChange={setEditRoleDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-base">Edit Role</DialogTitle>
              <DialogDescription className="text-xs">
                Update role information. Fields marked with * are required.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 mt-4">
              <div className="space-y-1.5">
                <Label htmlFor="editRoleName" className="text-xs">Role Name *</Label>
                <Input 
                  id="editRoleName" 
                  placeholder="e.g. Approver" 
                  value={editRoleName}
                  onChange={(e) => setEditRoleName(e.target.value)}
                  className="h-8 text-xs" 
                  disabled={isLoadingRoles}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="editRoleDescription" className="text-xs">Description</Label>
                <Input 
                  id="editRoleDescription" 
                  placeholder="e.g. Project approval and creation" 
                  value={editRoleDescription}
                  onChange={(e) => setEditRoleDescription(e.target.value)}
                  className="h-8 text-xs" 
                  disabled={isLoadingRoles}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="editRolePermissions" className="text-xs">Permissions</Label>
                <Input 
                  id="editRolePermissions" 
                  placeholder="e.g. Full Access, PR Management (comma-separated)" 
                  value={editRolePermissions}
                  onChange={(e) => setEditRolePermissions(e.target.value)}
                  className="h-8 text-xs" 
                  disabled={isLoadingRoles}
                />
                <p className="text-xs text-gray-500">Enter permissions separated by commas</p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="editRoleStatus" className="text-xs">Status</Label>
                <Select
                  value={editRoleStatus}
                  onValueChange={(value) => setEditRoleStatus(value)}
                  disabled={isLoadingRoles}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Select a status" />
                  </SelectTrigger>
                  <SelectContent className="text-xs">
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter className="mt-4">
              <Button variant="outline" className="h-8 text-xs" onClick={() => setEditRoleDialogOpen(false)} disabled={isLoadingRoles}>
                Cancel
              </Button>
              <Button 
                className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 h-8 text-xs"
                onClick={handleSaveEditRole}
                disabled={isLoadingRoles}
              >
                {isLoadingRoles ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5 mr-1.5" />
                    Save Changes
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Add Department Dialog */}
        <Dialog open={addDepartmentDialogOpen} onOpenChange={setAddDepartmentDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-base">Add Department</DialogTitle>
              <DialogDescription className="text-xs">
                Add a new department to the system
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 mt-4">
              <div className="space-y-1.5">
                <Label htmlFor="newDepartmentName" className="text-xs">Department Name</Label>
                <Input 
                  id="newDepartmentName" 
                  placeholder="e.g. NPD Team"
                  value={newDepartmentName}
                  onChange={(e) => setNewDepartmentName(e.target.value)}
                  className="h-8 text-xs" 
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="newDepartmentHead" className="text-xs">Department Head</Label>
                <Input 
                  id="newDepartmentHead" 
                  placeholder="e.g. John Doe"
                  value={newDepartmentHead}
                  onChange={(e) => setNewDepartmentHead(e.target.value)}
                  className="h-8 text-xs" 
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="newDepartmentDescription" className="text-xs">Description</Label>
                <Input 
                  id="newDepartmentDescription" 
                  placeholder="e.g. New Product Development"
                  value={newDepartmentDescription}
                  onChange={(e) => setNewDepartmentDescription(e.target.value)}
                  className="h-8 text-xs" 
                />
              </div>
            </div>
            <DialogFooter className="mt-4">
              <Button variant="outline" className="h-8 text-xs" onClick={() => setAddDepartmentDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 h-8 text-xs"
                onClick={handleAddDepartment}
                disabled={isLoadingDepartments}
              >
                {isLoadingDepartments ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <Plus className="w-3.5 h-3.5 mr-1.5" />
                    Add Department
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Department Dialog */}
        <Dialog open={editDepartmentDialogOpen} onOpenChange={setEditDepartmentDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-base">Edit Department</DialogTitle>
              <DialogDescription className="text-xs">
                Edit department details
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 mt-4">
              <div className="space-y-1.5">
                <Label htmlFor="editDepartmentName" className="text-xs">Department Name</Label>
                <Input 
                  id="editDepartmentName" 
                  placeholder="e.g. NPD Team"
                  value={editDepartmentName}
                  onChange={(e) => setEditDepartmentName(e.target.value)}
                  className="h-8 text-xs" 
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="editDepartmentHead" className="text-xs">Department Head</Label>
                <Input 
                  id="editDepartmentHead" 
                  placeholder="e.g. John Doe"
                  value={editDepartmentHead}
                  onChange={(e) => setEditDepartmentHead(e.target.value)}
                  className="h-8 text-xs" 
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="editDepartmentDescription" className="text-xs">Description</Label>
                <Input 
                  id="editDepartmentDescription" 
                  placeholder="e.g. New Product Development"
                  value={editDepartmentDescription}
                  onChange={(e) => setEditDepartmentDescription(e.target.value)}
                  className="h-8 text-xs" 
                />
              </div>
            </div>
            <DialogFooter className="mt-4">
              <Button variant="outline" className="h-8 text-xs" onClick={() => setEditDepartmentDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 h-8 text-xs"
                onClick={handleSaveEditDepartment}
                disabled={isLoadingDepartments}
              >
                {isLoadingDepartments ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Pencil className="w-3.5 h-3.5 mr-1.5" />
                    Save Changes
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Add BOM Item Dialog */}
        <Dialog open={addBomDialogOpen} onOpenChange={setAddBomDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-base">Add BOM Item</DialogTitle>
              <DialogDescription className="text-xs">
                Add a new item to the Bill of Materials database
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 mt-4">
              <div className="space-y-1.5">
                <Label htmlFor="newBomItemName" className="text-xs">Item Name</Label>
                <Input 
                  id="newBomItemName" 
                  placeholder="e.g. Steel Plate"
                  value={newBomItemName}
                  onChange={(e) => setNewBomItemName(e.target.value)}
                  className="h-8 text-xs" 
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="newBomPartNumber" className="text-xs">Part Number</Label>
                  <Select
                    value={newBomPartNumber}
                    onValueChange={(value) => setNewBomPartNumber(value)}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Select part number" />
                    </SelectTrigger>
                    <SelectContent className="text-xs">
                      {partNumberConfig.length === 0 && (
                        <SelectItem value="none" disabled>No part numbers configured</SelectItem>
                      )}
                      {partNumberConfig.map((config) => (
                        <SelectItem key={config.id} value={config.example} className="font-mono">
                          {config.example} ({config.format})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="newBomToolNumber" className="text-xs">Tool Number</Label>
                  <Select
                    value={newBomToolNumber}
                    onValueChange={(value) => setNewBomToolNumber(value)}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Select tool number" />
                    </SelectTrigger>
                    <SelectContent className="text-xs">
                      {toolNumberConfig.length === 0 && (
                        <SelectItem value="none" disabled>No tool numbers configured</SelectItem>
                      )}
                      {toolNumberConfig.map((config) => (
                        <SelectItem key={config.id} value={config.example} className="font-mono">
                          {config.example} ({config.format})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="newBomCategory" className="text-xs">Category</Label>
                <Input 
                  id="newBomCategory" 
                  placeholder="e.g. Raw Material, Component"
                  value={newBomCategory}
                  onChange={(e) => setNewBomCategory(e.target.value)}
                  className="h-8 text-xs" 
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="newBomUnit" className="text-xs">Unit</Label>
                  <Input 
                    id="newBomUnit" 
                    placeholder="e.g. kg, pcs"
                    value={newBomUnit}
                    onChange={(e) => setNewBomUnit(e.target.value)}
                    className="h-8 text-xs" 
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="newBomUnitPrice" className="text-xs">Unit Price (INR)</Label>
                  <Input 
                    id="newBomUnitPrice" 
                    placeholder="e.g. ₹1,250"
                    value={newBomUnitPrice}
                    onChange={(e) => setNewBomUnitPrice(e.target.value)}
                    className="h-8 text-xs" 
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="newBomSupplier" className="text-xs">Supplier</Label>
                <Input 
                  id="newBomSupplier" 
                  placeholder="e.g. Steel Corp"
                  value={newBomSupplier}
                  onChange={(e) => setNewBomSupplier(e.target.value)}
                  className="h-8 text-xs" 
                />
              </div>
            </div>
            <DialogFooter className="mt-4">
              <Button variant="outline" className="h-8 text-xs" onClick={() => setAddBomDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 h-8 text-xs"
                onClick={handleAddBomItem}
              >
                <Plus className="w-3.5 h-3.5 mr-1.5" />
                Add BOM Item
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit BOM Item Dialog */}
        <Dialog open={editBomDialogOpen} onOpenChange={setEditBomDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-base">Edit BOM Item</DialogTitle>
              <DialogDescription className="text-xs">
                Edit Bill of Materials item details
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 mt-4">
              <div className="space-y-1.5">
                <Label htmlFor="editBomItemName" className="text-xs">Item Name</Label>
                <Input 
                  id="editBomItemName" 
                  placeholder="e.g. Steel Plate"
                  value={editBomItemName}
                  onChange={(e) => setEditBomItemName(e.target.value)}
                  className="h-8 text-xs" 
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="editBomPartNumber" className="text-xs">Part Number</Label>
                  <Select
                    value={editBomPartNumber}
                    onValueChange={(value) => setEditBomPartNumber(value)}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Select part number" />
                    </SelectTrigger>
                    <SelectContent className="text-xs">
                      {partNumberConfig.length === 0 && (
                        <SelectItem value="none" disabled>No part numbers configured</SelectItem>
                      )}
                      {partNumberConfig.map((config) => (
                        <SelectItem key={config.id} value={config.example} className="font-mono">
                          {config.example} ({config.format})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="editBomToolNumber" className="text-xs">Tool Number</Label>
                  <Select
                    value={editBomToolNumber}
                    onValueChange={(value) => setEditBomToolNumber(value)}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Select tool number" />
                    </SelectTrigger>
                    <SelectContent className="text-xs">
                      {toolNumberConfig.length === 0 && (
                        <SelectItem value="none" disabled>No tool numbers configured</SelectItem>
                      )}
                      {toolNumberConfig.map((config) => (
                        <SelectItem key={config.id} value={config.example} className="font-mono">
                          {config.example} ({config.format})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="editBomCategory" className="text-xs">Category</Label>
                <Input 
                  id="editBomCategory" 
                  placeholder="e.g. Raw Material, Component"
                  value={editBomCategory}
                  onChange={(e) => setEditBomCategory(e.target.value)}
                  className="h-8 text-xs" 
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="editBomUnit" className="text-xs">Unit</Label>
                  <Input 
                    id="editBomUnit" 
                    placeholder="e.g. kg, pcs"
                    value={editBomUnit}
                    onChange={(e) => setEditBomUnit(e.target.value)}
                    className="h-8 text-xs" 
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="editBomUnitPrice" className="text-xs">Unit Price (INR)</Label>
                  <Input 
                    id="editBomUnitPrice" 
                    placeholder="e.g. ₹1,250"
                    value={editBomUnitPrice}
                    onChange={(e) => setEditBomUnitPrice(e.target.value)}
                    className="h-8 text-xs" 
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="editBomSupplier" className="text-xs">Supplier</Label>
                <Input 
                  id="editBomSupplier" 
                  placeholder="e.g. Steel Corp"
                  value={editBomSupplier}
                  onChange={(e) => setEditBomSupplier(e.target.value)}
                  className="h-8 text-xs" 
                />
              </div>
            </div>
            <DialogFooter className="mt-4">
              <Button variant="outline" className="h-8 text-xs" onClick={() => setEditBomDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 h-8 text-xs"
                onClick={handleSaveEditBomItem}
              >
                <Pencil className="w-3.5 h-3.5 mr-1.5" />
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}