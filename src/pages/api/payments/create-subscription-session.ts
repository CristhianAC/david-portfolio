export const prerender = false;

import type { APIRoute } from "astro";
import { createHash, randomUUID } from "node:crypto";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
    },
  });

const getCheckoutConfig = () => {
  const publicKey =
    import.meta.env.WOMPI_PUBLIC_KEY || import.meta.env.PUBLIC_WOMPI_PUBLIC_KEY;
  const integrityKey = import.meta.env.WOMPI_INTEGRITY_KEY;
  const amountInCents = Number(
    import.meta.env.WOMPI_SUBSCRIPTION_AMOUNT_IN_CENTS || "99900"
  );
  const currency = import.meta.env.WOMPI_SUBSCRIPTION_CURRENCY || "COP";
  const planName =
    import.meta.env.WOMPI_SUBSCRIPTION_NAME || "Suscripción Premium";

  if (!publicKey || !integrityKey) {
    throw new Error(
      "WOMPI_PUBLIC_KEY and WOMPI_INTEGRITY_KEY environment variables are required."
    );
  }

  if (!Number.isFinite(amountInCents) || amountInCents <= 0) {
    throw new Error(
      "WOMPI_SUBSCRIPTION_AMOUNT_IN_CENTS must be a positive number in cents."
    );
  }

  return {
    publicKey,
    integrityKey,
    amountInCents,
    currency,
    planName,
  } as const;
};

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const payload = (await request.json().catch(() => ({}))) as {
      sessionId?: string | null;
    };
    const sessionId =
      typeof payload.sessionId === "string" &&
      payload.sessionId.trim().length > 0
        ? payload.sessionId.trim()
        : undefined;

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

    const { publicKey, integrityKey, amountInCents, currency, planName } =
      getCheckoutConfig();

    const reference = `SUB-${Date.now()}-${randomUUID().split("-")[0]}`;
    const signature = createHash("sha256")
      .update(`${reference}${amountInCents}${currency}${integrityKey}`)
      .digest("hex");

    const redirectUrl = new URL("/profile", request.url).toString();

    return jsonResponse({
      publicKey,
      amountInCents,
      currency,
      reference,
      redirectUrl,
      signature: { integrity: signature },
      sessionId: sessionId ?? null,
      customerData: {
        email: data.user.email,
        fullName: data.user.user_metadata?.full_name || undefined,
      },
      collect: {
        document: true,
        phoneNumber: true,
        email: true,
        fullName: true,
      },
      planName,
    });
  } catch (err) {
    console.error("Error creating subscription session", err);
    return jsonResponse(
      { message: "No fue posible iniciar el proceso de pago" },
      500
    );
  }
};
