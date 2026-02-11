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

The codebase is being migrated to **hexagonal architecture**. New code goes in the new layers; legacy code in `services/` stays until its domain is migrated.

```
src/
├── domain/                          # Pure business logic (NO external deps)
│   ├── entities/                    # Business objects (TS interfaces)
│   ├── ports/repositories/          # Outbound contracts (interfaces)
│   ├── useCases/                    # Single-responsibility application logic
│   └── errors/                      # Domain error classes
│
├── infrastructure/                  # Outbound adapters (Supabase, etc.)
│   └── supabase/
│       ├── client.ts                # Supabase singleton re-export
│       ├── repositories/            # Port implementations
│       └── mappers/                 # DB ↔ domain transformers
│
├── di/                              # Dependency injection (simple factory)
│   └── container.ts
│
├── shared/                          # Cross-cutting concerns
│   └── types/                       # Result<T>, AppError
│
├── screens/          # (legacy) Pantallas — will move to presentation/
├── components/       # (legacy) UI components
├── hooks/            # (legacy) Custom hooks
├── services/         # (legacy) Facades delegating to use cases
├── context/          # AuthContext, ReservationsContext
├── utils/            # dateHelpers, validators
└── constants/        # colors, config
```

## Reglas de Negocio

| Concepto | Valor |
|----------|-------|
| Horario | 08:00 - 22:00 (configurable por admin) |
| Bloques | 30 min |
| Máx por reserva | 3 bloques (1.5h) |
| Máx reservas/vivienda | 1 |
| Anticipación máxima | 7 días |
| Cancelación | Sin límite de tiempo |
| Protección desplazamiento | 24h |
| Pausas/Descansos | Configurable por admin (ej: hora de comida) |

## Prioridades

- **Primera reserva** → Garantizada (G) - No desplazable
- _Segunda reserva (deshabilitada)_ → Sistema soporta 2 reservas pero límite actual es 1

Ver `docs/features/reservas.md` para reglas de conversión.

## Convenciones

- **Código**: Inglés (variables, funciones, componentes, comentarios)
- **Texto usuario final**: Español (mensajes, labels, alertas)
- Componentes: PascalCase
- Funciones/variables: camelCase
- Columnas PostgreSQL: snake_case
- Hooks: `use[Feature]`
- Callbacks: `on[Acción]`

## Arquitectura

### Hexagonal Architecture (Ports & Adapters)

**Dependency rules:**
- `domain/` has ZERO external imports (no Supabase, no React, no Expo)
- `infrastructure/` depends on `domain/` (implements ports)
- `presentation/` depends on `domain/` (uses use cases via DI)
- NEVER `domain/` → `infrastructure/` or `domain/` → `presentation/`

**Patterns:**
- `Result<T>` over exceptions — all operations return `Result<T>`
- One use case = one file (Single Responsibility)
- Repository pattern — domain defines interface, infrastructure implements
- Mapper pattern — transforms between DB rows, domain entities, and legacy formats
- Facade pattern during migration — old `services/` delegate to use cases

### File Rules

- Files < 300 lines
- One responsibility per file
- State logic → hooks in `src/hooks/`
- Screens = orchestrators (connect hooks + components)
- `index.ts` barrel files for centralized exports

### Path Aliases

Use `@domain/*`, `@infrastructure/*`, `@presentation/*`, `@shared/*`, `@di/*` in new TypeScript files.

### Naming

- **Domain layer**: English only (entities, use cases, ports)
- **Mappers**: Transform between English domain ↔ Spanish legacy ↔ snake_case DB
- **UI text**: Spanish (user-facing messages, labels, alerts)

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
| `docs/features/horarios-configurables.md` | Configuración horarios y pausas |

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
