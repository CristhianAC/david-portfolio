// Lógica para manejar las interacciones de la página de perfil
export class ProfilePageManager {
  constructor() {
    this.init();
  }

  init() {
    if (typeof window !== "undefined") {
      document.addEventListener("DOMContentLoaded", () => {
        this.setupSignOutFunctionality();
        this.setupPremiumUpgrade();
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

  setupPremiumUpgrade() {
    const upgradeButton = document.getElementById("upgrade-button");

    if (upgradeButton) {
      upgradeButton.addEventListener("click", () => {
        // Aquí puedes integrar con tu pasarela de pagos preferida
        // Por ejemplo: Stripe, PayPal, etc.

        // Ejemplo con Stripe (necesitarías configurar Stripe)
        // window.location.href = "/api/create-checkout-session";

        // Por ahora, mostramos un alert como placeholder
        alert(
          "Funcionalidad de pago en desarrollo. Pronto podrás actualizar a Premium!"
        );

        // También podrías abrir un modal de pago personalizado
        // this.openPaymentModal();
      });
    }
  }

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
}

// Inicializar cuando se carga el módulo
new ProfilePageManager();
