// js_files/homeContent.js

document.addEventListener("DOMContentLoaded", async () => {
    await loadHomeServices();
});

async function loadHomeServices() {
    const servicesGrid = document.getElementById("servicesGrid");

    if (!servicesGrid) return;

    if (typeof GucaSupabase === "undefined") {
        console.warn("Supabase client not found. Keeping hard-coded services.");
        return;
    }

    const { data, error } = await GucaSupabase
        .from("service_cards")
        .select("pill, title, description, display_order, is_active")
        .eq("is_active", true)
        .order("display_order", { ascending: true });

    if (error) {
        console.error("Could not load services:", error);
        return;
    }

    if (!data || data.length === 0) {
        console.warn("No active services found. Keeping hard-coded services.");
        return;
    }

    servicesGrid.innerHTML = data.map((service) => `
        <article
            class="card service-quote-card"
            tabindex="0"
            role="button"
            data-service-title="${escapeAttribute(service.title)}"
            data-service-pill="${escapeAttribute(service.pill)}"
        >
            <div class="pill">${escapeHtml(service.pill)}</div>
            <h3>${escapeHtml(service.title)}</h3>
            <p>${escapeHtml(service.description)}</p>

            <span class="service-card-action">
                Solicitar cotización →
            </span>
        </article>
    `).join("");

    document.querySelectorAll(".service-quote-card").forEach((card) => {
        const handleServiceClick = () => {
            const serviceTitle = card.dataset.serviceTitle || "";
            const servicePill = card.dataset.servicePill || "";

            const projectType = document.getElementById("projectType");
            const message = document.getElementById("message");

            const serviceText = `${servicePill} - ${serviceTitle}`;

            if (projectType) {
                const normalized = serviceText.toLowerCase();

                if (normalized.includes("residencial") || normalized.includes("casa")) {
                    projectType.value = "residential";
                } else if (normalized.includes("comercial") || normalized.includes("local")) {
                    projectType.value = "commercial";
                } else if (normalized.includes("remodel") || normalized.includes("renov")) {
                    projectType.value = "remodeling";
                } else if (normalized.includes("mantenimiento") || normalized.includes("repar")) {
                    projectType.value = "maintenance";
                } else if (normalized.includes("construcción") || normalized.includes("construccion") || normalized.includes("obra")) {
                    projectType.value = "residential";
                } else {
                    projectType.value = "other";
                }
            }

            if (message) {
                message.value = `Hola, quiero solicitar una cotización para el servicio: ${serviceText}.`;
            }

            document.getElementById("contact")?.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });
        };

        card.addEventListener("click", handleServiceClick);

        card.addEventListener("keydown", (event) => {
            if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                handleServiceClick();
            }
        });
    });
}

function escapeHtml(value) {
    if (value === null || value === undefined) return "";

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function escapeAttribute(value) {
    return escapeHtml(value);
}