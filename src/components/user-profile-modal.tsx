"use client";

import { useState, useEffect } from "react";
import { 
  User, 
  Mail, 
  Phone, 
  ShieldCheck, 
  KeyRound, 
  Bell, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  Eye, 
  EyeOff, 
  Building2, 
  Briefcase, 
  Save,
  Lock,
  Smartphone
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialName?: string;
  initialEmail?: string;
  initialRole?: string;
}

export function UserProfileModal({
  isOpen,
  onClose,
  initialName = "Juan Dela Cruz",
  initialEmail = "resident@enclavehoa.com",
  initialRole = "RESIDENT",
}: UserProfileModalProps) {
  const [activeTab, setActiveTab] = useState<"details" | "security" | "notifications">("details");

  // Profile Details State
  const nameParts = initialName.split(" ");
  const [firstName, setFirstName] = useState(nameParts[0] || "Juan");
  const [lastName, setLastName] = useState(nameParts.slice(1).join(" ") || "Dela Cruz");
  const [email, setEmail] = useState(initialEmail);
  const [mobileNumber, setMobileNumber] = useState("+63 917 444 5566");
  const [emergencyPhone, setEmergencyPhone] = useState("+63 918 999 8888");

  // Security / Password State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Notification Preferences
  const [smsAlerts, setSmsAlerts] = useState(true);
  const [emailBulletins, setEmailBulletins] = useState(true);
  const [whatsappGatePass, setWhatsappGatePass] = useState(true);

  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const matchName = document.cookie.match(/demo_user_name=([^;]+)/);
    const matchEmail = document.cookie.match(/demo_user_email=([^;]+)/);
    if (matchName) {
      const full = decodeURIComponent(matchName[1]);
      const parts = full.split(" ");
      setFirstName(parts[0] || "");
      setLastName(parts.slice(1).join(" ") || "");
    }
    if (matchEmail) {
      setEmail(decodeURIComponent(matchEmail[1]));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Password validation
  const hasMinLength = newPassword.length >= 8;
  const hasNumber = /\d/.test(newPassword);
  const hasUpper = /[A-Z]/.test(newPassword);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(newPassword);
  const isStrong = hasMinLength && hasNumber && hasUpper;

  const handleSaveDetails = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const updatedFullName = `${firstName.trim()} ${lastName.trim()}`;
    document.cookie = `demo_user_name=${encodeURIComponent(updatedFullName)}; path=/; max-age=86400`;
    document.cookie = `demo_user_email=${encodeURIComponent(email.trim())}; path=/; max-age=86400`;

    setTimeout(() => {
      setIsSubmitting(false);
      setNotification({
        type: "success",
        message: "Profile details updated successfully!",
      });
      setTimeout(() => setNotification(null), 3000);
    }, 400);
  };

  const handleUpdatePassword = (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentPassword) {
      setNotification({ type: "error", message: "Please enter your current password." });
      return;
    }

    if (newPassword.length < 8) {
      setNotification({ type: "error", message: "New password must be at least 8 characters long." });
      return;
    }

    if (newPassword !== confirmPassword) {
      setNotification({ type: "error", message: "New passwords do not match." });
      return;
    }

    if (newPassword === currentPassword) {
      setNotification({ type: "error", message: "New password cannot be the same as your current password." });
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setNotification({
        type: "success",
        message: "Password updated successfully!",
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setNotification(null), 3000);
    }, 500);
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "SUPER_ADMIN": return "Super Administrator";
      case "TREASURER": return "HOA Treasurer / Finance";
      case "GUARD": return "Security Officer";
      default: return "Resident Member";
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <Card className="w-full max-w-lg bg-white shadow-2xl border-slate-200 overflow-hidden max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 my-auto">
        {/* Modal Header */}
        <CardHeader className="bg-slate-900 text-white flex flex-row items-center justify-between p-4 sm:p-5 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center font-bold text-white shadow-xs">
              <User className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-base font-bold text-white flex items-center gap-2">
                <span>Account & Profile Settings</span>
              </CardTitle>
              <CardDescription className="text-xs text-slate-400">
                {getRoleLabel(initialRole)} • {email}
              </CardDescription>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </CardHeader>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50/80 px-4 pt-2 gap-2 text-xs shrink-0 overflow-x-auto">
          <button
            onClick={() => setActiveTab("details")}
            className={`pb-2 px-3 font-semibold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === "details"
                ? "border-emerald-600 text-emerald-800"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            <User className="w-3.5 h-3.5" />
            Profile Details
          </button>

          <button
            onClick={() => setActiveTab("security")}
            className={`pb-2 px-3 font-semibold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === "security"
                ? "border-emerald-600 text-emerald-800"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            Password & Security
          </button>

          <button
            onClick={() => setActiveTab("notifications")}
            className={`pb-2 px-3 font-semibold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === "notifications"
                ? "border-emerald-600 text-emerald-800"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            <Bell className="w-3.5 h-3.5" />
            Notifications
          </button>
        </div>

        {/* Modal Body */}
        <CardContent className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
          {notification && (
            <div
              className={`p-3 rounded-lg border text-xs flex items-center gap-2 animate-in fade-in ${
                notification.type === "success"
                  ? "bg-emerald-50 border-emerald-200 text-emerald-800 font-semibold"
                  : "bg-rose-50 border-rose-200 text-rose-800 font-semibold"
              }`}
            >
              {notification.type === "success" ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{notification.message}</span>
            </div>
          )}

          {/* TAB 1: PROFILE DETAILS */}
          {activeTab === "details" && (
            <form onSubmit={handleSaveDetails} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700">First Name</Label>
                  <Input
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="h-9 text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700">Last Name</Label>
                  <Input
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="h-9 text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">Official Login Email</Label>
                <div className="relative">
                  <Input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-9 text-xs pl-8"
                  />
                  <Mail className="w-3.5 h-3.5 absolute left-2.5 top-3 text-slate-400" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700">Primary Mobile Number</Label>
                  <div className="relative">
                    <Input
                      value={mobileNumber}
                      onChange={(e) => setMobileNumber(e.target.value)}
                      placeholder="+63 9XX XXX XXXX"
                      className="h-9 text-xs pl-8"
                    />
                    <Smartphone className="w-3.5 h-3.5 absolute left-2.5 top-3 text-slate-400" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700">Emergency Relative Phone</Label>
                  <div className="relative">
                    <Input
                      value={emergencyPhone}
                      onChange={(e) => setEmergencyPhone(e.target.value)}
                      placeholder="+63 9XX XXX XXXX"
                      className="h-9 text-xs pl-8 text-rose-700"
                    />
                    <Phone className="w-3.5 h-3.5 absolute left-2.5 top-3 text-slate-400" />
                  </div>
                </div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1 text-slate-600">
                <div className="flex justify-between items-center">
                  <span className="font-medium">System Role:</span>
                  <Badge variant="outline" className="font-bold text-slate-800">
                    {initialRole}
                  </Badge>
                </div>
                <div className="flex justify-between items-center pt-1 border-t border-slate-200">
                  <span className="font-medium">Designation:</span>
                  <span className="font-semibold text-emerald-800">
                    {initialRole === "SUPER_ADMIN" ? "System Admin (Independent)" : "Homeowner / Resident"}
                  </span>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <Button type="button" variant="outline" onClick={onClose} className="h-9 text-xs">
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold h-9 text-xs flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  {isSubmitting ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          )}

          {/* TAB 2: SECURITY & PASSWORD */}
          {activeTab === "security" && (
            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">Current Password</Label>
                <div className="relative">
                  <Input
                    type={showCurrent ? "text" : "password"}
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    className="pr-10 text-xs h-9"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrent(!showCurrent)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">New Password</Label>
                <div className="relative">
                  <Input
                    type={showNew ? "text" : "password"}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    className="pr-10 text-xs h-9"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(!showNew)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Password Strength Checklist */}
                <div className="grid grid-cols-2 gap-1.5 pt-1 text-[11px] text-slate-500">
                  <div className={`flex items-center gap-1 ${hasMinLength ? "text-emerald-700 font-semibold" : ""}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${hasMinLength ? "bg-emerald-600" : "bg-slate-300"}`} />
                    8+ Characters
                  </div>
                  <div className={`flex items-center gap-1 ${hasNumber ? "text-emerald-700 font-semibold" : ""}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${hasNumber ? "bg-emerald-600" : "bg-slate-300"}`} />
                    Has Number
                  </div>
                  <div className={`flex items-center gap-1 ${hasUpper ? "text-emerald-700 font-semibold" : ""}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${hasUpper ? "bg-emerald-600" : "bg-slate-300"}`} />
                    Has Uppercase
                  </div>
                  <div className={`flex items-center gap-1 ${hasSpecial ? "text-emerald-700 font-semibold" : ""}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${hasSpecial ? "bg-emerald-600" : "bg-slate-300"}`} />
                    Has Symbol
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">Confirm New Password</Label>
                <div className="relative">
                  <Input
                    type={showConfirm ? "text" : "password"}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-type new password"
                    className="pr-10 text-xs h-9"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <Button type="button" variant="outline" onClick={onClose} className="h-9 text-xs">
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting || !isStrong || newPassword !== confirmPassword}
                  className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold h-9 text-xs flex items-center gap-1.5"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  {isSubmitting ? "Updating..." : "Update Password"}
                </Button>
              </div>
            </form>
          )}

          {/* TAB 3: NOTIFICATIONS */}
          {activeTab === "notifications" && (
            <div className="space-y-4 text-xs">
              <p className="text-slate-500 text-xs">
                Manage how you receive gate pass alerts, billing statements, and emergency announcements.
              </p>

              <div className="space-y-3">
                <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={smsAlerts}
                    onChange={(e) => setSmsAlerts(e.target.checked)}
                    className="mt-0.5 rounded text-emerald-600"
                  />
                  <div>
                    <span className="font-bold text-slate-900 block">SMS Emergency Broadcasts</span>
                    <span className="text-slate-500 text-[11px]">Instant text alerts for power maintenance or security advisories.</span>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={emailBulletins}
                    onChange={(e) => setEmailBulletins(e.target.checked)}
                    className="mt-0.5 rounded text-emerald-600"
                  />
                  <div>
                    <span className="font-bold text-slate-900 block">Email Invoices & Official Receipts</span>
                    <span className="text-slate-500 text-[11px]">Monthly dues statement summaries and payment confirmations.</span>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={whatsappGatePass}
                    onChange={(e) => setWhatsappGatePass(e.target.checked)}
                    className="mt-0.5 rounded text-emerald-600"
                  />
                  <div>
                    <span className="font-bold text-slate-900 block">WhatsApp Visitor QR Passes</span>
                    <span className="text-slate-500 text-[11px]">Receive automatic copy of guest passes when visitors arrive at Gate 1.</span>
                  </div>
                </label>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <Button
                  type="button"
                  onClick={() => {
                    setNotification({ type: "success", message: "Notification preferences saved!" });
                    setTimeout(() => setNotification(null), 3000);
                  }}
                  className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold h-9 text-xs"
                >
                  Save Preferences
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
