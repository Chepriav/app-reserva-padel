# CLAUDE.md

Guía esencial para Claude Code. Documentación detallada en `docs/`.

## Proyecto

App React Native (Expo) + PWA para reservas de pistas de pádel en urbanización. Residentes reservan turnos, ven disponibilidad y gestionan reservas. Sistema de prioridades (Garantizada/Provisional) por vivienda.

## Stack

- **Frontend**: React Native + Expo (iOS, Android, Web/PWA)
- **Backend**: Supabase (Auth + PostgreSQL + Edge Functions + Storage)
- **Hosting**: Vercel (web)

## Comandos

```bash
npm install          # Instalar dependencias
npm start            # Servidor desarrollo
npm run web          # Navegador (PWA)
npm test             # Tests
npm run lint         # Verificar código
```

## Estructura

```
src/
├── screens/          # Pantallas (orquestadores)
│   ├── HomeScreen.js           # Reservas + bloqueos
│   ├── ReservationsScreen.js   # Mis reservas
│   ├── MatchesScreen.js        # Buscar jugadores
│   ├── BulletinScreen.js       # Anuncios + notificaciones
│   ├── ProfileScreen.js        # Perfil usuario
│   └── AdminScreen.js          # Panel admin
├── components/
│   ├── home/         # Componentes HomeScreen
│   ├── partidas/     # Componentes partidas
│   ├── tablon/       # Componentes tablón
│   └── admin/        # Componentes admin
├── hooks/            # Custom hooks (useSchedules, useBlockouts, etc.)
├── services/         # Servicios (auth, reservations, matches, etc.)
├── context/          # AuthContext, ReservationsContext
├── utils/            # dateHelpers, validators
└── constants/        # colors, config
```

## Reglas de Negocio

| Concepto | Valor |
|----------|-------|
| Horario | 08:00 - 22:00 |
| Bloques | 30 min |
| Máx por reserva | 3 bloques (1.5h) |
| Máx reservas/vivienda | 2 |
| Anticipación máxima | 7 días |
| Protección desplazamiento | 24h |

## Prioridades

- **Primera reserva** → Garantizada (G) - No desplazable
- **Segunda reserva** → Provisional (P) - Desplazable por otra vivienda

Ver `docs/features/reservas.md` para reglas de conversión.

## Convenciones

- Componentes: PascalCase
- Funciones/variables: camelCase
- Columnas PostgreSQL: snake_case
- Hooks: `use[Feature]`
- Callbacks: `on[Acción]`
- Mensajes de error: español

## Arquitectura

**Obligatorio:**
- Archivos < 300 líneas
- Una responsabilidad por archivo
- Lógica de estado → hooks en `src/hooks/`
- Screens = orquestadores (conectan hooks + componentes)
- `index.js` para exports centralizados

Ver `docs/patterns.md` para ejemplos y anti-patrones.

## Variables de Entorno

```
EXPO_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...
EXPO_PUBLIC_PROJECT_ID=tu-project-id
EXPO_PUBLIC_VAPID_PUBLIC_KEY=BNRg...
```

## Documentación Detallada

| Archivo | Contenido |
|---------|-----------|
| `docs/database.md` | Esquemas SQL completos |
| `docs/services.md` | API de servicios |
| `docs/patterns.md` | Patrones de código |
| `docs/features/reservas.md` | Sistema prioridades |
| `docs/features/partidas.md` | Partidas y clases |
| `docs/features/tablon.md` | Tablón de anuncios |
| `docs/features/bloqueos.md` | Bloqueos admin |
| `docs/features/push.md` | Notificaciones push |

## Colores Principales

```javascript
primary: '#2e7d32'          // Verde oscuro
secondary: '#4caf50'        // Verde claro
accent: '#ff9800'           // Naranja (selección)
reservaGarantizada: '#2e7d32'  // Verde (G)
reservaProvisional: '#FFC107'  // Amarillo (P)
bloqueado: '#e53e3e'        // Rojo
```

## Despliegue

```bash
npx expo export:web && npx vercel --prod
```
