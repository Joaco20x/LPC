import { NextRequest } from 'next/server';
import { controladorGoogleCallback } from '@/auth/controllers/google.oauth.controller';

export async function GET(req: NextRequest) {
  return controladorGoogleCallback(req);
}
