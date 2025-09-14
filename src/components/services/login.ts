import type { LoginResponse } from "../model/loginResponse";
import { toast } from "react-toastify";
export const login = async (
  email: string,
  password: string
): Promise<LoginResponse> => {
  const formData = new FormData();
  formData.append("email", email);
  formData.append("password", password);

  const response = await fetch("/api/auth/signin", {
    method: "POST",
    body: formData,
  });
  if (!response.ok) {
    const errorData = await response.json();
    const errorMessage = errorData.message || "Login failed";
    toast.error(errorMessage);
    throw new Error(errorMessage);
  }

  const data = await response.json();
  return data as LoginResponse;
};
