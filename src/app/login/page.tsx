"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { 
  Building2, 
  LockKeyhole, 
  Mail, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  Sparkles, 
  ShieldCheck, 
  Info,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCommunitySettings } from "@/lib/context/community-settings";
import { INITIAL_USERS } from "@/lib/data/mock-data";
import { UserRole } from "@/types/database";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { settings } = useCommunitySettings();

  const [activeTab, setActiveTab] = useState<"signin" | "register" | "forgot">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState("");
  const [lotAddress, setLotAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showDemoAccordion, setShowDemoAccordion] = useState(false);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const trimmedEmail = email.trim().toLowerCase();

    // Check against seeded user database
    const matchedUser = INITIAL_USERS.find(
      (u) => u.email.toLowerCase() === trimmedEmail
    );

    setTimeout(() => {
      if (matchedUser) {
        // Successful login
        const role = matchedUser.role;
        const name = `${matchedUser.first_name} ${matchedUser.last_name}`;

        document.cookie = `demo_user_role=${role}; path=/; max-age=86400; SameSite=Lax`;
        document.cookie = `demo_user_name=${encodeURIComponent(name)}; path=/; max-age=86400; SameSite=Lax`;
        document.cookie = `demo_user_email=${encodeURIComponent(matchedUser.email)}; path=/; max-age=86400; SameSite=Lax`;

        setSuccessMessage(`Welcome back, ${name}! Redirecting...`);

        setTimeout(() => {
          if (role === "SUPER_ADMIN" || role === "TREASURER") {
            router.push("/admin");
          } else if (role === "GUARD") {
            router.push("/guard");
          } else {
            router.push("/resident");
          }
          router.refresh();
        }, 500);
      } else if (trimmedEmail) {
        // If unknown email in demo, default to new resident
        const demoName = fullName || trimmedEmail.split("@")[0];
        document.cookie = `demo_user_role=RESIDENT; path=/; max-age=86400; SameSite=Lax`;
        document.cookie = `demo_user_name=${encodeURIComponent(demoName)}; path=/; max-age=86400; SameSite=Lax`;
        document.cookie = `demo_user_email=${encodeURIComponent(trimmedEmail)}; path=/; max-age=86400; SameSite=Lax`;

        setSuccessMessage(`Signed in as Resident. Redirecting to Homeowner portal...`);
        setTimeout(() => {
          router.push("/resident");
          router.refresh();
        }, 500);
      } else {
        setErrorMessage("Please enter a valid email address.");
        setIsLoading(false);
      }
    }, 400);
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    setTimeout(() => {
      const name = fullName || "New Resident";
      document.cookie = `demo_user_role=RESIDENT; path=/; max-age=86400; SameSite=Lax`;
      document.cookie = `demo_user_name=${encodeURIComponent(name)}; path=/; max-age=86400; SameSite=Lax`;
      document.cookie = `demo_user_email=${encodeURIComponent(email || "resident@enclavehoa.com")}; path=/; max-age=86400; SameSite=Lax`;

      setSuccessMessage("Account registration submitted! Entering Homeowner Portal...");
      setTimeout(() => {
        router.push("/resident");
        router.refresh();
      }, 500);
    }, 400);
  };

  const handleQuickFill = (user: typeof INITIAL_USERS[0]) => {
    setEmail(user.email);
    setPassword("Password123!");
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Ambience Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center z-10">
        <Link href="/" className="inline-flex items-center gap-3 group">
          <div className="w-12 h-12 rounded-2xl bg-emerald-600 flex items-center justify-center text-white font-extrabold text-2xl shadow-xl ring-4 ring-emerald-500/20 group-hover:scale-105 transition-transform">
            {settings.villageName.substring(0, 1) || "E"}
          </div>
          <div className="text-left">
            <h1 className="text-xl font-bold text-white tracking-tight">
              {settings.villageName}
            </h1>
            <p className="text-xs text-emerald-400 font-medium tracking-wide">
              {settings.motherVillageName} Enclave Portal
            </p>
          </div>
        </Link>
        <h2 className="mt-6 text-xl font-semibold text-slate-100">
          HOA Secure Management Gateway
        </h2>
        <p className="mt-1 text-xs text-slate-400">
          Single Sign-On for Homeowners, HOA Officers & Security Staff
        </p>
      </div>

      {/* Main Authentication Card */}
      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md z-10 px-4">
        <Card className="bg-slate-950/80 border-slate-800 backdrop-blur-xl shadow-2xl overflow-hidden text-slate-100">
          <Tabs value={activeTab} onValueChange={(v) => {
            setActiveTab(v as any);
            setErrorMessage(null);
            setSuccessMessage(null);
          }}>
            <div className="px-6 pt-5">
              <TabsList className="grid w-full grid-cols-2 bg-slate-900 border border-slate-800 text-xs">
                <TabsTrigger value="signin">Sign In</TabsTrigger>
                <TabsTrigger value="register">Register Resident</TabsTrigger>
              </TabsList>
            </div>

            {/* SIGN IN TAB */}
            <TabsContent value="signin" className="p-6 pt-4 space-y-4">
              {errorMessage && (\n                <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg flex items-center gap-2 text-rose-300 text-xs">\n                  <AlertCircle className="w-4 h-4 shrink-0" />\n                  <span>{errorMessage}</span>\n                </div>\n              )}

              {successMessage && (\n                <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg flex items-center gap-2 text-emerald-300 text-xs">\n                  <CheckCircle2 className="w-4 h-4 shrink-0" />\n                  <span>{successMessage}</span>\n                </div>\n              )}

              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs text-slate-300 font-medium">Email Address</Label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <Input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. resident@enclavehoa.com"
                      className="pl-9 bg-slate-900/90 border-slate-700 text-white placeholder:text-slate-500 text-xs h-10"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs text-slate-300 font-medium">Password</Label>
                    <button
                      type="button"
                      onClick={() => setActiveTab("forgot")}
                      className="text-[11px] text-emerald-400 hover:text-emerald-300 hover:underline"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <LockKeyhole className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <Input
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="pl-9 pr-9 bg-slate-900/90 border-slate-700 text-white placeholder:text-slate-500 text-xs h-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold h-10 shadow-lg shadow-emerald-900/30 transition-all"
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                      Authenticating...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-1.5">
                      Sign In to Portal <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  )}
                </Button>
              </form>
            </TabsContent>

            {/* REGISTER TAB */}
            <TabsContent value="register" className="p-6 pt-4 space-y-4">
              <div className="text-xs text-slate-400">
                Register your lot residence or tenant profile for official HOA verification.
              </div>

              {successMessage && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg flex items-center gap-2 text-emerald-300 text-xs">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{successMessage}</span>
                </div>
              )}

              <form onSubmit={handleRegister} className="space-y-3">
                <div className="space-y-1">
                  <Label className="text-xs text-slate-300">Full Name</Label>
                  <Input
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Maria Santos"
                    className="bg-slate-900/90 border-slate-700 text-white text-xs h-9"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs text-slate-300">Unit (Block & Lot)</Label>
                  <Input
                    required
                    value={lotAddress}
                    onChange={(e) => setLotAddress(e.target.value)}
                    placeholder="e.g. Block 3 Lot 14"
                    className="bg-slate-900/90 border-slate-700 text-white text-xs h-9"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs text-slate-300">Email Address</Label>
                  <Input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="maria.santos@gmail.com"
                    className="bg-slate-900/90 border-slate-700 text-white text-xs h-9"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs text-slate-300">Mobile Number</Label>
                  <Input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+63 917 123 4567"
                    className="bg-slate-900/90 border-slate-700 text-white text-xs h-9"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold h-9 mt-2"
                >
                  Create Homeowner Profile
                </Button>
              </form>
            </TabsContent>

            {/* FORGOT PASSWORD TAB */}
            <TabsContent value="forgot" className="p-6 pt-4 space-y-4">
              <div className="text-xs text-slate-400">
                Enter your registered email address and we will send you a password reset link.
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-slate-300">Email Address</Label>
                <Input
                  type="email"
                  placeholder="name@enclavehoa.com"
                  className="bg-slate-900/90 border-slate-700 text-white text-xs h-10"
                />
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setActiveTab("signin")}
                  className="w-1/2 border-slate-700 text-slate-300 text-xs h-9"
                >
                  Back to Sign In
                </Button>
                <Button
                  onClick={() => {
                    setSuccessMessage("Password reset email sent to your inbox.");
                    setActiveTab("signin");
                  }}
                  className="w-1/2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold h-9"
                >
                  Send Reset Link
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </Card>

        {/* Security / Compliance Footer */}
        <div className="mt-6 text-center text-xs text-slate-500 space-y-1.5">
          <p className="flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Enclavix • 256-Bit Encrypted HOA Governance Platform</span>
          </p>
          <div className="flex items-center justify-center gap-3 text-[11px] text-slate-400">
            <Link href="/about" className="hover:text-emerald-400 font-semibold underline underline-offset-2">About Enclavix</Link>
            <span>•</span>
            <Link href="/" className="hover:text-emerald-400">Public Portal</Link>
          </div>
          <p className="text-[10px] text-slate-600">
            {settings.villageName} • Protected under RA 9904 (Magna Carta for Homeowners)
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}
