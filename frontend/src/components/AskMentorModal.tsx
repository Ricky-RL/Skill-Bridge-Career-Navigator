'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { MentorshipConnection, AnalysisResult, ParsedJobInfo } from '@/lib/types';
import Button from '@/components/ui/Button';
import Card, { CardHeader, CardTitle, CardContent } from '@/components/ui/Card';

interface JobContext {
  title: string;
  company?: string | null;
  matchPercentage?: number;
  missingSkills?: string[];
}

interface AskMentorModalProps {
  userId: string;
  jobContext: JobContext;
  onClose: () => void;
  onMessageSent?: () => void;
}

export default function AskMentorModal({
  userId,
  jobContext,
  onClose,
  onMessageSent,
}: AskMentorModalProps) {
  const [connections, setConnections] = useState<MentorshipConnection[]>([]);
  const [selectedConnection, setSelectedConnection] = useState<MentorshipConnection | null>(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    loadConnections();
  }, [userId]);

  useEffect(() => {
    // Pre-fill message with job context
    const missingSkillsText = jobContext.missingSkills && jobContext.missingSkills.length > 0
      ? `\n\nI'm missing these skills: ${jobContext.missingSkills.slice(0, 5).join(', ')}${jobContext.missingSkills.length > 5 ? ` and ${jobContext.missingSkills.length - 5} more` : ''}.`
      : '';

    const matchText = jobContext.matchPercentage !== undefined
      ? ` My current match is ${jobContext.matchPercentage}%.`
      : '';

    setMessage(
      `Hi! I'm looking at a ${jobContext.title}${jobContext.company ? ` position at ${jobContext.company}` : ''} and would love your advice.${matchText}${missingSkillsText}\n\nWhat do you think about this role for me? Any tips on how I should prepare?`
    );
  }, [jobContext]);

  const loadConnections = async () => {
    try {
      const conns = await api.getConnections(userId, 'mentee');
      // Only show active connections where user is the mentee
      const activeConnections = conns.filter(c => c.status === 'active');
      setConnections(activeConnections);
      if (activeConnections.length === 1) {
        setSelectedConnection(activeConnections[0]);
      }
    } catch (err) {
      console.error('Failed to load connections:', err);
      setError('Failed to load mentor connections');
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!selectedConnection || !message.trim()) return;

    setSending(true);
    setError(null);

    try {
      await api.sendMentorshipMessage(selectedConnection.id, message.trim(), userId);
      setSuccess(true);
      onMessageSent?.();
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      console.error('Failed to send message:', err);
      setError('Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <Card variant="elevated" className="w-full max-w-lg">
          <CardContent className="py-12 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading your mentors...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <Card variant="elevated" className="w-full max-w-lg">
          <CardContent className="py-12 text-center">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Message Sent!</h3>
            <p className="text-gray-600">Your mentor will receive your message shortly.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card variant="elevated" className="w-full max-w-lg max-h-[90vh] flex flex-col">
        <CardHeader className="flex-shrink-0 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <CardTitle>Ask Your Mentor</CardTitle>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-xl p-2"
            >
              ✕
            </button>
          </div>
        </CardHeader>

        <CardContent className="flex-1 overflow-y-auto space-y-4 py-4">
          {/* Job Context */}
          <div className="bg-violet-50 rounded-xl p-4">
            <h4 className="font-medium text-violet-900 mb-1">About this job</h4>
            <p className="text-violet-700">
              {jobContext.title}
              {jobContext.company && ` at ${jobContext.company}`}
            </p>
            {jobContext.matchPercentage !== undefined && (
              <p className="text-sm text-violet-600 mt-1">
                Your match: {jobContext.matchPercentage}%
              </p>
            )}
          </div>

          {connections.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">No Active Mentors</h3>
              <p className="text-gray-600 text-sm mb-4">
                You don&apos;t have any active mentor connections yet.
              </p>
              <Button
                variant="primary"
                onClick={() => {
                  onClose();
                  window.location.href = '/mentors';
                }}
              >
                Find a Mentor
              </Button>
            </div>
          ) : (
            <>
              {/* Mentor Selection */}
              {connections.length > 1 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Mentor
                  </label>
                  <div className="space-y-2">
                    {connections.map((conn) => (
                      <button
                        key={conn.id}
                        onClick={() => setSelectedConnection(conn)}
                        className={`w-full p-3 rounded-xl border-2 text-left transition-all ${
                          selectedConnection?.id === conn.id
                            ? 'border-violet-500 bg-violet-50'
                            : 'border-gray-200 hover:border-violet-300'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center">
                            <span className="text-violet-600 font-semibold">
                              {conn.mentor_name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{conn.mentor_name}</p>
                            <p className="text-sm text-gray-500">
                              {conn.sessions_completed} sessions completed
                            </p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Single Mentor Display */}
              {connections.length === 1 && selectedConnection && (
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center">
                    <span className="text-violet-600 font-semibold">
                      {selectedConnection.mentor_name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      Sending to {selectedConnection.mentor_name}
                    </p>
                    <p className="text-sm text-gray-500">Your mentor</p>
                  </div>
                </div>
              )}

              {/* Message Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Message
                </label>
                <textarea
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-violet-500 resize-none"
                  rows={6}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Ask your mentor about this job..."
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                  {error}
                </div>
              )}
            </>
          )}
        </CardContent>

        {connections.length > 0 && (
          <div className="flex-shrink-0 border-t border-gray-100 p-4 flex gap-3">
            <Button variant="outline" className="flex-1" onClick={onClose}>
              Cancel
            </Button>
            <Button
              variant="primary"
              className="flex-1"
              onClick={handleSend}
              isLoading={sending}
              disabled={!selectedConnection || !message.trim()}
            >
              Send Message
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
