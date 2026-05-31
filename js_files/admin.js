// js_files/admin.js

document.addEventListener("DOMContentLoaded", async () => {
    const year = document.getElementById("year");
    const adminStatus = document.getElementById("adminStatus");
    const adminContent = document.getElementById("adminContent");
    const logoutBtn = document.getElementById("adminLogoutBtn");

    const panelTitle = document.getElementById("adminPanelTitle");
    const panelDescription = document.getElementById("adminPanelDescription");
    const panelBody = document.getElementById("adminPanelBody");
    const adminStatsGrid = document.getElementById("adminStatsGrid");

    if (year) {
        year.textContent = new Date().getFullYear();
    }

    if (typeof GucaSupabase === "undefined") {
        adminStatus.textContent = "Error: Supabase no cargó. Revisa supabaseClient.js.";
        adminStatus.className = "admin-status error";
        return;
    }

    const { data: sessionData, error: sessionError } = await GucaSupabase.auth.getSession();

    if (sessionError || !sessionData.session) {
        window.location.href = "login.html";
        return;
    }

    const user = sessionData.session.user;

    const { data: profile, error: profileError } = await GucaSupabase
        .from("profiles")
        .select("email, role")
        .eq("id", user.id)
        .single();

    if (profileError || !profile || profile.role !== "admin") {
        adminStatus.textContent = "Acceso denegado. Esta página es solo para administradores.";
        adminStatus.className = "admin-status error";

        setTimeout(() => {
            window.location.href = "index.html";
        }, 1600);

        return;
    }

    adminStatus.textContent = `Acceso autorizado: ${profile.email}`;
    adminStatus.className = "admin-status success";
    adminContent.hidden = false;
    await loadAdminStats();

    if (logoutBtn) {
        logoutBtn.addEventListener("click", async () => {
            await GucaSupabase.auth.signOut();
            window.location.href = "login.html";
        });
    }

    document.querySelectorAll("[data-admin-section]").forEach((button) => {
        button.addEventListener("click", () => {
            const section = button.dataset.adminSection;
            showAdminSection(section);
        });
    });

    async function showAdminSection(section) {

        if (section === "home-images") {
            panelTitle.textContent = "Imágenes de inicio";
            panelDescription.textContent = "Edita las imágenes principales que aparecen en la parte superior de la página de inicio.";

            panelBody.innerHTML = `
        <div class="admin-actions-row">
            <button type="button" class="btn btn-primary" id="addHomeImageBtn">
                Agregar imagen
            </button>
        </div>

        <div id="homeImagesAdminList" class="admin-list">
            Cargando imágenes...
        </div>
        `;

            document
                .getElementById("addHomeImageBtn")
                .addEventListener("click", () => renderHomeImageForm());

            await loadHomeImagesAdmin();
            return;
        }
        if (section === "services") {
            panelTitle.textContent = "Servicios";
            panelDescription.textContent = "Edita las tarjetas de servicios que aparecen en la página principal.";

            panelBody.innerHTML = `
                <div class="admin-actions-row">
                    <button type="button" class="btn btn-primary" id="addServiceBtn">
                        Agregar servicio
                    </button>
                </div>

                <div id="servicesAdminList" class="admin-list">
                    Cargando servicios...
                </div>
            `;

            document
                .getElementById("addServiceBtn")
                .addEventListener("click", () => renderServiceForm());

            await loadServicesAdmin();
            return;




        }

        if (section === "projects") {
            panelTitle.textContent = "Obras ejecutadas";
            panelDescription.textContent = "Edita proyectos, cliente, año, importe e imágenes.";

            panelBody.innerHTML = `
        <div class="admin-actions-row">
            <button type="button" class="btn btn-primary" id="addProjectBtn">
                Agregar obra
            </button>
        </div>

        <div id="projectsAdminList" class="admin-list">
            Cargando obras...
        </div>
        `;

            document
                .getElementById("addProjectBtn")
                .addEventListener("click", () => renderProjectForm());

            await loadProjectsAdmin();
            return;
        }

        if (section === "categories") {
            panelTitle.textContent = "Categorías de suministros";
            panelDescription.textContent = "Edita las categorías que aparecen en la página de suministros.";

            panelBody.innerHTML = `
        <div class="admin-actions-row">
            <button type="button" class="btn btn-primary" id="addCategoryBtn">
                Agregar categoría
            </button>
        </div>

        <div id="categoriesAdminList" class="admin-list">
            Cargando categorías...
        </div>
        `;

            document
                .getElementById("addCategoryBtn")
                .addEventListener("click", () => renderCategoryForm());

            await loadCategoriesAdmin();
            return;
        }

        if (section === "inventory") {
            panelTitle.textContent = "Inventario";
            panelDescription.textContent = "Edita productos, folios, precios, tipos y disponibilidad.";

            panelBody.innerHTML = `
        <div class="admin-actions-row">
            <button type="button" class="btn btn-primary" id="addInventoryBtn">
                Agregar producto
            </button>
        </div>

        <div id="inventoryAdminList" class="admin-list">
            Cargando inventario...
        </div>
        `;

            document
                .getElementById("addInventoryBtn")
                .addEventListener("click", () => renderInventoryForm());

            await loadInventoryAdmin();
            return;
        }

        if (section === "supply-requests") {
            panelTitle.textContent = "Solicitudes de suministros";
            panelDescription.textContent = "Consulta solicitudes recibidas desde la página de suministros.";

            panelBody.innerHTML = `
        <div id="requestsAdminList" class="admin-list">
            Cargando solicitudes...
        </div>
        `;

            await loadRequestsAdmin();
            return;
        }

        if (section === "service-requests") {
            panelTitle.textContent = "Solicitudes de servicios";
            panelDescription.textContent = "Consulta solicitudes recibidas desde el formulario principal.";

            panelBody.innerHTML = `
        <div id="serviceRequestsAdminList" class="admin-list">
            Cargando solicitudes...
        </div>
        `;

            await loadServiceRequestsAdmin();
            return;
        }


    }

    async function loadServicesAdmin() {
        const list = document.getElementById("servicesAdminList");
        if (!list) return;

        list.textContent = "Cargando servicios...";

        const { data, error } = await GucaSupabase
            .from("service_cards")
            .select("*")
            .order("display_order", { ascending: true });

        if (error) {
            console.error(error);
            list.innerHTML = `
                <div class="msg error">
                    No se pudieron cargar los servicios.
                </div>
            `;
            return;
        }

        if (!data || data.length === 0) {
            list.innerHTML = `
                <div class="admin-empty-state">
                    No hay servicios todavía. Usa “Agregar servicio”.
                </div>
            `;
            return;
        }

        list.innerHTML = data.map((service) => `
            <article class="admin-item ${service.is_active ? "" : "admin-item-disabled"}">
                <div>
                    <span class="pill">${escapeHtml(service.pill)}</span>
                    <h3>${escapeHtml(service.title)}</h3>
                    <p>${escapeHtml(service.description)}</p>
                    <small>Orden: ${service.display_order} | Estado: ${service.is_active ? "Visible" : "Oculto"}</small>
                </div>

                <div class="admin-item-actions">
                    <button type="button" class="btn btn-outline" data-edit-service="${service.id}">
                        Editar
                    </button>

                    <button type="button" class="btn btn-outline" data-toggle-service="${service.id}" data-current-active="${service.is_active}">
                        ${service.is_active ? "Ocultar" : "Mostrar"}
                    </button>

                    <button type="button" class="btn btn-outline admin-danger-btn" data-delete-service="${service.id}">
                        Eliminar
                    </button>
                </div>
            </article>
        `).join("");

        document.querySelectorAll("[data-edit-service]").forEach((btn) => {
            btn.addEventListener("click", () => {
                const service = data.find((item) => item.id === Number(btn.dataset.editService));
                renderServiceForm(service);
            });
        });

        document.querySelectorAll("[data-toggle-service]").forEach((btn) => {
            btn.addEventListener("click", async () => {
                const id = Number(btn.dataset.toggleService);
                const currentActive = btn.dataset.currentActive === "true";

                const { error } = await GucaSupabase
                    .from("service_cards")
                    .update({ is_active: !currentActive })
                    .eq("id", id);

                if (error) {
                    alert("No se pudo cambiar el estado.");
                    console.error(error);
                    return;
                }

                await loadServicesAdmin();
            });
        });

        document.querySelectorAll("[data-delete-service]").forEach((btn) => {
            btn.addEventListener("click", async () => {
                const id = Number(btn.dataset.deleteService);

                const confirmDelete = confirm("¿Seguro que quieres eliminar este servicio?");
                if (!confirmDelete) return;

                const { error } = await GucaSupabase
                    .from("service_cards")
                    .delete()
                    .eq("id", id);

                if (error) {
                    alert("No se pudo eliminar el servicio.");
                    console.error(error);
                    return;
                }

                await loadServicesAdmin();
            });
        });


    }

    async function loadAdminStats() {
        if (!adminStatsGrid) return;

        adminStatsGrid.innerHTML = `
        <div class="admin-stat-card">Cargando resumen...</div>
    `;

        const [
            servicesResult,
            projectsResult,
            inventoryResult,

            serviceNewResult,
            serviceContactedResult,
            serviceProcessResult,
            serviceClosedResult,

            supplyNewResult,
            supplyContactedResult,
            supplyProcessResult,
            supplyClosedResult
        ] = await Promise.all([
            GucaSupabase
                .from("service_cards")
                .select("id", { count: "exact", head: true })
                .eq("is_active", true),

            GucaSupabase
                .from("projects")
                .select("id", { count: "exact", head: true })
                .eq("is_active", true),

            GucaSupabase
                .from("inventory_items")
                .select("id", { count: "exact", head: true })
                .eq("is_active", true),

            GucaSupabase
                .from("service_requests")
                .select("id", { count: "exact", head: true })
                .eq("status", "Nueva"),

            GucaSupabase
                .from("service_requests")
                .select("id", { count: "exact", head: true })
                .eq("status", "Contactado"),

            GucaSupabase
                .from("service_requests")
                .select("id", { count: "exact", head: true })
                .eq("status", "En proceso"),

            GucaSupabase
                .from("service_requests")
                .select("id", { count: "exact", head: true })
                .eq("status", "Cerrada"),

            GucaSupabase
                .from("supply_requests")
                .select("id", { count: "exact", head: true })
                .eq("status", "Nueva"),

            GucaSupabase
                .from("supply_requests")
                .select("id", { count: "exact", head: true })
                .eq("status", "Contactado"),

            GucaSupabase
                .from("supply_requests")
                .select("id", { count: "exact", head: true })
                .eq("status", "En proceso"),

            GucaSupabase
                .from("supply_requests")
                .select("id", { count: "exact", head: true })
                .eq("status", "Cerrada")
        ]);

        const results = [
            servicesResult,
            projectsResult,
            inventoryResult,
            serviceNewResult,
            serviceContactedResult,
            serviceProcessResult,
            serviceClosedResult,
            supplyNewResult,
            supplyContactedResult,
            supplyProcessResult,
            supplyClosedResult
        ];

        const hasError = results.some(result => result.error);

        if (hasError) {
            console.error({
                servicesResult,
                projectsResult,
                inventoryResult,
                serviceNewResult,
                serviceContactedResult,
                serviceProcessResult,
                serviceClosedResult,
                supplyNewResult,
                supplyContactedResult,
                supplyProcessResult,
                supplyClosedResult
            });

            adminStatsGrid.innerHTML = `
            <div class="msg error">
                No se pudo cargar el resumen.
            </div>
        `;
            return;
        }

        adminStatsGrid.innerHTML = `
        <div class="admin-stats-group">
            <h3>Contenido del sitio</h3>

            <div class="admin-stats-row stats-3">
                <div class="admin-stat-card">
                    <strong>${servicesResult.count || 0}</strong>
                    <span>Servicios activos</span>
                </div>

                <div class="admin-stat-card">
                    <strong>${projectsResult.count || 0}</strong>
                    <span>Obras visibles</span>
                </div>

                <div class="admin-stat-card">
                    <strong>${inventoryResult.count || 0}</strong>
                    <span>Productos activos</span>
                </div>
            </div>
        </div>

        <div class="admin-stats-group">
            <h3>Solicitudes de servicios</h3>

            <div class="admin-stats-row stats-4">
                <div class="admin-stat-card">
                    <strong>${serviceNewResult.count || 0}</strong>
                    <span>Nuevas</span>
                </div>

                <div class="admin-stat-card">
                    <strong>${serviceContactedResult.count || 0}</strong>
                    <span>Contactadas</span>
                </div>

                <div class="admin-stat-card">
                    <strong>${serviceProcessResult.count || 0}</strong>
                    <span>En proceso</span>
                </div>

                <div class="admin-stat-card">
                    <strong>${serviceClosedResult.count || 0}</strong>
                    <span>Cerradas</span>
                </div>
            </div>
        </div>

        <div class="admin-stats-group">
            <h3>Solicitudes de suministros</h3>

            <div class="admin-stats-row stats-4">
                <div class="admin-stat-card">
                    <strong>${supplyNewResult.count || 0}</strong>
                    <span>Nuevas</span>
                </div>

                <div class="admin-stat-card">
                    <strong>${supplyContactedResult.count || 0}</strong>
                    <span>Contactadas</span>
                </div>

                <div class="admin-stat-card">
                    <strong>${supplyProcessResult.count || 0}</strong>
                    <span>En proceso</span>
                </div>

                <div class="admin-stat-card">
                    <strong>${supplyClosedResult.count || 0}</strong>
                    <span>Cerradas</span>
                </div>
            </div>
        </div>
    `;
    }
    async function loadHomeImagesAdmin() {
        const list = document.getElementById("homeImagesAdminList");
        if (!list) return;

        list.textContent = "Cargando imágenes...";

        const { data, error } = await GucaSupabase
            .from("home_gallery_images")
            .select("*")
            .order("display_order", { ascending: true });

        if (error) {
            console.error(error);
            list.innerHTML = `
            <div class="msg error">
                No se pudieron cargar las imágenes de inicio.
            </div>
        `;
            return;
        }

        if (!data || data.length === 0) {
            list.innerHTML = `
            <div class="admin-empty-state">
                No hay imágenes todavía. Usa “Agregar imagen”.
            </div>
        `;
            return;
        }

        list.innerHTML = data.map((image) => {
            const src =
                /^https?:\/\//i.test(image.image_url) || image.image_url.startsWith("assets/")
                    ? image.image_url
                    : `assets/Imagenes galería/${encodeURIComponent(image.image_url)}`;

            return `
            <article class="admin-item ${image.is_active ? "" : "admin-item-disabled"}">
                <div>
                    <div class="admin-gallery-preview-card" style="max-width:320px;">
                        <img src="${escapeAttribute(src)}" alt="${escapeAttribute(image.alt || image.title || "Imagen de inicio")}" />
                    </div>

                    <span class="pill">${image.is_active ? "Visible" : "Oculta"}</span>
                    <h3>${escapeHtml(image.title || "Imagen sin título")}</h3>

                    <small>
                        Archivo/URL: ${escapeHtml(image.image_url)}
                        | Orden: ${image.display_order}
                    </small>
                </div>

                <div class="admin-item-actions">
                    <button type="button" class="btn btn-outline" data-edit-home-image="${image.id}">
                        Editar
                    </button>

                    <button type="button" class="btn btn-outline" data-toggle-home-image="${image.id}" data-current-active="${image.is_active}">
                        ${image.is_active ? "Ocultar" : "Mostrar"}
                    </button>

                    <button type="button" class="btn btn-outline admin-danger-btn" data-delete-home-image="${image.id}">
                        Eliminar
                    </button>
                </div>
            </article>
        `;
        }).join("");

        document.querySelectorAll("[data-edit-home-image]").forEach((btn) => {
            btn.addEventListener("click", () => {
                const image = data.find((item) => item.id === Number(btn.dataset.editHomeImage));
                renderHomeImageForm(image);
            });
        });

        document.querySelectorAll("[data-toggle-home-image]").forEach((btn) => {
            btn.addEventListener("click", async () => {
                const id = Number(btn.dataset.toggleHomeImage);
                const currentActive = btn.dataset.currentActive === "true";

                const { error } = await GucaSupabase
                    .from("home_gallery_images")
                    .update({ is_active: !currentActive })
                    .eq("id", id);

                if (error) {
                    alert("No se pudo cambiar el estado.");
                    console.error(error);
                    return;
                }

                await loadHomeImagesAdmin();
            });
        });

        document.querySelectorAll("[data-delete-home-image]").forEach((btn) => {
            btn.addEventListener("click", async () => {
                const id = Number(btn.dataset.deleteHomeImage);

                const confirmDelete = confirm("¿Seguro que quieres eliminar esta imagen?");
                if (!confirmDelete) return;

                const { error } = await GucaSupabase
                    .from("home_gallery_images")
                    .delete()
                    .eq("id", id);

                if (error) {
                    alert("No se pudo eliminar la imagen.");
                    console.error(error);
                    return;
                }

                await loadHomeImagesAdmin();
            });
        });
    }

    function renderHomeImageForm(image = null) {
        const isEditing = Boolean(image);

        panelTitle.textContent = isEditing ? "Editar imagen de inicio" : "Agregar imagen de inicio";
        panelDescription.textContent = "Puedes usar un nombre de archivo local o una URL completa.";

        panelBody.innerHTML = `
        <form id="homeImageAdminForm" class="admin-edit-form">
            <div class="field">
                <label for="homeImageTitle">Título interno</label>
                <input
                    id="homeImageTitle"
                    type="text"
                    value="${image ? escapeAttribute(image.title || "") : ""}"
                    placeholder="Ejemplo: Galería principal 1"
                />
            </div>

            <div class="field">
                <label for="homeImageUpload">Subir imagen</label>
                <input
                    id="homeImageUpload"
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                />
            
                <button
                    type="button"
                    class="btn btn-outline"
                    id="uploadHomeImageBtn"
                    style="margin-top:0.6rem;"
                >
                    Subir imagen
                </button>
            
                <p id="homeImageUploadMsg" class="msg" aria-live="polite"></p>
            </div>
            
            <div class="field">
                <label for="homeImageUrl">Archivo o URL de imagen</label>
                <input
                    id="homeImageUrl"
                    type="text"
                    value="${image ? escapeAttribute(image.image_url || "") : ""}"
                    placeholder="La imagen subida aparecerá aquí automáticamente."
                    required
                />
                <small>
                    Puedes subir una imagen o escribir una URL completa. También puedes usar un archivo local como construccionimagen1.jpg.
                </small>
            
                <div id="homeImagePreview" class="admin-image-preview"></div>
            </div>
    
                <div class="field">
                    <label for="homeImageAlt">Texto alternativo</label>
                    <input
                        id="homeImageAlt"
                        type="text"
                        value="${image ? escapeAttribute(image.alt || "") : ""}"
                        placeholder="Descripción corta de la imagen"
                    />
                </div>
    
                <div class="field">
                    <label for="homeImageOrder">Orden</label>
                    <input
                        id="homeImageOrder"
                        type="number"
                        min="0"
                        step="1"
                        value="${image ? image.display_order : 1}"
                        required
                    />
                </div>

            <div class="field admin-checkbox-field">
                <label>
                    <input
                        id="homeImageActive"
                        type="checkbox"
                        ${!image || image.is_active ? "checked" : ""}
                    />
                    Visible en la página
                </label>
            </div>

            <div class="admin-form-actions">
                <button type="submit" class="btn btn-primary">
                    Guardar cambios
                </button>

                <button type="button" class="btn btn-outline" id="cancelHomeImageEdit">
                    Cancelar
                </button>
            </div>

            <p id="homeImageFormMsg" class="msg" aria-live="polite"></p>
        </form>
    `;

        document.getElementById("cancelHomeImageEdit").addEventListener("click", () => {
            showAdminSection("home-images");
        });

        const homeImageUrlInput = document.getElementById("homeImageUrl");
        const homeImagePreview = document.getElementById("homeImagePreview");

        const getHomeImageSrc = () => {
            const value = homeImageUrlInput.value.trim();

            if (!value) return "";

            if (/^https?:\/\//i.test(value) || value.startsWith("assets/")) {
                return value;
            }

            return `assets/Imagenes galería/${encodeURIComponent(value)}`;
        };

        const renderHomeImagePreview = () => {
            const src = getHomeImageSrc();

            if (!src) {
                homeImagePreview.innerHTML = `
            <div class="admin-image-preview-empty">
                No hay imagen seleccionada.
            </div>
        `;
                return;
            }

            homeImagePreview.innerHTML = `
        <div class="admin-image-preview-card">
            <img src="${escapeAttribute(src)}" alt="Vista previa de imagen de inicio" />

            <button type="button" class="btn btn-outline admin-danger-btn" id="removeHomeImageBtn">
                Quitar imagen
            </button>
        </div>
    `;

            document.getElementById("removeHomeImageBtn").addEventListener("click", () => {
                homeImageUrlInput.value = "";
                renderHomeImagePreview();
            });
        };

        homeImageUrlInput.addEventListener("input", renderHomeImagePreview);
        renderHomeImagePreview();

        document.getElementById("uploadHomeImageBtn").addEventListener("click", async () => {
            const fileInput = document.getElementById("homeImageUpload");
            const uploadMsg = document.getElementById("homeImageUploadMsg");

            const file = fileInput.files[0];

            if (!file) {
                uploadMsg.textContent = "Selecciona una imagen primero.";
                uploadMsg.className = "msg error";
                return;
            }

            const allowedTypes = ["image/png", "image/jpeg", "image/webp"];

            if (!allowedTypes.includes(file.type)) {
                uploadMsg.textContent = "Solo se permiten imágenes PNG, JPG o WEBP.";
                uploadMsg.className = "msg error";
                return;
            }

            const maxSize = 10 * 1024 * 1024;

            if (file.size > maxSize) {
                uploadMsg.textContent = "La imagen es demasiado grande. Máximo 10 MB.";
                uploadMsg.className = "msg error";
                return;
            }

            uploadMsg.textContent = "Subiendo imagen...";
            uploadMsg.className = "msg";

            const safeFileName = file.name
                .toLowerCase()
                .replaceAll(" ", "-")
                .replace(/[^a-z0-9.\-_]/g, "");

            const filePath = `home/${Date.now()}-${safeFileName}`;

            const { error: uploadError } = await GucaSupabase.storage
                .from("home-images")
                .upload(filePath, file, {
                    cacheControl: "3600",
                    upsert: false
                });

            if (uploadError) {
                console.error(uploadError);
                uploadMsg.textContent = "No se pudo subir la imagen.";
                uploadMsg.className = "msg error";
                return;
            }

            const { data: publicUrlData } = GucaSupabase.storage
                .from("home-images")
                .getPublicUrl(filePath);

            homeImageUrlInput.value = publicUrlData.publicUrl;
            renderHomeImagePreview();

            uploadMsg.textContent = "Imagen subida correctamente.";
            uploadMsg.className = "msg success";

            fileInput.value = "";
        });

        document.getElementById("homeImageAdminForm").addEventListener("submit", async (event) => {
            event.preventDefault();

            const msg = document.getElementById("homeImageFormMsg");

            const payload = {
                title: document.getElementById("homeImageTitle").value.trim(),
                image_url: document.getElementById("homeImageUrl").value.trim(),
                alt: document.getElementById("homeImageAlt").value.trim(),
                display_order: Number(document.getElementById("homeImageOrder").value),
                is_active: document.getElementById("homeImageActive").checked
            };

            msg.textContent = "Guardando...";
            msg.className = "msg";

            let result;

            if (isEditing) {
                result = await GucaSupabase
                    .from("home_gallery_images")
                    .update(payload)
                    .eq("id", image.id);
            } else {
                result = await GucaSupabase
                    .from("home_gallery_images")
                    .insert(payload);
            }

            if (result.error) {
                console.error(result.error);
                msg.textContent = "No se pudieron guardar los cambios.";
                msg.className = "msg error";
                return;
            }

            msg.textContent = "Cambios guardados correctamente.";
            msg.className = "msg success";

            setTimeout(() => {
                showAdminSection("home-images");
            }, 700);
        });
    }

    function renderServiceForm(service = null) {
        const isEditing = Boolean(service);

        panelTitle.textContent = isEditing ? "Editar servicio" : "Agregar servicio";
        panelDescription.textContent = "Llena los campos y guarda los cambios.";

        panelBody.innerHTML = `
            <form id="serviceAdminForm" class="admin-edit-form">
                <input type="hidden" id="serviceId" value="${service ? service.id : ""}" />

                <div class="field">
                    <label for="servicePill">Etiqueta superior</label>
                    <input
                        id="servicePill"
                        type="text"
                        value="${service ? escapeAttribute(service.pill) : ""}"
                        placeholder="Ejemplo: Construcción"
                        required
                    />
                </div>

                <div class="field">
                    <label for="serviceTitle">Título</label>
                    <input
                        id="serviceTitle"
                        type="text"
                        value="${service ? escapeAttribute(service.title) : ""}"
                        placeholder="Ejemplo: Obra nueva"
                        required
                    />
                </div>

                <div class="field">
                    <label for="serviceDescription">Descripción</label>
                    <textarea
                        id="serviceDescription"
                        required
                        placeholder="Describe el servicio de forma clara."
                    >${service ? escapeHtml(service.description) : ""}</textarea>
                </div>

                <hr class="login-divider" />
                <p class="login-note"><strong>Traducción en inglés</strong> (opcional). Si se deja vacío, el sitio mostrará el texto en español.</p>

                <div class="field">
                    <label for="servicePillEn">Etiqueta en inglés</label>
                    <input
                        id="servicePillEn"
                        type="text"
                        value="${service ? escapeAttribute(service.pill_en || "") : ""}"
                        placeholder="Example: Construction"
                    />
                </div>

                <div class="field">
                    <label for="serviceTitleEn">Título en inglés</label>
                    <input
                        id="serviceTitleEn"
                        type="text"
                        value="${service ? escapeAttribute(service.title_en || "") : ""}"
                        placeholder="Example: New construction"
                    />
                </div>

                <div class="field">
                    <label for="serviceDescriptionEn">Descripción en inglés</label>
                    <textarea
                        id="serviceDescriptionEn"
                        placeholder="Describe the service in English."
                    >${service ? escapeHtml(service.description_en || "") : ""}</textarea>
                </div>

                <div class="field">
                    <label for="serviceOrder">Orden</label>
                    <input
                        id="serviceOrder"
                        type="number"
                        value="${service ? service.display_order : 1}"
                        min="0"
                        step="1"
                        required
                    />
                </div>

                <div class="field admin-checkbox-field">
                    <label>
                        <input
                            id="serviceActive"
                            type="checkbox"
                            ${!service || service.is_active ? "checked" : ""}
                        />
                        Visible en la página
                    </label>
                </div>

                <div class="admin-form-actions">
                    <button type="submit" class="btn btn-primary">
                        Guardar cambios
                    </button>

                    <button type="button" class="btn btn-outline" id="cancelServiceEdit">
                        Cancelar
                    </button>
                </div>

                <p id="serviceFormMsg" class="msg" aria-live="polite"></p>
            </form>
        `;

        document.getElementById("cancelServiceEdit").addEventListener("click", () => {
            showAdminSection("services");
        });

        document.getElementById("serviceAdminForm").addEventListener("submit", async (event) => {
            event.preventDefault();

            const msg = document.getElementById("serviceFormMsg");

            const payload = {
                pill: document.getElementById("servicePill").value.trim(),
                title: document.getElementById("serviceTitle").value.trim(),
                description: document.getElementById("serviceDescription").value.trim(),
                pill_en: document.getElementById("servicePillEn").value.trim() || null,
                title_en: document.getElementById("serviceTitleEn").value.trim() || null,
                description_en: document.getElementById("serviceDescriptionEn").value.trim() || null,
                display_order: Number(document.getElementById("serviceOrder").value),
                is_active: document.getElementById("serviceActive").checked
            };

            msg.textContent = "Guardando...";
            msg.className = "msg";

            let result;

            if (isEditing) {
                result = await GucaSupabase
                    .from("service_cards")
                    .update(payload)
                    .eq("id", service.id);
            } else {
                result = await GucaSupabase
                    .from("service_cards")
                    .insert(payload);
            }

            if (result.error) {
                console.error(result.error);
                msg.textContent = "No se pudieron guardar los cambios.";
                msg.className = "msg error";
                return;
            }

            msg.textContent = "Cambios guardados correctamente.";
            msg.className = "msg success";

            setTimeout(() => {
                showAdminSection("services");
            }, 700);
        });
    }
    async function loadCategoriesAdmin() {
        const list = document.getElementById("categoriesAdminList");
        if (!list) return;

        list.textContent = "Cargando categorías...";

        const { data, error } = await GucaSupabase
            .from("supply_categories")
            .select("*")
            .order("display_order", { ascending: true });

        if (error) {
            console.error(error);
            list.innerHTML = `
            <div class="msg error">
                No se pudieron cargar las categorías.
            </div>
        `;
            return;
        }

        if (!data || data.length === 0) {
            list.innerHTML = `
            <div class="admin-empty-state">
                No hay categorías todavía. Usa “Agregar categoría”.
            </div>
        `;
            return;
        }

        list.innerHTML = data.map((category) => `
        <article class="admin-item ${category.is_active ? "" : "admin-item-disabled"}">
            <div>
                <span class="supply-category-icon" style="margin-bottom:0.5rem;">
                    <i class="fa-solid ${escapeAttribute(category.icon || "fa-box")}"></i>
                </span>

                <h3>${escapeHtml(category.name)}</h3>
                <p>${escapeHtml(category.description)}</p>

                <small>
                    Slug: ${escapeHtml(category.slug)}
                    | Orden: ${category.display_order}
                    | Estado: ${category.is_active ? "Visible" : "Oculto"}
                </small>
            </div>

            <div class="admin-item-actions">
                <button type="button" class="btn btn-outline" data-edit-category="${category.id}">
                    Editar
                </button>

                <button type="button" class="btn btn-outline" data-toggle-category="${category.id}" data-current-active="${category.is_active}">
                    ${category.is_active ? "Ocultar" : "Mostrar"}
                </button>

                <button type="button" class="btn btn-outline admin-danger-btn" data-delete-category="${category.id}">
                    Eliminar
                </button>
            </div>
        </article>
    `).join("");

        document.querySelectorAll("[data-edit-category]").forEach((btn) => {
            btn.addEventListener("click", () => {
                const category = data.find((item) => item.id === Number(btn.dataset.editCategory));
                renderCategoryForm(category);
            });
        });

        document.querySelectorAll("[data-toggle-category]").forEach((btn) => {
            btn.addEventListener("click", async () => {
                const id = Number(btn.dataset.toggleCategory);
                const currentActive = btn.dataset.currentActive === "true";

                const { error } = await GucaSupabase
                    .from("supply_categories")
                    .update({ is_active: !currentActive })
                    .eq("id", id);

                if (error) {
                    alert("No se pudo cambiar el estado.");
                    console.error(error);
                    return;
                }

                await loadCategoriesAdmin();
            });
        });

        document.querySelectorAll("[data-delete-category]").forEach((btn) => {
            btn.addEventListener("click", async () => {
                const id = Number(btn.dataset.deleteCategory);

                const confirmDelete = confirm(
                    "¿Seguro que quieres eliminar esta categoría? Si tiene productos relacionados, puede fallar."
                );

                if (!confirmDelete) return;

                const { error } = await GucaSupabase
                    .from("supply_categories")
                    .delete()
                    .eq("id", id);

                if (error) {
                    alert("No se pudo eliminar. Probablemente hay productos usando esta categoría.");
                    console.error(error);
                    return;
                }

                await loadCategoriesAdmin();
            });
        });
    }

    function renderCategoryForm(category = null) {
        const isEditing = Boolean(category);

        panelTitle.textContent = isEditing ? "Editar categoría" : "Agregar categoría";
        panelDescription.textContent = "Llena los campos y guarda los cambios.";

        panelBody.innerHTML = `
        <form id="categoryAdminForm" class="admin-edit-form">
            <input type="hidden" id="categoryId" value="${category ? category.id : ""}" />

            <div class="field">
                <label for="categorySlug">Slug / identificador</label>
                <input
                    id="categorySlug"
                    type="text"
                    value="${category ? escapeAttribute(category.slug) : ""}"
                    placeholder="Ejemplo: uniformes"
                    required
                    ${isEditing ? "readonly" : ""}
                />
                <small>
                    Usa minúsculas, sin espacios. Ejemplo: uniformes, alimentos, limpieza.
                </small>
            </div>

            <div class="field">
                <label for="categoryName">Nombre visible</label>
                <input
                    id="categoryName"
                    type="text"
                    value="${category ? escapeAttribute(category.name) : ""}"
                    placeholder="Ejemplo: Uniformes"
                    required
                />
            </div>

            <div class="field">
                <label for="categoryDescription">Descripción</label>
                <textarea
                    id="categoryDescription"
                    required
                    placeholder="Describe la categoría."
                >${category ? escapeHtml(category.description) : ""}</textarea>
            </div>

            <hr class="login-divider" />
            <p class="login-note"><strong>Traducción en inglés</strong> (opcional). Si se deja vacío, el sitio mostrará el texto en español.</p>

            <div class="field">
                <label for="categoryNameEn">Nombre visible en inglés</label>
                <input
                    id="categoryNameEn"
                    type="text"
                    value="${category ? escapeAttribute(category.name_en || "") : ""}"
                    placeholder="Example: Uniforms"
                />
            </div>

            <div class="field">
                <label for="categoryDescriptionEn">Descripción en inglés</label>
                <textarea
                    id="categoryDescriptionEn"
                    placeholder="Short description in English."
                >${category ? escapeHtml(category.description_en || "") : ""}</textarea>
            </div>

            <div class="field">
                <label for="categoryIcon">Icono Font Awesome</label>
                <input
                    id="categoryIcon"
                    type="text"
                    value="${category ? escapeAttribute(category.icon || "") : ""}"
                    placeholder="Ejemplo: fa-vest"
                />
                <small>
                    Ejemplos: fa-vest, fa-apple-whole, fa-spray-can-sparkles, fa-gears, fa-file-lines.
                </small>
            </div>

            <div class="field">
                <label for="categoryOrder">Orden</label>
                <input
                    id="categoryOrder"
                    type="number"
                    value="${category ? category.display_order : 1}"
                    min="0"
                    step="1"
                    required
                />
            </div>

            <div class="field admin-checkbox-field">
                <label>
                    <input
                        id="categoryActive"
                        type="checkbox"
                        ${!category || category.is_active ? "checked" : ""}
                    />
                    Visible en la página
                </label>
            </div>

            <div class="admin-form-actions">
                <button type="submit" class="btn btn-primary">
                    Guardar cambios
                </button>

                <button type="button" class="btn btn-outline" id="cancelCategoryEdit">
                    Cancelar
                </button>
            </div>

            <p id="categoryFormMsg" class="msg" aria-live="polite"></p>
        </form>
    `;

        document.getElementById("cancelCategoryEdit").addEventListener("click", () => {
            showAdminSection("categories");
        });

        document.getElementById("categoryAdminForm").addEventListener("submit", async (event) => {
            event.preventDefault();

            const msg = document.getElementById("categoryFormMsg");

            const slugValue = document
                .getElementById("categorySlug")
                .value
                .trim()
                .toLowerCase()
                .replaceAll(" ", "-");

            const payload = {
                slug: slugValue,
                name: document.getElementById("categoryName").value.trim(),
                description: document.getElementById("categoryDescription").value.trim(),
                name_en: document.getElementById("categoryNameEn").value.trim() || null,
                description_en: document.getElementById("categoryDescriptionEn").value.trim() || null,
                icon: document.getElementById("categoryIcon").value.trim(),
                display_order: Number(document.getElementById("categoryOrder").value),
                is_active: document.getElementById("categoryActive").checked
            };

            msg.textContent = "Guardando...";
            msg.className = "msg";

            let result;

            if (isEditing) {
                result = await GucaSupabase
                    .from("supply_categories")
                    .update({
                        name: payload.name,
                        description: payload.description,
                        icon: payload.icon,
                        display_order: payload.display_order,
                        is_active: payload.is_active
                    })
                    .eq("id", category.id);
            } else {
                result = await GucaSupabase
                    .from("supply_categories")
                    .insert(payload);
            }

            if (result.error) {
                console.error(result.error);
                msg.textContent = "No se pudieron guardar los cambios.";
                msg.className = "msg error";
                return;
            }

            msg.textContent = "Cambios guardados correctamente.";
            msg.className = "msg success";

            setTimeout(() => {
                showAdminSection("categories");
            }, 700);
        });
    }
    async function getActiveCategoriesForAdmin() {
        const { data, error } = await GucaSupabase
            .from("supply_categories")
            .select("slug, name")
            .eq("is_active", true)
            .order("display_order", { ascending: true });

        if (error) {
            console.error(error);
            return [];
        }

        return data || [];
    }

    async function loadInventoryAdmin() {
        const list = document.getElementById("inventoryAdminList");
        if (!list) return;

        list.textContent = "Cargando inventario...";

        const { data, error } = await GucaSupabase
            .from("inventory_items")
            .select("*")
            .order("serial", { ascending: true });

        if (error) {
            console.error(error);
            list.innerHTML = `
            <div class="msg error">
                No se pudo cargar el inventario.
            </div>
        `;
            return;
        }

        if (!data || data.length === 0) {
            list.innerHTML = `
            <div class="admin-empty-state">
                No hay productos todavía. Usa “Agregar producto”.
            </div>
        `;
            return;
        }

        list.innerHTML = data.map((item) => `
        <article class="admin-item ${item.is_active ? "" : "admin-item-disabled"}">
            <div>
                <div class="inventory-card-top" style="justify-content:flex-start;">
                    ${item.image_url
            ? `<span class="inventory-image-wrap">
                        <img
                            src="${escapeAttribute(item.image_url)}"
                            alt="${escapeAttribute(item.name)}"
                            class="inventory-image"
                        />
                       </span>`
            : `<span class="inventory-icon">
                            <i class="fa-solid ${escapeAttribute(item.icon || "fa-box")}"></i>
                       </span>`
        }
                    <span class="inventory-serial">${escapeHtml(item.serial)}</span>
                </div>

                <h3>${escapeHtml(item.name)}</h3>
                <p>${escapeHtml(item.description || "")}</p>

                <small>
                    Categoría: ${escapeHtml(item.category_slug)}
                    | Tipo: ${escapeHtml(item.type || "General")}
                    | Precio: ${item.price === null ? "A cotizar" : "$" + Number(item.price).toFixed(2)}
                    | Estado: ${item.is_active ? "Visible" : "Oculto"}
                </small>
            </div>

            <div class="admin-item-actions">
                <button type="button" class="btn btn-outline" data-edit-inventory="${item.id}">
                    Editar
                </button>

                <button type="button" class="btn btn-outline" data-toggle-inventory="${item.id}" data-current-active="${item.is_active}">
                    ${item.is_active ? "Ocultar" : "Mostrar"}
                </button>

                <button type="button" class="btn btn-outline admin-danger-btn" data-delete-inventory="${item.id}">
                    Eliminar
                </button>
            </div>
        </article>
        `).join("");

        document.querySelectorAll("[data-edit-inventory]").forEach((btn) => {
            btn.addEventListener("click", () => {
                const item = data.find((product) => product.id === Number(btn.dataset.editInventory));
                renderInventoryForm(item);
            });
        });

        document.querySelectorAll("[data-toggle-inventory]").forEach((btn) => {
            btn.addEventListener("click", async () => {
                const id = Number(btn.dataset.toggleInventory);
                const currentActive = btn.dataset.currentActive === "true";

                const { error } = await GucaSupabase
                    .from("inventory_items")
                    .update({ is_active: !currentActive })
                    .eq("id", id);

                if (error) {
                    alert("No se pudo cambiar el estado.");
                    console.error(error);
                    return;
                }

                await loadInventoryAdmin();
            });
        });

        document.querySelectorAll("[data-delete-inventory]").forEach((btn) => {
            btn.addEventListener("click", async () => {
                const id = Number(btn.dataset.deleteInventory);

                const confirmDelete = confirm("¿Seguro que quieres eliminar este producto?");
                if (!confirmDelete) return;

                const { error } = await GucaSupabase
                    .from("inventory_items")
                    .delete()
                    .eq("id", id);

                if (error) {
                    alert("No se pudo eliminar el producto.");
                    console.error(error);
                    return;
                }

                await loadInventoryAdmin();
            });
        });
    }
    async function loadRequestsAdmin() {
        const list = document.getElementById("requestsAdminList");
        if (!list) return;

        list.textContent = "Cargando solicitudes...";

        const { data, error } = await GucaSupabase
            .from("supply_requests")
            .select("*")
            .order("created_at", { ascending: false });

        if (error) {
            console.error(error);
            list.innerHTML = `
            <div class="msg error">
                No se pudieron cargar las solicitudes.
            </div>
        `;
            return;
        }

        if (!data || data.length === 0) {
            list.innerHTML = `
            <div class="admin-empty-state">
                No hay solicitudes todavía.
            </div>
        `;
            return;
        }

        list.innerHTML = data.map((request) => `
        <article class="admin-item">
            <div>
                <span class="pill">${escapeHtml(request.status || "Nueva")}</span>

                <h3>${escapeHtml(request.name)}</h3>

                <p>
                    <strong>Producto:</strong>
                    ${escapeHtml(request.selected_product || "No especificado")}
                </p>

                <p>
                    <strong>Mensaje:</strong>
                    ${escapeHtml(request.message)}
                </p>

                <small>
                    Correo: ${escapeHtml(request.email)}
                    | Tel: ${escapeHtml(request.phone)}
                    | Cantidad: ${request.quantity || "No especificada"}
                    | Entrega: ${escapeHtml(request.delivery_area || "No especificada")}
                    | Fecha: ${new Date(request.created_at).toLocaleString("es-MX")}
                </small>
            </div>

            <div class="admin-item-actions">
                <button type="button" class="btn btn-outline" data-request-status="${request.id}" data-status="Contactado">
                    Contactado
                </button>
            
                <button type="button" class="btn btn-outline" data-request-status="${request.id}" data-status="En proceso">
                    En proceso
                </button>
            
                <button type="button" class="btn btn-outline" data-request-status="${request.id}" data-status="Cerrada">
                    Cerrar
                </button>
            
                <button type="button" class="btn btn-outline admin-danger-btn" data-delete-request="${request.id}">
                    Eliminar
                </button>
            </div>
        </article>
        `).join("");

        document.querySelectorAll("[data-request-status]").forEach((btn) => {
            btn.addEventListener("click", async () => {
                const id = Number(btn.dataset.requestStatus);
                const status = btn.dataset.status;

                const { error } = await GucaSupabase
                    .from("supply_requests")
                    .update({
                        status,
                        updated_at: new Date().toISOString()
                    })
                    .eq("id", id);

                if (error) {
                    alert("No se pudo actualizar la solicitud.");
                    console.error(error);
                    return;
                }

                await loadRequestsAdmin();
                await loadAdminStats();
            });
        });

        document.querySelectorAll("[data-delete-request]").forEach((btn) => {
            btn.addEventListener("click", async () => {
                const id = Number(btn.dataset.deleteRequest);

                const confirmDelete = confirm("¿Seguro que quieres eliminar esta solicitud?");
                if (!confirmDelete) return;

                const { error } = await GucaSupabase
                    .from("supply_requests")
                    .delete()
                    .eq("id", id);

                if (error) {
                    alert("No se pudo eliminar la solicitud.");
                    console.error(error);
                    return;
                }

                await loadRequestsAdmin();
            });
        });
    }

    async function loadServiceRequestsAdmin() {
        const list = document.getElementById("serviceRequestsAdminList");
        if (!list) return;

        list.textContent = "Cargando solicitudes...";

        const { data, error } = await GucaSupabase
            .from("service_requests")
            .select("*")
            .order("created_at", { ascending: false });

        if (error) {
            console.error(error);
            list.innerHTML = `
            <div class="msg error">
                No se pudieron cargar las solicitudes de servicios.
            </div>
        `;
            return;
        }

        if (!data || data.length === 0) {
            list.innerHTML = `
            <div class="admin-empty-state">
                No hay solicitudes de servicios todavía.
            </div>
        `;
            return;
        }

        list.innerHTML = data.map((request) => `
        <article class="admin-item">
            <div>
                <span class="pill">${escapeHtml(request.status || "Nueva")}</span>

                <h3>${escapeHtml(request.name)}</h3>

                <p>
                    <strong>Tipo de proyecto:</strong>
                    ${escapeHtml(request.project_type || "No especificado")}
                </p>

                <p>
                    <strong>Mensaje:</strong>
                    ${escapeHtml(request.message)}
                </p>

                <small>
                    Correo: ${escapeHtml(request.email)}
                    | Tel: ${escapeHtml(request.phone)}
                    | Fecha: ${new Date(request.created_at).toLocaleString("es-MX")}
                </small>
            </div>

            <div class="admin-item-actions">
                <button type="button" class="btn btn-outline" data-service-request-status="${request.id}" data-status="Contactado">
                    Contactado
                </button>
            
                <button type="button" class="btn btn-outline" data-service-request-status="${request.id}" data-status="En proceso">
                    En proceso
                </button>
            
                <button type="button" class="btn btn-outline" data-service-request-status="${request.id}" data-status="Cerrada">
                    Cerrar
                </button>
            
                <button type="button" class="btn btn-outline admin-danger-btn" data-delete-service-request="${request.id}">
                    Eliminar
                </button>
            </div>
        </article>
    `).join("");

        document.querySelectorAll("[data-service-request-status]").forEach((btn) => {
            btn.addEventListener("click", async () => {
                const id = Number(btn.dataset.serviceRequestStatus);
                const status = btn.dataset.status;

                const { error } = await GucaSupabase
                    .from("service_requests")
                    .update({
                        status,
                        updated_at: new Date().toISOString()
                    })
                    .eq("id", id);

                if (error) {
                    alert("No se pudo actualizar la solicitud.");
                    console.error(error);
                    return;
                }

                await loadServiceRequestsAdmin();
                await loadAdminStats();
            });
        });

        document.querySelectorAll("[data-delete-service-request]").forEach((btn) => {
            btn.addEventListener("click", async () => {
                const id = Number(btn.dataset.deleteServiceRequest);

                const confirmDelete = confirm("¿Seguro que quieres eliminar esta solicitud?");
                if (!confirmDelete) return;

                const { error } = await GucaSupabase
                    .from("service_requests")
                    .delete()
                    .eq("id", id);

                if (error) {
                    alert("No se pudo eliminar la solicitud.");
                    console.error(error);
                    return;
                }

                await loadServiceRequestsAdmin();
                await loadAdminStats();
            });
        });
    }

    async function renderInventoryForm(item = null) {
        const isEditing = Boolean(item);
        const categories = await getActiveCategoriesForAdmin();

        panelTitle.textContent = isEditing ? "Editar producto" : "Agregar producto";
        panelDescription.textContent = "Llena los campos del producto y guarda los cambios.";

        panelBody.innerHTML = `
        <form id="inventoryAdminForm" class="admin-edit-form">
            <input type="hidden" id="inventoryId" value="${item ? item.id : ""}" />

            <div class="field">
                <label for="inventorySerial">Folio / serial</label>
                <input
                    id="inventorySerial"
                    type="text"
                    value="${item ? escapeAttribute(item.serial) : ""}"
                    placeholder="Ejemplo: LIM-001"
                    required
                />
            </div>
            
            <div class="field">
                <label for="inventoryImageUpload">Subir imagen del producto</label>
                <input
                    id="inventoryImageUpload"
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                />
            
                <button
                    type="button"
                    class="btn btn-outline"
                    id="uploadInventoryImageBtn"
                    style="margin-top:0.6rem;"
                >
                    Subir imagen
                </button>
            
                <p id="inventoryUploadMsg" class="msg" aria-live="polite"></p>
            </div>
            
            <div class="field">
                <label for="inventoryImageUrl">URL de imagen</label>
                <input
                    id="inventoryImageUrl"
                    type="text"
                    value="${item ? escapeAttribute(item.image_url || "") : ""}"
                    placeholder="La imagen subida aparecerá aquí automáticamente."
                />
            
                <div id="inventoryImagePreview" class="admin-image-preview"></div>
            </div>

            <div class="field">
                <label for="inventoryName">Nombre del producto</label>
                <input
                    id="inventoryName"
                    type="text"
                    value="${item ? escapeAttribute(item.name) : ""}"
                    placeholder="Ejemplo: Desinfectante multiusos"
                    required
                />
            </div>

            <div class="field">
                <label for="inventoryCategory">Categoría</label>
                <select id="inventoryCategory" required>
                    <option value="">Selecciona una categoría</option>
                    ${categories.map((category) => `
                        <option value="${escapeAttribute(category.slug)}" ${item && item.category_slug === category.slug ? "selected" : ""}>
                            ${escapeHtml(category.name)}
                        </option>
                    `).join("")}
                </select>
            </div>

            <div class="field">
                <label for="inventoryType">Tipo</label>
                <input
                    id="inventoryType"
                    type="text"
                    value="${item ? escapeAttribute(item.type || "") : ""}"
                    placeholder="Ejemplo: Seguridad, Bebidas, Químicos"
                />
            </div>

            <div class="field">
                <label for="inventoryDescription">Descripción</label>
                <textarea
                    id="inventoryDescription"
                    placeholder="Describe el producto."
                >${item ? escapeHtml(item.description || "") : ""}</textarea>
            </div>

            <hr class="login-divider" />
            <p class="login-note"><strong>Traducción en inglés</strong> (opcional). Si se deja vacío, el sitio mostrará el texto en español.</p>

            <div class="field">
                <label for="inventoryNameEn">Nombre en inglés</label>
                <input
                    id="inventoryNameEn"
                    type="text"
                    value="${item ? escapeAttribute(item.name_en || "") : ""}"
                    placeholder="Example: Reflective vest"
                />
            </div>

            <div class="field">
                <label for="inventoryTypeEn">Tipo en inglés</label>
                <input
                    id="inventoryTypeEn"
                    type="text"
                    value="${item ? escapeAttribute(item.type_en || "") : ""}"
                    placeholder="Example: Safety"
                />
            </div>

            <div class="field">
                <label for="inventoryDescriptionEn">Descripción en inglés</label>
                <textarea
                    id="inventoryDescriptionEn"
                    placeholder="Product description in English."
                >${item ? escapeHtml(item.description_en || "") : ""}</textarea>
            </div>

            <div class="field">
                <label for="inventoryUnitEn">Unidad en inglés</label>
                <input
                    id="inventoryUnitEn"
                    type="text"
                    value="${item ? escapeAttribute(item.unit_en || "") : ""}"
                    placeholder="Example: piece"
                />
            </div>

            <div class="field">
                <label for="inventoryStatusEn">Estado en inglés</label>
                <input
                    id="inventoryStatusEn"
                    type="text"
                    value="${item ? escapeAttribute(item.status_en || "") : ""}"
                    placeholder="Example: Quotable"
                />
            </div>

            <div class="field">
                <label for="inventoryPrice">Precio de referencia</label>
                <input
                    id="inventoryPrice"
                    type="number"
                    min="0"
                    step="0.01"
                    value="${item && item.price !== null ? item.price : ""}"
                    placeholder="Ejemplo: 120"
                />
                <small>Déjalo vacío si el producto es “A cotizar”.</small>
            </div>

            <div class="field">
                <label for="inventoryUnit">Unidad</label>
                <input
                    id="inventoryUnit"
                    type="text"
                    value="${item ? escapeAttribute(item.unit || "") : ""}"
                    placeholder="Ejemplo: pieza, caja, litro, paquete"
                />
            </div>

            <div class="field">
                <label for="inventoryStatusInput">Estado visible</label>
                <input
                    id="inventoryStatusInput"
                    type="text"
                    value="${item ? escapeAttribute(item.status || "") : "Cotizable"}"
                    placeholder="Ejemplo: Cotizable, Sobre pedido, A cotizar"
                />
            </div>

            <div class="field">
                <label for="inventoryIcon">Icono Font Awesome</label>
                <input
                    id="inventoryIcon"
                    type="text"
                    value="${item ? escapeAttribute(item.icon || "") : ""}"
                    placeholder="Ejemplo: fa-vest, fa-broom, fa-file-lines"
                />
            </div>

            <div class="field admin-checkbox-field">
                <label>
                    <input
                        id="inventoryActive"
                        type="checkbox"
                        ${!item || item.is_active ? "checked" : ""}
                    />
                    Visible en la página
                </label>
            </div>

            <div class="admin-form-actions">
                <button type="submit" class="btn btn-primary">
                    Guardar cambios
                </button>

                <button type="button" class="btn btn-outline" id="cancelInventoryEdit">
                    Cancelar
                </button>
            </div>

            <p id="inventoryFormMsg" class="msg" aria-live="polite"></p>
        </form>
    `;

        document.getElementById("cancelInventoryEdit").addEventListener("click", () => {
            showAdminSection("inventory");
        });

        const inventoryImageUrlInput = document.getElementById("inventoryImageUrl");
        const inventoryImagePreview = document.getElementById("inventoryImagePreview");

        const renderInventoryImagePreview = () => {
            const imageUrl = inventoryImageUrlInput.value.trim();

            if (!imageUrl) {
                inventoryImagePreview.innerHTML = `
            <div class="admin-image-preview-empty">
                No hay imagen seleccionada para este producto.
            </div>
        `;
                return;
            }

            inventoryImagePreview.innerHTML = `
        <div class="admin-image-preview-card">
            <img src="${escapeAttribute(imageUrl)}" alt="Vista previa del producto" />

            <button type="button" class="btn btn-outline admin-danger-btn" id="removeInventoryImageBtn">
                Quitar imagen
            </button>
        </div>
    `;

            document.getElementById("removeInventoryImageBtn").addEventListener("click", () => {
                inventoryImageUrlInput.value = "";
                renderInventoryImagePreview();
            });
        };

        inventoryImageUrlInput.addEventListener("input", renderInventoryImagePreview);
        renderInventoryImagePreview();
        document.getElementById("uploadInventoryImageBtn").addEventListener("click", async () => {
            const fileInput = document.getElementById("inventoryImageUpload");
            const imageUrlInput = document.getElementById("inventoryImageUrl");
            const uploadMsg = document.getElementById("inventoryUploadMsg");

            const file = fileInput.files[0];

            if (!file) {
                uploadMsg.textContent = "Selecciona una imagen primero.";
                uploadMsg.className = "msg error";
                return;
            }

            const allowedTypes = ["image/png", "image/jpeg", "image/webp"];

            if (!allowedTypes.includes(file.type)) {
                uploadMsg.textContent = "Solo se permiten imágenes PNG, JPG o WEBP.";
                uploadMsg.className = "msg error";
                return;
            }

            const maxSize = 10 * 1024 * 1024;

            if (file.size > maxSize) {
                uploadMsg.textContent = "La imagen es demasiado grande. Máximo 10 MB.";
                uploadMsg.className = "msg error";
                return;
            }

            uploadMsg.textContent = "Subiendo imagen...";
            uploadMsg.className = "msg";

            const serial = document.getElementById("inventorySerial").value.trim().toUpperCase() || "producto";

            const safeFileName = file.name
                .toLowerCase()
                .replaceAll(" ", "-")
                .replace(/[^a-z0-9.\-_]/g, "");

            const filePath = `products/${serial}-${Date.now()}-${safeFileName}`;

            const { error: uploadError } = await GucaSupabase.storage
                .from("inventory-images")
                .upload(filePath, file, {
                    cacheControl: "3600",
                    upsert: false
                });

            if (uploadError) {
                console.error(uploadError);
                uploadMsg.textContent = "No se pudo subir la imagen.";
                uploadMsg.className = "msg error";
                return;
            }

            const { data: publicUrlData } = GucaSupabase.storage
                .from("inventory-images")
                .getPublicUrl(filePath);

            imageUrlInput.value = publicUrlData.publicUrl;
            renderInventoryImagePreview();

            uploadMsg.textContent = "Imagen subida correctamente.";
            uploadMsg.className = "msg success";

            fileInput.value = "";
        });

        document.getElementById("inventoryAdminForm").addEventListener("submit", async (event) => {
            event.preventDefault();

            const msg = document.getElementById("inventoryFormMsg");

            const rawPrice = document.getElementById("inventoryPrice").value;

            const payload = {
                serial: document.getElementById("inventorySerial").value.trim().toUpperCase(),
                name: document.getElementById("inventoryName").value.trim(),
                image_url: document.getElementById("inventoryImageUrl").value.trim() || null,
                category_slug: document.getElementById("inventoryCategory").value,
                type: document.getElementById("inventoryType").value.trim() || "General",
                description: document.getElementById("inventoryDescription").value.trim(),
                price: rawPrice === "" ? null : Number(rawPrice),
                unit: document.getElementById("inventoryUnit").value.trim() || "pieza",
                status: document.getElementById("inventoryStatusInput").value.trim() || "Cotizable",
                icon: document.getElementById("inventoryIcon").value.trim() || "fa-box",
                is_active: document.getElementById("inventoryActive").checked
            };

            msg.textContent = "Guardando...";
            msg.className = "msg";

            let result;

            if (isEditing) {
                result = await GucaSupabase
                    .from("inventory_items")
                    .update(payload)
                    .eq("id", item.id);
            } else {
                result = await GucaSupabase
                    .from("inventory_items")
                    .insert(payload);
            }

            if (result.error) {
                console.error(result.error);
                msg.textContent = "No se pudieron guardar los cambios. Revisa que el folio no esté repetido.";
                msg.className = "msg error";
                return;
            }

            msg.textContent = "Cambios guardados correctamente.";
            msg.className = "msg success";

            setTimeout(() => {
                showAdminSection("inventory");
            }, 700);
        });
    }

    async function loadProjectsAdmin() {
        const list = document.getElementById("projectsAdminList");
        if (!list) return;

        list.textContent = "Cargando obras...";

        const { data, error } = await GucaSupabase
            .from("projects")
            .select("*")
            .order("display_order", { ascending: true });

        if (error) {
            console.error(error);
            list.innerHTML = `
            <div class="msg error">
                No se pudieron cargar las obras.
            </div>
        `;
            return;
        }

        if (!data || data.length === 0) {
            list.innerHTML = `
            <div class="admin-empty-state">
                No hay obras todavía. Usa “Agregar obra”.
            </div>
        `;
            return;
        }

        list.innerHTML = data.map((project) => `
        <article class="admin-item ${project.is_active ? "" : "admin-item-disabled"}">
            <div>
                <span class="pill">${escapeHtml(project.category || "Obra")}</span>
                <h3>${escapeHtml(project.title)}</h3>
                <p>${escapeHtml(project.description)}</p>

                <small>
                    Cliente: ${escapeHtml(project.client || "Sin cliente")}
                    | Año: ${project.project_year || "Sin año"}
                    | Orden: ${project.display_order}
                    | Estado: ${project.is_active ? "Visible" : "Oculto"}
                </small>
            </div>

            <div class="admin-item-actions">
                <button type="button" class="btn btn-outline" data-edit-project="${project.id}">
                    Editar
                </button>

                <button type="button" class="btn btn-outline" data-toggle-project="${project.id}" data-current-active="${project.is_active}">
                    ${project.is_active ? "Ocultar" : "Mostrar"}
                </button>

                <button type="button" class="btn btn-outline admin-danger-btn" data-delete-project="${project.id}">
                    Eliminar
                </button>
            </div>
        </article>
    `).join("");

        document.querySelectorAll("[data-edit-project]").forEach((btn) => {
            btn.addEventListener("click", () => {
                const project = data.find((item) => item.id === Number(btn.dataset.editProject));
                renderProjectForm(project);
            });
        });

        document.querySelectorAll("[data-toggle-project]").forEach((btn) => {
            btn.addEventListener("click", async () => {
                const id = Number(btn.dataset.toggleProject);
                const currentActive = btn.dataset.currentActive === "true";

                const { error } = await GucaSupabase
                    .from("projects")
                    .update({ is_active: !currentActive })
                    .eq("id", id);

                if (error) {
                    alert("No se pudo cambiar el estado.");
                    console.error(error);
                    return;
                }

                await loadProjectsAdmin();
            });
        });

        document.querySelectorAll("[data-delete-project]").forEach((btn) => {
            btn.addEventListener("click", async () => {
                const id = Number(btn.dataset.deleteProject);

                const confirmDelete = confirm("¿Seguro que quieres eliminar esta obra?");
                if (!confirmDelete) return;

                const { error } = await GucaSupabase
                    .from("projects")
                    .delete()
                    .eq("id", id);

                if (error) {
                    alert("No se pudo eliminar la obra.");
                    console.error(error);
                    return;
                }

                await loadProjectsAdmin();
            });
        });
    }

    function renderProjectForm(project = null) {
        const isEditing = Boolean(project);

        const galleryValue = Array.isArray(project?.gallery)
            ? project.gallery.join(", ")
            : project?.gallery || "";

        panelTitle.textContent = isEditing ? "Editar obra" : "Agregar obra";
        panelDescription.textContent = "Llena los datos de la obra y guarda los cambios.";

        panelBody.innerHTML = `
        <form id="projectAdminForm" class="admin-edit-form">
            <input type="hidden" id="projectId" value="${project ? project.id : ""}" />

            <div class="field">
                <label for="projectImageUpload">Subir imagen</label>
                <input
                    id="projectImageUpload"
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                />

                <button
                    type="button"
                    class="btn btn-outline"
                    id="uploadProjectImageBtn"
                    style="margin-top:0.6rem;"
                >
                    Subir imagen
                </button>

                <p id="projectUploadMsg" class="msg" aria-live="polite"></p>
            </div>

            <div class="field">
                <label for="projectGallery">Imágenes del proyecto</label>
                <textarea
                    id="projectGallery"
                    placeholder="Las imágenes subidas aparecerán aquí. También puedes poner URLs separadas por coma."
                >${escapeHtml(galleryValue)}</textarea>
                <small>
                    Puedes tener varias imágenes. Sepáralas por coma. La primera será la imagen principal.
                </small>
            
                <div id="projectGalleryPreview" class="admin-gallery-preview"></div>
            </div>

            <div class="field">
                <label for="projectCategory">Categoría</label>
                <input
                    id="projectCategory"
                    type="text"
                    value="${project ? escapeAttribute(project.category || "") : ""}"
                    placeholder="Ejemplo: Industrial, Instalaciones eléctricas"
                    required
                />
            </div>

            <div class="field">
                <label for="projectTitle">Título de la obra</label>
                <input
                    id="projectTitle"
                    type="text"
                    value="${project ? escapeAttribute(project.title || "") : ""}"
                    placeholder="Ejemplo: Muro divisorio con estructura metálica"
                    required
                />
            </div>

            <div class="field">
                <label for="projectDescription">Descripción</label>
                <textarea
                    id="projectDescription"
                    required
                    placeholder="Describe brevemente la obra realizada."
                >${project ? escapeHtml(project.description || "") : ""}</textarea>
            </div>

            <div class="field">
                <label for="projectClient">Cliente</label>
                <input
                    id="projectClient"
                    type="text"
                    value="${project ? escapeAttribute(project.client || "") : ""}"
                    placeholder="Ejemplo: PCM Corrugados"
                />
            </div>

            <hr class="login-divider" />
            <p class="login-note"><strong>Traducción en inglés</strong> (opcional). Si se deja vacío, el sitio mostrará el texto en español.</p>

            <div class="field">
                <label for="projectCategoryEn">Categoría en inglés</label>
                <input
                    id="projectCategoryEn"
                    type="text"
                    value="${project ? escapeAttribute(project.category_en || "") : ""}"
                    placeholder="Example: Civil works"
                />
            </div>

            <div class="field">
                <label for="projectTitleEn">Título en inglés</label>
                <input
                    id="projectTitleEn"
                    type="text"
                    value="${project ? escapeAttribute(project.title_en || "") : ""}"
                    placeholder="Example: Industrial maintenance project"
                />
            </div>

            <div class="field">
                <label for="projectDescriptionEn">Descripción en inglés</label>
                <textarea
                    id="projectDescriptionEn"
                    placeholder="Project description in English."
                >${project ? escapeHtml(project.description_en || "") : ""}</textarea>
            </div>

            <div class="field">
                <label for="projectClientEn">Cliente en inglés</label>
                <input
                    id="projectClientEn"
                    type="text"
                    value="${project ? escapeAttribute(project.client_en || "") : ""}"
                    placeholder="Example: Private client"
                />
            </div>

            <div class="field">
                <label for="projectAltEn">Texto alternativo en inglés</label>
                <input
                    id="projectAltEn"
                    type="text"
                    value="${project ? escapeAttribute(project.alt_en || "") : ""}"
                    placeholder="Example: Industrial construction work"
                />
            </div>

            <div class="field">
                <label for="projectYear">Año</label>
                <input
                    id="projectYear"
                    type="number"
                    min="1990"
                    max="2100"
                    value="${project && project.project_year ? project.project_year : new Date().getFullYear()}"
                    required
                />
            </div>

            <div class="field">
                <label for="projectAmount">Importe ejecutado</label>
                <input
                    id="projectAmount"
                    type="number"
                    min="0"
                    step="0.01"
                    value="${project && project.amount !== null ? project.amount : ""}"
                    placeholder="Ejemplo: 150000"
                />
                <small>Déjalo vacío si no quieres mostrar importe.</small>
            </div>

            <div class="field">
                <label for="projectAlt">Texto alternativo de imagen</label>
                <input
                    id="projectAlt"
                    type="text"
                    value="${project ? escapeAttribute(project.alt || "") : ""}"
                    placeholder="Ejemplo: Trabajos de construcción industrial"
                />
            </div>

            <div class="field">
                <label for="projectOrder">Orden</label>
                <input
                    id="projectOrder"
                    type="number"
                    min="0"
                    step="1"
                    value="${project ? project.display_order : 1}"
                    required
                />
            </div>

            <div class="field admin-checkbox-field">
                <label>
                    <input
                        id="projectActive"
                        type="checkbox"
                        ${!project || project.is_active ? "checked" : ""}
                    />
                    Visible en la página
                </label>
            </div>

            <div class="admin-form-actions">
                <button type="submit" class="btn btn-primary">
                    Guardar cambios
                </button>

                <button type="button" class="btn btn-outline" id="cancelProjectEdit">
                    Cancelar
                </button>
            </div>

            <p id="projectFormMsg" class="msg" aria-live="polite"></p>
        </form>
    `;

        document.getElementById("cancelProjectEdit").addEventListener("click", () => {
            showAdminSection("projects");
        });

        const projectGalleryInput = document.getElementById("projectGallery");
        const projectGalleryPreview = document.getElementById("projectGalleryPreview");

        const getProjectGalleryArray = () => {
            return projectGalleryInput.value
                .split(",")
                .map(item => item.trim())
                .filter(Boolean);
        };

        const renderProjectGalleryPreview = () => {
            const galleryItems = getProjectGalleryArray();

            if (!galleryItems.length) {
                projectGalleryPreview.innerHTML = `
            <div class="admin-gallery-preview-empty">
                No hay imágenes en esta galería.
            </div>
        `;
                return;
            }

            projectGalleryPreview.innerHTML = galleryItems.map((url, index) => {
                const src =
                    /^https?:\/\//i.test(url) || url.startsWith("assets/")
                        ? url
                        : `assets/Imagenes galería/${encodeURIComponent(url)}`;

                return `
            <div class="admin-gallery-preview-card">
                <img src="${escapeAttribute(src)}" alt="Imagen ${index + 1} del proyecto" />
                <small>${escapeHtml(url)}</small>

                <button
                    type="button"
                    class="btn btn-outline admin-danger-btn"
                    data-remove-project-image="${index}"
                >
                    Quitar
                </button>
            </div>
        `;
            }).join("");

            document.querySelectorAll("[data-remove-project-image]").forEach(button => {
                button.addEventListener("click", () => {
                    const indexToRemove = Number(button.dataset.removeProjectImage);
                    const updatedGallery = getProjectGalleryArray()
                        .filter((_, index) => index !== indexToRemove);

                    projectGalleryInput.value = updatedGallery.join(", ");
                    renderProjectGalleryPreview();
                });
            });
        };

        projectGalleryInput.addEventListener("input", renderProjectGalleryPreview);
        renderProjectGalleryPreview();

        document.getElementById("uploadProjectImageBtn").addEventListener("click", async () => {
            const fileInput = document.getElementById("projectImageUpload");
            const galleryInput = document.getElementById("projectGallery");
            const uploadMsg = document.getElementById("projectUploadMsg");

            const file = fileInput.files[0];

            if (!file) {
                uploadMsg.textContent = "Selecciona una imagen primero.";
                uploadMsg.className = "msg error";
                return;
            }

            const allowedTypes = ["image/png", "image/jpeg", "image/webp"];

            if (!allowedTypes.includes(file.type)) {
                uploadMsg.textContent = "Solo se permiten imágenes PNG, JPG o WEBP.";
                uploadMsg.className = "msg error";
                return;
            }

            const maxSize = 10 * 1024 * 1024;

            if (file.size > maxSize) {
                uploadMsg.textContent = "La imagen es demasiado grande. Máximo 10 MB.";
                uploadMsg.className = "msg error";
                return;
            }

            uploadMsg.textContent = "Subiendo imagen...";
            uploadMsg.className = "msg";

            const safeFileName = file.name
                .toLowerCase()
                .replaceAll(" ", "-")
                .replace(/[^a-z0-9.\-_]/g, "");

            const filePath = `projects/${Date.now()}-${safeFileName}`;

            const { error: uploadError } = await GucaSupabase.storage
                .from("project-images")
                .upload(filePath, file, {
                    cacheControl: "3600",
                    upsert: false
                });

            if (uploadError) {
                console.error(uploadError);
                uploadMsg.textContent = "No se pudo subir la imagen.";
                uploadMsg.className = "msg error";
                return;
            }

            const { data: publicUrlData } = GucaSupabase.storage
                .from("project-images")
                .getPublicUrl(filePath);

            const publicUrl = publicUrlData.publicUrl;
            const currentGallery = galleryInput.value.trim();

            galleryInput.value = currentGallery
                ? `${currentGallery}, ${publicUrl}`
                : publicUrl;
            renderProjectGalleryPreview();

            uploadMsg.textContent = "Imagen subida correctamente.";
            uploadMsg.className = "msg success";

            fileInput.value = "";
        });

        document.getElementById("projectAdminForm").addEventListener("submit", async (event) => {
            event.preventDefault();

            const msg = document.getElementById("projectFormMsg");

            const rawAmount = document.getElementById("projectAmount").value;
            const rawGallery = document.getElementById("projectGallery").value.trim();

            const galleryArray = rawGallery
                ? rawGallery.split(",").map((item) => item.trim()).filter(Boolean)
                : [];

            const payload = {
                category: document.getElementById("projectCategory").value.trim(),
                title: document.getElementById("projectTitle").value.trim(),
                description: document.getElementById("projectDescription").value.trim(),
                client: document.getElementById("projectClient").value.trim(),
                category_en: document.getElementById("projectCategoryEn").value.trim() || null,
                title_en: document.getElementById("projectTitleEn").value.trim() || null,
                description_en: document.getElementById("projectDescriptionEn").value.trim() || null,
                client_en: document.getElementById("projectClientEn").value.trim() || null,
                alt_en: document.getElementById("projectAltEn").value.trim() || null,
                project_year: Number(document.getElementById("projectYear").value),
                amount: rawAmount === "" ? null : Number(rawAmount),
                gallery: galleryArray,
                image_url: galleryArray[0] || null,
                alt: document.getElementById("projectAlt").value.trim(),
                display_order: Number(document.getElementById("projectOrder").value),
                is_active: document.getElementById("projectActive").checked
            };

            msg.textContent = "Guardando...";
            msg.className = "msg";

            let result;

            if (isEditing) {
                result = await GucaSupabase
                    .from("projects")
                    .update(payload)
                    .eq("id", project.id);
            } else {
                result = await GucaSupabase
                    .from("projects")
                    .insert(payload);
            }

            if (result.error) {
                console.error(result.error);
                msg.textContent = "No se pudieron guardar los cambios.";
                msg.className = "msg error";
                return;
            }

            msg.textContent = "Cambios guardados correctamente.";
            msg.className = "msg success";

            setTimeout(() => {
                showAdminSection("projects");
            }, 700);
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
});