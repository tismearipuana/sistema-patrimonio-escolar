export type Role = 'ADMIN' | 'SUPPORT' | 'USER';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  tenantId?: string;
  tenantName?: string;
}