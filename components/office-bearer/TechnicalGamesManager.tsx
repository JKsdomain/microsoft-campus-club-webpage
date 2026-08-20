"use client";

import React, { useState } from "react";
import { Gamepad2, Send, CheckCircle2, Trophy, Terminal, Code2 } from "lucide-react";
import { useOBAuth } from "./OBAuthProvider";
import { UnauthorizedGuard } from "./UnauthorizedGuard";
import { Button } from "../ui/Button";

export const TechnicalGamesManager: React.FC = () => {
  const { hasResponsibility, submitQuizProposal, submissions } = useOBAuth();
  const isAssigned = hasResponsibility("Technical Games");

  const [gameTitle, setGameTitle] = useState("Microcontroller Speed Hack 2026");
  const [category, setCategory] = useState("Embedded & IoT");
  const [maxTeams, setMaxTeams] = useState<number>(32);
  const [durationMinutes, setDurationMinutes] = useState<number>(120);
  const [instructions, setInstructions] = useState(
    "Teams must solve 3 IoT debugging modules within the time limit. Submissions evaluated on performance efficiency and code elegance."
  );

  const [submitSuccess, setSubmitSuccess] = useState(false);

  if (!isAssigned) {
    return <UnauthorizedGuard activityName="Technical Games" />;
  }

  const handleSubmitProposal = (e: React.FormEvent) => {
    e.preventDefault();

    submitQuizProposal({
      type: "General Quiz", // Uses General Quiz type in the proposal queue with [Technical Games] prefix
      title: `[Technical Games] ${gameTitle}`,
      questionsToUpload: maxTeams,
      questionsToDisplay: maxTeams,
      randomQuestions: false,
      randomChoices: false,
      timerMinutes: durationMinutes,
      questionsDetected: maxTeams,
      csvFileName: `${gameTitle.toLowerCase().replace(/ /g, "_")}_rules.csv`,
    });

    setSubmitSuccess(true);
    setTimeout(() => setSubmitSuccess(false), 4000);
  };

  const relevantSubmissions = submissions.filter((s) => s.title.includes("[Technical Games]"));

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Toast Notification */}
      {submitSuccess && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm flex items-center space-x-3">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <div>
            <span className="font-bold block">Game Challenge Submitted for Approval!</span>
            <span className="text-xs text-emerald-300">
              Technical game proposal routed to Admin Approval Queue.
            </span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Event Config Form */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleSubmitProposal} className="p-6 rounded-2xl bg-[#0D1B2A] border border-white/10 shadow-xl space-y-5">
            <div className="pb-3 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-[#0078D4]/10 text-[#22D3EE]">
                  <Gamepad2 className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-[#F8FAFC]">
                  Technical Game Arena Setup
                </h3>
              </div>
              <span className="text-xs font-mono text-[#22D3EE]">
                EVENT CONFIGURATION
              </span>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#CBD5E1] mb-1.5">
                Game Title / Challenge Name
              </label>
              <input
                type="text"
                required
                value={gameTitle}
                onChange={(e) => setGameTitle(e.target.value)}
                placeholder="e.g. Bug Hunt & Speed Debugging"
                className="w-full h-11 px-3.5 rounded-xl bg-[#07111F] border border-white/15 text-[#F8FAFC] placeholder-[#94A3B8] text-sm focus:outline-none focus:border-[#0078D4]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-[#CBD5E1] mb-1.5">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full h-11 px-3 rounded-xl bg-[#07111F] border border-white/15 text-[#F8FAFC] text-sm focus:outline-none focus:border-[#0078D4]"
                >
                  <option value="Embedded & IoT">Embedded & IoT</option>
                  <option value="Algorithmic Speed Coding">Algorithmic Speed Coding</option>
                  <option value="Web & UI Hack">Web & UI Hack</option>
                  <option value="CTF & Security">CTF & Security</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#CBD5E1] mb-1.5">
                  Max Participant Teams
                </label>
                <input
                  type="number"
                  min={5}
                  max={200}
                  value={maxTeams}
                  onChange={(e) => setMaxTeams(parseInt(e.target.value) || 5)}
                  className="w-full h-11 px-3.5 rounded-xl bg-[#07111F] border border-white/15 text-[#F8FAFC] text-sm focus:outline-none focus:border-[#0078D4]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#CBD5E1] mb-1.5">
                  Duration (Minutes)
                </label>
                <input
                  type="number"
                  min={30}
                  max={360}
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(parseInt(e.target.value) || 30)}
                  className="w-full h-11 px-3.5 rounded-xl bg-[#07111F] border border-white/15 text-[#F8FAFC] text-sm focus:outline-none focus:border-[#0078D4]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#CBD5E1] mb-1.5">
                Challenge Rules & Evaluation Criteria
              </label>
              <textarea
                rows={4}
                required
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="Enter rules, judging guidelines, and submission format..."
                className="w-full p-3.5 rounded-xl bg-[#07111F] border border-white/15 text-[#F8FAFC] placeholder-[#94A3B8] text-sm focus:outline-none focus:border-[#0078D4] leading-relaxed"
              />
            </div>

            <div className="pt-4 border-t border-white/10 flex justify-end">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                leftIcon={<Send className="w-4 h-4" />}
              >
                Submit for Approval
              </Button>
            </div>
          </form>
        </div>

        {/* Right Info Column */}
        <div className="space-y-6">
          {/* Live External Platform Card */}
          <div className="p-6 rounded-2xl bg-[#0D1B2A] border border-[#0078D4]/30 shadow-xl space-y-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-[#0078D4]/10 text-[#22D3EE]">
                <Gamepad2 className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-[#F8FAFC]">
                Live Games Arena
              </h3>
            </div>
            <p className="text-xs text-[#CBD5E1] leading-relaxed">
              Launch and test the live games arena on the official Technical Games platform.
            </p>
            <Button
              href="https://technical-game-homepage.vercel.app/#games"
              variant="primary"
              size="md"
              className="w-full justify-center"
            >
              Open Games Platform
            </Button>
          </div>

          <div className="p-6 rounded-2xl bg-[#0D1B2A] border border-white/10 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-[#F8FAFC] pb-2 border-b border-white/10">
              Active Challenge Arenas
            </h3>
            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-[#07111F] border border-white/10 flex items-center space-x-3">
                <Trophy className="w-5 h-5 text-amber-400" />
                <div>
                  <span className="text-xs font-bold text-[#F8FAFC] block">
                    Azure Speed Challenge
                  </span>
                  <span className="text-[11px] text-[#94A3B8]">
                    32 Teams Registered • Live
                  </span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-[#07111F] border border-white/10 flex items-center space-x-3">
                <Terminal className="w-5 h-5 text-[#22D3EE]" />
                <div>
                  <span className="text-xs font-bold text-[#F8FAFC] block">
                    CTF Binary Exploitation
                  </span>
                  <span className="text-[11px] text-[#94A3B8]">
                    16 Teams Registered • Upcoming
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
