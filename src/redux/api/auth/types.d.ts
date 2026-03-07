namespace AUTH {
  type GetResponse = {
    id: number;
    username: string;
    role: "customer" | "manager" | "admin" | "owner";
    first_name: string;
    last_name: string;
    email: string;
    address: string;
    number: string;
  }[];
  type GetRequest = void;

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
