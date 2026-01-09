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
  AlertCircle
} from "lucide-react";

type UserRole = "Approver" | "NPD" | "Maintenance" | "Spares" | "Indentor";

interface ProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userRole: UserRole;
}

export function ProfileDialog({ open, onOpenChange, userRole }: ProfileDialogProps) {
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
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="firstName" className="text-xs">First Name</Label>
                  <Input id="firstName" placeholder="Enter first name" defaultValue="John" className="h-8 text-xs" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="lastName" className="text-xs">Last Name</Label>
                  <Input id="lastName" placeholder="Enter last name" defaultValue="Doe" className="h-8 text-xs" />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email" className="flex items-center gap-1.5 text-xs">
                  <Mail className="w-3.5 h-3.5" />
                  Email Address
                </Label>
                <Input id="email" type="email" placeholder="Enter email" defaultValue="john.doe@company.com" className="h-8 text-xs" />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="phone" className="flex items-center gap-1.5 text-xs">
                  <Phone className="w-3.5 h-3.5" />
                  Phone Number
                </Label>
                <Input id="phone" type="tel" placeholder="Enter phone number" defaultValue="+91 98765 43210" className="h-8 text-xs" />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="department" className="flex items-center gap-1.5 text-xs">
                  <Building2 className="w-3.5 h-3.5" />
                  Department / Team
                </Label>
                <Input id="department" placeholder="Enter department" defaultValue={`${userRole} Team`} disabled className="h-8 text-xs" />
              </div>

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
              <div className="space-y-1.5">
                <Label htmlFor="currentPassword" className="text-xs">Current Password</Label>
                <Input id="currentPassword" type="password" placeholder="Enter current password" className="h-8 text-xs" />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="newPassword" className="text-xs">New Password</Label>
                <Input id="newPassword" type="password" placeholder="Enter new password" className="h-8 text-xs" />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="confirmPassword" className="text-xs">Confirm New Password</Label>
                <Input id="confirmPassword" type="password" placeholder="Confirm new password" className="h-8 text-xs" />
              </div>

              <div className="flex items-start gap-2 p-2 bg-blue-50 border border-blue-200 rounded-md">
                <AlertCircle className="w-3.5 h-3.5 text-blue-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-blue-800">
                  Password must be at least 8 characters long and contain uppercase, lowercase, numbers, and special characters.
                </p>
              </div>

              <Button className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 h-8 text-xs">
                <Lock className="w-3.5 h-3.5 mr-1.5" />
                Update Password
              </Button>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-2 pb-2">
            <Button variant="outline" className="h-8 text-xs" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 h-8 text-xs">
              <Save className="w-3.5 h-3.5 mr-1.5" />
              Save Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
