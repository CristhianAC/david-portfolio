import type { APIRoute } from "astro";
import MercadoPagoConfig from "mercadopago";

const mercadopago = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN as string,
});

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();

    const preference = {
      items: [
        {
          title: body.title ?? "Producto de prueba",
          quantity: body.quantity ?? 1,
          currency_id: "ARS",
          unit_price: body.price ?? 100,
        },
      ],
      back_urls: {
        success: "https://tusitio.com/success",
        failure: "https://tusitio.com/failure",
        pending: "https://tusitio.com/pending",
      },
      auto_return: "approved",
    };

    return new Response(JSON.stringify(""), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
    });
  }
};
