// Quick script to check schedule_config database values
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
);

async function checkConfig() {
  console.log('Querying schedule_config via RPC...\n');

  const { data, error } = await supabase.rpc('get_schedule_config');

  if (error) {
    console.error('Error:', error);
    return;
  }

  const config = data?.[0];

  if (!config) {
    console.log('No config found in database');
    return;
  }

  console.log('=== SCHEDULE CONFIG FROM DATABASE ===\n');
  console.log('General Settings:');
  console.log('  hora_apertura:', config.hora_apertura);
  console.log('  hora_cierre:', config.hora_cierre);
  console.log('  duracion_bloque:', config.duracion_bloque);
  console.log('  usar_horarios_diferenciados:', config.usar_horarios_diferenciados);

  console.log('\nWeekday Break:');
  console.log('  pausa_inicio:', config.pausa_inicio);
  console.log('  pausa_fin:', config.pausa_fin);
  console.log('  motivo_pausa:', config.motivo_pausa);
  console.log('  pausa_dias_semana:', config.pausa_dias_semana);

  console.log('\nWeekday Hours (if differentiated):');
  console.log('  semana_hora_apertura:', config.semana_hora_apertura);
  console.log('  semana_hora_cierre:', config.semana_hora_cierre);

  console.log('\nWeekend Hours (if differentiated):');
  console.log('  finde_hora_apertura:', config.finde_hora_apertura);
  console.log('  finde_hora_cierre:', config.finde_hora_cierre);

  console.log('\n>>> WEEKEND BREAK (THE CRITICAL FIELDS) <<<');
  console.log('  finde_pausa_inicio:', config.finde_pausa_inicio);
  console.log('  finde_pausa_fin:', config.finde_pausa_fin);
  console.log('  finde_motivo_pausa:', config.finde_motivo_pausa);
  console.log('  finde_pausa_dias_semana:', config.finde_pausa_dias_semana);

  console.log('\n=== END CONFIG ===\n');

  // Test the break logic
  console.log('Testing break logic for Saturday (day 6):');
  const testDate = new Date('2026-01-18'); // A Saturday
  console.log('Test date:', testDate.toDateString(), '(day of week:', testDate.getDay(), ')');

  const testSlot = { start: '15:00', end: '15:30' };
  console.log('Test slot:', testSlot);

  if (config.usar_horarios_diferenciados) {
    const isWeekend = testDate.getDay() === 0 || testDate.getDay() === 6;
    console.log('Is weekend?', isWeekend);

    if (isWeekend) {
      console.log('Should use weekend break:', {
        inicio: config.finde_pausa_inicio,
        fin: config.finde_pausa_fin
      });
    } else {
      console.log('Should use weekday break:', {
        inicio: config.pausa_inicio,
        fin: config.pausa_fin
      });
    }
  }
}

checkConfig().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
