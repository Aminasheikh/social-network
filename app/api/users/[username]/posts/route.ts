import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(_req: NextRequest, { params }: { params: { username: string } }) {
  const session = await getServerSession(authOptions);

  const user = await prisma.user.findUnique({ where: { username: params.username } });
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const isOwner = session?.user.id === user.id;
  const isFriend = session ? !!(await prisma.friendship.findFirst({
    where: { userId: session.user.id, friendId: user.id },
  })) : false;

  const privacyFilter = isOwner
    ? {}
    : isFriend
    ? { privacy: { in: ['public', 'friends'] } }
    : { privacy: 'public' };

  const posts = await prisma.post.findMany({
    where: { authorId: user.id, ...privacyFilter },
    include: {
      author: { select: { id: true, name: true, username: true, avatar: true } },
      _count: { select: { likes: true, comments: true } },
      likes: session ? { where: { userId: session.user.id }, select: { userId: true } } : false,
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(posts);
}
