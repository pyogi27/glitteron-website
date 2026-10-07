export interface WebsiteUser {
  id: number;
  phone: string | null;
  firstName: string;
  lastName: string;
  email: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zipCode?: string | null;
}

/** Shape thrown by the API helpers on non-2xx responses */
export interface ApiError {
  status: number;
  message: string;
}
