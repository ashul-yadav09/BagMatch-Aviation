import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../db/db.ts';
import { User, UserRole } from '../db/types.ts';

const JWT_SECRET = process.env.JWT_SECRET || 'bagmatch-secure-jwt-aviation-secret-2026';
const TOKEN_EXPIRY = '7d';

export interface UserSessionPayload {
  userId: string;
  email: string;
  role: UserRole;
  fullName: string;
}

export class AuthService {
  public static hashPassword(password: string): string {
    const salt = bcrypt.genSaltSync(10);
    return bcrypt.hashSync(password, salt);
  }

  public static verifyPassword(password: string, hash: string): boolean {
    return bcrypt.compareSync(password, hash);
  }

  public static generateToken(user: User): string {
    const payload: UserSessionPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      fullName: user.full_name,
    };
    return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
  }

  public static verifyToken(token: string): UserSessionPayload | null {
    try {
      return jwt.verify(token, JWT_SECRET) as UserSessionPayload;
    } catch {
      return null;
    }
  }

  public static sanitizeUser(user: User): Omit<User, 'password_hash'> {
    const { password_hash, ...rest } = user;
    return rest;
  }
}
