export interface Notification {
  id: string;
  userId: string;
  organizationId?: string;
  type: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
  updatedAt: string;
  [key: string]: any;
}

export interface ListNotificationsRequest {
  userId: string;
  page?: number;
  size?: number;
  unreadOnly?: boolean;
}

export interface ListNotificationsResponse {
  notifications: Notification[];
  total: number;
  page: number;
  size: number;
  [key: string]: any;
}

export interface UnreadCountResponse {
  count: number;
  [key: string]: any;
}

export interface SetEmailContactRequest {
  userId: string;
  email: string;
}

export interface SetEmailContactResponse {
  message?: string;
  [key: string]: any;
}

export interface SetPreferenceRequest {
  channels: string[];
  enabled: boolean;
}

export interface SetPreferenceResponse {
  message?: string;
  [key: string]: any;
}