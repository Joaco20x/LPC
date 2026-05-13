// src/app/api_dor/refresh/route.ts

import { NextRequest } from 'next/server';
import { controladorRefresh } from '@/backend/controllers/refresh.controller';

export async function POST(req: NextRequest) {
  return await controladorRefresh(req);
}