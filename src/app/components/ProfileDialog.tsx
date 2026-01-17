import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { 
  User, 
  Mail, 
  Phone, 
  Building2, 
  Lock,
  Save,
  AlertCircle,
  Loader2
} from "lucide-react";
import { useState, useEffect } from "react";
import { apiService } from "../services/api";

type UserRole = "Approver" | "NPD" | "Maintenance" | "Spares" | "Indentor";

interface ProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userRole: UserRole;
}

export function ProfileDialog({ open, onOpenChange, userRole }: ProfileDialogProps) {
  // Profile form state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [department, setDepartment] = useState("");
  const [userId, setUserId] = useState<string | null>(null);

  // Password form state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Loading and error states
  const [isLoading, setIsLoading] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Fetch current user data when dialog opens
  useEffect(() => {
    const fetchUserData = async () => {
      if (!open) return;
      
      setIsLoading(true);
      setError(null);
      try {
        const currentUser = apiService.getCurrentUser();
        if (!currentUser || !currentUser.id) {
          setError('User not found');
          return;
        }

        const user = await apiService.getUserById(currentUser.id);
        setUserId(user.id);
        setFirstName(user.firstName || "");
        setLastName(user.lastName || "");
        setEmail(user.email || "");
        setPhone(user.phone || "");
        setDepartment(user.department || "");
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch user data';
        setError(errorMessage);
        console.error('Error fetching user data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [open]);

  // Handle Save Profile
  const handleSaveProfile = async () => {
    if (!userId) {
      alert('User ID not found');
      return;
    }

    if (!firstName || !lastName) {
      alert('Please fill in First Name and Last Name');
      return;
    }

    setIsSavingProfile(true);
    setError(null);
    try {
      const userData = {
        firstName,
        lastName,
        phone: phone || undefined,
        department: department || undefined,
      };

      await apiService.updateUser(userId, userData);
      
      // Update localStorage with new user data
      const currentUser = apiService.getCurrentUser();
      if (currentUser) {
        currentUser.firstName = firstName;
        currentUser.lastName = lastName;
        currentUser.phone = phone;
        currentUser.department = department;
        localStorage.setItem('user', JSON.stringify(currentUser));
      }

      alert('Profile updated successfully!');
      onOpenChange(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update profile';
      setError(errorMessage);
      alert(errorMessage);
      console.error('Error updating profile:', err);
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Handle Change Password
  const handleChangePassword = async () => {
    if (!userId) {
      alert('User ID not found');
      return;
    }

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError('Please fill in all password fields');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirm password do not match');
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters long');
      return;
    }

    setIsChangingPassword(true);
    setPasswordError(null);
    try {
      await apiService.changePassword(userId, {
        currentPassword,
        newPassword,
      });

      // Clear password fields
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      
      alert('Password changed successfully!');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to change password';
      setPasswordError(errorMessage);
      alert(errorMessage);
      console.error('Error changing password:', err);
    } finally {
      setIsChangingPassword(false);
    }
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">Profile Settings</DialogTitle>
          <DialogDescription className="text-xs">
            Update your personal information and security settings
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Profile Information */}
          <Card>
            <CardHeader className="p-4">
              <CardTitle className="flex items-center gap-2 text-base">
                <User className="w-4 h-4" />
                Profile Information
              </CardTitle>
              <CardDescription className="text-xs">
                Update your personal information and contact details
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-0 space-y-3">
              {isLoading ? (
                <div className="text-center py-8">
                  <Loader2 className="w-6 h-6 mx-auto mb-2 animate-spin text-gray-400" />
                  <p className="text-xs text-gray-500">Loading profile...</p>
                </div>
              ) : error ? (
                <div className="p-2 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-xs text-red-800">Error: {error}</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="firstName" className="text-xs">First Name</Label>
                      <Input 
                        id="firstName" 
                        placeholder="Enter first name" 
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="h-8 text-xs"
                        disabled={isSavingProfile}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="lastName" className="text-xs">Last Name</Label>
                      <Input 
                        id="lastName" 
                        placeholder="Enter last name" 
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="h-8 text-xs"
                        disabled={isSavingProfile}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="email" className="flex items-center gap-1.5 text-xs">
                      <Mail className="w-3.5 h-3.5" />
                      Email Address
                    </Label>
                    <Input 
                      id="email" 
                      type="email" 
                      placeholder="Enter email" 
                      value={email}
                      disabled
                      className="h-8 text-xs bg-gray-50"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="phone" className="flex items-center gap-1.5 text-xs">
                      <Phone className="w-3.5 h-3.5" />
                      Phone Number
                    </Label>
                    <Input 
                      id="phone" 
                      type="tel" 
                      placeholder="Enter phone number" 
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="h-8 text-xs"
                      disabled={isSavingProfile}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="department" className="flex items-center gap-1.5 text-xs">
                      <Building2 className="w-3.5 h-3.5" />
                      Department / Team
                    </Label>
                    <Input 
                      id="department" 
                      placeholder="Enter department" 
                      value={department || `${userRole} Team`}
                      onChange={(e) => setDepartment(e.target.value)}
                      className="h-8 text-xs"
                      disabled={isSavingProfile}
                    />
                  </div>
                </>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="role" className="text-xs">Current Role</Label>
                <div className="flex items-center gap-2">
                  <Badge className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white text-xs">
                    {userRole}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Security Settings */}
          <Card>
            <CardHeader className="p-4">
              <CardTitle className="flex items-center gap-2 text-base">
                <Lock className="w-4 h-4" />
                Security Settings
              </CardTitle>
              <CardDescription className="text-xs">
                Manage your account security and password
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-0 space-y-3">
              {passwordError && (
                <div className="p-2 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-xs text-red-800">{passwordError}</p>
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="currentPassword" className="text-xs">Current Password</Label>
                <Input 
                  id="currentPassword" 
                  type="password" 
                  placeholder="Enter current password" 
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="h-8 text-xs"
                  disabled={isChangingPassword}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="newPassword" className="text-xs">New Password</Label>
                <Input 
                  id="newPassword" 
                  type="password" 
                  placeholder="Enter new password" 
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    setPasswordError(null);
                  }}
                  className="h-8 text-xs"
                  disabled={isChangingPassword}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="confirmPassword" className="text-xs">Confirm New Password</Label>
                <Input 
                  id="confirmPassword" 
                  type="password" 
                  placeholder="Confirm new password" 
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setPasswordError(null);
                  }}
                  className="h-8 text-xs"
                  disabled={isChangingPassword}
                />
              </div>

              <div className="flex items-start gap-2 p-2 bg-blue-50 border border-blue-200 rounded-md">
                <AlertCircle className="w-3.5 h-3.5 text-blue-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-blue-800">
                  Password must be at least 8 characters long and contain uppercase, lowercase, numbers, and special characters.
                </p>
              </div>

              <Button 
                className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 h-8 text-xs"
                onClick={handleChangePassword}
                disabled={isChangingPassword}
              >
                {isChangingPassword ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Lock className="w-3.5 h-3.5 mr-1.5" />
                    Update Password
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-2 pb-2">
            <Button 
              variant="outline" 
              className="h-8 text-xs" 
              onClick={() => onOpenChange(false)}
              disabled={isSavingProfile || isChangingPassword}
            >
              Cancel
            </Button>
            <Button 
              className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 h-8 text-xs"
              onClick={handleSaveProfile}
              disabled={isSavingProfile || isChangingPassword || isLoading}
            >
              {isSavingProfile ? (
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
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
