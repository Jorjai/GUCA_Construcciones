# GUCA language system notes

This version adds a scalable JavaScript-based language system.

## New files

```txt
js_files/language.js
js_files/translations/en.js
js_files/translations/es.js
```

## How it works

HTML elements use translation attributes such as:

```html
<h1 data-i18n="home.title">Construcción sólida, resultados que duran.</h1>
<input data-i18n-placeholder="home.contact.namePlaceholder" />
<p data-i18n-html="home.introHtml">...</p>
```

The language selector stores the selected language in:

```txt
localStorage.gucaLanguage
```

Default language is English (`en`).

## Add a future language

1. Create a new file:

```txt
js_files/translations/fr.js
```

2. Add the same object structure as `en.js`.
3. Add the script before `language.js` in the HTML.
4. Add an option to the language selector:

```html
<option value="fr">🌐 FR</option>
```

## Important note for admin content

The public interface is translated by JavaScript. Content that comes from Supabase, such as project names, project descriptions, inventory items, and service cards, should be entered in the language the client wants to display. For a future fully multilingual database, add translated fields in Supabase such as `title_en`, `title_es`, `description_en`, and `description_es`.
