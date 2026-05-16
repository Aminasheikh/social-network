import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(_req: NextRequest, { params }: { params: { username: string } }) {
  const session = await getServerSession(authOptions);

  const user = await prisma.user.findUnique({
    where: { username: params.username },
    select: {
      id: true, name: true, username: true, bio: true,
      avatar: true, coverImage: true, isPrivate: true, createdAt: true,
      _count: { select: { posts: true, friends: true } },
    },
  });

  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  let isFriend = false;
  let friendRequestStatus = null;

  if (session && session.user.id !== user.id) {
    const friendship = await prisma.friendship.findFirst({
      where: { userId: session.user.id, friendId: user.id },
    });
    isFriend = !!friendship;

    if (!isFriend) {
      const request = await prisma.friendRequest.findFirst({
        where: {
          OR: [
            { senderId: session.user.id, receiverId: user.id },
            { senderId: user.id, receiverId: session.user.id },
          ],
        },
      });
      if (request) {
        friendRequestStatus = request.status === 'pending'
          ? (request.senderId === session.user.id ? 'sent' : 'received')
          : request.status;
      }
    }
  }

  return NextResponse.json({ ...user, isFriend, friendRequestStatus });
}

export async function PATCH(req: NextRequest, { params }: { params: { username: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { username: params.username } });
  if (!user || user.id !== session.user.id)
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { name, bio, isPrivate, avatar, coverImage } = await req.json();
  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { name, bio, isPrivate, avatar, coverImage },
    select: { id: true, name: true, username: true, bio: true, avatar: true, coverImage: true, isPrivate: true },
  });

  return NextResponse.json(updated);
}
