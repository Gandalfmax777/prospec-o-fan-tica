export interface OrgMembership {
  id: string;
  name: string;
  slug: string;
  role: string;
}

export interface User {
  id: string;
  email: string;
  name: string | null;
  emailVerified: boolean;
  image: string | null;
  role?: string;
  managerId?: string | null;
  organizationId?: string | null;
  organization?: { id: string; name: string; slug: string } | null;
  organizations?: OrgMembership[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Session {
  id: string;
  userId: string;
  expiresAt: Date;
  token: string;
  ipAddress: string | null;
  userAgent: string | null;
  user: User;
}

export interface AuthResponse {
  user: User;
  session: Session;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput {
  email: string;
  password: string;
  name?: string;
}

export interface AuthError {
  error: string;
  message?: string;
}
