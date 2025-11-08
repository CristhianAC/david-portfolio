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
    return new Response(
      JSON.stringify({
        message: "Correo electrónico y contraseña obligatorios",
      }),
      {
        status: 400,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }

  const userAtr = {
    name: formData.get("name")?.toString() || undefined,
  };

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: userAtr,
    },
  });

  if (error) {
    return new Response(JSON.stringify({ message: error.message }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  // Devolver JSON en lugar de redirect
  return new Response(
    JSON.stringify({
      message:
        "Registro exitoso. Revisa el mensaje enviado a tu correo y sigue las instrucciones para confirmar tu cuenta.",
      user: data.user,
      session: data.session,
    }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
};
