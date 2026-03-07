'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import api from '@/lib/api';
import { MentorProfile, MentorMatch, MentorshipConnection, UserProfile, MenteeDetails, MentorDetails, MentorshipSession, UnreadMessageCounts } from '@/lib/types';
import Button from '@/components/ui/Button';
import Card, { CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import MentorshipChat from '@/components/MentorshipChat';

type TabType = 'find' | 'connections' | 'become';

export default function MentorsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('find');
  const [error, setError] = useState<string | null>(null);

  // Find Mentors tab
  const [mentorMatches, setMentorMatches] = useState<MentorMatch[]>([]);
  const [allMentors, setAllMentors] = useState<MentorProfile[]>([]);
  const [searchExpertise, setSearchExpertise] = useState('');
  const [selectedMentor, setSelectedMentor] = useState<MentorProfile | null>(null);
  const [requestMessage, setRequestMessage] = useState('');
  const [requestGoals, setRequestGoals] = useState('');
  const [sendingRequest, setSendingRequest] = useState(false);

  // Connections tab
  const [connections, setConnections] = useState<MentorshipConnection[]>([]);
  const [myMentorProfile, setMyMentorProfile] = useState<MentorProfile | null>(null);

  // Session scheduling
  const [schedulingConnection, setSchedulingConnection] = useState<MentorshipConnection | null>(null);
  const [sessionForm, setSessionForm] = useState({
    date: '',
    time: '',
    duration: 30,
    topic: '',
    notes: '',
  });
  const [schedulingSession, setSchedulingSession] = useState(false);

  // Become Mentor tab
  const [mentorForm, setMentorForm] = useState({
    bio: '',
    expertise_areas: '',
    industries: '',
    years_experience: 5,
    job_title: '',
    company: '',
    linkedin_url: '',
    max_mentees: 3,
    availability_hours_per_week: 2,
  });
  const [submittingMentor, setSubmittingMentor] = useState(false);

  // Edit mentor profile
  const [editingProfile, setEditingProfile] = useState(false);
  const [editForm, setEditForm] = useState({
    bio: '',
    expertise_areas: '',
    industries: '',
    years_experience: 5,
    job_title: '',
    company: '',
    linkedin_url: '',
    max_mentees: 3,
    availability_hours_per_week: 2,
    status: 'available' as 'available' | 'busy' | 'inactive',
  });
  const [savingProfile, setSavingProfile] = useState(false);

  // Mentee details modal
  const [viewingMentee, setViewingMentee] = useState<MentorshipConnection | null>(null);
  const [menteeDetails, setMenteeDetails] = useState<MenteeDetails | null>(null);
  const [loadingMenteeDetails, setLoadingMenteeDetails] = useState(false);

  // Mentor details modal (for mentees viewing their mentor)
  const [viewingMentor, setViewingMentor] = useState<MentorshipConnection | null>(null);
  const [mentorDetails, setMentorDetails] = useState<MentorDetails | null>(null);
  const [loadingMentorDetails, setLoadingMentorDetails] = useState(false);

  // Chat
  const [chattingConnection, setChattingConnection] = useState<MentorshipConnection | null>(null);
  const [unreadCounts, setUnreadCounts] = useState<UnreadMessageCounts | null>(null);

  useEffect(() => {
    const init = async () => {
      const response = await supabase.auth.getSession();
      const session = response?.data?.session;
      if (!session) {
        router.push('/auth/login');
        return;
      }

      setUserId(session.user.id);

      try {
        const profile = await api.getProfile(session.user.id);
        setUserProfile(profile);

        // Load mentor matches
        const matches = await api.findMentorMatches(session.user.id, 10);
        setMentorMatches(matches);

        // Load all mentors
        const mentors = await api.listMentors({ limit: 20 });
        setAllMentors(mentors);

        // Check if user is a mentor
        const mentorProfile = await api.getUserMentorProfile(session.user.id);
        setMyMentorProfile(mentorProfile);

        // Load connections
        const conns = await api.getConnections(session.user.id, 'both');
        setConnections(conns);

        // Load unread message counts
        try {
          const counts = await api.getUnreadMessageCounts(session.user.id);
          setUnreadCounts(counts);
        } catch (err) {
          console.error('Error loading unread counts:', err);
        }
      } catch (err) {
        console.error('Error loading mentor data:', err);
      }

      setLoading(false);
    };

    init();
  }, [router]);

  // Refresh unread counts periodically
  useEffect(() => {
    if (!userId) return;

    const interval = setInterval(async () => {
      try {
        const counts = await api.getUnreadMessageCounts(userId);
        setUnreadCounts(counts);
      } catch (err) {
        // Ignore errors on poll
      }
    }, 30000); // Every 30 seconds

    return () => clearInterval(interval);
  }, [userId]);

  const handleSearchMentors = async () => {
    setLoading(true);
    try {
      const mentors = await api.listMentors({
        expertise: searchExpertise || undefined,
        limit: 20,
      });
      setAllMentors(mentors);
    } catch (err) {
      setError('Failed to search mentors');
    }
    setLoading(false);
  };

  const handleRequestMentorship = async () => {
    if (!userId || !selectedMentor) return;

    const goals = requestGoals.split(',').map((g) => g.trim()).filter(Boolean);
    if (goals.length === 0) {
      setError('Please enter at least one goal');
      return;
    }

    if (requestMessage.length < 20) {
      setError('Please write a longer introduction message (at least 20 characters)');
      return;
    }

    setSendingRequest(true);
    setError(null);

    try {
      console.log('Sending mentorship request:', {
        mentee_id: userId,
        mentor_id: selectedMentor.id,
        message: requestMessage,
        goals,
      });

      const connection = await api.requestMentorship({
        mentee_id: userId,
        mentor_id: selectedMentor.id,
        message: requestMessage,
        goals,
      });

      console.log('Connection created:', connection);
      setConnections((prev) => [...prev, connection]);
      setSelectedMentor(null);
      setRequestMessage('');
      setRequestGoals('');
      setActiveTab('connections');
    } catch (err) {
      console.error('Mentorship request error:', err);
      setError(err instanceof Error ? err.message : 'Failed to send request');
    } finally {
      setSendingRequest(false);
    }
  };

  const handleAcceptConnection = async (connectionId: string) => {
    try {
      await api.acceptMentorship(connectionId);
      setConnections((prev) =>
        prev.map((c) => (c.id === connectionId ? { ...c, status: 'active' } : c))
      );
    } catch (err) {
      setError('Failed to accept connection');
    }
  };

  const handleDeclineConnection = async (connectionId: string) => {
    try {
      await api.declineMentorship(connectionId);
      setConnections((prev) =>
        prev.map((c) => (c.id === connectionId ? { ...c, status: 'declined' } : c))
      );
    } catch (err) {
      setError('Failed to decline connection');
    }
  };

  const handleScheduleSession = async () => {
    if (!schedulingConnection) return;

    if (!sessionForm.date || !sessionForm.time) {
      setError('Please select a date and time');
      return;
    }

    if (!sessionForm.topic.trim()) {
      setError('Please enter a topic for the session');
      return;
    }

    setSchedulingSession(true);
    setError(null);

    try {
      const scheduledTime = new Date(`${sessionForm.date}T${sessionForm.time}`).toISOString();

      console.log('Scheduling session:', {
        connection_id: schedulingConnection.id,
        scheduled_time: scheduledTime,
        duration_minutes: sessionForm.duration,
        topic: sessionForm.topic,
        notes: sessionForm.notes || undefined,
      });

      await api.scheduleSession({
        connection_id: schedulingConnection.id,
        scheduled_time: scheduledTime,
        duration_minutes: sessionForm.duration,
        topic: sessionForm.topic,
        notes: sessionForm.notes || undefined,
      });

      // Reset form and close modal
      setSchedulingConnection(null);
      setSessionForm({
        date: '',
        time: '',
        duration: 30,
        topic: '',
        notes: '',
      });

      // Show success message
      setError(null);
      alert('Session scheduled successfully!');
    } catch (err) {
      console.error('Schedule session error:', err);
      setError(err instanceof Error ? err.message : 'Failed to schedule session');
    } finally {
      setSchedulingSession(false);
    }
  };

  const handleBecomeMentor = async () => {
    if (!userId) return;

    const expertise = mentorForm.expertise_areas.split(',').map((e) => e.trim()).filter(Boolean);
    const industries = mentorForm.industries.split(',').map((i) => i.trim()).filter(Boolean);

    if (expertise.length === 0) {
      setError('Please enter at least one area of expertise');
      return;
    }

    if (mentorForm.bio.length < 50) {
      setError('Please write a longer bio (at least 50 characters)');
      return;
    }

    setSubmittingMentor(true);
    setError(null);

    try {
      const profile = await api.becomeMentor({
        user_id: userId,
        bio: mentorForm.bio,
        expertise_areas: expertise,
        industries,
        years_experience: mentorForm.years_experience,
        job_title: mentorForm.job_title,
        company: mentorForm.company || undefined,
        linkedin_url: mentorForm.linkedin_url || undefined,
        max_mentees: mentorForm.max_mentees,
        availability_hours_per_week: mentorForm.availability_hours_per_week,
      });

      setMyMentorProfile(profile);
      setActiveTab('connections');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create mentor profile');
    } finally {
      setSubmittingMentor(false);
    }
  };

  const startEditingProfile = () => {
    if (!myMentorProfile) return;
    setEditForm({
      bio: myMentorProfile.bio,
      expertise_areas: myMentorProfile.expertise_areas.join(', '),
      industries: myMentorProfile.industries.join(', '),
      years_experience: myMentorProfile.years_experience,
      job_title: myMentorProfile.job_title,
      company: myMentorProfile.company || '',
      linkedin_url: myMentorProfile.linkedin_url || '',
      max_mentees: myMentorProfile.max_mentees,
      availability_hours_per_week: myMentorProfile.availability_hours_per_week,
      status: myMentorProfile.status,
    });
    setEditingProfile(true);
  };

  const handleSaveProfile = async () => {
    if (!userId) return;

    const expertise = editForm.expertise_areas.split(',').map((e) => e.trim()).filter(Boolean);
    const industries = editForm.industries.split(',').map((i) => i.trim()).filter(Boolean);

    if (expertise.length === 0) {
      setError('Please enter at least one area of expertise');
      return;
    }

    if (editForm.bio.length < 50) {
      setError('Please write a longer bio (at least 50 characters)');
      return;
    }

    setSavingProfile(true);
    setError(null);

    try {
      const updated = await api.updateMentorProfile(userId, {
        bio: editForm.bio,
        expertise_areas: expertise,
        industries,
        years_experience: editForm.years_experience,
        job_title: editForm.job_title,
        company: editForm.company || undefined,
        linkedin_url: editForm.linkedin_url || undefined,
        max_mentees: editForm.max_mentees,
        availability_hours_per_week: editForm.availability_hours_per_week,
        status: editForm.status,
      });

      setMyMentorProfile(updated);
      setEditingProfile(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleViewMentee = async (connection: MentorshipConnection) => {
    setViewingMentee(connection);
    setLoadingMenteeDetails(true);
    setMenteeDetails(null);

    try {
      const details = await api.getMenteeDetails(connection.id);
      setMenteeDetails(details);
    } catch (err) {
      console.error('Failed to load mentee details:', err);
      setError('Failed to load mentee details');
    } finally {
      setLoadingMenteeDetails(false);
    }
  };

  const handleViewMentor = async (connection: MentorshipConnection) => {
    setViewingMentor(connection);
    setLoadingMentorDetails(true);
    setMentorDetails(null);

    try {
      const details = await api.getMentorDetails(connection.id);
      setMentorDetails(details);
    } catch (err) {
      console.error('Failed to load mentor details:', err);
      setError('Failed to load mentor details');
    } finally {
      setLoadingMentorDetails(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-700',
      active: 'bg-green-100 text-green-700',
      completed: 'bg-blue-100 text-blue-700',
      declined: 'bg-red-100 text-red-700',
    };
    return styles[status] || 'bg-gray-100 text-gray-700';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading mentorship data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Header */}
      <div className="bg-gradient-purple pt-4 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-white">
            <h1 className="text-3xl md:text-4xl font-bold mb-2">Mentorship</h1>
            <p className="text-white/80 text-lg">
              Connect with experienced professionals or guide others in their career journey
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6">
            {error}
            <button onClick={() => setError(null)} className="float-right font-bold">×</button>
          </div>
        )}

        {/* Tab Navigation */}
        <Card variant="elevated" className="mb-6">
          <CardContent className="p-2">
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab('find')}
                className={`flex-1 px-4 py-3 rounded-xl font-medium transition-all ${
                  activeTab === 'find'
                    ? 'bg-violet-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Find Mentors
              </button>
              <button
                onClick={() => setActiveTab('connections')}
                className={`flex-1 px-4 py-3 rounded-xl font-medium transition-all ${
                  activeTab === 'connections'
                    ? 'bg-violet-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                My Connections
                {connections.filter((c) => c.status === 'pending').length > 0 && (
                  <span className="ml-2 px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                    {connections.filter((c) => c.status === 'pending').length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('become')}
                className={`flex-1 px-4 py-3 rounded-xl font-medium transition-all ${
                  activeTab === 'become'
                    ? 'bg-violet-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {myMentorProfile ? 'My Mentor Profile' : 'Become a Mentor'}
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Find Mentors Tab */}
        {activeTab === 'find' && (
          <div className="space-y-6 pb-12">
            {/* Search */}
            <Card variant="elevated">
              <CardContent className="p-5">
                <div className="flex gap-4">
                  <Input
                    placeholder="Search by expertise (e.g., AWS, Python, Leadership)..."
                    value={searchExpertise}
                    onChange={(e) => setSearchExpertise(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearchMentors()}
                    className="flex-1"
                  />
                  <Button variant="primary" onClick={handleSearchMentors}>
                    Search
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Recommended Matches */}
            {mentorMatches.length > 0 && (
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4">Recommended for You</h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {mentorMatches.map((match) => (
                    <Card
                      key={match.mentor.id}
                      variant="elevated"
                      className="cursor-pointer hover:shadow-lg transition-shadow"
                      onClick={() => setSelectedMentor(match.mentor)}
                    >
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="font-bold text-gray-900">{match.mentor.name}</h3>
                            <p className="text-sm text-violet-600">{match.mentor.job_title}</p>
                            {match.mentor.company && (
                              <p className="text-sm text-gray-500">{match.mentor.company}</p>
                            )}
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-violet-600">{match.match_score}%</div>
                            <p className="text-xs text-gray-500">Match</p>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{match.reason}</p>
                        <div className="flex flex-wrap gap-1">
                          {match.matching_skills.slice(0, 3).map((skill) => (
                            <span
                              key={skill}
                              className="px-2 py-0.5 bg-violet-100 text-violet-700 rounded text-xs"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* All Mentors */}
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4">All Mentors</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {allMentors.map((mentor) => (
                  <Card
                    key={mentor.id}
                    variant="elevated"
                    className="cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => setSelectedMentor(mentor)}
                  >
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-bold text-gray-900">{mentor.name}</h3>
                          <p className="text-sm text-violet-600">{mentor.job_title}</p>
                          {mentor.company && (
                            <p className="text-sm text-gray-500">{mentor.company}</p>
                          )}
                        </div>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            mentor.status === 'available'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {mentor.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">{mentor.bio}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                        <span>{mentor.years_experience} years exp</span>
                        <span>{mentor.total_sessions} sessions</span>
                        {mentor.rating && <span>★ {mentor.rating.toFixed(1)}</span>}
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {mentor.expertise_areas.slice(0, 4).map((skill) => (
                          <span
                            key={skill}
                            className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {allMentors.length === 0 && (
                <Card variant="bordered" className="bg-white">
                  <CardContent className="p-8 text-center text-gray-500">
                    <div className="text-5xl mb-4">👥</div>
                    <p className="font-medium">No mentors found</p>
                    <p className="text-sm">Be the first to become a mentor!</p>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Request Modal */}
            {selectedMentor && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <Card variant="elevated" className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Request Mentorship</CardTitle>
                      <button
                        onClick={() => setSelectedMentor(null)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        ✕
                      </button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="bg-violet-50 rounded-xl p-4">
                      <h3 className="font-bold text-gray-900">{selectedMentor.name}</h3>
                      <p className="text-sm text-violet-600">{selectedMentor.job_title}</p>
                      {selectedMentor.company && (
                        <p className="text-sm text-gray-500">{selectedMentor.company}</p>
                      )}
                      <p className="text-sm text-gray-600 mt-2">{selectedMentor.bio}</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Your Goals (comma-separated)
                      </label>
                      <Input
                        placeholder="e.g., Learn AWS, Career transition, Interview prep"
                        value={requestGoals}
                        onChange={(e) => setRequestGoals(e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Introduction Message
                      </label>
                      <textarea
                        className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                        rows={4}
                        placeholder="Introduce yourself and explain why you'd like this mentor..."
                        value={requestMessage}
                        onChange={(e) => setRequestMessage(e.target.value)}
                      />
                    </div>

                    {error && (
                      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                        {error}
                      </div>
                    )}

                    <div className="flex gap-3">
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => setSelectedMentor(null)}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="primary"
                        className="flex-1"
                        onClick={handleRequestMentorship}
                        isLoading={sendingRequest}
                      >
                        Send Request
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        )}

        {/* Connections Tab */}
        {activeTab === 'connections' && (
          <div className="space-y-6 pb-12">
            {/* Pending Requests (for mentors) */}
            {myMentorProfile && connections.filter((c) => c.status === 'pending' && c.mentor_id === myMentorProfile.id).length > 0 && (
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4">Pending Requests</h2>
                <div className="space-y-4">
                  {connections
                    .filter((c) => c.status === 'pending' && c.mentor_id === myMentorProfile.id)
                    .map((conn) => (
                      <Card key={conn.id} variant="elevated">
                        <CardContent className="p-5">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-bold text-gray-900">{conn.mentee_name}</h3>
                              <p className="text-sm text-gray-500 mt-1">{conn.message}</p>
                              <div className="flex flex-wrap gap-2 mt-3">
                                {conn.goals.map((goal) => (
                                  <span
                                    key={goal}
                                    className="px-2 py-1 bg-violet-100 text-violet-700 rounded-full text-xs"
                                  >
                                    {goal}
                                  </span>
                                ))}
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeclineConnection(conn.id)}
                              >
                                Decline
                              </Button>
                              <Button
                                variant="primary"
                                size="sm"
                                onClick={() => handleAcceptConnection(conn.id)}
                              >
                                Accept
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              </div>
            )}

            {/* Active Connections */}
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4">My Connections</h2>
              <div className="space-y-4">
                {connections
                  .filter((c) => c.status !== 'declined')
                  .map((conn) => {
                    const isMentor = myMentorProfile?.id === conn.mentor_id;
                    const handleClick = isMentor ? () => handleViewMentee(conn) : () => handleViewMentor(conn);
                    return (
                      <Card
                        key={conn.id}
                        variant="elevated"
                        className="cursor-pointer hover:shadow-lg transition-shadow"
                        onClick={handleClick}
                      >
                        <CardContent className="p-5">
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-bold text-gray-900">
                                  {isMentor ? conn.mentee_name : conn.mentor_name}
                                </h3>
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(conn.status)}`}>
                                  {conn.status}
                                </span>
                                <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs">
                                  {isMentor ? 'Mentee' : 'Mentor'}
                                </span>
                              </div>
                              <div className="flex flex-wrap gap-2 mt-2">
                                {conn.goals.map((goal) => (
                                  <span
                                    key={goal}
                                    className="px-2 py-1 bg-violet-100 text-violet-700 rounded-full text-xs"
                                  >
                                    {goal}
                                  </span>
                                ))}
                              </div>
                              <p className="text-sm text-gray-500 mt-2">
                                {conn.sessions_completed} sessions completed
                              </p>
                              <p className="text-xs text-violet-600 mt-1">
                                Click to view {isMentor ? 'mentee' : 'mentor'} profile
                              </p>
                            </div>
                            <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                              {(conn.status === 'active' || conn.status === 'pending') && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setChattingConnection(conn)}
                                  className="relative"
                                >
                                  Chat
                                  {(unreadCounts?.by_connection[conn.id] ?? 0) > 0 && (
                                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                                      {unreadCounts?.by_connection[conn.id]}
                                    </span>
                                  )}
                                </Button>
                              )}
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={handleClick}
                              >
                                View Profile
                              </Button>
                              {conn.status === 'active' && (
                                <Button
                                  variant="primary"
                                  size="sm"
                                  onClick={() => setSchedulingConnection(conn)}
                                >
                                  Schedule Session
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}

                {connections.filter((c) => c.status !== 'declined').length === 0 && (
                  <Card variant="bordered" className="bg-white">
                    <CardContent className="p-8 text-center text-gray-500">
                      <div className="text-5xl mb-4">🤝</div>
                      <p className="font-medium">No connections yet</p>
                      <p className="text-sm">Find a mentor to get started!</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>

            {/* Schedule Session Modal */}
            {schedulingConnection && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <Card variant="elevated" className="w-full max-w-lg">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Schedule Session</CardTitle>
                      <button
                        onClick={() => setSchedulingConnection(null)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        ✕
                      </button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="bg-violet-50 rounded-xl p-4">
                      <p className="text-sm text-gray-600">
                        Scheduling session with{' '}
                        <span className="font-semibold text-violet-700">
                          {myMentorProfile?.id === schedulingConnection.mentor_id
                            ? schedulingConnection.mentee_name
                            : schedulingConnection.mentor_name}
                        </span>
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Date
                        </label>
                        <Input
                          type="date"
                          value={sessionForm.date}
                          onChange={(e) => setSessionForm({ ...sessionForm, date: e.target.value })}
                          min={new Date().toISOString().split('T')[0]}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Time
                        </label>
                        <Input
                          type="time"
                          value={sessionForm.time}
                          onChange={(e) => setSessionForm({ ...sessionForm, time: e.target.value })}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Duration (minutes)
                      </label>
                      <select
                        className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                        value={sessionForm.duration}
                        onChange={(e) => setSessionForm({ ...sessionForm, duration: parseInt(e.target.value) })}
                      >
                        <option value={15}>15 minutes</option>
                        <option value={30}>30 minutes</option>
                        <option value={45}>45 minutes</option>
                        <option value={60}>1 hour</option>
                        <option value={90}>1.5 hours</option>
                        <option value={120}>2 hours</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Topic
                      </label>
                      <Input
                        placeholder="e.g., Career advice, Technical deep-dive, Interview prep"
                        value={sessionForm.topic}
                        onChange={(e) => setSessionForm({ ...sessionForm, topic: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Notes (optional)
                      </label>
                      <textarea
                        className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                        rows={3}
                        placeholder="Any specific questions or topics you'd like to cover..."
                        value={sessionForm.notes}
                        onChange={(e) => setSessionForm({ ...sessionForm, notes: e.target.value })}
                      />
                    </div>

                    {error && (
                      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                        {error}
                      </div>
                    )}

                    <div className="flex gap-3">
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => setSchedulingConnection(null)}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="primary"
                        className="flex-1"
                        onClick={handleScheduleSession}
                        isLoading={schedulingSession}
                      >
                        Schedule
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Mentee Details Modal */}
            {viewingMentee && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
                <Card variant="elevated" className="w-full max-w-2xl my-8">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>{viewingMentee.mentee_name}&apos;s Profile</CardTitle>
                      <button
                        onClick={() => {
                          setViewingMentee(null);
                          setMenteeDetails(null);
                        }}
                        className="text-gray-400 hover:text-gray-600 text-xl"
                      >
                        ✕
                      </button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {loadingMenteeDetails ? (
                      <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600 mx-auto mb-4" />
                        <p className="text-gray-600">Loading mentee details...</p>
                      </div>
                    ) : menteeDetails ? (
                      <>
                        {/* Mentee Profile Info */}
                        <div className="bg-violet-50 rounded-xl p-4">
                          <h3 className="font-semibold text-gray-900 mb-2">Profile</h3>
                          {menteeDetails.profile ? (
                            <div className="space-y-2">
                              <p className="text-gray-700">
                                <span className="font-medium">Name:</span> {menteeDetails.profile.name}
                              </p>
                              {menteeDetails.profile.years_of_experience && (
                                <p className="text-gray-700">
                                  <span className="font-medium">Experience:</span> {menteeDetails.profile.years_of_experience} years
                                </p>
                              )}
                              {menteeDetails.profile.skills && menteeDetails.profile.skills.length > 0 && (
                                <div>
                                  <span className="font-medium text-gray-700">Skills:</span>
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {menteeDetails.profile.skills.slice(0, 10).map((skill) => (
                                      <span
                                        key={skill}
                                        className="px-2 py-0.5 bg-violet-100 text-violet-700 rounded text-xs"
                                      >
                                        {skill}
                                      </span>
                                    ))}
                                    {menteeDetails.profile.skills.length > 10 && (
                                      <span className="text-gray-500 text-xs">+{menteeDetails.profile.skills.length - 10} more</span>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          ) : (
                            <p className="text-gray-500">No profile information available</p>
                          )}
                        </div>

                        {/* Mentorship Goals */}
                        <div>
                          <h3 className="font-semibold text-gray-900 mb-2">Mentorship Goals</h3>
                          <div className="flex flex-wrap gap-2">
                            {menteeDetails.connection.goals.map((goal) => (
                              <span
                                key={goal}
                                className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm"
                              >
                                {goal}
                              </span>
                            ))}
                          </div>
                          <p className="text-gray-600 mt-2 text-sm italic">
                            &quot;{menteeDetails.connection.message}&quot;
                          </p>
                        </div>

                        {/* Saved Jobs / Analyses */}
                        <div>
                          <h3 className="font-semibold text-gray-900 mb-2">
                            Saved Job Analyses ({menteeDetails.saved_analyses.length})
                          </h3>
                          {menteeDetails.saved_analyses.length > 0 ? (
                            <div className="space-y-3 max-h-48 overflow-y-auto">
                              {menteeDetails.saved_analyses.map((analysis) => (
                                <div
                                  key={analysis.id}
                                  className="border border-gray-200 rounded-lg p-3 bg-white"
                                >
                                  <div className="flex items-center justify-between mb-2">
                                    <div>
                                      <p className="font-medium text-gray-900">{analysis.job_title}</p>
                                      {analysis.company && (
                                        <p className="text-sm text-gray-500">{analysis.company}</p>
                                      )}
                                    </div>
                                    <div
                                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                                        analysis.match_percentage >= 70
                                          ? 'bg-green-100 text-green-700'
                                          : analysis.match_percentage >= 50
                                          ? 'bg-yellow-100 text-yellow-700'
                                          : 'bg-red-100 text-red-700'
                                      }`}
                                    >
                                      {analysis.match_percentage}% match
                                    </div>
                                  </div>
                                  {analysis.missing_skills.length > 0 && (
                                    <div>
                                      <p className="text-xs text-gray-500 mb-1">Missing skills:</p>
                                      <div className="flex flex-wrap gap-1">
                                        {analysis.missing_skills.map((skill) => (
                                          <span
                                            key={skill}
                                            className="px-2 py-0.5 bg-red-50 text-red-600 rounded text-xs"
                                          >
                                            {skill}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-gray-500 text-sm">No saved job analyses yet</p>
                          )}
                        </div>

                        {/* Sessions */}
                        <div>
                          <h3 className="font-semibold text-gray-900 mb-2">
                            Sessions ({menteeDetails.sessions.length})
                          </h3>
                          {menteeDetails.sessions.length > 0 ? (
                            <div className="space-y-2 max-h-40 overflow-y-auto">
                              {menteeDetails.sessions.map((session) => (
                                <div
                                  key={session.id}
                                  className="border border-gray-200 rounded-lg p-3 bg-white flex items-center justify-between"
                                >
                                  <div>
                                    <p className="font-medium text-gray-900">{session.topic}</p>
                                    <p className="text-sm text-gray-500">
                                      {new Date(session.scheduled_time).toLocaleDateString()}{' '}
                                      at {new Date(session.scheduled_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                      {' • '}{session.duration_minutes} min
                                    </p>
                                  </div>
                                  <span
                                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                                      session.status === 'completed'
                                        ? 'bg-green-100 text-green-700'
                                        : session.status === 'confirmed'
                                        ? 'bg-blue-100 text-blue-700'
                                        : session.status === 'cancelled'
                                        ? 'bg-red-100 text-red-700'
                                        : 'bg-yellow-100 text-yellow-700'
                                    }`}
                                  >
                                    {session.status}
                                  </span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-gray-500 text-sm">No sessions scheduled yet</p>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3 pt-4 border-t border-gray-200">
                          <Button
                            variant="outline"
                            className="flex-1"
                            onClick={() => {
                              setViewingMentee(null);
                              setMenteeDetails(null);
                            }}
                          >
                            Close
                          </Button>
                          <Button
                            variant="outline"
                            className="flex-1"
                            onClick={() => {
                              setViewingMentee(null);
                              setChattingConnection(menteeDetails.connection);
                            }}
                          >
                            Chat
                          </Button>
                          {menteeDetails.connection.status === 'active' && (
                            <Button
                              variant="primary"
                              className="flex-1"
                              onClick={() => {
                                setViewingMentee(null);
                                setSchedulingConnection(menteeDetails.connection);
                              }}
                            >
                              Schedule Session
                            </Button>
                          )}
                        </div>
                      </>
                    ) : (
                      <p className="text-center text-gray-500 py-8">Failed to load mentee details</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Mentor Details Modal (for mentees viewing their mentor) */}
            {viewingMentor && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
                <Card variant="elevated" className="w-full max-w-2xl my-8">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>{viewingMentor.mentor_name}&apos;s Profile</CardTitle>
                      <button
                        onClick={() => {
                          setViewingMentor(null);
                          setMentorDetails(null);
                        }}
                        className="text-gray-400 hover:text-gray-600 text-xl"
                      >
                        ✕
                      </button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {loadingMentorDetails ? (
                      <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600 mx-auto mb-4" />
                        <p className="text-gray-600">Loading mentor details...</p>
                      </div>
                    ) : mentorDetails ? (
                      <>
                        {/* Mentor Profile Info */}
                        <div className="bg-violet-50 rounded-xl p-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-bold text-xl text-gray-900">{mentorDetails.mentor.name}</h3>
                              <p className="text-violet-700 font-medium">{mentorDetails.mentor.job_title}</p>
                              {mentorDetails.mentor.company && (
                                <p className="text-gray-600">{mentorDetails.mentor.company}</p>
                              )}
                            </div>
                            <div className="text-right">
                              {mentorDetails.mentor.rating && (
                                <p className="text-lg font-bold text-violet-600">
                                  {mentorDetails.mentor.rating.toFixed(1)} ★
                                </p>
                              )}
                              <p className="text-sm text-gray-500">
                                {mentorDetails.mentor.total_sessions} sessions
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Bio */}
                        <div>
                          <h3 className="font-semibold text-gray-900 mb-2">About</h3>
                          <p className="text-gray-600">{mentorDetails.mentor.bio}</p>
                        </div>

                        {/* Expertise Areas */}
                        <div>
                          <h3 className="font-semibold text-gray-900 mb-2">Expertise Areas</h3>
                          <div className="flex flex-wrap gap-2">
                            {mentorDetails.mentor.expertise_areas.map((area) => (
                              <span
                                key={area}
                                className="px-3 py-1 bg-violet-100 text-violet-700 rounded-full text-sm"
                              >
                                {area}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Industries */}
                        {mentorDetails.mentor.industries.length > 0 && (
                          <div>
                            <h3 className="font-semibold text-gray-900 mb-2">Industries</h3>
                            <div className="flex flex-wrap gap-2">
                              {mentorDetails.mentor.industries.map((industry) => (
                                <span
                                  key={industry}
                                  className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                                >
                                  {industry}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Connection Info */}
                        <div className="bg-green-50 rounded-xl p-4">
                          <h3 className="font-semibold text-gray-900 mb-2">Your Connection</h3>
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(mentorDetails.connection.status)}`}>
                              {mentorDetails.connection.status}
                            </span>
                            <span className="text-sm text-gray-600">
                              {mentorDetails.connection.sessions_completed} sessions completed
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-2 mb-2">
                            {mentorDetails.connection.goals.map((goal) => (
                              <span
                                key={goal}
                                className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs"
                              >
                                {goal}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Sessions */}
                        <div>
                          <h3 className="font-semibold text-gray-900 mb-2">
                            Sessions ({mentorDetails.sessions.length})
                          </h3>
                          {mentorDetails.sessions.length > 0 ? (
                            <div className="space-y-2 max-h-40 overflow-y-auto">
                              {mentorDetails.sessions.map((session) => (
                                <div
                                  key={session.id}
                                  className="border border-gray-200 rounded-lg p-3 bg-white flex items-center justify-between"
                                >
                                  <div>
                                    <p className="font-medium text-gray-900">{session.topic}</p>
                                    <p className="text-sm text-gray-500">
                                      {new Date(session.scheduled_time).toLocaleDateString()}{' '}
                                      at {new Date(session.scheduled_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                      {' • '}{session.duration_minutes} min
                                    </p>
                                  </div>
                                  <span
                                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                                      session.status === 'completed'
                                        ? 'bg-green-100 text-green-700'
                                        : session.status === 'confirmed'
                                        ? 'bg-blue-100 text-blue-700'
                                        : session.status === 'cancelled'
                                        ? 'bg-red-100 text-red-700'
                                        : 'bg-yellow-100 text-yellow-700'
                                    }`}
                                  >
                                    {session.status}
                                  </span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-gray-500 text-sm">No sessions scheduled yet</p>
                          )}
                        </div>

                        {/* LinkedIn Link */}
                        {mentorDetails.mentor.linkedin_url && (
                          <div>
                            <a
                              href={mentorDetails.mentor.linkedin_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-violet-600 hover:text-violet-800 text-sm flex items-center gap-1"
                            >
                              View LinkedIn Profile →
                            </a>
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex gap-3 pt-4 border-t border-gray-200">
                          <Button
                            variant="outline"
                            className="flex-1"
                            onClick={() => {
                              setViewingMentor(null);
                              setMentorDetails(null);
                            }}
                          >
                            Close
                          </Button>
                          <Button
                            variant="outline"
                            className="flex-1"
                            onClick={() => {
                              setViewingMentor(null);
                              setChattingConnection(mentorDetails.connection);
                            }}
                          >
                            Chat
                          </Button>
                          {mentorDetails.connection.status === 'active' && (
                            <Button
                              variant="primary"
                              className="flex-1"
                              onClick={() => {
                                setViewingMentor(null);
                                setSchedulingConnection(mentorDetails.connection);
                              }}
                            >
                              Schedule Session
                            </Button>
                          )}
                        </div>
                      </>
                    ) : (
                      <p className="text-center text-gray-500 py-8">Failed to load mentor details</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Chat Modal */}
            {chattingConnection && userId && (
              <MentorshipChat
                connection={chattingConnection}
                userId={userId}
                isMentor={myMentorProfile?.id === chattingConnection.mentor_id}
                onClose={() => {
                  setChattingConnection(null);
                  // Refresh unread counts after closing chat
                  api.getUnreadMessageCounts(userId).then(setUnreadCounts).catch(() => {});
                }}
              />
            )}
          </div>
        )}

        {/* Become Mentor Tab */}
        {activeTab === 'become' && (
          <div className="pb-12">
            {myMentorProfile ? (
              <>
              <Card variant="elevated">
                <CardHeader>
                  <CardTitle>Your Mentor Profile</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between bg-green-50 rounded-xl p-4">
                    <div>
                      <p className="font-medium text-green-700">You are a registered mentor!</p>
                      <p className="text-sm text-green-600">
                        {myMentorProfile.current_mentees} / {myMentorProfile.max_mentees} mentee slots filled
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        myMentorProfile.status === 'available'
                          ? 'bg-green-200 text-green-800'
                          : 'bg-gray-200 text-gray-600'
                      }`}
                    >
                      {myMentorProfile.status}
                    </span>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Bio</h4>
                    <p className="text-gray-600">{myMentorProfile.bio}</p>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Expertise Areas</h4>
                    <div className="flex flex-wrap gap-2">
                      {myMentorProfile.expertise_areas.map((area) => (
                        <span
                          key={area}
                          className="px-3 py-1 bg-violet-100 text-violet-700 rounded-full text-sm"
                        >
                          {area}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-1">Total Sessions</h4>
                      <p className="text-2xl font-bold text-violet-600">{myMentorProfile.total_sessions}</p>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 mb-1">Rating</h4>
                      <p className="text-2xl font-bold text-violet-600">
                        {myMentorProfile.rating ? `${myMentorProfile.rating.toFixed(1)} ★` : 'No ratings yet'}
                      </p>
                    </div>
                  </div>

                  {!editingProfile && (
                    <Button variant="outline" onClick={startEditingProfile} className="w-full">
                      Edit Profile
                    </Button>
                  )}
                </CardContent>
              </Card>

              {/* Edit Profile Form */}
              {editingProfile && (
                <Card variant="elevated" className="mt-6">
                  <CardHeader>
                    <CardTitle>Edit Your Mentor Profile</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Status
                      </label>
                      <select
                        className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                        value={editForm.status}
                        onChange={(e) => setEditForm({ ...editForm, status: e.target.value as 'available' | 'busy' | 'inactive' })}
                      >
                        <option value="available">Available</option>
                        <option value="busy">Busy</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Bio (min 50 characters)
                      </label>
                      <textarea
                        className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                        rows={4}
                        value={editForm.bio}
                        onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                      />
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Job Title
                        </label>
                        <Input
                          value={editForm.job_title}
                          onChange={(e) => setEditForm({ ...editForm, job_title: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Company
                        </label>
                        <Input
                          value={editForm.company}
                          onChange={(e) => setEditForm({ ...editForm, company: e.target.value })}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Areas of Expertise (comma-separated)
                      </label>
                      <Input
                        value={editForm.expertise_areas}
                        onChange={(e) => setEditForm({ ...editForm, expertise_areas: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Industries (comma-separated)
                      </label>
                      <Input
                        value={editForm.industries}
                        onChange={(e) => setEditForm({ ...editForm, industries: e.target.value })}
                      />
                    </div>

                    <div className="grid md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Years of Experience
                        </label>
                        <Input
                          type="number"
                          min={2}
                          value={editForm.years_experience}
                          onChange={(e) => setEditForm({ ...editForm, years_experience: parseInt(e.target.value) || 2 })}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Max Mentees
                        </label>
                        <Input
                          type="number"
                          min={1}
                          max={10}
                          value={editForm.max_mentees}
                          onChange={(e) => setEditForm({ ...editForm, max_mentees: parseInt(e.target.value) || 3 })}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Hours/Week
                        </label>
                        <Input
                          type="number"
                          min={1}
                          max={20}
                          value={editForm.availability_hours_per_week}
                          onChange={(e) => setEditForm({ ...editForm, availability_hours_per_week: parseInt(e.target.value) || 2 })}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        LinkedIn URL
                      </label>
                      <Input
                        value={editForm.linkedin_url}
                        onChange={(e) => setEditForm({ ...editForm, linkedin_url: e.target.value })}
                      />
                    </div>

                    {error && (
                      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                        {error}
                      </div>
                    )}

                    <div className="flex gap-3">
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => setEditingProfile(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="primary"
                        className="flex-1"
                        onClick={handleSaveProfile}
                        isLoading={savingProfile}
                      >
                        Save Changes
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
              </>
            ) : (
              <Card variant="elevated">
                <CardHeader>
                  <CardTitle>Become a Mentor</CardTitle>
                  <p className="text-sm text-gray-500">
                    Share your expertise and help others grow in their careers
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Bio (min 50 characters)
                    </label>
                    <textarea
                      className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                      rows={4}
                      placeholder="Tell potential mentees about your experience, achievements, and what you can help with..."
                      value={mentorForm.bio}
                      onChange={(e) => setMentorForm({ ...mentorForm, bio: e.target.value })}
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Job Title
                      </label>
                      <Input
                        placeholder="e.g., Senior Software Engineer"
                        value={mentorForm.job_title}
                        onChange={(e) => setMentorForm({ ...mentorForm, job_title: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Company (optional)
                      </label>
                      <Input
                        placeholder="e.g., Google"
                        value={mentorForm.company}
                        onChange={(e) => setMentorForm({ ...mentorForm, company: e.target.value })}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Areas of Expertise (comma-separated)
                    </label>
                    <Input
                      placeholder="e.g., AWS, System Design, Python, Career Growth"
                      value={mentorForm.expertise_areas}
                      onChange={(e) => setMentorForm({ ...mentorForm, expertise_areas: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Industries (comma-separated, optional)
                    </label>
                    <Input
                      placeholder="e.g., Cloud & Infrastructure, AI & Machine Learning"
                      value={mentorForm.industries}
                      onChange={(e) => setMentorForm({ ...mentorForm, industries: e.target.value })}
                    />
                  </div>

                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Years of Experience
                      </label>
                      <Input
                        type="number"
                        min={2}
                        value={mentorForm.years_experience}
                        onChange={(e) => setMentorForm({ ...mentorForm, years_experience: parseInt(e.target.value) || 2 })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Max Mentees
                      </label>
                      <Input
                        type="number"
                        min={1}
                        max={10}
                        value={mentorForm.max_mentees}
                        onChange={(e) => setMentorForm({ ...mentorForm, max_mentees: parseInt(e.target.value) || 3 })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Hours/Week Available
                      </label>
                      <Input
                        type="number"
                        min={1}
                        max={20}
                        value={mentorForm.availability_hours_per_week}
                        onChange={(e) => setMentorForm({ ...mentorForm, availability_hours_per_week: parseInt(e.target.value) || 2 })}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      LinkedIn URL (optional)
                    </label>
                    <Input
                      placeholder="https://linkedin.com/in/yourprofile"
                      value={mentorForm.linkedin_url}
                      onChange={(e) => setMentorForm({ ...mentorForm, linkedin_url: e.target.value })}
                    />
                  </div>

                  <Button
                    variant="primary"
                    className="w-full"
                    onClick={handleBecomeMentor}
                    isLoading={submittingMentor}
                  >
                    Register as Mentor
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
