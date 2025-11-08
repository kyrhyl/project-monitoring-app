import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';

export interface TokenPayload {
  userId: string;
  username: string;
  email: string;
  role: 'admin' | 'team_leader' | 'member';
  teamId?: string;
}

export class AuthUtils {
  static generateToken(payload: TokenPayload): string {
    return jwt.sign(payload, JWT_SECRET, {
      expiresIn: '7d',
      issuer: 'project-monitoring-app'
    });
  }

  static verifyToken(token: string): TokenPayload | null {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;
      return decoded;
    } catch (error) {
      return null;
    }
  }

  static extractTokenFromRequest(request: NextRequest): string | null {
    // Try Authorization header first
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    // Try cookies as fallback
    const tokenCookie = request.cookies.get('auth-token');
    if (tokenCookie) {
      return tokenCookie.value;
    }

    return null;
  }

  static getUserFromRequest(request: NextRequest): TokenPayload | null {
    const token = this.extractTokenFromRequest(request);
    if (!token) return null;

    return this.verifyToken(token);
  }

  static hasPermission(userRole: string, requiredRole: string): boolean {
    const roleHierarchy = {
      'admin': 3,
      'team_leader': 2,
      'member': 1
    };

    const userLevel = roleHierarchy[userRole as keyof typeof roleHierarchy] || 0;
    const requiredLevel = roleHierarchy[requiredRole as keyof typeof roleHierarchy] || 0;

    return userLevel >= requiredLevel;
  }

  static canManageUser(managerRole: string, targetRole: string): boolean {
    // Admin can manage everyone
    if (managerRole === 'admin') return true;
    
    // Team leaders can manage members only
    if (managerRole === 'team_leader' && targetRole === 'member') return true;
    
    return false;
  }
}

export default AuthUtils;