# GUCA Construcciones

Sitio web para **GUCA Construcciones**, desarrollado para presentar servicios de construcción, obras ejecutadas, una división de suministros y un panel administrador para gestionar el contenido del sitio.

El proyecto incluye páginas públicas, formularios de contacto, administración de solicitudes, carga de imágenes, autenticación de administradores y conexión con Supabase.

---

## Tecnologías utilizadas

- HTML5
- CSS3
- JavaScript
- Supabase
    - Authentication
    - Database
    - Storage
    - Row Level Security
- Netlify
    - Hosting
    - Forms
    - Form notifications
- Google OAuth
- Font Awesome

---

## Páginas principales

### Página de inicio

Archivo:

```txt
index.html
```

Incluye:

- Presentación de GUCA Construcciones.
- Servicios principales.
- Obras ejecutadas.
- Galería de imágenes.
- Formulario de contacto.
- Modo claro / oscuro.
- Menú móvil responsivo.

### Página de suministros

Archivo:

```txt
suministros.html
```

Incluye:

- División comercializadora.
- Categorías de suministros.
- Inventario dinámico.
- Filtros por categoría y tipo.
- Ordenamiento por precio, nombre, categoría, tipo y folio.
- Buscador de productos.
- Formulario de cotización.
- Registro de solicitudes en Supabase.
- Envío de formulario a Netlify.

### Página de login

Archivo:

```txt
login.html
```

Incluye:

- Inicio de sesión con correo y contraseña.
- Inicio de sesión con Google.
- Redirección al panel administrador.

### Panel administrador

Archivo:

```txt
admin.html
```

Permite administrar:

- Imágenes de inicio.
- Servicios.
- Obras ejecutadas.
- Categorías de suministros.
- Inventario.
- Solicitudes de servicios.
- Solicitudes de suministros.

### Páginas de confirmación

Archivos:

```txt
contacto-exito.html
suministros-exito.html
```

Se muestran después de enviar correctamente los formularios.

### Página 404

Archivo:

```txt
404.html
```

Muestra una página personalizada cuando el usuario entra a una ruta inexistente.

---

## Funciones del panel administrador

El panel administrador permite editar contenido sin modificar directamente el código.

### Dashboard

El panel incluye un resumen rápido con estadísticas de:

- Servicios activos.
- Obras visibles.
- Productos activos.
- Solicitudes de servicios nuevas, contactadas, en proceso y cerradas.
- Solicitudes de suministros nuevas, contactadas, en proceso y cerradas.

### Imágenes de inicio

- Agregar imágenes.
- Subir imágenes a Supabase Storage.
- Editar título, texto alternativo y orden.
- Ocultar o mostrar imágenes.
- Eliminar imágenes.

### Servicios

- Agregar servicios.
- Editar título, etiqueta y descripción.
- Cambiar orden.
- Mostrar u ocultar servicios.
- Eliminar servicios.

### Obras ejecutadas

- Agregar proyectos.
- Subir imágenes.
- Agregar galería de imágenes.
- Editar cliente, año, importe, descripción y categoría.
- Mostrar u ocultar proyectos.
- Eliminar proyectos.

### Categorías de suministros

- Crear categorías.
- Editar nombre, descripción, ícono y orden.
- Mostrar u ocultar categorías.
- Eliminar categorías.

### Inventario

- Agregar productos.
- Subir imágenes de productos.
- Editar folio, nombre, categoría, tipo, precio, unidad, estado e ícono.
- Mostrar u ocultar productos.
- Eliminar productos.

### Solicitudes

El sistema separa las solicitudes en dos secciones:

```txt
Solicitudes de servicios
Solicitudes de suministros
```

Cada solicitud puede tener estos estados:

```txt
Nueva
Contactado
En proceso
Cerrada
```

---

## Base de datos en Supabase

El proyecto usa Supabase como backend.

Tablas principales:

```txt
profiles
service_cards
projects
supply_categories
inventory_items
supply_requests
service_requests
home_gallery_images
```

### profiles

Guarda los usuarios registrados y su rol.

Campos principales:

```txt
id
email
role
created_at
```

### service_cards

Guarda los servicios mostrados en la página principal.

### projects

Guarda las obras ejecutadas, información del proyecto e imágenes.

### supply_categories

Guarda las categorías de suministros.

### inventory_items

Guarda los productos del inventario.

### supply_requests

Guarda las solicitudes enviadas desde la página de suministros.

### service_requests

Guarda las solicitudes enviadas desde el formulario principal.

### home_gallery_images

Guarda las imágenes principales de la página de inicio.

---

## Autenticación

El proyecto usa Supabase Authentication.

Métodos activos:

- Correo y contraseña.
- Google OAuth.

Solo los usuarios con rol:

```txt
admin
```

pueden acceder al panel administrador.

Si un usuario no tiene rol de administrador, el sistema bloquea el acceso y lo redirige.

---

## Netlify Forms

El proyecto usa Netlify Forms para recibir notificaciones por correo.

Formularios usados:

```txt
contact
suministros
```

El formulario principal guarda la solicitud en Supabase y también envía la información a Netlify.

El formulario de suministros guarda la solicitud en Supabase y también envía la información a Netlify.

---

## Supabase Storage

El proyecto usa Supabase Storage para subir imágenes.

Buckets usados:

```txt
home-images
project-images
inventory-images
```

Uso:

- `home-images`: imágenes principales del inicio.
- `project-images`: imágenes de obras ejecutadas.
- `inventory-images`: imágenes de productos.

---

## Cómo ejecutar el proyecto localmente

Instalar dependencias:

```bash
npm install
```

Ejecutar servidor local:

```bash
npm run dev
```

Abrir el proyecto en el navegador usando la URL local que indique la terminal.

---

## Archivos principales

```txt
index.html
suministros.html
login.html
admin.html
contacto-exito.html
suministros-exito.html
404.html
css/styles.css
js_files/main.js
js_files/suministros.js
js_files/admin.js
js_files/auth.js
js_files/supabaseClient.js
```

---

## Despliegue

El proyecto se despliega en Netlify.

Sitio en producción:

```txt
https://gucaconstrucciones.netlify.app
```

Para subir cambios:

```bash
git status
git add .
git commit -m "mensaje del cambio"
git push
```

Netlify detecta el cambio en GitHub y despliega automáticamente.

---

## Seguridad

El proyecto usa Row Level Security en Supabase.

El acceso de escritura para el panel administrador depende del rol del usuario en la tabla `profiles`.

Los usuarios públicos pueden enviar formularios, pero no pueden administrar contenido.

---

## Mejoras futuras

Posibles mejoras para una siguiente versión:

- Portal de pagos en línea.
- Carrito de suministros.
- Historial de pedidos para clientes.
- Filtros avanzados en el panel administrador.
- Exportar solicitudes a CSV o Excel.
- Notificaciones automáticas por correo desde Supabase Functions.
- Roles adicionales para usuarios.
- Panel de clientes.
- Mejor sistema de reportes y estadísticas.
- Confirmación automática por correo al cliente.

---

## Estado del proyecto

El proyecto actualmente incluye:

- Sitio público funcional.
- Página de suministros funcional.
- Panel administrador funcional.
- Autenticación con correo y Google.
- Formularios conectados a Supabase.
- Formularios conectados a Netlify.
- Diseño responsivo para móvil, tablet y escritorio.
- Modo claro y oscuro.