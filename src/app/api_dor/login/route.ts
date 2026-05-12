import { NextRequest } from 'next/server';
import { controladorLogin } from '@/backend/controllers/login.controller';

export async function POST(req: NextRequest) {
  return await controladorLogin(req);
}