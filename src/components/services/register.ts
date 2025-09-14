import type { LoginResponse } from "../model/loginResponse";

export const register = async (
  name: string,
  email: string,
  password: string
): Promise<LoginResponse> => {
  const formData = new FormData();
  formData.append("name", name);
  formData.append("email", email);
  formData.append("password", password);

  const response = await fetch("/api/auth/register", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Registration failed");
  }

  const data = await response.json();
  return data as LoginResponse;
};
