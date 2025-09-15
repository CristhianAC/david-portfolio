import { CookieUtils } from "./cookies";

/**
 * Utilidades específicas para manejar cookies de autenticación
 */
export class AuthCookies {
  private static readonly ACCESS_TOKEN_KEY = "sb-access-token";
  private static readonly REFRESH_TOKEN_KEY = "sb-refresh-token";
  private static readonly TOKEN_EXPIRES_DAYS = 7;

  /**
   * Guarda los tokens de autenticación en cookies
   * @param accessToken - Token de acceso
   * @param refreshToken - Token de refresh
   */
  static setAuthTokens(accessToken: string, refreshToken: string): void {
    CookieUtils.setCookie(
      this.ACCESS_TOKEN_KEY,
      accessToken,
      this.TOKEN_EXPIRES_DAYS
    );
    CookieUtils.setCookie(
      this.REFRESH_TOKEN_KEY,
      refreshToken,
      this.TOKEN_EXPIRES_DAYS
    );
  }

  /**
   * Obtiene el token de acceso
   * @returns El token de acceso o null si no existe
   */
  static getAccessToken(): string | null {
    return CookieUtils.getCookie(this.ACCESS_TOKEN_KEY);
  }

  /**
   * Obtiene el token de refresh
   * @returns El token de refresh o null si no existe
   */
  static getRefreshToken(): string | null {
    return CookieUtils.getCookie(this.REFRESH_TOKEN_KEY);
  }

  /**
   * Verifica si el usuario está autenticado
   * @returns true si ambos tokens existen, false en caso contrario
   */
  static isAuthenticated(): boolean {
    return this.getAccessToken() !== null && this.getRefreshToken() !== null;
  }

  /**
   * Elimina todos los tokens de autenticación
   */
  static clearAuthTokens(): void {
    CookieUtils.deleteCookie(this.ACCESS_TOKEN_KEY);
    CookieUtils.deleteCookie(this.REFRESH_TOKEN_KEY);
  }

  /**
   * Obtiene ambos tokens como un objeto
   * @returns Objeto con ambos tokens o null si alguno no existe
   */
  static getTokens(): { accessToken: string; refreshToken: string } | null {
    const accessToken = this.getAccessToken();
    const refreshToken = this.getRefreshToken();

    if (accessToken && refreshToken) {
      return { accessToken, refreshToken };
    }

    return null;
  }
}
