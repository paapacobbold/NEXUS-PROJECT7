export type OnboardingSlide = {
  id: string;
  title: string;
  description: string;
  image: string;
};

export type SessionItem = {
  id: string;
  title: string;
  tutor: string;
  time: string;
  participants: string;
  tag: string;
  image: string;
  isLive?: boolean;
};

export type CommunityPost = {
  id: string;
  author: string;
  role?: string;
  time: string;
  title: string;
  body: string;
  stats: string;
};

export type CommunityItem = {
  id: string;
  name: string;
  subject: string;
  members: number;
  posts: number;
  description: string;
  image: string;
  joined?: boolean;
  postsFeed: CommunityPost[];
};

export type ThreadPreview = {
  id: string;
  name: string;
  preview: string;
  time: string;
  unread?: number;
  avatar: string;
  online?: boolean;
  isGroup?: boolean;
};

export type MessageItem = {
  id: string;
  sender: 'me' | 'them';
  text: string;
  time: string;
};

export type UserProfile = {
  id?: string;
  name: string;
  email: string;
  university: string;
  major: string;
  year: string;
  bio: string;
  skills: string[];
  rating: string;
  points: number;
  sessions: number;
  communities: number;
  streak: string;
  avatar: string;
};

export type NotificationPrefs = {
  sessionReminders: boolean;
  communityPosts: boolean;
  meetupUpdates: boolean;
  directMessages: boolean;
  badgesAndPoints: boolean;
  weeklyDigest: boolean;
  promotions: boolean;
};

export const brand = {
  name: 'NEXUS',
  tagline: 'Connect · Learn · Grow',
  primary: '#2C2FA3',
  secondary: '#F4F2EE',
  text: '#17161C',
  muted: '#70707B',
  border: '#E8E4DE',
  success: '#59B980',
  danger: '#E45A4F',
};

export const onboardingSlides: OnboardingSlide[] = [
  {
    id: 'learn',
    title: 'Learn from your peers',
    description:
      'Connect with top-rated student tutors in your university who truly understand the curriculum.',
    image:
      'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'live',
    title: 'Join live sessions',
    description:
      'Attend interactive video sessions, ask questions in real time, and grow with your community.',
    image:
      'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'share',
    title: 'Share skills locally',
    description:
      'Discover students nearby with practical skills, study groups, and collaboration opportunities.',
    image:
      'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1200&q=80',
  },
];

export const DEFAULT_AVATAR = 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png';

export const currentUser: UserProfile = {
  name: 'Amara Osei',
  email: 'amara@nexus.edu',
  university: 'Greenfield University',
  major: 'Computer Science',
  year: '3rd Year',
  bio: 'Passionate about algorithms and distributed systems. Love helping others understand complex concepts.',
  skills: ['Python', 'Data Structures', 'Calculus', 'Linear Algebra'],
  rating: '4.8',
  points: 1240,
  sessions: 31,
  communities: 5,
  streak: '5 days',
  avatar: DEFAULT_AVATAR,
};

export const liveSession: SessionItem = {
  id: 'live-1',
  title: 'Dynamic Programming Masterclass',
  tutor: 'Peer Tutor',
  time: 'Now · 120 min',
  participants: '25 participants',
  tag: 'LIVE NOW',
  image: DEFAULT_AVATAR,
  isLive: true,
};

export const upcomingSessions: SessionItem[] = [
  {
    id: 'session-1',
    title: 'Calculus III: Surface Integrals Deep Dive',
    tutor: 'Math Peer Lead',
    time: 'Jun 12, 2026 · 3:00 PM',
    participants: '18/30',
    tag: 'Mathematics',
    image: DEFAULT_AVATAR,
  },
  {
    id: 'session-2',
    title: 'Intro to Quantum Entanglement',
    tutor: 'Physics Peer Lead',
    time: 'Jun 13, 2026 · 5:00 PM',
    participants: '12/20',
    tag: 'Physics',
    image: DEFAULT_AVATAR,
  },
  {
    id: 'session-3',
    title: 'Database Design Office Hours',
    tutor: 'CS Peer Lead',
    time: 'Jun 15, 2026 · 1:00 PM',
    participants: '9/15',
    tag: 'Computer Science',
    image: DEFAULT_AVATAR,
  },
];

export const communities: CommunityItem[] = [
  {
    id: 'calc',
    name: 'Calculus Masters',
    subject: 'Mathematics',
    members: 342,
    posts: 0,
    description:
      'A community for students tackling Calculus I, II, and III. Share problems, solutions, and study tips.',
    image:
      'https://images.unsplash.com/photo-1509228468518-180dd4864904?auto=format&fit=crop&w=1200&q=80',
    joined: true,
    postsFeed: [],
  },
  {
    id: 'quantum',
    name: 'Quantum Physics Circle',
    subject: 'Physics',
    members: 198,
    posts: 0,
    description:
      'Explore quantum concepts, exchange notes, and connect with students interested in modern physics.',
    image:
      'https://images.unsplash.com/photo-1518152006812-edab29b069ac?auto=format&fit=crop&w=1200&q=80',
    joined: true,
    postsFeed: [],
  },
  {
    id: 'algo',
    name: 'Algorithms & Data Structures',
    subject: 'Computer Science',
    members: 287,
    posts: 0,
    description:
      'Discuss runtime tradeoffs, prepare for interviews, and collaborate on weekly coding challenges.',
    image:
      'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=1200&q=80',
    postsFeed: [],
  },
];

export const threadPreviews: ThreadPreview[] = [];

export const threadMessages: Record<string, MessageItem[]> = {};

export const defaultNotificationPrefs: NotificationPrefs = {
  sessionReminders: true,
  communityPosts: true,
  meetupUpdates: true,
  directMessages: true,
  badgesAndPoints: false,
  weeklyDigest: false,
  promotions: false,
};

export const filterSections = {
  subject: ['Mathematics', 'Physics', 'CS', 'Chemistry', 'Biology', 'Economics'],
  contentType: ['Live Session', 'Recorded', 'Community', 'Meetup', 'Tutor'],
  skillLevel: ['Beginner', 'Intermediate', 'Advanced'],
  availability: ['Today', 'This week', 'Weekends', 'Mornings', 'Evenings'],
  minimumRating: ['Any', '3+', '4+', '4.5+'],
};

export const profileBadges = [
  { id: 'b1', emoji: '🚀', label: 'Early\nAdopter' },
  { id: 'b2', emoji: '⭐', label: 'Top\nContributor' },
  { id: 'b3', emoji: '🎓', label: '10\nSessions' },
];

export type InPersonMeetup = {
  id: string;
  title: string;
  organizer: string;
  location: string;
  dateTime: string;
  rsvpCount: number;
  rsvpStatus?: boolean;
};

export type RecordedLecture = {
  id: string;
  title: string;
  tutor: string;
  category: string;
  duration: string;
  views: number;
  thumbnail: string;
};

export type LeaderboardUser = {
  rank: number;
  name: string;
  role: string;
  points: number;
  avatar: string;
};

export const sampleMeetups: InPersonMeetup[] = [
  {
    id: 'meetup-1',
    title: 'KNUST Tech Library Group Study',
    organizer: 'Amara Osei',
    location: 'Main Library 2nd Floor, Quiet Zone',
    dateTime: 'Tomorrow · 4:00 PM',
    rsvpCount: 14,
    rsvpStatus: true,
  },
  {
    id: 'meetup-2',
    title: 'Peer Tutoring Problem Solving Circle',
    organizer: 'Kai Nakamura',
    location: 'Engineering Building Lab 3',
    dateTime: 'Friday · 2:00 PM',
    rsvpCount: 9,
    rsvpStatus: false,
  },
];

export const sampleRecordings: RecordedLecture[] = [
  {
    id: 'rec-1',
    title: 'Data Structures: Binary Trees & Graphs',
    tutor: 'Priya Sharma',
    category: 'Computer Science',
    duration: '45 mins',
    views: 128,
    thumbnail: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'rec-2',
    title: 'Calculus II: Integration Techniques',
    tutor: 'Kai Nakamura',
    category: 'Mathematics',
    duration: '60 mins',
    views: 215,
    thumbnail: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?auto=format&fit=crop&w=600&q=80',
  },
];

export const sampleLeaderboard: LeaderboardUser[] = [
  { rank: 1, name: 'Priya Sharma', role: 'Top Tutor', points: 2850, avatar: 'https://i.pravatar.cc/120?img=31' },
  { rank: 2, name: 'Kai Nakamura', role: 'Math Specialist', points: 2410, avatar: 'https://i.pravatar.cc/120?img=12' },
  { rank: 3, name: 'Amara Osei', role: 'CS Peer Guide', points: 1950, avatar: 'https://i.pravatar.cc/120?img=47' },
  { rank: 4, name: 'Sofia Reyes', role: 'Physics Tutor', points: 1720, avatar: 'https://i.pravatar.cc/120?img=23' },
];
