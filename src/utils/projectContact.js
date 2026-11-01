// Contact for commissions shown in the author signature (Perfil).
// Plain mailto link: no forms, no backend.
const CONTACT_EMAIL = 'chepriapps@gmail.com';
const SUBJECT = 'Tengo un proyecto en mente';
const BODY = 'Hola, Charly:\n\nHe usado la app de reservas de pádel y quería contarte algo.\n\nLo que necesito: \n';

export const PROJECT_MAILTO =
  `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(SUBJECT)}&body=${encodeURIComponent(BODY)}`;
