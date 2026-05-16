import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { emitToUser } from '@/lib/utils';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const existing = await prisma.like.findUnique({
    where: { userId_postId: { userId: session.user.id, postId: params.id } },
  });

  if (existing) {
    await prisma.like.delete({ where: { id: existing.id } });
    return NextResponse.json({ liked: false });
  }

  await prisma.like.create({ data: { userId: session.user.id, postId: params.id } });

  const post = await prisma.post.findUnique({ where: { id: params.id }, select: { authorId: true } });
  if (post && post.authorId !== session.user.id) {
    const notif = await prisma.notification.create({
      data: {
        type: 'like',
        message: `${session.user.name} liked your post`,
        userId: post.authorId,
        senderId: session.user.id,
        postId: params.id,
      },
      include: { sender: { select: { name: true, username: true, avatar: true } } },
    });
    emitToUser(post.authorId, 'notification', notif);
  }

  return NextResponse.json({ liked: true });
}
