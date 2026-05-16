import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const cursor = searchParams.get('cursor');
  const take = 10;

  const friendships = await prisma.friendship.findMany({
    where: { userId: session.user.id },
    select: { friendId: true },
  });
  const friendIds = friendships.map(f => f.friendId);

  const posts = await prisma.post.findMany({
    where: {
      OR: [
        { authorId: session.user.id },
        { authorId: { in: friendIds }, privacy: { in: ['public', 'friends'] } },
        { privacy: 'public' },
      ],
    },
    include: {
      author: { select: { id: true, name: true, username: true, avatar: true } },
      _count: { select: { likes: true, comments: true } },
      likes: { where: { userId: session.user.id }, select: { userId: true } },
    },
    orderBy: { createdAt: 'desc' },
    take,
    ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
  });

  const nextCursor = posts.length === take ? posts[posts.length - 1].id : null;
  return NextResponse.json({ posts, nextCursor });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { content, mediaUrl, mediaType, privacy } = await req.json();
  if (!content?.trim() && !mediaUrl) return NextResponse.json({ error: 'Content required' }, { status: 400 });

  const post = await prisma.post.create({
    data: { content: content || '', mediaUrl, mediaType, privacy: privacy || 'public', authorId: session.user.id },
    include: {
      author: { select: { id: true, name: true, username: true, avatar: true } },
      _count: { select: { likes: true, comments: true } },
      likes: { where: { userId: session.user.id }, select: { userId: true } },
    },
  });

  if (global.io) global.io.emit('new_post', post);
  return NextResponse.json(post, { status: 201 });
}
