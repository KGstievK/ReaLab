namespace AUTH {
  type ProfileAddress = {
    id: number;
    label: string;
    recipient_name: string;
    phone_number: string;
    country: string;
    city: string;
    address: string;
    postal_code: string;
    is_default: boolean;
  };

  type GetResponse = {
    id: number;
    username: string;
    role: "customer" | "manager" | "admin" | "owner";
    permissions?: string[];
    assigned_roles?: string[];
    first_name: string;
    last_name: string;
    email: string;
    address: string;
    number: string;
    addresses?: ProfileAddress[];
    default_address?: ProfileAddress | null;
  }[];
  type GetRequest = void;

  type GetProfileAddressesResponse = ProfileAddress[];
  type GetProfileAddressesRequest = void;

  type PostProfileAddressRequest = {
    label?: string;
    recipient_name: string;
    phone_number: string;
    country?: string;
    city: string;
    address: string;
    postal_code?: string;
    is_default?: boolean;
  };
  type PostProfileAddressResponse = ProfileAddress;

  type PatchProfileAddressRequest = {
    id: number;
    label?: string;
    recipient_name?: string;
    phone_number?: string;
    country?: string;
    city?: string;
    address?: string;
    postal_code?: string;
    is_default?: boolean;
  };
  type PatchProfileAddressResponse = ProfileAddress;

  type DeleteProfileAddressRequest = {
    id: number;
  };
  type DeleteProfileAddressResponse = {
    success: boolean;
    id: number;
  };

  type SetDefaultProfileAddressRequest = {
    id: number;
  };
  type SetDefaultProfileAddressResponse = ProfileAddress;

  type PutMeResponse = {};
  type PutMeRequest = {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
    email: string;
    address: string;
    number: string;
  };

  type PostLoginResponse = {
    access: string;
    refresh: string;
  };

  type PostLoginRequest = {
    username: string;
    password: string;
  };

  type PostRegistrationResponse = {
    access: string;
    refresh: string;
  };
  type PostRegistrationRequest = {
    username: string;
    email: string;
    password: string;
    confirm_password: string;
  };

  type PostLogoutResponse = {};
  type PostLogoutRequest = void;

  type PatchRefreshResponse = {
    access: string;
    refresh: string;
  };
  type PatchRefreshRequest = {
    refresh: string;
  };

  type PostForgotPasswordResponse = {
    status: string;
  };
  type PostForgotPasswordRequest = {
    email: string;
  };

  type PostResetPasswordResponse = {
    message: string;
  };
  type PostResetPasswordRequest = {
    email: string;
    reset_code: string;
    new_password: string;
  };
}
