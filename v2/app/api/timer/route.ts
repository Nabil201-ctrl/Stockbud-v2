import { NextResponse } from 'next/server';

export async function GET() {
  const days = 160;
  const timerInSeconds = days * 24 * 60 * 60;
  
  return NextResponse.json({
    data: {
      timer: timerInSeconds,
      days: days,
      message: `Timer set to ${days} days`
    }
  });
}