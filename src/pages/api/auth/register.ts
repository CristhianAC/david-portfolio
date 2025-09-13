// Con `output: 'hybrid'` configurado:
export const prerender = false;
import type { APIRoute } from "astro";
import { supabase } from "@/lib/supabase";
import type { UserAttributes } from "@supabase/supabase-js";

export const POST: APIRoute = async ({ request, redirect }) => {
  const formData = await request.formData();
  const email = formData.get("email")?.toString();
  const password = formData.get("password")?.toString();

  if (!email || !password) {
    return new Response("Correo electrónico y contraseña obligatorios", {
      status: 400,
    });
  }
  const userAtr = {
    name: formData.get("name")?.toString() || undefined,
  };
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: userAtr,
    },
  });

  if (error) {
    return new Response(error.message, { status: 500 });
  }

  return redirect("/login");
};
