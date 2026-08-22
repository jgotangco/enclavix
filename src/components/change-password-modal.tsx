"use client";

import { useState } from "react";
import { 
  KeyRound, 
  Lock, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  AlertCircle, 
  X,
  ShieldCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail?: string;
}

export function ChangePasswordModal({ isOpen, onClose, userEmail }: ChangePasswordModalProps) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  // Password strength validation
  const hasMinLength = newPassword.length >= 8;
  const hasNumber = /\d/.test(newPassword);
  const hasUpper = /[A-Z]/.test(newPassword);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(newPassword);
  const isStrong = hasMinLength && hasNumber && hasUpper;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!currentPassword) {
      setError("Please enter your current password.");
      return;
    }

    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }

    if (newPassword === currentPassword) {
      setError("New password cannot be the same as your old password.");
      return;
    }

    setIsSubmitting(true);

    // Simulate password update with local state persistence
    setTimeout(() => {
      setIsSubmitting(false);
      setSuccess("Password updated successfully! Please use your new password next time you log in.");
      setTimeout(() => {
        setSuccess(null);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        onClose();
      }, 2000);
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white shadow-2xl border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
        <CardHeader className="bg-slate-900 text-white flex flex-row items-center justify-between pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold">
              <KeyRound className="w-4 h-4" />
            </div>
            <div>
              <CardTitle className="text-base font-bold text-white leading-tight">Change Password</CardTitle>
              <CardDescription className="text-xs text-slate-400">
                {userEmail ? `Update credentials for ${userEmail}` : "Secure account credentials"}
              </CardDescription>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="p-6 space-y-4">
            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2 text-rose-700 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2 text-emerald-700 text-xs font-semibold">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{success}</span>
              </div>
            )}

            {/* Current Password */}
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

            {/* New Password */}
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

              {/* Password Requirements Checklist */}
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

            {/* Confirm New Password */}
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
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="h-9 text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || !isStrong || newPassword !== confirmPassword}
                className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold h-9 text-xs flex items-center gap-1.5"
              >
                <ShieldCheck className="w-4 h-4" />
                {isSubmitting ? "Updating..." : "Update Password"}
              </Button>
            </div>
          </CardContent>
        </form>
      </Card>
    </div>
  );
}
