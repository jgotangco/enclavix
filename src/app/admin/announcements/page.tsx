"use client";

import { useState } from "react";
import { 
  Bell, 
  Plus, 
  Pin, 
  AlertTriangle, 
  CheckCircle2, 
  Trash2, 
  Calendar, 
  Search,
  Eye,
  X
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { INITIAL_ANNOUNCEMENTS } from "@/lib/data/mock-data";
import { Announcement } from "@/types/database";
import { formatDate } from "@/lib/utils";

export default function AdminAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>(INITIAL_ANNOUNCEMENTS);
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [priority, setPriority] = useState<"URGENT" | "HIGH" | "NORMAL" | "LOW">("NORMAL");
  const [isPinned, setIsPinned] = useState(false);

  const handlePublish = (e: React.FormEvent) => {
    e.preventDefault();

    const newAnnouncement: Announcement = {
      id: `50000000-0000-0000-0000-${String(announcements.length + 10).padStart(12, "0")}`,
      title: title.trim(),
      content: content.trim(),
      priority,
      is_pinned: isPinned,
      published_by: "c0000000-0000-0000-0000-000000000001",
      created_at: new Date().toISOString(),
    };

    setAnnouncements([newAnnouncement, ...announcements]);
    setIsComposerOpen(false);
    setNotification(`Announcement "${newAnnouncement.title}" broadcasted to all enclave residents!`);
    setTitle("");
    setContent("");
    setIsPinned(false);
    setTimeout(() => setNotification(null), 3500);
  };

  const handleDelete = (id: string) => {
    setAnnouncements(announcements.filter((a) => a.id !== id));
    setNotification("Announcement removed.");
    setTimeout(() => setNotification(null), 3000);
  };

  const handleTogglePin = (id: string) => {
    setAnnouncements(
      announcements.map((a) => (a.id === id ? { ...a, is_pinned: !a.is_pinned } : a))
    );
  };

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
            Broadcast official HOA circulars, utility service alerts, and community event notices.
          </p>
        </div>

        <Button
          onClick={() => setIsComposerOpen(true)}
          className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs"
        >
          <Plus className="w-4 h-4" /> Publish Announcement
        </Button>
      </div>

      {notification && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          {notification}
        </div>
      )}

      {/* Announcements Feed */}
      <div className="space-y-4">
        {announcements.map((a) => (
          <Card key={a.id} className="border-slate-200 shadow-xs overflow-hidden">
            <CardHeader className="bg-slate-50/70 border-b border-slate-100 pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  {a.is_pinned && (
                    <Badge variant="default" className="bg-amber-600 text-white text-[10px] flex items-center gap-1">
                      <Pin className="w-3 h-3" /> Pinned
                    </Badge>
                  )}
                  <Badge
                    variant={a.priority === "URGENT" || a.priority === "HIGH" ? "destructive" : "secondary"}
                    className="text-[10px]"
                  >
                    {a.priority} Priority
                  </Badge>
                  <CardTitle className="text-base font-bold text-slate-900">{a.title}</CardTitle>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">{formatDate(a.created_at)}</span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleTogglePin(a.id)}
                    className="h-7 text-xs"
                  >
                    <Pin className="w-3 h-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDelete(a.id)}
                    className="h-7 text-xs text-rose-700 hover:bg-rose-50"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
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

      {/* Composer Modal */}
      {isComposerOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <Card className="w-full max-w-lg bg-white shadow-2xl border-slate-200">
            <CardHeader className="bg-slate-900 text-white flex flex-row items-center justify-between pb-4">
              <div>
                <CardTitle className="text-base font-bold text-white flex items-center gap-2">
                  <Bell className="w-5 h-5 text-emerald-400" />
                  Compose Community Advisory
                </CardTitle>
                <CardDescription className="text-xs text-slate-400">
                  Broadcasts to all 99 homeowners via portal feed
                </CardDescription>
              </div>
              <button onClick={() => setIsComposerOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </CardHeader>

            <form onSubmit={handlePublish} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Advisory Title</label>
                <Input
                  placeholder="e.g. Scheduled Water Pipe Maintenance / HOA Assembly"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Priority Level</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className="w-full h-9 rounded-md border border-slate-200 bg-white px-3 py-1 text-xs"
                  >
                    <option value="NORMAL">NORMAL (General Notice)</option>
                    <option value="HIGH">HIGH (Utility / Traffic Impact)</option>
                    <option value="URGENT">URGENT (Emergency / Security)</option>
                    <option value="LOW">LOW (Informational)</option>
                  </select>
                </div>

                <div className="flex items-center space-x-2 pt-6">
                  <input
                    type="checkbox"
                    id="pin"
                    checked={isPinned}
                    onChange={(e) => setIsPinned(e.target.checked)}
                    className="rounded border-slate-300 text-emerald-700 focus:ring-emerald-500"
                  />
                  <label htmlFor="pin" className="text-xs font-semibold text-slate-700 cursor-pointer">
                    Pin to top of feed
                  </label>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Announcement Body</label>
                <textarea
                  rows={5}
                  placeholder="Write clear instructions, schedules, and affected areas..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  required
                  className="w-full rounded-md border border-slate-200 bg-white p-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-600"
                />
              </div>

              <div className="pt-4 flex justify-end gap-2 border-t border-slate-100">
                <Button type="button" variant="outline" onClick={() => setIsComposerOpen(false)} className="text-xs">
                  Cancel
                </Button>
                <Button type="submit" className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold">
                  Publish to Community
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
