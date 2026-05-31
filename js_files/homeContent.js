// js_files/homeContent.js

document.addEventListener("DOMContentLoaded", async () => {
    await loadHomeServices();
});

function tr(key, params = {}, fallback = '') {
    return window.GucaI18n?.t(key, params, fallback) || fallback || key;
}

function currentLang() {
    return window.GucaI18n?.getLanguage?.() || 'es';
}

function translatedField(item, field) {
    const lang = currentLang();
    if (lang !== 'es') {
        const translated = item[`${field}_${lang}`];
        if (translated !== null && translated !== undefined && String(translated).trim() !== '') {
            return translated;
        }
    }
    return item[field] || '';
}

async function loadHomeServices() {
    const servicesGrid = document.getElementById("servicesGrid");

    if (!servicesGrid) return;

    if (typeof GucaSupabase === "undefined") {
        console.warn("Supabase client not found. Keeping hard-coded services.");
        return;
    }

    const { data, error } = await GucaSupabase
        .from("service_cards")
        .select("pill, title, description, pill_en, title_en, description_en, display_order, is_active")
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

    servicesGrid.innerHTML = data.map((service) => {
        const pill = translatedField(service, 'pill');
        const title = translatedField(service, 'title');
        const description = translatedField(service, 'description');

        return `
        <article
            class="card service-quote-card"
            tabindex="0"
            role="button"
            data-service-title="${escapeAttribute(title)}"
            data-service-pill="${escapeAttribute(pill)}"
        >
            <div class="pill">${escapeHtml(pill)}</div>
            <h3>${escapeHtml(title)}</h3>
            <p>${escapeHtml(description)}</p>

            <span class="service-card-action">
                ${tr("home.services.action", {}, "Solicitar cotización →")}
            </span>
        </article>
    `;
    }).join("");

    window.GucaI18n?.translatePage(document);

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
                message.value = tr('home.services.requestMessage', { service: serviceText }, `Hola, quiero solicitar una cotización para el servicio: ${serviceText}.`);
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