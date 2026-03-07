'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import api from '@/lib/api';
import { MentorshipChatMessage, MentorshipConnection } from '@/lib/types';
import Button from '@/components/ui/Button';
import Card, { CardHeader, CardTitle, CardContent } from '@/components/ui/Card';

interface MentorshipChatProps {
  connection: MentorshipConnection;
  userId: string;
  isMentor: boolean;
  onClose: () => void;
}

export default function MentorshipChat({
  connection,
  userId,
  isMentor,
  onClose,
}: MentorshipChatProps) {
  const [messages, setMessages] = useState<MentorshipChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const otherPersonName = isMentor ? connection.mentee_name : connection.mentor_name;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadMessages = useCallback(async () => {
    try {
      const response = await api.getMentorshipMessages(connection.id, userId, 100);
      setMessages(response.messages);
      // Mark messages as read
      if (response.unread_count > 0) {
        await api.markMessagesAsRead(connection.id, userId);
      }
    } catch (err) {
      console.error('Failed to load messages:', err);
      setError('Failed to load messages');
    } finally {
      setLoading(false);
    }
  }, [connection.id, userId]);

  useEffect(() => {
    loadMessages();
    // Poll for new messages every 10 seconds
    const interval = setInterval(loadMessages, 10000);
    return () => clearInterval(interval);
  }, [loadMessages]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSend = async () => {
    if (!newMessage.trim()) return;

    setSending(true);
    setError(null);

    try {
      const message = await api.sendMentorshipMessage(connection.id, newMessage.trim(), userId);
      setMessages((prev) => [...prev, message]);
      setNewMessage('');
      inputRef.current?.focus();
    } catch (err) {
      console.error('Failed to send message:', err);
      setError('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();

    if (isToday) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' ' +
           date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card variant="elevated" className="w-full max-w-2xl h-[80vh] flex flex-col">
        <CardHeader className="flex-shrink-0 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center">
                <span className="text-violet-600 font-semibold">
                  {otherPersonName.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <CardTitle className="text-base">{otherPersonName}</CardTitle>
                <p className="text-xs text-gray-500">
                  {connection.status === 'active' ? 'Active connection' : connection.status}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-xl p-2"
            >
              ✕
            </button>
          </div>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600 mx-auto mb-4" />
                <p className="text-gray-600">Loading messages...</p>
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-5xl mb-4">💬</div>
                <p className="text-gray-600 font-medium">No messages yet</p>
                <p className="text-gray-500 text-sm mt-1">
                  Start the conversation with {otherPersonName}!
                </p>
              </div>
            ) : (
              <>
                {messages.map((msg, idx) => {
                  const isOwn = msg.sender_id === userId;
                  const showDate = idx === 0 ||
                    new Date(messages[idx - 1].created_at).toDateString() !== new Date(msg.created_at).toDateString();

                  return (
                    <div key={msg.id}>
                      {showDate && (
                        <div className="text-center my-4">
                          <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
                            {new Date(msg.created_at).toLocaleDateString([], {
                              weekday: 'long',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </span>
                        </div>
                      )}
                      <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                        <div
                          className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                            isOwn
                              ? 'bg-violet-600 text-white rounded-br-md'
                              : 'bg-gray-100 text-gray-900 rounded-bl-md'
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                          <p
                            className={`text-xs mt-1 ${
                              isOwn ? 'text-violet-200' : 'text-gray-400'
                            }`}
                          >
                            {formatTime(msg.created_at)}
                            {isOwn && msg.is_read && ' ✓'}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Input Area */}
          <div className="flex-shrink-0 border-t border-gray-100 p-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm mb-3">
                {error}
              </div>
            )}
            <div className="flex gap-2">
              <textarea
                ref={inputRef}
                className="flex-1 px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-violet-500 resize-none"
                rows={2}
                placeholder="Type a message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={handleKeyPress}
                disabled={sending}
              />
              <Button
                variant="primary"
                onClick={handleSend}
                isLoading={sending}
                disabled={!newMessage.trim() || sending}
                className="self-end"
              >
                Send
              </Button>
            </div>
            <p className="text-xs text-gray-400 mt-2">Press Enter to send, Shift+Enter for new line</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
