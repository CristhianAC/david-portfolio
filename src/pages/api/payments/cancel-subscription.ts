export const prerender = false;

import type { APIRoute } from "astro";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
    },
  });

/**
 * Garantiza que la fecha de expiración se mantenga al menos un mes adelante
 * para respetar el periodo pagado cuando no existe metadata previa.
 */
const ensureFutureDate = (date: Date | null) => {
  const now = new Date();

  if (!date || Number.isNaN(date.getTime()) || date <= now) {
    const nextBilling = new Date(now);
    nextBilling.setMonth(nextBilling.getMonth() + 1);
    return nextBilling;
  }

  return date;
};

/**
 * Marca la suscripción como "cancelling" y conserva el acceso hasta
 * `premium_active_until`, devolviendo la fecha efectiva al cliente.
 */
export const POST: APIRoute = async ({ cookies }) => {
  try {
    const supabase = createSupabaseServerClient();
    const accessToken = cookies.get("sb-access-token");
    const refreshToken = cookies.get("sb-refresh-token");

    if (!accessToken || !refreshToken) {
      return jsonResponse({ message: "No autorizado" }, 401);
    }

    const { data, error } = await supabase.auth.setSession({
      access_token: accessToken.value,
      refresh_token: refreshToken.value,
    });

    if (error || !data.session || !data.user) {
      return jsonResponse({ message: "Sesión inválida" }, 401);
    }

    const metadata = data.user.user_metadata || {};
    const currentActiveUntil = metadata.premium_active_until
      ? new Date(metadata.premium_active_until)
      : null;
    const activeUntil = ensureFutureDate(currentActiveUntil);

    if (
      !metadata.is_premium &&
      (!currentActiveUntil || currentActiveUntil <= new Date())
    ) {
      return jsonResponse(
        {
          message: "No tienes una suscripción activa para cancelar",
        },
        400
      );
    }

    const now = new Date();

    const { error: updateError } = await supabase.auth.updateUser({
      data: {
        is_premium: true,
        premium_cancelled_at: now.toISOString(),
        premium_active_until: activeUntil.toISOString(),
        premium_status: "cancelling",
      },
    });

    if (updateError) {
      console.error("Supabase update error", updateError);
      return jsonResponse(
        {
          message: "No se pudo cancelar la suscripción en este momento",
        },
        500
      );
    }

    return jsonResponse({
      message:
        "Tu suscripción seguirá activa hasta la próxima fecha de renovación",
      activeUntil: activeUntil.toISOString(),
    });
  } catch (err) {
    console.error("Error cancelling subscription", err);
    return jsonResponse(
      { message: "No fue posible cancelar la suscripción" },
      500
    );
  }
};
