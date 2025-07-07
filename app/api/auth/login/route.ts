import { NextRequest, NextResponse } from 'next/server';
import { login, getClientInfo } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, rememberMe } = body;
    
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }
    
    const { ipAddress, userAgent } = getClientInfo(request);
    
    const result = await login(
      { email, password, rememberMe },
      ipAddress,
      userAgent
    );
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        user: {
          id: result.user!.id,
          email: result.user!.email,
          name: result.user!.name,
          company: result.user!.company,
          role: result.user!.role,
        }
      });
    } else {
      return NextResponse.json(
        { error: result.error },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error('Login API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}