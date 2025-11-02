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

interface ConfirmSubscriptionPayload {
  transactionId?: string;
  reference?: string;
}

interface WompiTransaction {
  id: string;
  status: string;
  amount_in_cents: number;
  currency: string;
  reference: string;
  payment_method_type?: string;
}

/**
 * Centraliza la lectura de variables de entorno y valida monto/moneda esperados.
 */
const getConfig = () => {
  const apiUrl =
    import.meta.env.WOMPI_API_URL || "https://production.wompi.co/v1";
  const privateKey = import.meta.env.WOMPI_PRIVATE_KEY;
  const expectedAmount = Number(
    import.meta.env.WOMPI_SUBSCRIPTION_AMOUNT_IN_CENTS || "99900"
  );
  const expectedCurrency = import.meta.env.WOMPI_SUBSCRIPTION_CURRENCY || "COP";

  if (!privateKey) {
    throw new Error("WOMPI_PRIVATE_KEY environment variable is required.");
  }

  if (!Number.isFinite(expectedAmount) || expectedAmount <= 0) {
    throw new Error(
      "WOMPI_SUBSCRIPTION_AMOUNT_IN_CENTS must be a positive number in cents."
    );
  }

  return { apiUrl, privateKey, expectedAmount, expectedCurrency } as const;
};

/**
 * Consulta el detalle de la transacción directamente a la API de Wompi para
 * garantizar que el backend verifique el monto, moneda y referencia.
 */
const fetchTransaction = async (
  apiUrl: string,
  privateKey: string,
  id: string
) => {
  const response = await fetch(`${apiUrl}/transactions/${id}`, {
    headers: {
      Authorization: `Bearer ${privateKey}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Wompi API responded with status ${response.status}`);
  }

  const payload = (await response.json()) as { data?: WompiTransaction };
  return payload.data;
};

/**
 * Valida la compra aprobada, actualiza el metadata del usuario y establece la
 * siguiente fecha de facturación para mantener el acceso mensual.
 */
export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const { transactionId, reference }: ConfirmSubscriptionPayload =
      await request.json().catch(() => ({}));

    if (!transactionId) {
      return jsonResponse({ message: "transactionId es obligatorio" }, 400);
    }

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

    const { apiUrl, privateKey, expectedAmount, expectedCurrency } =
      getConfig();
    const transaction = await fetchTransaction(
      apiUrl,
      privateKey,
      transactionId
    );

    if (!transaction) {
      return jsonResponse({ message: "Transacción no encontrada" }, 404);
    }

    if (transaction.amount_in_cents !== expectedAmount) {
      return jsonResponse(
        { message: "Monto de la transacción inesperado" },
        400
      );
    }

    if (transaction.currency !== expectedCurrency) {
      return jsonResponse(
        { message: "Moneda de la transacción inesperada" },
        400
      );
    }

    if (reference && transaction.reference !== reference) {
      return jsonResponse({ message: "Referencia no coincide" }, 400);
    }

    if (transaction.status !== "APPROVED") {
      return jsonResponse(
        {
          message: "La transacción no está aprobada",
          status: transaction.status,
        },
        409
      );
    }

    const now = new Date();
    const nextBillingDate = new Date(now);
    nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);

    const { error: updateError } = await supabase.auth.updateUser({
      data: {
        is_premium: true,
        premium_since: now.toISOString(),
        premium_active_until: nextBillingDate.toISOString(),
        premium_cancelled_at: null,
        premium_status: "active",
        premium_provider: "wompi",
        premium_transaction_id: transaction.id,
        premium_reference: transaction.reference,
        premium_payment_method: transaction.payment_method_type,
      },
    });

    if (updateError) {
      console.error("Supabase update error", updateError);
      return jsonResponse(
        { message: "No se pudo actualizar el estado de la suscripción" },
        500
      );
    }

    return jsonResponse({ message: "Suscripción activada" });
  } catch (err) {
    console.error("Error confirming subscription", err);
    return jsonResponse(
      { message: "No fue posible validar la transacción" },
      500
    );
  }
};
