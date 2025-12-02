import { NextResponse } from 'next/server';

// Email sending endpoint has been disabled.
// This route intentionally returns 410 Gone so callers know the feature is removed.

export async function POST() {
  return NextResponse.json(
    { message: 'Email sending is disabled in this deployment' },
    { status: 410 }
  );
}