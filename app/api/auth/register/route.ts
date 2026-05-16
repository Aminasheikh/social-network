import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const { name, username, email, password } = await req.json();

    if (!name || !username || !email || !password)
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });

    const exists = await prisma.user.findFirst({
      where: { OR: [{ email }, { username }] },
    });
    if (exists)
      return NextResponse.json({ error: 'Email or username already taken' }, { status: 400 });

    const hashed = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { name, username: username.toLowerCase(), email, password: hashed },
    });

    return NextResponse.json({ id: user.id, username: user.username }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
