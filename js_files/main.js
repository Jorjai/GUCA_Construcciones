// Main JS
document.addEventListener('DOMContentLoaded', () => {
    /* ======================
       Smooth scroll with header offset
       ====================== */
    const headerEl = document.querySelector('header');
    const headerHeight = headerEl ? headerEl.offsetHeight : 0;

    document.querySelectorAll('a[href^="#"]').forEach(link => {
        link.addEventListener('click', e => {
            const target = document.querySelector(link.getAttribute('href'));
            if (target) {
                e.preventDefault();
                const y = target.getBoundingClientRect().top + window.scrollY - headerHeight + 10;
                window.scrollTo({ top: y, behavior: 'smooth' });
            }
        });
    });

    /* ======================
   Hero gallery grid (auto, rotates items)
   ====================== */
    const heroGallery = document.getElementById('hero-gallery');

    if (heroGallery) {
        fetch('/api/gallery')
            .then(res => res.json())
            .then(data => {
                const allItems = data.items || [];
                if (!allItems.length) return;

                const visibleCount = Math.min(3, allItems.length);
                const folderPath = 'assets/Imagenes galería/';
                const folderUrl = encodeURI(folderPath);

                let startIndex = 0;
                let visibleIndices = Array.from({ length: visibleCount }, (_, i) => i);

                const slots = [];
                for (let i = 0; i < visibleCount; i++) {
                    const fig = document.createElement('figure');
                    fig.className = 'hero-gallery-slide';
                    heroGallery.appendChild(fig);
                    slots.push(fig);
                }

                const FADE_DELAY = 200;

                const renderSlots = (initial = false) => {
                    slots.forEach((fig, slotIndex) => {
                        const item = allItems[visibleIndices[slotIndex]];
                        if (!item) return;

                        const updateContent = () => {
                            fig.innerHTML = '';

                            if (item.type === 'video') {
                                const video = document.createElement('video');
                                video.src = folderUrl + encodeURIComponent(item.name);
                                video.muted = true;
                                video.loop = true;
                                video.autoplay = true;
                                video.playsInline = true;
                                fig.appendChild(video);
                            } else {
                                const img = document.createElement('img');
                                img.src = folderUrl + encodeURIComponent(item.name);
                                img.alt = item.name;
                                fig.appendChild(img);
                            }

                            requestAnimationFrame(() => {
                                fig.style.opacity = '1';
                            });
                        };

                        if (initial) {
                            updateContent();
                        } else {
                            fig.style.opacity = '0';
                            setTimeout(updateContent, FADE_DELAY);
                        }
                    });
                };

                renderSlots(true);

                if (allItems.length > visibleCount) {
                    setInterval(() => {
                        startIndex = (startIndex + visibleCount) % allItems.length;
                        visibleIndices = visibleIndices.map((_, i) =>
                            (startIndex + i) % allItems.length
                        );
                        renderSlots(false);
                    }, 7000);
                }
            })
            .catch(err => {
                console.error('Error loading gallery:', err);
            });
    }

    /* ======================
   Contact form handling
   ====================== */
    const form = document.getElementById('contact-form');
    const msgEl = document.getElementById('form-msg');

    if (form && msgEl) {
        // --- inputs ---
        const nameInput = form.querySelector('input[name="name"]');
        const emailInput = form.querySelector('input[name="email"]');
        const countrySelect = form.querySelector('select[name="phoneCountry"]');
        const phoneInput = form.querySelector('input[name="phoneNumber"]');
        const projectTypeInput = form.querySelector('select[name="projectType"]');
        const confirmationEl = document.getElementById('contact-confirmation');
        const confirmationCloseBtn = document.getElementById('contact-confirmation-close');

        // --- basic patterns ---
        const NAME_REGEX =
            /^[A-Za-zÁÉÍÓÚÜáéíóúüÑñ]+(?:\s+[A-Za-zÁÉÍÓÚÜáéíóúüÑñ]+)+$/; // al menos nombre + apellido
        const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const PHONE_REGEX = /^\d{10}$/; // solo 10 dígitos

        // --- spam limit (por día, por navegador) ---
        const MESSAGE_STATS_KEY = 'contactMessageStats';
        const MAX_MESSAGES_PER_DAY = 3; // cámbialo a 5 si quieres

        const getToday = () => new Date().toISOString().slice(0, 10);

        function getMessageStats() {
            try {
                const raw = localStorage.getItem(MESSAGE_STATS_KEY);
                return raw ? JSON.parse(raw) : {};
            } catch {
                return {};
            }
        }

        function saveMessageStats(stats) {
            try {
                localStorage.setItem(MESSAGE_STATS_KEY, JSON.stringify(stats));
            } catch {
                /* ignore */
            }
        }

        function canSendMoreToday() {
            const stats = getMessageStats();
            if (stats.date !== getToday()) return true;
            return (stats.count || 0) < MAX_MESSAGES_PER_DAY;
        }

        function registerSentMessage() {
            const stats = getMessageStats();
            const today = getToday();
            if (stats.date === today) {
                stats.count = (stats.count || 0) + 1;
            } else {
                stats.date = today;
                stats.count = 1;
            }
            saveMessageStats(stats);
        }

        // --- helpers UI ---
        function clearFieldErrors() {
            form.querySelectorAll('.field-error').forEach(el =>
                el.classList.remove('field-error')
            );
        }

        function showError(message, fieldToFocus) {
            msgEl.textContent = message;
            msgEl.className = 'msg error';
            if (fieldToFocus) {
                fieldToFocus.classList.add('field-error');
                fieldToFocus.focus();
            }
        }

        function showConfirmation() {
            if (confirmationEl) {
                confirmationEl.removeAttribute('hidden');
            } else {
                // fallback si no agregas la pantalla
                msgEl.textContent = '¡Gracias! Hemos recibido tu mensaje. Te contactaremos pronto.';
                msgEl.className = 'msg success';
            }
        }

        if (confirmationCloseBtn && confirmationEl) {
            confirmationCloseBtn.addEventListener('click', () => {
                confirmationEl.setAttribute('hidden', 'hidden');
            });
        }

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            clearFieldErrors();

            // --- spam check ---
            if (!canSendMoreToday()) {
                const limitMsg =
                    MAX_MESSAGES_PER_DAY === 1
                        ? 'Ya has enviado 1 mensaje hoy. Intenta de nuevo mañana.'
                        : `Has alcanzado el límite de ${MAX_MESSAGES_PER_DAY} mensajes hoy. Intenta de nuevo mañana.`;
                showError(limitMsg);
                return;
            }

            const data = new FormData(form);
            const name = (data.get('name') || '').toString().trim();
            const email = (data.get('email') || '').toString().trim();
            const phoneCountry =
                (data.get('phoneCountry') || '').toString().trim() || '+52'; // México por defecto
            const phoneNumber = (data.get('phoneNumber') || '').toString().trim();
            const message = (data.get('message') || '').toString().trim();
            const projectType = (data.get('projectType') || '').toString().trim();

            // --- required fields ---
            if (!name || !email || !phoneNumber || !message) {
                showError('Por favor completa los campos obligatorios (*).');
                return;
            }

            // --- name validation: solo letras + espacios, al menos nombre y apellido ---
            if (!NAME_REGEX.test(name)) {
                showError(
                    'Escribe tu nombre completo (nombre y apellido) solo con letras.',
                    nameInput
                );
                return;
            }

            // --- email validation ---
            if (!EMAIL_REGEX.test(email)) {
                showError('Escribe un correo electrónico válido (ej. nombre@dominio.com).', emailInput);
                return;
            }

            // --- phone validation: solo dígitos, 10 números ---
            if (!PHONE_REGEX.test(phoneNumber)) {
                showError('Escribe un número de teléfono de 10 dígitos, solo números.', phoneInput);
                return;
            }

            const fullPhone = `${phoneCountry}${phoneNumber}`;

            // --- front-end “sending…” state ---
            msgEl.textContent = 'Enviando mensaje...';
            msgEl.className = 'msg';

            // ================================
            //  IMPORTANT:
            //  Esto necesita un endpoint en tu backend
            //  que envíe el correo a construcciones.guca@gmail.com
            //  Ejemplo: POST /api/contact
            // ================================
            fetch('/api/contact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name,
                    email,
                    phone: fullPhone,
                    projectType,
                    message,
                }),
            })
                .then((res) => {
                    if (!res.ok) {
                        throw new Error('Error al enviar');
                    }
                    return res.json().catch(() => ({}));
                })
                .then(() => {
                    // éxito
                    registerSentMessage();
                    form.reset();
                    msgEl.textContent = '';
                    msgEl.className = 'msg';
                    showConfirmation();
                })
                .catch(() => {
                    showError(
                        'Hubo un problema al enviar tu mensaje. Intenta de nuevo en unos minutos.'
                    );
                });
        });
    }

    /* ======================
       Footer year
       ====================== */
    const yearSpan = document.getElementById('year');
    if (yearSpan) {
        yearSpan.textContent = new Date().getFullYear().toString();
    }

    /* ======================
       Theme toggle
       ====================== */
    const toggleBtn = document.getElementById('theme-toggle');
    if (toggleBtn) {
        const currentTheme = localStorage.getItem('theme') || 'light';
        document.documentElement.setAttribute('data-theme', currentTheme);
        toggleBtn.textContent = currentTheme === 'dark' ? '☀️' : '🌙';

        toggleBtn.addEventListener('click', () => {
            const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
            const newTheme = isDark ? 'light' : 'dark';

            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
            toggleBtn.textContent = newTheme === 'dark' ? '☀️' : '🌙';
        });
    }
    // === Copy email & toast feedback ===
    const EMAIL = 'construcciones.guca@gmail.com';

    const copyEmailBtn = document.getElementById('copyEmailBtn');
    const contactEmailLink = document.getElementById('contactEmailLink');
    const toastEl = document.getElementById('copyToast');
    let toastTimeoutId = null;

    function showToast(message) {
        if (!toastEl) return;

        toastEl.textContent = message;
        toastEl.classList.add('show');

        if (toastTimeoutId) {
            clearTimeout(toastTimeoutId);
        }

        toastTimeoutId = setTimeout(() => {
            toastEl.classList.remove('show');
        }, 1500);
    }

    function copyEmailToClipboard(e) {
        // prevent mail app opening when we just want to copy
        if (e) e.preventDefault();

        navigator.clipboard.writeText(EMAIL)
            .then(() => {
                showToast('Correo copiado al portapapeles');
            })
            .catch(() => {
                showToast('No se pudo copiar el correo');
            });
    }

// Footer icon
    if (copyEmailBtn) {
        copyEmailBtn.addEventListener('click', copyEmailToClipboard);
    }

// Contact section email
    if (contactEmailLink) {
        contactEmailLink.addEventListener('click', copyEmailToClipboard);
    }

// Volver arriba button smooth scroll
    const backTopBtn = document.querySelector('.back-top-btn');
    if (backTopBtn) {
        backTopBtn.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }
    /* ======================
    Obras ejecutadas (projects from JSON)
    ====================== */
    const projectsGrid = document.getElementById('projectsGrid');

    if (projectsGrid) {
        const PROJECT_MEDIA_PATH = 'assets/Imagenes galería/';
        const isVideoFile = (fileName = '') =>
            /\.(mp4|webm|ogg|mov)$/i.test(fileName);

        // NEW: controls
        const loadMoreBtn = document.getElementById('projectsLoadMore');
        const sortButtons = document.querySelectorAll('[data-project-sort]');
        const projectsStatus = document.getElementById('projectsStatus');

        // NEW: state
        const INITIAL_VISIBLE = 6;   // show 6 first (hide last 3)
        const BATCH_SIZE = 3;        // show 3 more each click
        let allProjects = [];
        let currentSort = 'default';
        let visibleCount = INITIAL_VISIBLE;
        let isExpanded = false;      // <--- NUEVO

        // --- helpers ---

        // sort without mutating original
        const getSortedProjects = () => {
            const arr = [...allProjects];

            if (currentSort === 'year-desc') {
                arr.sort((a, b) => b.year - a.year);
            } else if (currentSort === 'client') {
                arr.sort((a, b) =>
                    (a.client || '').localeCompare(b.client || '', 'es')
                );
            }
            // 'default' = original order
            return arr;
        };

        // build one card (your existing logic moved to a function)
        const createProjectCard = (project) => {
            const article = document.createElement('article');
            article.className = 'card project-card';

            // Optional category pill
            if (project.category) {
                const pill = document.createElement('div');
                pill.className = 'pill';
                pill.textContent = project.category.toUpperCase();
                article.appendChild(pill);
            }

            // ----- THUMB WITH HOVER SLIDESHOW -----

            // gallery can be string or array in JSON – normalize to array
            const mediaList = Array.isArray(project.gallery)
                ? project.gallery
                : project.gallery
                    ? [project.gallery]
                    : [];

            if (mediaList.length > 0) {
                const thumb = document.createElement('div');
                thumb.className = 'project-thumb';
                thumb.tabIndex = 0; // keyboard focus support

                const createMediaElement = (fileName) => {
                    const src = PROJECT_MEDIA_PATH + encodeURIComponent(fileName);

                    if (isVideoFile(fileName)) {
                        const video = document.createElement('video');
                        video.src = src;
                        video.muted = true;
                        video.autoplay = true;
                        video.loop = true;
                        video.playsInline = true;
                        video.setAttribute(
                            'aria-label',
                            project.alt || project.title || ''
                        );
                        return video;
                    } else {
                        const img = document.createElement('img');
                        img.src = src;
                        img.alt = project.alt || project.title || '';
                        img.loading = 'lazy';
                        return img;
                    }
                };

                let currentIndex = 0;
                let activeEl = createMediaElement(mediaList[0]);
                thumb.appendChild(activeEl);

                // Only slideshow if more than 1 media file
                if (mediaList.length > 1) {
                    let intervalId = null;

                    const switchMedia = () => {
                        currentIndex = (currentIndex + 1) % mediaList.length;
                        const nextEl = createMediaElement(mediaList[currentIndex]);
                        thumb.replaceChild(nextEl, activeEl);
                        activeEl = nextEl;
                    };

                    const startSlideshow = () => {
                        if (intervalId !== null) return;
                        intervalId = setInterval(switchMedia, 1500);
                    };

                    const stopSlideshow = () => {
                        if (intervalId === null) return;
                        clearInterval(intervalId);
                        intervalId = null;
                        currentIndex = 0;
                        const firstEl = createMediaElement(mediaList[0]);
                        thumb.replaceChild(firstEl, activeEl);
                        activeEl = firstEl;
                    };

                    thumb.addEventListener('mouseenter', startSlideshow);
                    thumb.addEventListener('mouseleave', stopSlideshow);
                    thumb.addEventListener('focusin', startSlideshow);
                    thumb.addEventListener('focusout', stopSlideshow);
                }

                article.appendChild(thumb);
            }

            // Main title
            const h3 = document.createElement('h3');
            h3.textContent = project.title;
            article.appendChild(h3);

            // Description
            const desc = document.createElement('p');
            desc.textContent = project.description;
            article.appendChild(desc);

            // Meta list (separated lines)
            const metaList = document.createElement('ul');
            metaList.className = 'project-meta-list';

            const amountFormatted =
                typeof project.amount === 'number'
                    ? project.amount.toLocaleString('es-MX', {
                        style: 'currency',
                        currency: 'MXN',
                    })
                    : project.amount;

            metaList.innerHTML = `
                <li><strong>Año:</strong> ${project.year}</li>
                <li><strong>Cliente:</strong> ${project.client}</li>
                <li><strong>Importe ejecutado:</strong> ${amountFormatted}</li>
            `;

            article.appendChild(metaList);
            return article;
        };

        // render according to current sort + visibleCount
        const renderProjects = () => {
            projectsGrid.innerHTML = '';

            const sorted = getSortedProjects();
            const total = sorted.length;

            // how many to show depending on toggle
            const effectiveVisible = isExpanded
                ? total
                : Math.min(visibleCount, total || 0);

            const toShow = sorted.slice(0, effectiveVisible);
            toShow.forEach((project) => {
                const card = createProjectCard(project);
                projectsGrid.appendChild(card);
            });

            // --- status text ---
            if (projectsStatus) {
                if (!total) {
                    projectsStatus.textContent = 'No hay obras para mostrar.';
                } else if (isExpanded || effectiveVisible === total) {
                    projectsStatus.textContent = `Mostrando todas las ${total} obras.`;
                } else {
                    projectsStatus.textContent =
                        `Mostrando primeras ${effectiveVisible} de ${total} obras. ` +
                        `Usa “Ver más” para ver el resto.`;
                }
            }

            // --- button visibility + label ---
            if (loadMoreBtn) {
                if (total <= INITIAL_VISIBLE) {
                    // nothing to expand/collapse
                    loadMoreBtn.style.display = 'none';
                } else {
                    loadMoreBtn.style.display = 'inline-flex';
                    loadMoreBtn.textContent = isExpanded ? 'Ver menos' : 'Ver más obras';
                }
            }
        };

        // --- event handlers ---

        if (loadMoreBtn) {
            loadMoreBtn.addEventListener('click', () => {
                const total = getSortedProjects().length;

                if (!isExpanded) {
                    // expand to show everything
                    isExpanded = true;
                    visibleCount = total;
                } else {
                    // collapse back to initial
                    isExpanded = false;
                    visibleCount = INITIAL_VISIBLE;
                }

                renderProjects();
            });
        }

        if (sortButtons.length) {
            sortButtons.forEach((btn) => {
                btn.addEventListener('click', () => {
                    currentSort = btn.dataset.projectSort || 'default';
                    renderProjects();
                });
            });
        }

        // --- fetch data and initial render ---

        fetch('data/projects.json')
            .then((res) => res.json())
            .then((projects) => {
                allProjects = projects || [];

                if (allProjects.length <= INITIAL_VISIBLE) {
                    visibleCount = allProjects.length;
                    isExpanded = true; // no toggle needed
                }

                renderProjects();
            })
            .catch((err) => {
                console.error('Error cargando projects.json:', err);
            });
    }
});