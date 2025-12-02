import { NextResponse } from 'next/server';

// OAuth callback removed — email functionality is disabled across this project.
export async function GET() {
  return NextResponse.json({ message: 'Email OAuth callback disabled' }, { status: 410 });
}
