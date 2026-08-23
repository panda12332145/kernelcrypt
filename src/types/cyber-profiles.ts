// ============================================================
// TYPES - Profile data structures for all platforms
// ============================================================

export interface TryHackMeProfile {
  username: string;
  avatar: string;
  memberSince: string;
  location: string;
  globalRank: number;
  followers: number;
  following: number;
  ctfsCompleted: number;
  ctfsWon: number;
  roomsCompleted: number;
  roomsTotal: number;
  pathsCompleted: number;
  pathsTotal: number;
  achievements: number;
  achievementsTotal: number;
  completionPercent: number;
  tags: string[];
  badges: Badge[];
  recentActivity: Activity[];
  activityHeatmap: number[][];
  lastUpdated: string;
}

export interface LeetCodeProfile {
  username: string;
  avatar: string;
  location: string;
  followers: number;
  joinedDate: string;
  problemsSolved: number;
  submissionsAccepted: number;
  problemsAttempted: number;
  rating: number;
  easyTotal: number;
  easySolved: number;
  mediumTotal: number;
  mediumSolved: number;
  hardTotal: number;
  hardSolved: number;
  totalProblems: number;
  completionPercent: number;
  globalRank: number;
  countryRank: number;
  streak: number;
  bestStreak: number;
  dailyProblem: number;
  recentActivity: LeetActivity[];
  lastUpdated: string;
}

export interface YouTubeProfile {
  channelName: string;
  handle: string;
  avatar: string;
  description: string;
  location: string;
  linkUrl: string;
  subscribers: number;
  totalVideos: number;
  totalViews: number;
  totalLikes: number;
  last28Views: number;
  last28Hours: number;
  last28Subscribers: number;
  last28Likes: number;
  viewsGrowth: number;
  hoursGrowth: number;
  subsGrowth: number;
  likesGrowth: number;
  estimatedRevenue: string;
  subscriberGoal: number;
  featuredVideo: FeaturedVideo;
  chartData: number[];
  lastUpdated: string;
}

export interface InstagramProfile {
  username: string;
  avatar: string;
  bio: string;
  location: string;
  followers: number;
  following: number;
  posts: number;
  totalLikes: number;
  highlights: Highlight[];
  latestPost: LatestPost;
  lastUpdated: string;
}

export interface Badge {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export interface Activity {
  type: 'room' | 'path' | 'achievement';
  description: string;
  target: string;
  timeAgo: string;
}

export interface LeetActivity {
  status: 'accepted' | 'attempted';
  problem: string;
  difficulty?: 'Hard' | 'Medium' | 'Easy';
  timeAgo: string;
}

export interface FeaturedVideo {
  title: string;
  thumbnail: string;
  date: string;
  views: string;
  likes: string;
  duration: string;
  description: string;
  url: string;
}

export interface Highlight {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export interface LatestPost {
  image: string;
  date: string;
  likes: number;
  comments: number;
  shares: number;
  caption: string;
  hashtags: string[];
}

export type Platform = 'tryhackme' | 'leetcode' | 'youtube' | 'instagram';
