// js_files/suministros.js

document.addEventListener("DOMContentLoaded", async () => {
    const mobileMenuToggle = document.querySelector(".mobile-menu-toggle");
    const navBar = document.querySelector(".nav-bar");

    if (mobileMenuToggle && navBar) {
        mobileMenuToggle.addEventListener("click", () => {
            navBar.classList.toggle("nav-open");

            const isOpen = navBar.classList.contains("nav-open");

            mobileMenuToggle.innerHTML = isOpen
                ? '<i class="fa-solid fa-xmark"></i><span>Cerrar</span>'
                : '<i class="fa-solid fa-bars"></i><span>Menú</span>';
        });

        document.querySelectorAll(".nav-bar nav a").forEach((link) => {
            link.addEventListener("click", () => {
                navBar.classList.remove("nav-open");
                mobileMenuToggle.innerHTML = '<i class="fa-solid fa-bars"></i><span>Menú</span>';
            });
        });
    }
    let inventory = [];

    const INITIAL_VISIBLE_PRODUCTS = 9;
    let visibleProductCount = INITIAL_VISIBLE_PRODUCTS;
    let inventoryExpanded = false;
    let categoryLabels = {};

    const inventoryGrid = document.getElementById("inventoryGrid");
    const inventorySearch = document.getElementById("inventorySearch");
    const categoryFilter = document.getElementById("categoryFilter");
    const typeFilter = document.getElementById("typeFilter");
    const sortInventory = document.getElementById("sortInventory");
    const inventoryStatus = document.getElementById("inventoryStatus");
    const selectedProduct = document.getElementById("selectedProduct");
    const supplyMessage = document.getElementById("supplyMessage");
    const quantity = document.getElementById("quantity");

    const fallbackCategoryLabels = {
        uniformes: "Uniformes",
        alimentos: "Alimentos",
        limpieza: "Artículos de limpieza",
        refacciones: "Refacciones",
        papeleria: "Papelería",
        otros: "Otros"
    };

    const fallbackInventory = [
        { serial:"UNI-001", category:"uniformes", type:"Seguridad", name:"Chaleco reflejante", price:120, unit:"pieza", status:"Cotizable", icon:"fa-vest", description:"Chaleco de alta visibilidad para obra, almacén o brigada." },
        { serial:"UNI-002", category:"uniformes", type:"Seguridad", name:"Casco de seguridad", price:180, unit:"pieza", status:"Cotizable", icon:"fa-hard-hat", description:"Casco para protección básica en zona de trabajo." },
        { serial:"ALI-001", category:"alimentos", type:"Bebidas", name:"Agua embotellada 600 ml", price:9, unit:"pieza", status:"Cotizable", icon:"fa-bottle-water", description:"Agua para oficina, obra, reuniones o eventos." },
        { serial:"LIM-001", category:"limpieza", type:"Químicos", name:"Desinfectante multiusos", price:65, unit:"litro", status:"Cotizable", icon:"fa-spray-can-sparkles", description:"Producto para limpieza general de superficies." },
        { serial:"OTR-001", category:"otros", type:"Especial", name:"Solicitud especial de suministros", price:null, unit:"cotización", status:"A cotizar", icon:"fa-boxes-stacked", description:"Usa este folio cuando necesitas algo que no aparece en la lista." }
    ];

    const money = value =>
        typeof value === "number"
            ? value.toLocaleString("es-MX", { style: "currency", currency: "MXN" })
            : "A cotizar";

    const normalize = value =>
        String(value || "")
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "");

    const escapeHtml = value => {
        if (value === null || value === undefined) return "";

        return String(value)
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");
    };

    async function loadInventoryFromSupabase() {
        categoryLabels = { ...fallbackCategoryLabels };

        if (typeof GucaSupabase === "undefined") {
            console.warn("Supabase client not found. Using fallback inventory.");
            inventory = fallbackInventory;
            return;
        }

        const { data: categories, error: categoriesError } = await GucaSupabase
            .from("supply_categories")
            .select("slug, name, is_active")
            .eq("is_active", true)
            .order("display_order", { ascending: true });

        if (!categoriesError && categories) {
            categoryLabels = {};

            categories.forEach(category => {
                categoryLabels[category.slug] = category.name;
            });
        }

        const { data, error } = await GucaSupabase
            .from("inventory_items")
            .select("serial, category_slug, type, name, price, unit, status, icon, image_url, description, is_active")
            .eq("is_active", true)
            .order("serial", { ascending: true });

        if (error) {
            console.error("Could not load inventory:", error);
            inventory = fallbackInventory;
            categoryLabels = { ...fallbackCategoryLabels };
            return;
        }

        inventory = data.map(item => ({
            serial: item.serial,
            category: item.category_slug,
            type: item.type || "General",
            name: item.name,
            price: item.price === null ? null : Number(item.price),
            unit: item.unit || "pieza",
            status: item.status || "Cotizable",
            icon: item.icon || "fa-box",
            imageUrl: item.image_url || "",
            description: item.description || ""
        }));
    }

    const updateTypeFilter = () => {
        if (!typeFilter || !categoryFilter) return;

        const selectedCategory = categoryFilter.value;

        const types = [
            ...new Set(
                inventory
                    .filter(item => selectedCategory === "all" || item.category === selectedCategory)
                    .map(item => item.type)
            )
        ].sort((a, b) => a.localeCompare(b, "es"));

        const current = typeFilter.value;

        typeFilter.innerHTML =
            '<option value="all">Todos</option>' +
            types.map(type => `<option value="${escapeHtml(type)}">${escapeHtml(type)}</option>`).join("");

        if (types.includes(current)) {
            typeFilter.value = current;
        }
    };


    const getFilteredInventory = () => {
        const query = normalize(inventorySearch?.value || "");
        const selectedCategory = categoryFilter?.value || "all";
        const selectedType = typeFilter?.value || "all";
        const sortMode = sortInventory?.value || "featured";

        let result = inventory.filter(item => {
            const matchesCategory = selectedCategory === "all" || item.category === selectedCategory;
            const matchesType = selectedType === "all" || item.type === selectedType;

            const searchText = normalize(
                `${item.serial} ${item.name} ${categoryLabels[item.category] || item.category} ${item.type} ${item.description}`
            );

            return matchesCategory && matchesType && (!query || searchText.includes(query));
        });

        result = [...result].sort((a, b) => {
            if (sortMode === "price-asc") return (a.price ?? Number.MAX_SAFE_INTEGER) - (b.price ?? Number.MAX_SAFE_INTEGER);
            if (sortMode === "price-desc") return (b.price ?? -1) - (a.price ?? -1);
            if (sortMode === "name-asc") return a.name.localeCompare(b.name, "es");
            if (sortMode === "name-desc") return b.name.localeCompare(a.name, "es");
            if (sortMode === "category-asc") {
                return (categoryLabels[a.category] || a.category).localeCompare(categoryLabels[b.category] || b.category, "es") || a.name.localeCompare(b.name, "es");
            }
            if (sortMode === "type-asc") return a.type.localeCompare(b.type, "es") || a.name.localeCompare(b.name, "es");
            if (sortMode === "serial-asc") return a.serial.localeCompare(b.serial, "es");

            return inventory.indexOf(a) - inventory.indexOf(b);
        });

        return result;
    };

    const createInventoryCard = item => {
        const article = document.createElement("article");
        article.className = "card inventory-card";

        const categoryName = categoryLabels[item.category] || item.category;

        article.innerHTML = `
            <div class="inventory-card-top">
                    ${item.imageUrl
                ? `<span class="inventory-image-wrap">
                <img src="${escapeHtml(item.imageUrl)}" alt="${escapeHtml(item.name)}" class="inventory-image" />
                   </span>`
                        : `<span class="inventory-icon">
                        <i class="fa-solid ${escapeHtml(item.icon)}"></i>
                   </span>`
            }

            <div class="pill">${escapeHtml(categoryName)}</div>

            <h3>${escapeHtml(item.name)}</h3>
            <p>${escapeHtml(item.description)}</p>

            <ul class="project-meta-list inventory-meta-list">
                <li><strong>Tipo:</strong> ${escapeHtml(item.type)}</li>
                <li><strong>Precio ref.:</strong> ${money(item.price)} / ${escapeHtml(item.unit)}</li>
                <li><strong>Estado:</strong> ${escapeHtml(item.status)}</li>
            </ul>

            <button type="button" class="btn btn-primary inventory-quote-btn" data-serial="${escapeHtml(item.serial)}">
                Cotizar este producto
            </button>
        `;

        article.querySelector(".inventory-quote-btn").addEventListener("click", () => {
            const label = `${item.serial} | ${item.name} | ${categoryName} | ${money(item.price)} / ${item.unit}`;

            if (selectedProduct) selectedProduct.value = label;
            if (quantity && !quantity.value) quantity.value = 1;

            if (supplyMessage && !supplyMessage.value.trim()) {
                supplyMessage.value = `Hola, quiero cotizar el producto ${item.serial} - ${item.name}. Cantidad estimada: `;
            }

            document.getElementById("supply-contact")?.scrollIntoView({ behavior: "smooth" });
        });

        return article;
    };

    const renderInventory = () => {
        if (!inventoryGrid) return;

        const items = getFilteredInventory();

        const totalItems = items.length;
        const visibleItems = inventoryExpanded
            ? items
            : items.slice(0, visibleProductCount);

        inventoryGrid.innerHTML = "";

        if (inventoryStatus) {
            inventoryStatus.textContent = `Mostrando ${visibleItems.length} de ${totalItems} productos.`;
        }

        if (!items.length) {
            inventoryGrid.innerHTML = `
            <div class="card empty-inventory-card">
                <h3>No encontramos productos con ese filtro</h3>
                <p>Prueba otra palabra o usa la categoría “Todas”.</p>
            </div>
        `;

            const loadMoreBtn = document.getElementById("inventoryLoadMoreBtn");
            if (loadMoreBtn) loadMoreBtn.style.display = "none";

            return;
        }

        visibleItems.forEach(item => inventoryGrid.appendChild(createInventoryCard(item)));

        const loadMoreBtn = document.getElementById("inventoryLoadMoreBtn");

        if (loadMoreBtn) {
            if (totalItems <= INITIAL_VISIBLE_PRODUCTS) {
                loadMoreBtn.style.display = "none";
            } else {
                loadMoreBtn.style.display = "inline-flex";
                loadMoreBtn.textContent = inventoryExpanded
                    ? "Ver menos"
                    : "Ver más productos";
            }
        }
    };

    const scrollAndFocus = (targetId, focusEl) => {
        document.getElementById(targetId)?.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });

        window.setTimeout(() => {
            if (!focusEl) return;

            focusEl.focus({ preventScroll: true });
            focusEl.classList.add("supply-focus-pulse");

            window.setTimeout(() => {
                focusEl.classList.remove("supply-focus-pulse");
            }, 1400);
        }, 450);
    };

    document.querySelectorAll("[data-supply-action]").forEach(button => {
        button.addEventListener("click", () => {
            const action = button.dataset.supplyAction;

            if (action === "search") {
                scrollAndFocus("inventory", inventorySearch);
                return;
            }

            if (action === "sort") {
                scrollAndFocus("inventory", sortInventory);

                if (sortInventory && sortInventory.value === "featured") {
                    sortInventory.value = "price-asc";
                    renderInventory();
                }

                return;
            }

            if (action === "quote") {
                scrollAndFocus("supply-contact", selectedProduct || document.getElementById("supplyName"));
            }
        });
    });

    document.querySelectorAll(".supply-category-card").forEach(card => {
        card.addEventListener("click", () => {
            if (categoryFilter) categoryFilter.value = card.dataset.category || "all";
            if (inventorySearch) inventorySearch.value = "";

            updateTypeFilter();
            renderInventory();

            document.getElementById("inventory")?.scrollIntoView({ behavior: "smooth" });
        });
    });

    [inventorySearch, categoryFilter, typeFilter, sortInventory].forEach(control => {
        if (!control) return;

        control.addEventListener("input", () => {
            if (control === categoryFilter) updateTypeFilter();
            renderInventory();
        });

        control.addEventListener("change", () => {
            if (control === categoryFilter) updateTypeFilter();
            renderInventory();
        });
    });

    const form = document.getElementById("supply-form");
    const inventoryLoadMoreBtn = document.getElementById("inventoryLoadMoreBtn");

    if (inventoryLoadMoreBtn) {
        inventoryLoadMoreBtn.addEventListener("click", () => {
            const wasExpanded = inventoryExpanded;

            inventoryExpanded = !inventoryExpanded;
            visibleProductCount = inventoryExpanded
                ? inventory.length
                : INITIAL_VISIBLE_PRODUCTS;

            renderInventory();

            if (wasExpanded) {
                document.getElementById("inventory")?.scrollIntoView({
                    behavior: "smooth",
                    block: "start"
                });
            }
        });
    }
    const formMsg = document.getElementById("supplyFormMsg");

    if (form && formMsg) {
        form.addEventListener("submit", event => {
            const data = new FormData(form);

            const name = String(data.get("name") || "").trim();
            const email = String(data.get("email") || "").trim();
            const phone = String(data.get("phone") || "").trim();
            const message = String(data.get("message") || "").trim();

            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

            if (!name || !email || !phone || !message) {
                event.preventDefault();
                formMsg.textContent = "Por favor completa los campos obligatorios.";
                formMsg.className = "msg error";
                return;
            }

            if (!emailRegex.test(email)) {
                event.preventDefault();
                formMsg.textContent = "Escribe un correo electrónico válido.";
                formMsg.className = "msg error";
                return;
            }

            formMsg.textContent = "Enviando solicitud...";
            formMsg.className = "msg";

            if (typeof GucaSupabase !== "undefined") {
                event.preventDefault();

                const requestPayload = {
                    name,
                    email,
                    phone,
                    selected_product: String(data.get("selectedProduct") || "").trim(),
                    quantity: data.get("quantity")
                        ? Number(data.get("quantity"))
                        : null,
                    delivery_area: String(data.get("deliveryArea") || "").trim(),
                    message,
                    status: "Nueva"
                };

                const netlifyPayload = new URLSearchParams(new FormData(form));

                netlifyPayload.set("form-name", "suministros");
                netlifyPayload.set("name", name);
                netlifyPayload.set("email", email);
                netlifyPayload.set("phone", phone);
                netlifyPayload.set("selectedProduct", requestPayload.selected_product || "");
                netlifyPayload.set("quantity", requestPayload.quantity || "");
                netlifyPayload.set("deliveryArea", requestPayload.delivery_area || "");
                netlifyPayload.set("message", message);

                Promise.all([
                    GucaSupabase
                        .from("supply_requests")
                        .insert(requestPayload),

                    fetch(window.location.pathname, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/x-www-form-urlencoded"
                        },
                        body: netlifyPayload.toString()
                    })
                ])
                    .then(([supabaseResult, netlifyResult]) => {
                        if (supabaseResult.error) {
                            console.error(supabaseResult.error);
                            formMsg.textContent = "No se pudo guardar la solicitud. Intenta de nuevo.";
                            formMsg.className = "msg error";
                            return;
                        }

                        if (!netlifyResult.ok) {
                            console.warn("La solicitud se guardó en Supabase, pero Netlify no recibió el formulario.");
                        }

                        window.location.href = "suministros-exito.html";
                    })
                    .catch((error) => {
                        console.error(error);
                        formMsg.textContent = "No se pudo enviar la solicitud. Intenta de nuevo.";
                        formMsg.className = "msg error";
                    });
            }
        });
    }

    const yearSpan = document.getElementById("year");
    if (yearSpan) yearSpan.textContent = new Date().getFullYear().toString();

    const toggleBtn = document.getElementById("theme-toggle");

    if (toggleBtn) {
        const currentTheme = localStorage.getItem("theme") || "light";

        document.documentElement.setAttribute("data-theme", currentTheme);
        toggleBtn.textContent = currentTheme === "dark" ? "☀️" : "🌙";

        toggleBtn.addEventListener("click", () => {
            const isDark = document.documentElement.getAttribute("data-theme") === "dark";
            const newTheme = isDark ? "light" : "dark";

            document.documentElement.setAttribute("data-theme", newTheme);
            localStorage.setItem("theme", newTheme);
            toggleBtn.textContent = newTheme === "dark" ? "☀️" : "🌙";
        });
    }

    const toastEl = document.getElementById("copyToast");
    let toastTimeoutId = null;

    const showToast = message => {
        if (!toastEl) return;

        toastEl.textContent = message;
        toastEl.classList.add("show");

        clearTimeout(toastTimeoutId);

        toastTimeoutId = setTimeout(() => {
            toastEl.classList.remove("show");
        }, 1500);
    };

    const supplyEmail = "guca.construcciones.qro@gmail.com";
    const copySupplyEmailBtn = document.getElementById("copySupplyEmailBtn");
    const supplyEmailLink = document.getElementById("supplyEmailLink");

    const copyEmail = event => {
        event.preventDefault();

        navigator.clipboard
            .writeText(supplyEmail)
            .then(() => showToast("Correo de suministros copiado"))
            .catch(() => showToast("No se pudo copiar el correo"));
    };

    if (copySupplyEmailBtn) copySupplyEmailBtn.addEventListener("click", copyEmail);
    if (supplyEmailLink) supplyEmailLink.addEventListener("click", copyEmail);

    const backTopBtn = document.querySelector(".back-top-btn");

    if (backTopBtn) {
        backTopBtn.addEventListener("click", () => {
            window.scrollTo({ top: 0, behavior: "smooth" });
        });
    }

    await loadInventoryFromSupabase();

    updateTypeFilter();
    inventoryExpanded = false;
    visibleProductCount = INITIAL_VISIBLE_PRODUCTS;
    renderInventory();

});