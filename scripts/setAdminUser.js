/**
 * Script temporal para establecer un usuario como admin
 * Uso: node scripts/setAdminUser.js
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Faltan variables de entorno EXPO_PUBLIC_SUPABASE_URL o EXPO_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function setUserAsAdmin() {
  const userId = '30591c94-0931-4681-ac7e-883d368a9819'; // Your user ID from logs

  console.log(`\nActualizando usuario ${userId} como admin...`);

  // Update user to be admin
  const { data, error } = await supabase
    .from('users')
    .update({ es_admin: true })
    .eq('id', userId)
    .select();

  if (error) {
    console.error('❌ Error al actualizar usuario:', error.message);
    process.exit(1);
  }

  if (data && data.length > 0) {
    console.log('✅ Usuario actualizado correctamente:');
    console.log('   ID:', data[0].id);
    console.log('   Nombre:', data[0].nombre);
    console.log('   Email:', data[0].email);
    console.log('   Es Admin:', data[0].es_admin);
    console.log('\n🎉 ¡Ahora cierra sesión y vuelve a iniciar sesión en la app para que se actualice el usuario!');
  } else {
    console.error('❌ No se encontró el usuario con ese ID');
    process.exit(1);
  }
}

setUserAsAdmin().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
