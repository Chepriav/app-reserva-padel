import type { Court } from '@domain/entities/Court';

export function toDomain(row: Record<string, unknown>): Court {
  return {
    id: row.id as string,
    name: row.nombre as string,
    description: (row.descripcion as string) ?? null,
    covered: (row.techada as boolean) ?? false,
    hasLights: (row.con_luz as boolean) ?? false,
    playerCapacity: (row.capacidad_jugadores as number) ?? 4,
  };
}

export function toLegacyFormat(court: Court): Record<string, unknown> {
  return {
    id: court.id,
    nombre: court.name,
    descripcion: court.description,
    techada: court.covered,
    conLuz: court.hasLights,
    capacidadJugadores: court.playerCapacity,
  };
}
