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
        <article class="card">
            <div class="pill">${escapeHtml(service.pill)}</div>
            <h3>${escapeHtml(service.title)}</h3>
            <p>${escapeHtml(service.description)}</p>
        </article>
    `).join("");
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