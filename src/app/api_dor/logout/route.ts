import { NextRequest } from 'next/server';
import { controladorLogout } from '@/backend/controllers/logout.controller';

export async function POST(req: NextRequest) {
  return await controladorLogout(req);
}