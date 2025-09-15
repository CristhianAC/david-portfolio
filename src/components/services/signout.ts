import { AuthCookies } from "@/utils/authCookies";

export function SignOutService() {
  AuthCookies.clearAuthTokens();
  // Redirect to home page after signing out
  window.location.href = "/";
}

export default SignOutService;
