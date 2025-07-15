// Database type definitions
export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface User extends BaseEntity {
  email: string;
  name: string;
}

export interface Project extends BaseEntity {
  name: string;
  description: string;
  userId: string;
}