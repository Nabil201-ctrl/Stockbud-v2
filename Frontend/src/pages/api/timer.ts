import { NextApiRequest, NextApiResponse } from 'next';
import { ApiResponse } from '../../../types';

interface TimerResponse {
  timer: number;
  days: number;
  message: string;
}

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse<TimerResponse>>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const days = 160;
  const timerInSeconds = days * 24 * 60 * 60;
  
  res.status(200).json({ 
    data: {
      timer: timerInSeconds,
      days: days,
      message: `Timer set to ${days} days`
    }
  });
}