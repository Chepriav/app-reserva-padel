# Sistema de Partidas y Clases

## Descripción

Sistema para que los usuarios creen partidas y busquen jugadores de la urbanización o externos.

## Tipos

### Partida
- 4 jugadores fijos
- Un nivel preferido
- Sin precio

### Clase
- 2-8 participantes (configurable)
- Múltiples niveles seleccionables
- Precio por alumno y/o grupo (informativo)
- Creador puede cerrar inscripciones manualmente

## Estados

- `buscando` - Aceptando jugadores
- `completa` - Todos los jugadores confirmados
- `cancelada` - Cancelada por el creador

## Flujo de Creación

1. Usuario pulsa "+" en PartidasScreen
2. Selecciona Partida o Clase
3. Configura: tipo (abierta/con reserva), nivel, mensaje
4. Opcionalmente añade jugadores iniciales
5. Al publicar se crea en estado 'buscando'

## Flujo de Solicitud

1. Usuario ve partida de OTRO usuario
2. Pulsa "Solicitar unirse"
3. Se crea jugador con estado `pendiente`
4. Creador ve solicitud y acepta/rechaza
5. Si acepta → estado `confirmado`
6. Si 4 jugadores confirmados → partida `completa`

## Tipos de Jugadores

- **Urbanización**: Usuario registrado (`usuario_id` no null)
- **Externo**: Jugador sin cuenta (`es_externo = true`)

## UI/UX

- **Tab "Buscan jugadores"**: Solo partidas de OTROS usuarios
- **Tab "Mis partidas"**: Creadas + donde estoy inscrito
- **Badge X/4**: Jugadores confirmados + creador
- **Borde verde**: Partidas completas
- **Badge "CLASE"**: Distintivo azul para clases

## Notificaciones

| Evento | Destinatario |
|--------|--------------|
| Solicitud de unirse | Creador |
| Solicitud aceptada | Solicitante |
| Partida completa | Todos los jugadores |
| Partida cancelada | Todos los jugadores |

## Diferencias Clase vs Partida

| Característica | Partida | Clase |
|---------------|---------|-------|
| Participantes | 4 fijos | 2-8 configurable |
| Nivel | Único | Múltiples |
| Precio | No | Sí (informativo) |
| Cerrar manual | No | Sí |
| Visual | Normal | Badge azul + fondo azul |
