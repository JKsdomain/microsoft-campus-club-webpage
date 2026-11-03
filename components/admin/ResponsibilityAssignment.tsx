"use client";

import React, { useState, useEffect } from "react";
import {
  UserCheck,
  Shield,
  CheckCircle2,
  ArrowRight,
  Calendar,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  Megaphone,
  Briefcase,
  HelpCircle,
  Trophy,
  Users,
  Layers,
} from "lucide-react";
import { useAdminAuth } from "./AdminAuthProvider";
import { Button } from "../ui/Button";

interface NoticeEventItem {
  id: string;
  name: string;
  description: string;
  assignedObId: string | null;
  assignedObName: string | null;
  department: string | null;
}

export const ResponsibilityAssignment: React.FC = () => {
  const { officeBearers, assignments, assignObToActivity } = useAdminAuth();

  const [selectedActivityId, setSelectedActivityId] = useState<string>(
    assignments[0]?.id || ""
  );
  const [selectedObId, setSelectedObId] = useState<string>("");
  const [notification, setNotification] = useState<string | null>(null);

  // Sub-events state for Event Notice
  const [events, setEvents] = useState<NoticeEventItem[]>([]);
  const [showEventSubAssignments, setShowEventSubAssignments] = useState(false);
  const [newEventName, setNewEventName] = useState("");
  const [newEventDesc, setNewEventDesc] = useState("");
  const [isAddingEvent, setIsAddingEvent] = useState(false);

  // Sync selectedActivityId if initial assignment loads late
  useEffect(() => {
    if (!selectedActivityId && assignments.length > 0) {
      setSelectedActivityId(assignments[0].id);
    }
  }, [assignments, selectedActivityId]);

  // Fetch notice events
  const loadEvents = async () => {
    try {
      const res = await fetch("/api/admin/events");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.events)) {
          setEvents(data.events);
        }
      }
    } catch (e) {
      console.error("Failed to load notice events:", e);
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

  const handleAssign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedActivityId || !selectedObId) return;

    const activity = assignments.find((a) => a.id === selectedActivityId);
    const ob = officeBearers.find((o) => o.id === selectedObId);

    if (activity && ob) {
      assignObToActivity(selectedActivityId, selectedObId);
      setNotification(
        `Assigned "${ob.name}" to strictly manage "${activity.activityName}". Any previous responsibility for this OB was replaced.`
      );
      setTimeout(() => setNotification(null), 4500);
    }
  };

  // Direct 1-click assign from card
  const handleQuickAssign = (activityId: string, obId: string) => {
    if (!obId) return;
    const activity = assignments.find((a) => a.id === activityId);
    const ob = officeBearers.find((o) => o.id === obId);
    if (activity && ob) {
      assignObToActivity(activityId, obId);
      setNotification(
        `Assigned "${ob.name}" to strictly manage "${activity.activityName}".`
      );
      setTimeout(() => setNotification(null), 4500);
    }
  };

  // Add a new event under Event Notice
  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventName.trim()) return;

    try {
      setIsAddingEvent(true);
      const res = await fetch("/api/admin/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newEventName.trim(), description: newEventDesc.trim() }),
      });
      if (res.ok) {
        setNewEventName("");
        setNewEventDesc("");
        setNotification(`Event "${newEventName.trim()}" created successfully.`);
        setTimeout(() => setNotification(null), 4000);
        await loadEvents();
      }
    } catch (e) {
      console.error("Failed to create event:", e);
    } finally {
      setIsAddingEvent(false);
    }
  };

  // Assign an OB to an individual event
  const handleAssignObToEvent = async (eventId: string, obId: string) => {
    try {
      const res = await fetch("/api/admin/events", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: eventId, assignedObId: obId || null }),
      });
      if (res.ok) {
        const ev = events.find((e) => e.id === eventId);
        const ob = officeBearers.find((o) => o.id === obId);
        setNotification(
          obId
            ? `Assigned "${ob?.name}" to strictly manage event "${ev?.name}".`
            : `Unassigned OB from event "${ev?.name}".`
        );
        setTimeout(() => setNotification(null), 4000);
        await loadEvents();
      }
    } catch (e) {
      console.error("Failed to assign OB to event:", e);
    }
  };

  // Delete an event
  const handleDeleteEvent = async (eventId: string, eventName: string) => {
    if (!confirm(`Are you sure you want to remove the event "${eventName}"? Any assigned OB will be unlinked.`)) return;

    try {
      const res = await fetch(`/api/admin/events?id=${eventId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setNotification(`Event "${eventName}" deleted.`);
        setTimeout(() => setNotification(null), 4000);
        await loadEvents();
      }
    } catch (e) {
      console.error("Failed to delete event:", e);
    }
  };

  const isNoticeResp = (name: string) => name.toLowerCase().includes("notice");

  // Filter into Core Activities (3) and Notice Modules (5)
  const coreAssignments = assignments.filter((a) => !isNoticeResp(a.activityName));
  const noticeAssignments = assignments.filter((a) => isNoticeResp(a.activityName));

  const getNoticeIcon = (name: string) => {
    switch (name) {
      case "Quiz Notice":
        return HelpCircle;
      case "Event Notice":
        return Calendar;
      case "Quiz Winners Notice":
        return Trophy;
      case "Active Participants Notice":
        return Users;
      case "Placement Questions Notice":
        return Briefcase;
      default:
        return Megaphone;
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Toast Notification */}
      {notification && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm flex items-center space-x-3">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Assignment Control Box */}
      <div className="p-6 rounded-2xl bg-[#0D1B2A] border border-white/10 shadow-xl space-y-6">
        <div className="pb-3 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Shield className="w-5 h-5 text-[#0078D4]" />
            <h3 className="text-lg font-bold text-[#F8FAFC]">
              Assign Responsibility (1 OB → 1 Responsibility)
            </h3>
          </div>
          <span className="text-xs font-mono text-[#22D3EE] bg-[#22D3EE]/10 px-2.5 py-0.5 rounded-full border border-[#22D3EE]/20">
            STRICT 1:1 ENFORCED
          </span>
        </div>

        <form onSubmit={handleAssign} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div>
            <label className="block text-xs font-medium text-[#CBD5E1] mb-1.5">
              Select Responsibility / Notice Type
            </label>
            <select
              value={selectedActivityId}
              onChange={(e) => setSelectedActivityId(e.target.value)}
              className="w-full h-11 px-3 rounded-xl bg-[#07111F] border border-white/15 text-[#F8FAFC] text-sm focus:outline-none focus:border-[#0078D4]"
            >
              {assignments.map((act) => (
                <option key={act.id} value={act.id}>
                  {act.activityName} ({act.assignmentStatus})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#CBD5E1] mb-1.5">
              Select Office Bearer
            </label>
            <select
              value={selectedObId}
              onChange={(e) => setSelectedObId(e.target.value)}
              className="w-full h-11 px-3 rounded-xl bg-[#07111F] border border-white/15 text-[#F8FAFC] text-sm focus:outline-none focus:border-[#0078D4]"
            >
              <option value="">-- Choose Office Bearer --</option>
              {officeBearers.map((ob) => (
                <option key={ob.id} value={ob.id}>
                  {ob.name} — Currently: {ob.responsibility}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Button
              type="submit"
              variant="primary"
              size="lg"
              disabled={!selectedObId || !selectedActivityId}
              rightIcon={<ArrowRight className="w-4 h-4" />}
              className="w-full h-11"
            >
              Assign Responsibility
            </Button>
          </div>
        </form>
      </div>

      {/* SECTION 1: CORE ACTIVITY RESPONSIBILITIES (3 BOXES) */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-[#0078D4]" />
          <h4 className="text-xs font-mono font-semibold uppercase tracking-wider text-[#94A3B8]">
            CORE ACTIVITY MODULES ({coreAssignments.length})
          </h4>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {coreAssignments.map((act) => (
            <div
              key={act.id}
              className="p-5 rounded-2xl bg-[#0D1B2A] border border-white/10 flex flex-col justify-between shadow-md hover:border-white/20 transition-all space-y-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <span className="text-[10px] font-mono text-[#0078D4] bg-[#0078D4]/10 px-2 py-0.5 rounded-full border border-[#0078D4]/20 inline-block">
                    MCC ACTIVITY
                  </span>
                  <h4 className="text-base font-bold text-[#F8FAFC]">{act.activityName}</h4>
                  <p className="text-xs text-[#94A3B8]">
                    Assigned Lead:{" "}
                    <span className="font-semibold text-white">
                      {act.assignedObName || "Unassigned"}
                    </span>
                  </p>
                </div>

                <div>
                  {act.assignmentStatus === "Assigned" ? (
                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center space-x-1">
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>Assigned</span>
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      Unassigned
                    </span>
                  )}
                </div>
              </div>

              {/* Inline Quick-Assign */}
              <div className="pt-3 border-t border-white/5 flex items-center justify-between gap-2">
                <span className="text-[11px] text-[#94A3B8] font-mono">Assign Lead:</span>
                <select
                  value={act.assignedObId || ""}
                  onChange={(e) => handleQuickAssign(act.id, e.target.value)}
                  className="h-8 px-2 rounded-lg bg-[#07111F] border border-white/15 text-white text-xs focus:outline-none focus:border-[#0078D4] max-w-[190px]"
                >
                  <option value="">-- Choose OB --</option>
                  {officeBearers.map((ob) => (
                    <option key={ob.id} value={ob.id}>
                      {ob.name} ({ob.responsibility})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 2: NOTICE MANAGEMENT RESPONSIBILITIES (5 BOXES FOR 5 EVENTS) */}
      <div className="space-y-4 pt-4 border-t border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Megaphone className="w-4 h-4 text-purple-400" />
            <h4 className="text-xs font-mono font-semibold uppercase tracking-wider text-purple-400">
              NOTICE PUBLISHING MODULES — 5 EVENT BOXES ({noticeAssignments.length})
            </h4>
          </div>
          <span className="text-[11px] font-mono text-[#22D3EE] bg-[#22D3EE]/10 px-2.5 py-0.5 rounded-full border border-[#22D3EE]/20">
            1 DEDICATED OB PER NOTICE EVENT
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {noticeAssignments.map((act) => {
            const Icon = getNoticeIcon(act.activityName);
            const isEventNotice = act.activityName === "Event Notice";

            return (
              <div
                key={act.id}
                className={`p-5 rounded-2xl bg-[#0D1B2A] border transition-all flex flex-col justify-between shadow-lg space-y-4 ${
                  isEventNotice
                    ? "border-purple-500/30 hover:border-purple-500/50"
                    : "border-purple-500/20 hover:border-purple-500/40"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-mono text-purple-300 bg-purple-500/10 px-2 py-0.5 rounded-full border border-purple-500/30 flex items-center gap-1">
                        <Icon className="w-3 h-3 text-purple-300" />
                        <span>NOTICE MODULE</span>
                      </span>
                    </div>

                    <h4 className="text-base font-bold text-[#F8FAFC]">{act.activityName}</h4>
                    <p className="text-xs text-[#94A3B8]">
                      Assigned Lead:{" "}
                      <span className="font-semibold text-white">
                        {act.assignedObName || "Unassigned"}
                      </span>
                    </p>
                  </div>

                  <div>
                    {act.assignmentStatus === "Assigned" ? (
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center space-x-1">
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>Assigned</span>
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        Unassigned
                      </span>
                    )}
                  </div>
                </div>

                {/* Inline Quick-Assign */}
                <div className="pt-3 border-t border-white/5 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] text-[#94A3B8] font-mono">Assign Lead:</span>
                    <select
                      value={act.assignedObId || ""}
                      onChange={(e) => handleQuickAssign(act.id, e.target.value)}
                      className="h-8 px-2 rounded-lg bg-[#07111F] border border-white/15 text-white text-xs focus:outline-none focus:border-purple-500 max-w-[190px]"
                    >
                      <option value="">-- Choose OB --</option>
                      {officeBearers.map((ob) => (
                        <option key={ob.id} value={ob.id}>
                          {ob.name} ({ob.responsibility})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Optional Event Sub-Assignment expansion for Event Notice */}
                  {isEventNotice && (
                    <div className="pt-2 border-t border-white/5">
                      <button
                        type="button"
                        onClick={() => setShowEventSubAssignments(!showEventSubAssignments)}
                        className="text-[11px] text-[#22D3EE] hover:underline flex items-center gap-1 font-mono"
                      >
                        <Calendar className="w-3 h-3" />
                        <span>
                          {showEventSubAssignments
                            ? "Hide Sub-Events"
                            : `Manage Specific Event Sub-Leads (${events.length})`}
                        </span>
                        {showEventSubAssignments ? (
                          <ChevronUp className="w-3 h-3" />
                        ) : (
                          <ChevronDown className="w-3 h-3" />
                        )}
                      </button>

                      {showEventSubAssignments && (
                        <div className="mt-3 p-3 rounded-xl bg-[#07111F] border border-white/10 space-y-3">
                          {/* Event Add Form */}
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={newEventName}
                              onChange={(e) => setNewEventName(e.target.value)}
                              placeholder="Event name (e.g. Workshop, Hackathon)"
                              className="flex-1 h-8 px-2 rounded-lg bg-[#0D1B2A] border border-white/15 text-white text-xs focus:outline-none focus:border-[#0078D4]"
                            />
                            <button
                              type="button"
                              onClick={handleCreateEvent}
                              disabled={isAddingEvent || !newEventName.trim()}
                              className="px-2.5 h-8 rounded-lg bg-[#0078D4] text-white text-xs font-semibold hover:bg-[#0078D4]/90 disabled:opacity-40"
                            >
                              Add
                            </button>
                          </div>

                          {/* Events Sub-List */}
                          <div className="space-y-1.5 max-h-48 overflow-y-auto">
                            {events.length === 0 ? (
                              <p className="text-[10px] text-[#94A3B8] italic">No sub-events configured.</p>
                            ) : (
                              events.map((ev) => (
                                <div
                                  key={ev.id}
                                  className="p-2 rounded-lg bg-[#0D1B2A] border border-white/5 flex items-center justify-between gap-2"
                                >
                                  <div className="truncate flex-1">
                                    <span className="text-xs font-bold text-white block truncate">{ev.name}</span>
                                    <span className="text-[10px] text-[#94A3B8] font-mono">
                                      Lead: {ev.assignedObName || "Unassigned"}
                                    </span>
                                  </div>
                                  <select
                                    value={ev.assignedObId || ""}
                                    onChange={(e) => handleAssignObToEvent(ev.id, e.target.value)}
                                    className="h-7 px-1.5 rounded bg-[#07111F] border border-white/15 text-white text-[11px] max-w-[120px]"
                                  >
                                    <option value="">Assign OB</option>
                                    {officeBearers.map((ob) => (
                                      <option key={ob.id} value={ob.id}>
                                        {ob.name}
                                      </option>
                                    ))}
                                  </select>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteEvent(ev.id, ev.name)}
                                    className="text-red-400 hover:text-red-300 p-1"
                                    title="Delete event"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
