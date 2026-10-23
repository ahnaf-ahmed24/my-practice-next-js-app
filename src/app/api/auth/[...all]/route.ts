import { auth } from '@/lib/auth';
import { toNextJsHandler } from 'better-auth/next-js';

// Better Auth-এর সব এন্ডপয়েন্ট (/api/auth/*) হ্যান্ডেল করে
export const { GET, POST, PATCH, PUT, DELETE } = toNextJsHandler(auth.handler);
