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
  UserX,
  Megaphone,
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
  const [showEventSubAssignments, setShowEventSubAssignments] = useState(true);
  const [newEventName, setNewEventName] = useState("");
  const [newEventDesc, setNewEventDesc] = useState("");
  const [isAddingEvent, setIsAddingEvent] = useState(false);

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

      {/* Responsibilities Grid */}
      <div className="space-y-4">
        <h4 className="text-xs font-mono font-semibold uppercase tracking-wider text-[#94A3B8]">
          CURRENT RESPONSIBILITY ASSIGNMENTS ({assignments.length})
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {assignments.map((act) => {
            const isNotice = isNoticeResp(act.activityName);
            const isEventNotice = act.activityName === "Event Notice";

            return (
              <div
                key={act.id}
                className={`p-5 rounded-2xl bg-[#0D1B2A] border transition-all shadow-md ${
                  isEventNotice
                    ? "border-[#0078D4]/40 md:col-span-2"
                    : isNotice
                    ? "border-purple-500/20 hover:border-purple-500/40"
                    : "border-white/10 hover:border-white/20"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                          isNotice
                            ? "bg-purple-500/10 text-purple-300 border-purple-500/30"
                            : "bg-[#0078D4]/10 text-[#0078D4] border-[#0078D4]/30"
                        }`}
                      >
                        {isEventNotice
                          ? "PARENT RESPONSIBILITY (DYNAMIC EVENTS)"
                          : isNotice
                          ? "NOTICE RESPONSIBILITY"
                          : "MCC ACTIVITY"}
                      </span>
                    </div>

                    <h4 className="text-base font-bold text-[#F8FAFC]">{act.activityName}</h4>
                    <p className="text-xs text-[#94A3B8]">
                      Assigned Lead:{" "}
                      <span className="font-semibold text-white">
                        {act.assignedObName || (isEventNotice ? "Assigned Per-Event Below" : "Unassigned")}
                      </span>
                    </p>
                  </div>

                  <div>
                    {act.assignmentStatus === "Assigned" ? (
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center space-x-1">
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>Assigned</span>
                      </span>
                    ) : (
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        {isEventNotice ? "Multi-Event" : "Unassigned"}
                      </span>
                    )}
                  </div>
                </div>

                {/* SPECIAL SECTION FOR EVENT NOTICE SUB-EVENTS */}
                {isEventNotice && (
                  <div className="mt-5 pt-4 border-t border-white/10 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-[#22D3EE]" />
                        <span className="text-xs font-semibold uppercase tracking-wider text-[#22D3EE]">
                          Event Notice Sub-Responsibilities ({events.length} Events)
                        </span>
                      </div>
                      <button
                        onClick={() => setShowEventSubAssignments(!showEventSubAssignments)}
                        className="text-xs text-[#94A3B8] hover:text-white flex items-center gap-1 font-mono"
                      >
                        <span>{showEventSubAssignments ? "Hide Events" : "Manage Events"}</span>
                        {showEventSubAssignments ? (
                          <ChevronUp className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>

                    {showEventSubAssignments && (
                      <div className="space-y-4 pt-2">
                        {/* Event Add Form */}
                        <form
                          onSubmit={handleCreateEvent}
                          className="p-3.5 rounded-xl bg-[#07111F] border border-white/10 grid grid-cols-1 sm:grid-cols-12 gap-3 items-end"
                        >
                          <div className="sm:col-span-5">
                            <label className="block text-[11px] text-[#94A3B8] mb-1 font-mono">
                              New Event Name
                            </label>
                            <input
                              type="text"
                              value={newEventName}
                              onChange={(e) => setNewEventName(e.target.value)}
                              placeholder="e.g. Hackathon, Workshop, Symposium"
                              className="w-full h-9 px-3 rounded-lg bg-[#0D1B2A] border border-white/15 text-white text-xs focus:outline-none focus:border-[#0078D4]"
                              required
                            />
                          </div>
                          <div className="sm:col-span-4">
                            <label className="block text-[11px] text-[#94A3B8] mb-1 font-mono">
                              Description (Optional)
                            </label>
                            <input
                              type="text"
                              value={newEventDesc}
                              onChange={(e) => setNewEventDesc(e.target.value)}
                              placeholder="Event scope or guidelines"
                              className="w-full h-9 px-3 rounded-lg bg-[#0D1B2A] border border-white/15 text-white text-xs focus:outline-none focus:border-[#0078D4]"
                            />
                          </div>
                          <div className="sm:col-span-3">
                            <Button
                              type="submit"
                              variant="secondary"
                              size="sm"
                              disabled={isAddingEvent || !newEventName.trim()}
                              className="w-full h-9 text-xs"
                              leftIcon={<Plus className="w-3.5 h-3.5" />}
                            >
                              Add Event
                            </Button>
                          </div>
                        </form>

                        {/* Events Table / List */}
                        <div className="divide-y divide-white/5 border border-white/10 rounded-xl overflow-hidden bg-[#07111F]">
                          {events.length === 0 ? (
                            <div className="p-4 text-center text-xs text-[#94A3B8]">
                              No events configured yet. Add your first event above.
                            </div>
                          ) : (
                            events.map((ev) => (
                              <div
                                key={ev.id}
                                className="p-3 sm:px-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-white/[0.02]"
                              >
                                <div className="space-y-0.5">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-[#F8FAFC]">
                                      {ev.name}
                                    </span>
                                    {ev.assignedObName ? (
                                      <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 font-mono">
                                        Assigned: {ev.assignedObName}
                                      </span>
                                    ) : (
                                      <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 font-mono">
                                        Unassigned
                                      </span>
                                    )}
                                  </div>
                                  {ev.description && (
                                    <p className="text-[11px] text-[#94A3B8]">{ev.description}</p>
                                  )}
                                </div>

                                <div className="flex items-center gap-2 sm:self-center">
                                  <select
                                    value={ev.assignedObId || ""}
                                    onChange={(e) => handleAssignObToEvent(ev.id, e.target.value)}
                                    className="h-8 px-2 rounded-lg bg-[#0D1B2A] border border-white/15 text-white text-xs focus:outline-none focus:border-[#0078D4] max-w-[220px]"
                                  >
                                    <option value="">-- Assign OB to this Event --</option>
                                    {officeBearers.map((ob) => (
                                      <option key={ob.id} value={ob.id}>
                                        {ob.name} ({ob.responsibility})
                                      </option>
                                    ))}
                                  </select>

                                  <button
                                    onClick={() => handleDeleteEvent(ev.id, ev.name)}
                                    title="Delete Event"
                                    className="p-1.5 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
