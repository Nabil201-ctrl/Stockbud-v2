import { NextResponse } from 'next/server';

// Authorization route removed — email functionality is disabled.
export async function GET() {
  return NextResponse.json({ message: 'Email / OAuth authorization disabled' }, { status: 410 });
}
