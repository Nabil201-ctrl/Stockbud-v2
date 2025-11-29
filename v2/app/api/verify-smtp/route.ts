import { NextRequest, NextResponse } from 'next/server';
import { verifySmtpConnection } from '../../../lib/nodemailer';

export async function GET(request: NextRequest) {
  const result = await verifySmtpConnection();
  if (result.success) {
    return NextResponse.json(result, { status: 200 });
  } else {
    return NextResponse.json(result, { status: 500 });
  }
}
