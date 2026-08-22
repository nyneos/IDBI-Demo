export interface AppSetting {
  key: string;
  value: string;
  updated_at: Date;
}

export interface UserNameResponse {
  userName: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  created_at: Date;
}
