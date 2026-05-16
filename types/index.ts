export interface UserProfile {
  id: string;
  name: string;
  username: string;
  email: string;
  bio?: string | null;
  avatar?: string | null;
  coverImage?: string | null;
  isPrivate: boolean;
  createdAt: string;
  _count?: {
    posts: number;
    friends: number;
  };
}

export interface Post {
  id: string;
  content: string;
  mediaUrl?: string | null;
  mediaType?: string | null;
  privacy: string;
  createdAt: string;
  author: {
    id: string;
    name: string;
    username: string;
    avatar?: string | null;
  };
  _count: { likes: number; comments: number };
  likes: { userId: string }[];
}

export interface Comment {
  id: string;
  content: string;
  createdAt: string;
  author: {
    id: string;
    name: string;
    username: string;
    avatar?: string | null;
  };
}

export interface Notification {
  id: string;
  type: string;
  message: string;
  read: boolean;
  postId?: string | null;
  createdAt: string;
  sender?: {
    name: string;
    username: string;
    avatar?: string | null;
  } | null;
}

export interface FriendRequest {
  id: string;
  status: string;
  createdAt: string;
  sender: {
    id: string;
    name: string;
    username: string;
    avatar?: string | null;
  };
}

declare global {
  var io: any;
  namespace NodeJS {
    interface Global {
      io: any;
    }
  }
}

import 'next-auth';
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      username: string;
      avatar?: string;
    };
  }
}
