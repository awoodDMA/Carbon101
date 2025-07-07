import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getCurrentUser();
    
    if (user) {
      return NextResponse.json({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          company: user.company,
          role: user.role,
          profileImage: user.profileImage,
          preferences: user.preferences,
          accConnection: user.accConnection ? {
            connectedAt: user.accConnection.connectedAt,
            accountName: user.accConnection.accountName,
            lastSync: user.accConnection.lastSync,
            isActive: user.accConnection.isActive,
          } : null,
        }
      });
    } else {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error('Get user API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}