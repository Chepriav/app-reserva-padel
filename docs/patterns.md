# Patrones de Arquitectura y Código

## Arquitectura Hexagonal (Ports & Adapters)

El código nuevo sigue arquitectura hexagonal. El legado en `services/` permanece hasta que su dominio se migre.

### Reglas de Dependencia

```
domain/ ← infrastructure/
domain/ ← presentation/
domain/ ←✗ NO depende de nada externo
```

### Capas

| Capa | Ruta | Responsabilidad |
|------|------|-----------------|
| Domain | `src/domain/` | Entidades, puertos (interfaces), use cases, errores |
| Infrastructure | `src/infrastructure/supabase/` | Repositorios (implementan puertos), mappers |
| Presentation | `src/presentation/` | Screens, hooks, context |
| DI | `src/di/container.ts` | Wiring de dependencias |
| Shared | `src/shared/` | `Result<T>`, `AppError` |

### Result\<T\>

Todas las operaciones retornan `Result<T>` en lugar de lanzar excepciones:

```typescript
return ok(user);
return fail(new AuthenticationError('Email not confirmed'));

// Consumo
const result = await loginUser.execute(email, password);
if (!result.success) {
  const msg = getErrorMessage(result.error); // traduce a español
}
```

### Patrones Clave

**Use Case** — una sola responsabilidad, un solo archivo:
```typescript
export class LoginUser {
  constructor(private auth: AuthProvider, private users: UserRepository) {}
  async execute(email: string, password: string): Promise<Result<User>> { ... }
}
```

**Repository** — dominio define la interfaz, infraestructura implementa:
```typescript
// domain/ports/repositories/UserRepository.ts
export interface UserRepository {
  findById(id: string): Promise<Result<User | null>>;
}
// infrastructure/supabase/repositories/SupabaseUserRepository.ts
export class SupabaseUserRepository implements UserRepository { ... }
```

**Mapper** — transforma entre DB (snake_case/español) ↔ domain (inglés) ↔ legacy (camelCase/español):
```typescript
toDomain(row: UserRow): User           // DB → dominio
toLegacyFormat(user: User): LegacyUser // dominio → legacy
```

**Facade** — `services/authService.supabase.js` delega en use cases y mantiene la API legacy para screens/hooks existentes.

---

## Principios de Archivos

1. **< 300 líneas** por archivo
2. **Una responsabilidad** por archivo
3. Lógica de estado → **custom hooks** en `src/hooks/`
4. **Screens = orquestadores** (conectan hooks + componentes, no tienen lógica propia)

## Estructura por Feature (presentación)

```
src/presentation/
├── screens/[Name]Screen.js      # Orquestador
├── hooks/use[Feature].js        # Estado + lógica
└── components/[feature]/        # UI pura
    ├── index.js                 # Barrel export
    └── [Component].js
```

## Convenciones de Nombres

| Tipo | Convención | Ejemplo |
|------|------------|---------|
| Hook | `use[Feature]` | `useBlockouts` |
| Componente | PascalCase | `HorarioChip` |
| Callback prop | `on[Acción]` | `onPress` |
| Use case | `[Verbo][Sustantivo]` | `LoginUser`, `CancelReservation` |
| Mapper fn | `toDomain`, `toLegacyFormat` | — |

## Manejo de Errores

- `domain/errors/DomainErrors.ts` — clases de error por dominio (cada una con `code` y `message`)
- `services/authService.supabase.js` — `getErrorMessage()` traduce errores al español:
  - Primero por `error.code` (errores de dominio: `USER_NOT_FOUND`, `INFRASTRUCTURE_ERROR`, …)
  - Luego por `error.message` (errores de Supabase Auth en inglés)
  - Fallback a mensaje genérico

## Patrones de Hooks

```javascript
// Datos
function useFeatureData(params) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => { ... }, [params]);
  useEffect(() => { load(); }, [load]);
  return { data, loading, reload: load };
}

// Acciones
function useFeatureActions(onSuccess) {
  const create = async (data) => { ... };
  return { create };
}
```

## Anti-patrones a Evitar

1. `domain/` importando de `infrastructure/` o `presentation/`
2. Screens con lógica de negocio (va en hooks o use cases)
3. Lógica de UI en use cases (va en hooks)
4. Archivos > 300 líneas
5. Props drilling excesivo (usar contexto o composición)
