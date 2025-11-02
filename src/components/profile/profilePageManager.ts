/**
 * Orquesta las interacciones de la página de perfil relacionadas con sesiones,
 * pagos recurrentes Wompi y lógica de cancelación. Mantiene referencias a la
 * librería de pagos para evitar cargas duplicadas y centraliza los toasts de UI.
 */
// Lógica para manejar las interacciones de la página de perfil
type CheckoutPayload = {
  publicKey: string;
  amountInCents: number;
  currency: string;
  planName: string;
  reference: string;
  redirectUrl: string;
  signature: {
    integrity: string;
  };
  sessionId?: string | null;
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
};

type CheckoutResult = {
  transaction?: {
    id: string;
    status: string;
    reference?: string;
  };
};

export class ProfilePageManager {
  private wompiScriptPromise: Promise<void> | null = null;
  private wompiSessionPromise: Promise<string | null> | null = null;
  private wompiSessionId: string | null = null;

  constructor() {
    this.init();
  }

  init() {
    if (typeof window !== "undefined") {
      document.addEventListener("DOMContentLoaded", () => {
        this.setupSignOutFunctionality();
        this.setupPremiumUpgrade();
        this.setupSubscriptionCancellation();
        this.setupProfileActions();
      });
    }
  }

  setupSignOutFunctionality() {
    const signoutButton = document.getElementById("signout-button");
    const signoutModal = document.getElementById("signout-modal");
    const confirmButton = document.getElementById("confirm-signout");
    const cancelButton = document.getElementById("cancel-signout");

    if (signoutButton && signoutModal) {
      // Show modal when signout button is clicked
      signoutButton.addEventListener("click", () => {
        signoutModal.classList.remove("hidden");
        signoutModal.classList.add("flex");
      });

      // Hide modal when cancel button is clicked
      cancelButton?.addEventListener("click", () => {
        signoutModal.classList.add("hidden");
        signoutModal.classList.remove("flex");
      });

      // Hide modal when clicking outside
      signoutModal.addEventListener("click", (e) => {
        if (e.target === signoutModal) {
          signoutModal.classList.add("hidden");
          signoutModal.classList.remove("flex");
        }
      });

      // Confirm signout
      confirmButton?.addEventListener("click", async () => {
        try {
          const { default: SignOutService } = await import(
            "../services/signout"
          );
          SignOutService();
        } catch (error) {
          console.error("Error during signout:", error);
          // Still redirect even if there's an error
          window.location.href = "/";
        }
      });

      // Handle ESC key to close modal
      document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && !signoutModal.classList.contains("hidden")) {
          signoutModal.classList.add("hidden");
          signoutModal.classList.remove("flex");
        }
      });
    }
  }

  /**
   * Configura el botón de upgrade premium y maneja el flujo de checkout
   * incluyendo la preparación de la sesión Wompi y el callback del widget.
   */
  setupPremiumUpgrade() {
    const upgradeButton = document.getElementById(
      "wompi-premium-upgrade"
    ) as HTMLButtonElement | null;

    if (!upgradeButton) {
      return;
    }

    const originalText = upgradeButton.textContent || "Actualizar";

    const setButtonState = (options: { disabled?: boolean; text?: string }) => {
      if (typeof options.disabled === "boolean") {
        upgradeButton.disabled = options.disabled;
      }

      if (options.text) {
        upgradeButton.textContent = options.text;
      } else {
        upgradeButton.textContent = originalText;
      }
    };

    const handleError = (message: string) => {
      console.error(message);
      this.showToast(message, "error");
      setButtonState({ disabled: false, text: originalText });
    };

    void this.initializeWompiSession();

    upgradeButton.addEventListener("click", async () => {
      if (upgradeButton.disabled) {
        return;
      }

      try {
        setButtonState({ disabled: true, text: "Preparando pago..." });

        const sessionId = await this.initializeWompiSession();

        const configResponse = await fetch(
          "/api/payments/create-subscription-session",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ sessionId }),
          }
        );

        if (!configResponse.ok) {
          const errorBody = await configResponse.json().catch(() => ({}));
          throw new Error(
            errorBody?.message || "No fue posible iniciar el pago"
          );
        }

        const checkoutConfig = (await configResponse.json()) as CheckoutPayload;

        await this.loadWompiScript();

        const WidgetCheckoutCtor = window.WidgetCheckout;

        if (!WidgetCheckoutCtor) {
          throw new Error(
            "La librería de pagos de Wompi no se cargó correctamente."
          );
        }

        const checkout = new WidgetCheckoutCtor({
          currency: checkoutConfig.currency,
          amountInCents: checkoutConfig.amountInCents,
          reference: checkoutConfig.reference,
          publicKey: checkoutConfig.publicKey,
          redirectUrl: checkoutConfig.redirectUrl,
          signature: checkoutConfig.signature,
          customerData: checkoutConfig.customerData,
          collect: checkoutConfig.collect,
          products: [
            {
              name: checkoutConfig.planName,
              quantity: 1,
            },
          ],
        });

        checkout.open(async (result: CheckoutResult) => {
          const transaction = result?.transaction;

          if (!transaction) {
            this.showToast(
              "Cerraste el proceso de pago antes de completarlo.",
              "info"
            );
            setButtonState({ disabled: false });
            return;
          }

          if (transaction.status === "APPROVED") {
            const confirmed = await this.confirmPremiumUpgrade(
              transaction.id,
              checkoutConfig.reference
            );

            if (!confirmed) {
              setButtonState({ disabled: false });
            }
            return;
          }

          if (transaction.status === "PENDING") {
            this.showToast(
              "Tu pago está pendiente de confirmación. Te avisaremos cuando se complete.",
              "warning"
            );
          } else {
            this.showToast(
              "El pago no fue aprobado. Por favor intenta nuevamente.",
              "error"
            );
          }

          setButtonState({ disabled: false });
        });
      } catch (error) {
        console.error("Error iniciando el pago", error);
        handleError(
          error instanceof Error
            ? error.message
            : "No fue posible iniciar el pago. Intenta más tarde."
        );
      }
    });
  }

  /**
   * Muestra toasts placeholder para acciones que aún no están implementadas.
   */
  setupProfileActions() {
    // Ejemplo de uso de notificaciones para acciones del perfil
    const configButtons = document.querySelectorAll("[data-action]");
    configButtons.forEach((button) => {
      button.addEventListener("click", (e) => {
        const action = (e.target as Element).closest("button")?.dataset.action;
        switch (action) {
          case "edit-profile":
            this.showToast("Función de editar perfil próximamente", "info");
            break;
          case "notifications":
            this.showToast(
              "Configuración de notificaciones próximamente",
              "info"
            );
            break;
          case "privacy":
            this.showToast("Configuración de privacidad próximamente", "info");
            break;
          case "help":
            this.showToast("Redirigiendo al centro de ayuda...", "info");
            break;
          case "contact":
            this.showToast("Abriendo formulario de contacto...", "info");
            break;
        }
      });
    });
  }

  /**
   * Muestra un modal de confirmación y coordina la cancelación diferida de la
   * suscripción para que permanezca activa hasta la fecha pagada.
   */
  setupSubscriptionCancellation() {
    const cancelButton = document.getElementById(
      "cancel-subscription-button"
    ) as HTMLButtonElement | null;
    const modal = document.getElementById("cancel-subscription-modal");
    const confirmButton = document.getElementById(
      "confirm-cancel-subscription"
    ) as HTMLButtonElement | null;
    const dismissButton = document.getElementById(
      "dismiss-cancel-subscription"
    ) as HTMLButtonElement | null;
    const closeIconButton = document.getElementById(
      "cancel-cancel-subscription"
    ) as HTMLButtonElement | null;

    if (!cancelButton || !modal || !confirmButton || !dismissButton) {
      return;
    }

    const closeModal = () => {
      modal.classList.add("hidden");
      modal.classList.remove("flex");
    };

    const openModal = () => {
      modal.classList.remove("hidden");
      modal.classList.add("flex");
    };

    cancelButton.addEventListener("click", () => {
      openModal();
    });

    dismissButton.addEventListener("click", () => {
      closeModal();
    });

    closeIconButton?.addEventListener("click", () => {
      closeModal();
    });

    modal.addEventListener("click", (event) => {
      if (event.target === modal) {
        closeModal();
      }
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !modal.classList.contains("hidden")) {
        closeModal();
      }
    });

    confirmButton.addEventListener("click", async () => {
      if (confirmButton.disabled) {
        return;
      }

      const originalText = confirmButton.textContent || "Sí, cancelar plan";
      confirmButton.disabled = true;
      confirmButton.textContent = "Cancelando...";

      try {
        const response = await fetch("/api/payments/cancel-subscription", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        });

        const payload = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(
            payload?.message || "No se pudo cancelar la suscripción."
          );
        }

        const activeUntilText = (() => {
          const activeUntilIso = payload?.activeUntil as string | undefined;
          if (!activeUntilIso) {
            return null;
          }

          const activeUntil = new Date(activeUntilIso);
          if (Number.isNaN(activeUntil.getTime())) {
            return null;
          }

          return new Intl.DateTimeFormat("es-ES", {
            year: "numeric",
            month: "long",
            day: "numeric",
          }).format(activeUntil);
        })();

        this.showToast(
          activeUntilText
            ? `Tu plan seguirá activo hasta el ${activeUntilText}.`
            : payload?.message ||
                "Tu suscripción se canceló al finalizar el periodo.",
          "info"
        );

        closeModal();

        setTimeout(() => {
          window.location.reload();
        }, 1600);
      } catch (error) {
        console.error("Error cancelling subscription", error);
        this.showToast(
          error instanceof Error
            ? error.message
            : "No se pudo cancelar la suscripción. Intenta nuevamente.",
          "error"
        );
      } finally {
        confirmButton.disabled = false;
        confirmButton.textContent = originalText;
      }
    });
  }

  // Función para mostrar notificaciones toast
  showToast(message: string | null, type: string = "info") {
    const toast = document.createElement("div");
    toast.className = `fixed top-4 right-4 z-50 max-w-sm p-4 rounded-lg shadow-lg transform transition-all duration-300 translate-x-full`;

    const bgColor =
      type === "success"
        ? "bg-green-500"
        : type === "error"
          ? "bg-red-500"
          : type === "warning"
            ? "bg-yellow-500"
            : "bg-blue-500";

    toast.className += ` ${bgColor} text-white`;
    toast.textContent = message;

    document.body.appendChild(toast);

    // Animar entrada
    setTimeout(() => {
      toast.classList.remove("translate-x-full");
    }, 100);

    // Remover después de 3 segundos
    setTimeout(() => {
      toast.classList.add("translate-x-full");
      setTimeout(() => {
        document.body.removeChild(toast);
      }, 300);
    }, 3000);
  }

  /**
   * Carga perezosamente el script de Wompi y reutiliza la misma promesa en
   * visitas repetidas para evitar insertar múltiples etiquetas script.
   */
  private loadWompiScript() {
    if (typeof window === "undefined") {
      return Promise.reject(
        new Error("La librería de pagos solo está disponible en el navegador.")
      );
    }

    if (window.WidgetCheckout) {
      return Promise.resolve();
    }

    if (!this.wompiScriptPromise) {
      this.wompiScriptPromise = new Promise<void>((resolve, reject) => {
        const existingScript = document.querySelector<HTMLScriptElement>(
          "script[data-wompi-widget]"
        );

        if (existingScript) {
          if (
            existingScript.dataset.loaded === "true" &&
            window.WidgetCheckout
          ) {
            resolve();
            return;
          }

          existingScript.addEventListener("load", () => {
            window.WidgetCheckout
              ? resolve()
              : reject(
                  new Error(
                    "No fue posible inicializar la librería de Wompi (WidgetCheckout)."
                  )
                );
          });

          existingScript.addEventListener("error", () => {
            reject(new Error("Error cargando la librería de pagos de Wompi."));
          });
          if (
            existingScript.dataset.loaded === "true" &&
            !window.WidgetCheckout
          ) {
            reject(
              new Error(
                "No fue posible inicializar la librería de Wompi (WidgetCheckout)."
              )
            );
          }

          return;
        }

        const script = document.createElement("script");
        script.src = "https://checkout.wompi.co/widget.js";
        script.async = true;
        script.dataset.wompiWidget = "true";
        script.onload = () => {
          script.dataset.loaded = "true";
          window.WidgetCheckout
            ? resolve()
            : reject(
                new Error(
                  "No fue posible inicializar la librería de Wompi (WidgetCheckout)."
                )
              );
        };
        script.onerror = () => {
          reject(new Error("Error cargando la librería de pagos de Wompi."));
        };

        document.head.appendChild(script);
      });
    }

    return this.wompiScriptPromise;
  }

  /**
   * Inicializa una sesión de WidgetCheckout una sola vez y reintenta cuando el
   * objeto global $wompi todavía no está listo.
   */
  private initializeWompiSession(): Promise<string | null> {
    if (typeof window === "undefined") {
      return Promise.resolve(null);
    }

    if (this.wompiSessionId) {
      return Promise.resolve(this.wompiSessionId);
    }

    if (this.wompiSessionPromise) {
      return this.wompiSessionPromise;
    }

    this.wompiSessionPromise = new Promise<string | null>((resolve) => {
      const finalize = (value: string | null) => {
        if (value) {
          this.wompiSessionId = value;
        } else {
          setTimeout(() => {
            this.wompiSessionPromise = null;
          }, 0);
        }

        resolve(value);
      };

      const attemptInitialize = (retries: number) => {
        const wompi = window.$wompi;

        if (!wompi || typeof wompi.initialize !== "function") {
          if (retries > 0) {
            setTimeout(() => attemptInitialize(retries - 1), 300);
          } else {
            finalize(null);
          }
          return;
        }

        try {
          wompi.initialize((data, error) => {
            if (!error && data?.sessionId) {
              finalize(data.sessionId);
            } else {
              if (error) {
                console.warn(
                  "No se pudo obtener el sessionId de Wompi:",
                  error
                );
              }
              finalize(null);
            }
          });
        } catch (err) {
          console.error("Error inicializando la librería Wompi JS", err);
          finalize(null);
        }
      };

      attemptInitialize(5);
    });

    return this.wompiSessionPromise;
  }

  /**
   * Valida la transacción aprobada contra el backend y refresca la página para
   * reflejar el nuevo estado premium del usuario.
   */
  private async confirmPremiumUpgrade(
    transactionId: string,
    reference: string
  ): Promise<boolean> {
    try {
      const response = await fetch("/api/payments/confirm-subscription", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ transactionId, reference }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(
          payload?.message || "No se pudo validar el pago con el servidor"
        );
      }

      this.showToast("¡Tu suscripción Premium está activa!", "success");

      setTimeout(() => {
        window.location.reload();
      }, 1500);
      return true;
    } catch (error) {
      console.error("Error confirmando suscripción", error);
      this.showToast(
        error instanceof Error
          ? error.message
          : "No se pudo confirmar el pago. Contáctanos si el cargo fue realizado.",
        "error"
      );
      return false;
    }
  }
}

// Inicializar cuando se carga el módulo
new ProfilePageManager();
