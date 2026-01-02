# Sistema de Reservas y Prioridades

## Concepto de Prioridades

El sistema limita reservas **por vivienda** (no por usuario):
- **Primera reserva** → Garantizada (G) - No puede ser desplazada
- **Segunda reserva** → Provisional (P) - Puede ser desplazada por otra vivienda

## Reglas de Conversión P → G

| Escenario | Regla | Tiempo de Conversión |
|-----------|-------|---------------------|
| Continuidad | G termina cuando P empieza | Cuando G termine |
| Mismo día (<3h gap) | G termina, P existe mismo día | 90 min después de G |
| Gap > 3h | G y P mismo día pero >3h | 24h después de G |
| Diferente día | G termina, P existe otro día | 24h después de G |
| Sin G - mismo día | Solo existe P para hoy | 90 min desde creación |
| Sin G - diferente día | Solo existe P para otro día | 24h desde creación |

## Reglas de Desplazamiento

Una vivienda puede desplazar la reserva P de otra vivienda si:
- La reserva es Provisional (P)
- Faltan más de 24 horas para la reserva
- La vivienda que desplaza tiene su primera reserva disponible

## RPCs de Supabase

- `crear_reserva_con_prioridad` - Calcula prioridad y tiempo de conversión
- `desplazar_reserva_y_crear_nueva` - Desplazamiento atómico con notificación
- `process_pending_conversions` - Procesa conversiones pendientes (cron cada 15 min)

## Visualización en UI

| Estado | Color | Significado |
|--------|-------|-------------|
| Garantizada (G) | Verde `#2e7d32` | Mi reserva confirmada |
| Provisional (P) | Amarillo `#FFC107` | Mi reserva provisional |
| Desplazable | Gris `#e0e0e0` | Otra vivienda, puedo desplazar |
| Ocupada | Gris oscuro | No disponible |

## Flujo de Reserva

1. Usuario selecciona bloques de 30 min (máx 3 = 1.5h)
2. Sistema valida límites (máx 2 reservas por vivienda)
3. Sistema calcula prioridad (G o P)
4. Si hay desplazamiento, muestra confirmación
5. Crea reserva vía RPC
6. Notifica a vivienda desplazada (si aplica)

## Columnas en tabla `reservas`

```sql
prioridad TEXT DEFAULT 'primera',   -- 'primera' (G) o 'segunda' (P)
conversion_timestamp TIMESTAMPTZ,    -- Cuándo convertir P a G
conversion_rule TEXT,                -- Regla aplicada
converted_at TIMESTAMPTZ             -- Cuándo se convirtió
```

## Conversión en Frontend

Cuando una vivienda solo tiene 1 reserva futura, se muestra como Garantizada automáticamente sin esperar al cron job.
