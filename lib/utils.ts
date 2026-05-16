import { clsx, type ClassValue } from 'clsx';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function emitToUser(userId: string, event: string, data: any) {
  if (global.io) {
    global.io.to(`user:${userId}`).emit(event, data);
  }
}
