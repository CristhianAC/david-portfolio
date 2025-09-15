// Utilidades para manejar cookies
export class CookieUtils {
  /**
   * Establece una cookie
   * @param name - Nombre de la cookie
   * @param value - Valor de la cookie
   * @param days - Días de expiración (opcional, por defecto 7 días)
   * @param path - Ruta de la cookie (opcional, por defecto '/')
   */
  static setCookie(
    name: string,
    value: string,
    days: number = 7,
    path: string = "/"
  ): void {
    const expires = new Date();
    expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);

    document.cookie = `${name}=${encodeURIComponent(
      value
    )};expires=${expires.toUTCString()};path=${path};SameSite=Strict;Secure=${
      location.protocol === "https:"
    }`;
  }

  /**
   * Obtiene el valor de una cookie
   * @param name - Nombre de la cookie
   * @returns El valor de la cookie o null si no existe
   */
  static getCookie(name: string): string | null {
    const nameEQ = name + "=";
    const ca = document.cookie.split(";");

    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === " ") {
        c = c.substring(1, c.length);
      }
      if (c.indexOf(nameEQ) === 0) {
        return decodeURIComponent(c.substring(nameEQ.length, c.length));
      }
    }
    return null;
  }

  /**
   * Elimina una cookie
   * @param name - Nombre de la cookie
   * @param path - Ruta de la cookie (opcional, por defecto '/')
   */
  static deleteCookie(name: string, path: string = "/"): void {
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=${path}`;
  }

  /**
   * Verifica si una cookie existe
   * @param name - Nombre de la cookie
   * @returns true si la cookie existe, false en caso contrario
   */
  static cookieExists(name: string): boolean {
    return this.getCookie(name) !== null;
  }
}
