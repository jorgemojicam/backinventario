# Backend Node.js + Express + MySQL

Backend con arquitectura en capas para gestionar **usuarios** y **productos**.

## Arquitectura

```
src/
├── config/
│   └── db.js              # Pool de conexiones MySQL
├── routes/                # Definición de endpoints (capa HTTP)
│   ├── index.js
│   ├── usuario.routes.js
│   └── producto.routes.js
├── controllers/           # Maneja req/res, delega en servicios
│   ├── usuario.controller.js
│   └── producto.controller.js
├── services/               # Lógica de negocio y validaciones
│   ├── usuario.service.js
│   └── producto.service.js
├── repositories/           # Acceso a datos (SQL puro con mysql2)
│   ├── usuario.repository.js
│   └── producto.repository.js
├── middlewares/
│   └── errorHandler.js     # Manejo centralizado de errores
├── utils/
│   └── ApiError.js         # Clase de error personalizada
├── app.js                  # Configuración de Express
└── server.js               # Punto de entrada
```

Flujo de una petición:
`Ruta → Controlador → Servicio (validaciones/reglas) → Repositorio (SQL) → MySQL`

Ventajas de esta separación:
- **Repositorios**: único lugar que conoce SQL. Si cambias de motor de BD, solo tocas esta capa.
- **Servicios**: reglas de negocio y validaciones, reutilizables e independientes de HTTP.
- **Controladores**: delgados, solo traducen HTTP ↔ servicios.
- **Manejo de errores centralizado** con `express-async-errors`, evita try/catch repetido.

## Instalación

```bash
cd backend
npm install
cp .env.example .env
```

Edita `.env` con tus credenciales de MySQL:

```
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=tu_password
DB_NAME=tu_base_de_datos
```

Si tus tablas `usuarios` y `productos` no existen aún, puedes usar `schema.sql` como referencia (ajústalo a tu estructura real):

```bash
mysql -u root -p tu_base_de_datos < schema.sql
```

## Ejecutar

```bash
npm run dev    # con nodemon (desarrollo)
npm start      # producción
```

El servidor corre en `http://localhost:3000/api/v1`.

## Endpoints

### Usuarios
| Método | Ruta | Descripción |
|---|---|---|
| GET | /api/v1/usuarios?page=1&pageSize=20 | Listar usuarios (paginado) |
| GET | /api/v1/usuarios/:id | Obtener usuario por id |
| POST | /api/v1/usuarios | Crear usuario `{nombre, email, password}` |
| PUT | /api/v1/usuarios/:id | Actualizar usuario `{nombre, email}` |
| DELETE | /api/v1/usuarios/:id | Eliminar usuario |
| GET | /api/v1/usuarios/:usuarioId/productos | Productos de un usuario |

### Productos
| Método | Ruta | Descripción |
|---|---|---|
| GET | /api/v1/productos?page=1&pageSize=20 | Listar productos (paginado) |
| GET | /api/v1/productos/:id | Obtener producto por id |
| POST | /api/v1/productos | Crear producto `{nombre, descripcion, precio, stock, usuario_id}` |
| PUT | /api/v1/productos/:id | Actualizar producto |
| DELETE | /api/v1/productos/:id | Eliminar producto |

### Salud
`GET /api/v1/health` → estado de la API.

## Notas importantes

- **Ajusta las columnas** en `usuario.repository.js` y `producto.repository.js` si tus tablas reales tienen nombres distintos.
- En producción, **hashea las contraseñas** (bcrypt) antes de guardarlas — está señalado con un comentario en `usuario.service.js`.
- Todas las consultas usan **parámetros preparados** (`?`) para prevenir inyección SQL.
- El pool de conexiones (`mysql2/promise`) reutiliza conexiones, ideal para producción.
