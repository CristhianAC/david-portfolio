export interface LoginResponse {
  user: {
    id: string;
    email: string;
    // otros campos del usuario
  };
  session: {
    access_token: string;
    refresh_token: string;
    // otros campos de la sesión
  };
}
