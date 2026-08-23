"use client";

import { useState } from "react";
import { 
  Bell, 
  Pin, 
  AlertTriangle, 
  Calendar, 
  Search, 
  Sparkles,
  Info,
  ShieldCheck
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { INITIAL_ANNOUNCEMENTS } from "@/lib/data/mock-data";
import { Announcement } from "@/types/database";
import { formatDate } from "@/lib/utils";

export default function ResidentAnnouncementsPage() {
  const [announcements] = useState<Announcement[]>(INITIAL_ANNOUNCEMENTS);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredAnnouncements = announcements.filter((a) =>
    a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Bell className="w-7 h-7 text-emerald-700" />
            Community Bulletin & Advisories
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Official announcements from the Enclave Homeowners Association Board of Directors.
          </p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <Input
            placeholder="Search circulars & advisories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 text-xs"
          />
        </div>
      </div>

      {/* Announcements List */}
      <div className="space-y-4">
        {filteredAnnouncements.map((a) => (
          <Card
            key={a.id}
            className={`border-slate-200 shadow-xs overflow-hidden ${
              a.is_pinned ? "border-l-4 border-l-emerald-600 bg-emerald-50/20" : ""
            }`}
          >
            <CardHeader className="bg-slate-50/70 border-b border-slate-100 pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  {a.is_pinned && (
                    <Badge variant="default" className="bg-emerald-700 text-white text-[10px] flex items-center gap-1">
                      <Pin className="w-3 h-3" /> Pinned Notice
                    </Badge>
                  )}
                  {a.priority === "URGENT" || a.priority === "HIGH" ? (
                    <Badge variant="destructive" className="text-[10px]">
                      {a.priority} Priority
                    </Badge>
                  ) : null}
                  <CardTitle className="text-base font-bold text-slate-900">{a.title}</CardTitle>
                </div>
                <span className="text-xs text-slate-400 font-medium">
                  {formatDate(a.created_at)}
                </span>
              </div>
            </CardHeader>
            <CardContent className="p-5">
              <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">
                {a.content}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
