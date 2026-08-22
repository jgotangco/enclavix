"use client";

import { useState } from "react";
import { 
  Users, 
  UserPlus, 
  Search, 
  Filter, 
  ShieldCheck, 
  BadgeDollarSign, 
  UserCheck, 
  ShieldAlert, 
  Home, 
  Phone, 
  Mail, 
  Edit, 
  CheckCircle2, 
  X, 
  KeyRound, 
  Building2,
  Lock,
  UserCog,
  Briefcase,
  Award
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { INITIAL_USERS, INITIAL_PROPERTIES } from "@/lib/data/mock-data";
import { Profile, UserRole, OfficerPosition, AffiliationType } from "@/types/database";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<Profile[]>(INITIAL_USERS);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRole, setSelectedRole] = useState<string>("ALL");
  const [selectedPosition, setSelectedPosition] = useState<string>("ALL");
  const [selectedAffiliation, setSelectedAffiliation] = useState<string>("ALL");

  // Modals state
  const [editingUser, setEditingUser] = useState<Profile | null>(null);
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  // New user form state
  const [newFirstName, setNewFirstName] = useState("");
  const [newLastName, setNewLastName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newRole, setNewRole] = useState<UserRole>("RESIDENT");
  const [newPosition, setNewPosition] = useState<OfficerPosition>("NONE");
  const [newAffiliation, setNewAffiliation] = useState<AffiliationType>("HOMEOWNER");
  const [newPropertyId, setNewPropertyId] = useState<string>("");

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  // Filtered Users
  const filteredUsers = users.filter((u) => {
    const fullName = `${u.first_name} ${u.last_name}`.toLowerCase();
    const matchesSearch =
      fullName.includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.phone_number && u.phone_number.includes(searchQuery));

    const matchesRole = selectedRole === "ALL" || u.role === selectedRole;
    const matchesPosition = selectedPosition === "ALL" || (u.officer_position || "NONE") === selectedPosition;
    const matchesAffiliation = selectedAffiliation === "ALL" || (u.affiliation_type || "HOMEOWNER") === selectedAffiliation;

    return matchesSearch && matchesRole && matchesPosition && matchesAffiliation;
  });

  // Summary Metrics
  const totalAdmins = users.filter((u) => u.role === "SUPER_ADMIN").length;
  const totalOfficers = users.filter((u) => u.officer_position && u.officer_position !== "NONE").length;
  const totalEmployees = users.filter((u) => u.affiliation_type === "HOA_EMPLOYEE" || u.affiliation_type === "SECURITY_PERSONNEL" || u.affiliation_type === "PROPERTY_STAFF").length;
  const totalResidents = users.filter((u) => u.role === "RESIDENT").length;

  // Handle Edit Save
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    setUsers((prev) =>
      prev.map((u) => (u.id === editingUser.id ? { ...editingUser, updated_at: new Date().toISOString() } : u))
    );

    showNotification(`User ${editingUser.first_name} ${editingUser.last_name} updated successfully!`);
    setEditingUser(null);
  };

  // Handle Add User
  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();

    const newUser: Profile = {
      id: `c0000000-0000-0000-0000-${String(users.length + 1).padStart(12, "0")}`,
      first_name: newFirstName,
      last_name: newLastName,
      email: newEmail,
      phone_number: newPhone || "+63 900 000 0000",
      mobile_number: newPhone || "+63 900 000 0000",
      emergency_contact: "+63 2 8800 1000",
      role: newRole,
      officer_position: newPosition,
      affiliation_type: newAffiliation,
      property_id: newPropertyId || null,
      is_primary_contact: true,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setUsers((prev) => [newUser, ...prev]);
    showNotification(`New user ${newFirstName} ${newLastName} registered successfully!`);
    setIsAddUserOpen(false);

    // Reset fields
    setNewFirstName("");
    setNewLastName("");
    setNewEmail("");
    setNewPhone("");
    setNewRole("RESIDENT");
    setNewPosition("NONE");
    setNewAffiliation("HOMEOWNER");
    setNewPropertyId("");
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case "SUPER_ADMIN":
        return <Badge variant="default" className="bg-slate-900 text-white font-bold text-[10px]">Super Admin</Badge>;
      case "TREASURER":
        return <Badge variant="default" className="bg-amber-600 text-white font-bold text-[10px]">Finance / Treasurer</Badge>;
      case "GUARD":
        return <Badge variant="warning" className="bg-amber-400 text-slate-950 font-bold text-[10px]">Security Station</Badge>;
      case "RESIDENT":
        return <Badge variant="info" className="bg-sky-100 text-sky-900 font-semibold text-[10px]">Resident Portal</Badge>;
      default:
        return <Badge variant="secondary" className="text-[10px]">{role}</Badge>;
    }
  };

  const getPositionBadge = (pos?: OfficerPosition) => {
    switch (pos) {
      case "PRESIDENT":
        return <Badge className="bg-purple-700 text-white text-[10px] font-bold">HOA President</Badge>;
      case "VICE_PRESIDENT":
        return <Badge className="bg-purple-600 text-white text-[10px]">Vice President</Badge>;
      case "SECRETARY":
        return <Badge className="bg-indigo-600 text-white text-[10px]">Secretary</Badge>;
      case "TREASURER_OFFICER":
        return <Badge className="bg-amber-600 text-white text-[10px]">Treasurer</Badge>;
      case "AUDITOR":
        return <Badge className="bg-teal-600 text-white text-[10px]">Auditor</Badge>;
      case "BOARD_MEMBER":
        return <Badge className="bg-blue-600 text-white text-[10px]">Board Member</Badge>;
      case "COMMITTEE_HEAD":
        return <Badge className="bg-cyan-700 text-white text-[10px]">Committee Head</Badge>;
      case "PROPERTY_MANAGER":
        return <Badge className="bg-emerald-700 text-white text-[10px]">Property Manager</Badge>;
      default:
        return <span className="text-slate-400 text-[11px] font-normal">—</span>;
    }
  };

  const getAffiliationBadge = (aff?: AffiliationType) => {
    switch (aff) {
      case "HOMEOWNER":
        return <Badge variant="outline" className="text-emerald-700 border-emerald-300 bg-emerald-50 text-[10px]">Homeowner</Badge>;
      case "TENANT":
        return <Badge variant="outline" className="text-sky-700 border-sky-300 bg-sky-50 text-[10px]">Tenant</Badge>;
      case "HOA_EMPLOYEE":
        return <Badge variant="outline" className="text-purple-700 border-purple-300 bg-purple-50 text-[10px]">HOA Employee</Badge>;
      case "PROPERTY_STAFF":
        return <Badge variant="outline" className="text-slate-700 border-slate-300 bg-slate-100 text-[10px]">Property Staff</Badge>;
      case "SECURITY_PERSONNEL":
        return <Badge variant="outline" className="text-amber-800 border-amber-300 bg-amber-50 text-[10px]">Security Guard</Badge>;
      case "EXTERNAL_VENDOR":
        return <Badge variant="outline" className="text-rose-700 border-rose-300 bg-rose-50 text-[10px]">Vendor</Badge>;
      default:
        return <Badge variant="outline" className="text-[10px]">{aff || "Member"}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-5 right-5 z-50 p-4 rounded-xl bg-slate-900 text-white border border-emerald-500 shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-5">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-semibold">{notification}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <Users className="w-7 h-7 text-emerald-700" />
            User Accounts & Roles Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Independent control of System Access Roles, Community Officer Positions, and Affiliations across all personnel.
          </p>
        </div>

        <Button
          onClick={() => setIsAddUserOpen(true)}
          className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs h-9 shadow-sm flex items-center gap-2 self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" /> Register User
        </Button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="border-slate-200 shadow-xs">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xl font-black text-slate-900">{totalAdmins}</div>
              <div className="text-[11px] text-slate-500 font-medium">System Admins</div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-xs">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xl font-black text-slate-900">{totalOfficers}</div>
              <div className="text-[11px] text-slate-500 font-medium">Board Officers</div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-xs">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xl font-black text-slate-900">{totalEmployees}</div>
              <div className="text-[11px] text-slate-500 font-medium">Staff & Employees</div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-xs">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              <Home className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xl font-black text-slate-900">{totalResidents}</div>
              <div className="text-[11px] text-slate-500 font-medium">Resident Users</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <Card className="border-slate-200 shadow-xs">
        <CardContent className="p-4 flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Search user name, email, phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 text-xs h-9"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {/* Role Filter */}
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="h-9 px-3 text-xs rounded-md border border-slate-200 bg-white text-slate-700 font-medium"
            >
              <option value="ALL">All System Roles</option>
              <option value="SUPER_ADMIN">Super Admin</option>
              <option value="TREASURER">Treasurer</option>
              <option value="GUARD">Guard</option>
              <option value="RESIDENT">Resident</option>
            </select>

            {/* Officer Position Filter */}
            <select
              value={selectedPosition}
              onChange={(e) => setSelectedPosition(e.target.value)}
              className="h-9 px-3 text-xs rounded-md border border-slate-200 bg-white text-slate-700 font-medium"
            >
              <option value="ALL">All Officer Positions</option>
              <option value="PRESIDENT">President</option>
              <option value="VICE_PRESIDENT">Vice President</option>
              <option value="SECRETARY">Secretary</option>
              <option value="TREASURER_OFFICER">Treasurer</option>
              <option value="BOARD_MEMBER">Board Member</option>
              <option value="PROPERTY_MANAGER">Property Manager</option>
              <option value="NONE">No Board Seat</option>
            </select>

            {/* Affiliation Filter */}
            <select
              value={selectedAffiliation}
              onChange={(e) => setSelectedAffiliation(e.target.value)}
              className="h-9 px-3 text-xs rounded-md border border-slate-200 bg-white text-slate-700 font-medium"
            >
              <option value="ALL">All Affiliations</option>
              <option value="HOMEOWNER">Homeowner</option>
              <option value="TENANT">Tenant</option>
              <option value="HOA_EMPLOYEE">HOA Employee</option>
              <option value="SECURITY_PERSONNEL">Security Guard</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Users Master Table */}
      <Card className="border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="font-bold text-xs">User Profile</TableHead>
                <TableHead className="font-bold text-xs">System Access Role</TableHead>
                <TableHead className="font-bold text-xs">Officer Position</TableHead>
                <TableHead className="font-bold text-xs">Affiliation</TableHead>
                <TableHead className="font-bold text-xs">Assigned Lot</TableHead>
                <TableHead className="font-bold text-xs">Contact</TableHead>
                <TableHead className="font-bold text-xs">Status</TableHead>
                <TableHead className="text-right font-bold text-xs">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-slate-500 text-xs">
                    No user accounts match your filter criteria.
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((u) => {
                  const prop = INITIAL_PROPERTIES.find((p) => p.id === u.property_id);

                  return (
                    <TableRow key={u.id} className="hover:bg-slate-50/80 transition-colors">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="w-8 h-8 border border-slate-200">
                            <AvatarFallback className="bg-slate-800 text-slate-200 text-xs font-bold">
                              {u.first_name[0]}{u.last_name[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-bold text-xs text-slate-900">
                              {u.first_name} {u.last_name}
                            </div>
                            <div className="text-[11px] text-slate-400 flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              <span>{u.email}</span>
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{getRoleBadge(u.role)}</TableCell>
                      <TableCell>{getPositionBadge(u.officer_position)}</TableCell>
                      <TableCell>{getAffiliationBadge(u.affiliation_type)}</TableCell>
                      <TableCell className="text-xs font-medium text-slate-800">
                        {prop ? (
                          <span className="font-bold text-emerald-800">
                            Blk {prop.block_number} Lot {prop.lot_number}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">None / HOA Office</span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-slate-600 font-mono">
                        {u.phone_number || "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={u.is_active ? "default" : "destructive"} className="text-[10px]">
                          {u.is_active ? "Active" : "Disabled"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingUser({ ...u })}
                          className="h-7 text-xs text-slate-700 hover:text-emerald-700"
                        >
                          <Edit className="w-3.5 h-3.5 mr-1" /> Edit
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <Card className="w-full max-w-lg bg-white shadow-2xl border-slate-200 overflow-hidden max-h-[92vh] flex flex-col my-auto animate-in fade-in zoom-in-95">
            <CardHeader className="bg-slate-900 text-white flex flex-row items-center justify-between pb-3 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold">
                  <UserCog className="w-4 h-4" />
                </div>
                <div>
                  <CardTitle className="text-base font-bold text-white">
                    Edit User & Permissions
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-400">
                    {editingUser.email}
                  </CardDescription>
                </div>
              </div>
              <button
                onClick={() => setEditingUser(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </CardHeader>

            <form onSubmit={handleSaveEdit} className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700">First Name</Label>
                  <Input
                    required
                    value={editingUser.first_name}
                    onChange={(e) => setEditingUser({ ...editingUser, first_name: e.target.value })}
                    className="h-9 text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700">Last Name</Label>
                  <Input
                    required
                    value={editingUser.last_name}
                    onChange={(e) => setEditingUser({ ...editingUser, last_name: e.target.value })}
                    className="h-9 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700">Email Address</Label>
                  <Input
                    type="email"
                    required
                    value={editingUser.email}
                    onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                    className="h-9 text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700">Mobile Phone</Label>
                  <Input
                    value={editingUser.phone_number || ""}
                    onChange={(e) => setEditingUser({ ...editingUser, phone_number: e.target.value })}
                    className="h-9 text-xs font-mono"
                  />
                </div>
              </div>

              {/* System Role */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-900 flex items-center justify-between">
                  <span>System Access Role (Determines Portal View)</span>
                  <Badge variant="outline" className="text-[10px]">Access Level</Badge>
                </Label>
                <select
                  value={editingUser.role}
                  onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value as UserRole })}
                  className="w-full h-9 rounded-md border border-slate-300 bg-white px-3 py-1 text-xs font-semibold text-slate-900"
                >
                  <option value="SUPER_ADMIN">SUPER_ADMIN (Full Admin Console)</option>
                  <option value="TREASURER">TREASURER (Finance & Billing Console)</option>
                  <option value="GUARD">GUARD (Gate 1 Security Scanner Kiosk)</option>
                  <option value="RESIDENT">RESIDENT (Homeowner Portal)</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Officer Position */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700">Community Officer Position</Label>
                  <select
                    value={editingUser.officer_position || "NONE"}
                    onChange={(e) => setEditingUser({ ...editingUser, officer_position: e.target.value as OfficerPosition })}
                    className="w-full h-9 rounded-md border border-slate-200 bg-white px-3 py-1 text-xs"
                  >
                    <option value="NONE">None (Regular Member / No Board Seat)</option>
                    <option value="PRESIDENT">HOA President</option>
                    <option value="VICE_PRESIDENT">Vice President</option>
                    <option value="SECRETARY">Secretary</option>
                    <option value="TREASURER_OFFICER">Treasurer Officer</option>
                    <option value="AUDITOR">Auditor</option>
                    <option value="BOARD_MEMBER">Board Member</option>
                    <option value="COMMITTEE_HEAD">Committee Head</option>
                    <option value="PROPERTY_MANAGER">Property Manager</option>
                  </select>
                </div>

                {/* Affiliation */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700">Affiliation / Designation</Label>
                  <select
                    value={editingUser.affiliation_type || "HOMEOWNER"}
                    onChange={(e) => setEditingUser({ ...editingUser, affiliation_type: e.target.value as AffiliationType })}
                    className="w-full h-9 rounded-md border border-slate-200 bg-white px-3 py-1 text-xs"
                  >
                    <option value="HOMEOWNER">Homeowner (Property Owner)</option>
                    <option value="TENANT">Tenant (Leaseholder)</option>
                    <option value="HOA_EMPLOYEE">HOA Employee (Admin Staff)</option>
                    <option value="PROPERTY_STAFF">Property Maintenance Staff</option>
                    <option value="SECURITY_PERSONNEL">Security Guard</option>
                    <option value="EXTERNAL_VENDOR">External Contractor / Vendor</option>
                  </select>
                </div>
              </div>

              {/* Property Lot Assignment */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">Assigned Property Lot</Label>
                <select
                  value={editingUser.property_id || ""}
                  onChange={(e) => setEditingUser({ ...editingUser, property_id: e.target.value || null })}
                  className="w-full h-9 rounded-md border border-slate-200 bg-white px-3 py-1 text-xs"
                >
                  <option value="">None / HOA Headquarters Staff (No Lot)</option>
                  {INITIAL_PROPERTIES.map((p) => (
                    <option key={p.id} value={p.id}>
                      Block {p.block_number} Lot {p.lot_number} ({p.unit_address})
                    </option>
                  ))}
                </select>
              </div>

              {/* Account Status Toggle */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200">
                <div>
                  <span className="text-xs font-bold text-slate-900 block">Account Active Status</span>
                  <span className="text-[11px] text-slate-500">Disabled users are blocked from logging in.</span>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant={editingUser.is_active ? "default" : "destructive"}
                  onClick={() => setEditingUser({ ...editingUser, is_active: !editingUser.is_active })}
                  className="h-8 text-xs font-bold"
                >
                  {editingUser.is_active ? "Active" : "Disabled"}
                </Button>
              </div>

              {/* Quick Reset Password Trigger */}
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-amber-700" />
                  <span className="text-amber-900 font-medium">Reset password to temporary default</span>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => showNotification(`Password for ${editingUser.email} has been reset to "Password123!".`)}
                  className="h-7 text-xs text-amber-800 border-amber-300 hover:bg-amber-100"
                >
                  Reset Password
                </Button>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <Button type="button" variant="outline" onClick={() => setEditingUser(null)} className="h-9 text-xs">
                  Cancel
                </Button>
                <Button type="submit" className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold h-9 text-xs">
                  Save Changes
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Add User Modal */}
      {isAddUserOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <Card className="w-full max-w-lg bg-white shadow-2xl border-slate-200 overflow-hidden max-h-[92vh] flex flex-col my-auto animate-in fade-in zoom-in-95">
            <CardHeader className="bg-slate-900 text-white flex flex-row items-center justify-between pb-3 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <CardTitle className="text-base font-bold text-white">
                    Register New Account
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-400">
                    Create system access credentials, officer positions, and affiliations
                  </CardDescription>
                </div>
              </div>
              <button
                onClick={() => setIsAddUserOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </CardHeader>

            <form onSubmit={handleAddUser} className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700">First Name</Label>
                  <Input
                    required
                    placeholder="e.g. Maria"
                    value={newFirstName}
                    onChange={(e) => setNewFirstName(e.target.value)}
                    className="h-9 text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700">Last Name</Label>
                  <Input
                    required
                    placeholder="e.g. Santos"
                    value={newLastName}
                    onChange={(e) => setNewLastName(e.target.value)}
                    className="h-9 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700">Email Address</Label>
                  <Input
                    type="email"
                    required
                    placeholder="e.g. maria@enclavehoa.com"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="h-9 text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700">Mobile Phone</Label>
                  <Input
                    placeholder="+63 9XX XXX XXXX"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    className="h-9 text-xs font-mono"
                  />
                </div>
              </div>

              {/* System Access Role */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-900">System Access Role</Label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as UserRole)}
                  className="w-full h-9 rounded-md border border-slate-300 bg-white px-3 py-1 text-xs font-semibold text-slate-900"
                >
                  <option value="RESIDENT">RESIDENT (Homeowner Portal)</option>
                  <option value="SUPER_ADMIN">SUPER_ADMIN (Full Admin Console)</option>
                  <option value="TREASURER">TREASURER (Finance & Billing Console)</option>
                  <option value="GUARD">GUARD (Gate 1 Security Scanner Kiosk)</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Officer Position */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700">Officer Position</Label>
                  <select
                    value={newPosition}
                    onChange={(e) => setNewPosition(e.target.value as OfficerPosition)}
                    className="w-full h-9 rounded-md border border-slate-200 bg-white px-3 py-1 text-xs"
                  >
                    <option value="NONE">None (Regular Member / No Board Seat)</option>
                    <option value="PRESIDENT">HOA President</option>
                    <option value="VICE_PRESIDENT">Vice President</option>
                    <option value="SECRETARY">Secretary</option>
                    <option value="TREASURER_OFFICER">Treasurer Officer</option>
                    <option value="AUDITOR">Auditor</option>
                    <option value="BOARD_MEMBER">Board Member</option>
                    <option value="COMMITTEE_HEAD">Committee Head</option>
                    <option value="PROPERTY_MANAGER">Property Manager</option>
                  </select>
                </div>

                {/* Affiliation */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700">Affiliation Type</Label>
                  <select
                    value={newAffiliation}
                    onChange={(e) => setNewAffiliation(e.target.value as AffiliationType)}
                    className="w-full h-9 rounded-md border border-slate-200 bg-white px-3 py-1 text-xs"
                  >
                    <option value="HOMEOWNER">Homeowner (Property Owner)</option>
                    <option value="TENANT">Tenant (Leaseholder)</option>
                    <option value="HOA_EMPLOYEE">HOA Employee (Staff)</option>
                    <option value="PROPERTY_STAFF">Property Maintenance Staff</option>
                    <option value="SECURITY_PERSONNEL">Security Guard</option>
                    <option value="EXTERNAL_VENDOR">External Contractor</option>
                  </select>
                </div>
              </div>

              {/* Property Lot Assignment */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">Property Lot Assignment (Optional)</Label>
                <select
                  value={newPropertyId}
                  onChange={(e) => setNewPropertyId(e.target.value)}
                  className="w-full h-9 rounded-md border border-slate-200 bg-white px-3 py-1 text-xs"
                >
                  <option value="">None / HOA Headquarters Staff (No Lot)</option>
                  {INITIAL_PROPERTIES.map((p) => (
                    <option key={p.id} value={p.id}>
                      Block {p.block_number} Lot {p.lot_number} ({p.unit_address})
                    </option>
                  ))}
                </select>
              </div>

              <div className="p-3 bg-emerald-50 rounded-lg text-xs text-emerald-900 border border-emerald-200">
                <strong>Default Initial Password:</strong> Initial login credentials will be set to <code className="bg-emerald-100 px-1 py-0.5 rounded font-mono font-bold">Password123!</code>. The user can change their password at any time.
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <Button type="button" variant="outline" onClick={() => setIsAddUserOpen(false)} className="h-9 text-xs">
                  Cancel
                </Button>
                <Button type="submit" className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold h-9 text-xs">
                  Create User Account
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
