import { Role } from '../utils/constants';

export interface AuthUser {
  id: string;
  email: string;
  role: Role;
  status: string;
}

export interface JwtAccessPayload {
  sub: string;
  email: string;
  role: Role;
  type: 'access';
}

export interface JwtRefreshPayload {
  sub: string;
  tokenId: string;
  type: 'refresh';
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthUser;
      requestId?: string;
    }
  }
}
