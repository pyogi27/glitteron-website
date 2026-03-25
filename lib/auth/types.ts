export interface WebsiteUser {
  id: number;
  phone: string;
  firstName: string;
  lastName: string;
  email: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zipCode?: string | null;
}

export interface AuthSuccessResponse {
  success: true;
  accessToken: string;
  user: WebsiteUser;
}

export interface OtpSentResponse {
  success: true;
  message: string;
}

/** Shape thrown by the API helpers on non-2xx responses */
export interface ApiError {
  status: number;
  message: string;
}
