// js_files/language.js
// Scalable language switcher for GUCA Construcciones.
// Add more languages by creating another file in js_files/translations/ and adding an option in the selector.
(function () {
    const STORAGE_KEY = "gucaLanguage";
    const DEFAULT_LANGUAGE = "es";

    function getTranslations() {
        return window.GucaTranslations || {};
    }

    function getAvailableLanguages() {
        return Object.keys(getTranslations());
    }

    function getSavedLanguage() {
        const saved = localStorage.getItem(STORAGE_KEY);
        const available = getAvailableLanguages();

        if (saved && available.includes(saved)) return saved;
        if (available.includes(DEFAULT_LANGUAGE)) return DEFAULT_LANGUAGE;
        return available[0] || DEFAULT_LANGUAGE;
    }

    function getNestedValue(object, path) {
        return path.split(".").reduce((current, key) => {
            if (current && Object.prototype.hasOwnProperty.call(current, key)) {
                return current[key];
            }
            return undefined;
        }, object);
    }

    function interpolate(text, params = {}) {
        if (typeof text !== "string") return text;

        return text.replace(/\{(\w+)\}/g, (_, key) => {
            return Object.prototype.hasOwnProperty.call(params, key) ? params[key] : `{${key}}`;
        });
    }

    function t(key, params = {}, fallback = "") {
        const language = getSavedLanguage();
        const translations = getTranslations();
        const value = getNestedValue(translations[language] || {}, key);

        if (value !== undefined && value !== null) {
            return interpolate(value, params);
        }

        const fallbackValue = getNestedValue(translations[DEFAULT_LANGUAGE] || {}, key);
        if (fallbackValue !== undefined && fallbackValue !== null) {
            return interpolate(fallbackValue, params);
        }

        return fallback || key;
    }

    function translatePage(root = document) {
        const language = getSavedLanguage();
        document.documentElement.lang = language;

        root.querySelectorAll("[data-i18n]").forEach((element) => {
            const key = element.getAttribute("data-i18n");
            if (!key) return;
            element.textContent = t(key, {}, element.textContent);
        });

        root.querySelectorAll("[data-i18n-html]").forEach((element) => {
            const key = element.getAttribute("data-i18n-html");
            if (!key) return;
            element.innerHTML = t(key, {}, element.innerHTML);
        });

        ["placeholder", "aria-label", "title", "value", "content"].forEach((attributeName) => {
            root.querySelectorAll(`[data-i18n-${attributeName}]`).forEach((element) => {
                const key = element.getAttribute(`data-i18n-${attributeName}`);
                if (!key) return;
                element.setAttribute(attributeName, t(key, {}, element.getAttribute(attributeName) || ""));
            });
        });

        root.querySelectorAll("select.language-select").forEach((select) => {
            select.value = language;
        });
    }

    function setLanguage(language) {
        const available = getAvailableLanguages();
        if (!available.includes(language)) return;

        localStorage.setItem(STORAGE_KEY, language);
        translatePage(document);
        document.dispatchEvent(new CustomEvent("guca:languageChanged", { detail: { language } }));

        // Reload so Supabase-driven content is fetched again using the selected language.
        // This keeps dynamic service cards, projects, categories and inventory consistent.
        window.setTimeout(() => window.location.reload(), 60);
    }

    function initLanguageSelectors() {
        document.querySelectorAll("select.language-select").forEach((select) => {
            select.value = getSavedLanguage();
            select.addEventListener("change", () => setLanguage(select.value));
        });
    }

    window.GucaI18n = {
        t,
        setLanguage,
        getLanguage: getSavedLanguage,
        translatePage
    };

    document.addEventListener("DOMContentLoaded", () => {
        initLanguageSelectors();
        translatePage(document);
    });
})();
