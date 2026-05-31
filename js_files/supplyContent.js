// js_files/supplyContent.js

document.addEventListener("DOMContentLoaded", async () => {
    await loadSupplyCategories();
});

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

function tr(key, params = {}, fallback = '') {
    return window.GucaI18n?.t(key, params, fallback) || fallback || key;
}

async function loadSupplyCategories() {
    const categoryGrid = document.getElementById("supplyCategoryGrid");

    if (!categoryGrid) return;

    if (typeof GucaSupabase === "undefined") {
        console.warn("Supabase client not found. Keeping hard-coded supply categories.");
        return;
    }

    const { data, error } = await GucaSupabase
        .from("supply_categories")
        .select("slug, name, description, name_en, description_en, icon, display_order, is_active")
        .eq("is_active", true)
        .order("display_order", { ascending: true });

    if (error) {
        console.error("Could not load supply categories:", error);
        return;
    }

    if (!data || data.length === 0) {
        console.warn("No active supply categories found. Keeping hard-coded categories.");
        return;
    }

    categoryGrid.innerHTML = data.map((category) => {
        const name = translatedField(category, 'name');
        const description = translatedField(category, 'description');

        return `
        <button class="supply-category-card" type="button" data-category="${escapeAttribute(category.slug)}">
            <span class="supply-category-icon">
                <i class="fa-solid ${escapeAttribute(category.icon || "fa-box")}"></i>
            </span>
            <strong>${escapeHtml(name)}</strong>
            <small>${escapeHtml(description)}</small>
        </button>
    `;
    }).join("");

    setupDynamicCategoryClicks();
    updateCategoryFilterOptions(data);
    window.GucaI18n?.translatePage(document);
}

function setupDynamicCategoryClicks() {
    const categoryFilter = document.getElementById("categoryFilter");
    const inventorySearch = document.getElementById("inventorySearch");

    document.querySelectorAll(".supply-category-card").forEach((card) => {
        card.addEventListener("click", () => {
            const category = card.dataset.category || "all";

            if (categoryFilter) {
                categoryFilter.value = category;

                categoryFilter.dispatchEvent(new Event("input", { bubbles: true }));
                categoryFilter.dispatchEvent(new Event("change", { bubbles: true }));
            }

            if (inventorySearch) {
                inventorySearch.value = "";
                inventorySearch.dispatchEvent(new Event("input", { bubbles: true }));
            }

            document.getElementById("inventory")?.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });
        });
    });
}

function updateCategoryFilterOptions(categories) {
    const categoryFilter = document.getElementById("categoryFilter");
    if (!categoryFilter) return;

    const currentValue = categoryFilter.value || "all";

    categoryFilter.innerHTML = `
        <option value="all">${tr("supplies.allCategories", {}, "Todas")}</option>
        ${categories.map((category) => `
            <option value="${escapeAttribute(category.slug)}">
                ${escapeHtml(translatedField(category, 'name'))}
            </option>
        `).join("")}
    `;

    const stillExists = categories.some((category) => category.slug === currentValue);

    categoryFilter.value = stillExists ? currentValue : "all";

    categoryFilter.dispatchEvent(new Event("change", { bubbles: true }));
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