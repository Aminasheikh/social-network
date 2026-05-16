import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { emitToUser } from '@/lib/utils';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type') || 'requests';

  if (type === 'requests') {
    const requests = await prisma.friendRequest.findMany({
      where: { receiverId: session.user.id, status: 'pending' },
      include: { sender: { select: { id: true, name: true, username: true, avatar: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(requests);
  }

  const friends = await prisma.friendship.findMany({
    where: { userId: session.user.id },
    include: { friend: { select: { id: true, name: true, username: true, avatar: true } } },
  });
  return NextResponse.json(friends.map(f => f.friend));
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { receiverId } = await req.json();
  if (session.user.id === receiverId)
    return NextResponse.json({ error: 'Cannot add yourself' }, { status: 400 });

  const existing = await prisma.friendRequest.findFirst({
    where: {
      OR: [
        { senderId: session.user.id, receiverId },
        { senderId: receiverId, receiverId: session.user.id },
      ],
    },
  });
  if (existing) return NextResponse.json({ error: 'Request already exists' }, { status: 400 });

  const request = await prisma.friendRequest.create({
    data: { senderId: session.user.id, receiverId },
    include: { sender: { select: { id: true, name: true, username: true, avatar: true } } },
  });

  const notif = await prisma.notification.create({
    data: {
      type: 'friend_request',
      message: `${session.user.name} sent you a friend request`,
      userId: receiverId,
      senderId: session.user.id,
    },
    include: { sender: { select: { name: true, username: true, avatar: true } } },
  });
  emitToUser(receiverId, 'notification', notif);
  emitToUser(receiverId, 'friend_request', request);

  return NextResponse.json(request, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { requestId, action } = await req.json();

  const request = await prisma.friendRequest.findUnique({ where: { id: requestId } });
  if (!request || request.receiverId !== session.user.id)
    return NextResponse.json({ error: 'Not found' }, { status: 404 });

  if (action === 'accept') {
    await prisma.$transaction([
      prisma.friendRequest.update({ where: { id: requestId }, data: { status: 'accepted' } }),
      prisma.friendship.createMany({
        data: [
          { userId: request.senderId, friendId: request.receiverId },
          { userId: request.receiverId, friendId: request.senderId },
        ],
      }),
    ]);

    const notif = await prisma.notification.create({
      data: {
        type: 'friend_accept',
        message: `${session.user.name} accepted your friend request`,
        userId: request.senderId,
        senderId: session.user.id,
      },
      include: { sender: { select: { name: true, username: true, avatar: true } } },
    });
    emitToUser(request.senderId, 'notification', notif);
  } else {
    await prisma.friendRequest.update({ where: { id: requestId }, data: { status: 'rejected' } });
  }

  return NextResponse.json({ success: true });
}
