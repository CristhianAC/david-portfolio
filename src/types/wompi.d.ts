export interface WompiCheckoutOptions {
  currency: string;
  amountInCents: number;
  reference: string;
  publicKey: string;
  redirectUrl?: string;
  signature?: {
    integrity: string;
  };
  customerData?: {
    email?: string | null;
    fullName?: string | null;
    phoneNumber?: string | null;
    legalId?: string | null;
  };
  collect?: {
    document?: boolean;
    phoneNumber?: boolean;
    email?: boolean;
    fullName?: boolean;
  };
  products?: Array<{
    name: string;
    quantity: number;
    priceInCents?: number;
  }>;
}

export interface WompiCheckoutResult {
  transaction?: {
    id: string;
    status: string;
    reference?: string;
  };
}

export interface WompiCheckoutInstance {
  open(callback?: (result: WompiCheckoutResult) => void): void;
}

export interface WompiInitializeResult {
  sessionId?: string;
}

declare global {
  interface Window {
    WidgetCheckout?: new (
      options: WompiCheckoutOptions
    ) => WompiCheckoutInstance;
    $wompi?: {
      initialize(
        callback: (
          data: WompiInitializeResult,
          error: { error: string } | null
        ) => void
      ): void;
    };
  }
}

export {};
