'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import { addMessage } from '../../redux/slices/chatSlice';
import { runRefinement } from '../../redux/slices/sourcingSlice';
import {
  MessageSquare,
  Send,
  Loader2,
  User,
  Bot,
  Sparkles,
} from 'lucide-react';

export const RefinementChat: React.FC = () => {
  const dispatch = useAppDispatch();
  const { messages, isTyping } = useAppSelector((state) => state.chat);
  const { filters, rubric, candidates, status } = useAppSelector((state) => state.sourcing);
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isRefining = status === 'refining';

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSendFeedback = (customText?: string) => {
    const feedbackText = (customText || inputText).trim();
    if (!feedbackText || isRefining) return;

    // 1. Add user message
    dispatch(
      addMessage({
        id: `msg_user_${Date.now()}`,
        role: 'user',
        content: feedbackText,
        timestamp: new Date().toISOString(),
      })
    );

    // 2. Collect any per-profile feedback signals
    const profileSignals = candidates
      .filter((c) => c.feedback)
      .map((c) => ({
        candidateId: c.profile.id,
        candidateName: c.profile.name,
        feedback: c.feedback!,
        reason: c.explanation,
      }));

    // 3. Dispatch refinement
    dispatch(
      runRefinement({
        userFeedback: feedbackText,
        currentFilters: filters,
        currentRubric: rubric,
        profileSignals,
        chatHistory: messages.map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
      })
    );

    setInputText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendFeedback();
    }
  };

  const suggestions = [
    '1 is too junior, 2 and 4 are right',
    'Include scaleup backgrounds',
    'Prioritize candidates with 5+ yrs exp',
  ];

  return (
    <div className="flex flex-col h-[520px] rounded-2xl bg-card border border-cardBorder overflow-hidden shadow-md">
      {/* Header */}
      <div className="p-4 border-b border-cardBorder bg-zinc-900/40 flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="p-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
            <MessageSquare className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className="font-semibold text-xs sm:text-sm text-zinc-100">
              Refine Matches
            </h3>
            <p className="text-[10px] text-zinc-400">
              Type feedback to fine-tune filters & rankings
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start space-x-2.5 ${
              msg.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''
            }`}
          >
            <div
              className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 text-xs font-semibold ${
                msg.role === 'user'
                  ? 'bg-zinc-700 text-zinc-100'
                  : 'bg-zinc-800 text-indigo-400 border border-zinc-700'
              }`}
            >
              {msg.role === 'user' ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
            </div>

            <div
              className={`max-w-[85%] rounded-2xl p-3.5 leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-zinc-700/90 text-zinc-100'
                  : 'bg-zinc-900/80 border border-zinc-800 text-zinc-200'
              }`}
            >
              <p className="whitespace-pre-wrap text-xs">{msg.content}</p>

              {/* Adjustments summary */}
              {msg.changes && (
                <div className="mt-2.5 pt-2 border-t border-zinc-800 space-y-1.5">
                  {msg.changes.filter_changes?.length > 0 && (
                    <div className="p-2 rounded-lg bg-zinc-800/60 border border-zinc-700/40 text-[11px]">
                      <span className="font-semibold text-indigo-300 block mb-0.5">Filter Updates:</span>
                      <ul className="list-disc list-inside text-zinc-300 space-y-0.5">
                        {msg.changes.filter_changes.map((fc, i) => (
                          <li key={i}>{fc}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {msg.changes.rubric_changes?.length > 0 && (
                    <div className="p-2 rounded-lg bg-zinc-800/60 border border-zinc-700/40 text-[11px]">
                      <span className="font-semibold text-purple-300 block mb-0.5">Scoring Updates:</span>
                      <ul className="list-disc list-inside text-zinc-300 space-y-0.5">
                        {msg.changes.rubric_changes.map((rc, i) => (
                          <li key={i}>{rc}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}

        {(isTyping || isRefining) && (
          <div className="flex items-center space-x-2 text-zinc-400 p-2 text-xs">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />
            <span>Updating criteria and re-ranking matches...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Feedback Chips */}
      <div className="px-3 py-2 border-t border-zinc-800 bg-zinc-900/40 overflow-x-auto flex gap-1.5 no-scrollbar">
        {suggestions.map((s, idx) => (
          <button
            key={idx}
            onClick={() => handleSendFeedback(s)}
            disabled={isRefining}
            className="whitespace-nowrap px-2.5 py-1 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 border border-zinc-700/60 text-[11px] text-zinc-300 hover:text-white transition-all shrink-0"
          >
            {s}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="p-3 border-t border-cardBorder bg-card">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendFeedback();
          }}
          className="flex items-center space-x-2"
        >
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type feedback (e.g. '1 is too junior, 2 and 4 are right')..."
            disabled={isRefining}
            className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500/50"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isRefining}
            className="p-2 rounded-xl bg-zinc-100 hover:bg-white disabled:opacity-40 text-zinc-900 text-xs font-semibold transition-all shadow-sm"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
};
