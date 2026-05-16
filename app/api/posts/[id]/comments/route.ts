import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { emitToUser } from '@/lib/utils';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const comments = await prisma.comment.findMany({
    where: { postId: params.id },
    include: { author: { select: { id: true, name: true, username: true, avatar: true } } },
    orderBy: { createdAt: 'asc' },
  });
  return NextResponse.json(comments);
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { content } = await req.json();
  if (!content?.trim()) return NextResponse.json({ error: 'Content required' }, { status: 400 });

  const comment = await prisma.comment.create({
    data: { content, authorId: session.user.id, postId: params.id },
    include: { author: { select: { id: true, name: true, username: true, avatar: true } } },
  });

  const post = await prisma.post.findUnique({ where: { id: params.id }, select: { authorId: true } });
  if (post && post.authorId !== session.user.id) {
    const notif = await prisma.notification.create({
      data: {
        type: 'comment',
        message: `${session.user.name} commented on your post`,
        userId: post.authorId,
        senderId: session.user.id,
        postId: params.id,
      },
      include: { sender: { select: { name: true, username: true, avatar: true } } },
    });
    emitToUser(post.authorId, 'notification', notif);
  }

  if (global.io) global.io.emit(`comments:${params.id}`, comment);
  return NextResponse.json(comment, { status: 201 });
}
