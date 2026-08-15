// Tope de la prueba gratuita: cada módulo (Horarios, Reuniones, Notas,
// Planificación semanal, Agenda) tiene su propio límite independiente,
// aplicado tanto aquí (para la UX) como en el trigger de Postgres
// enforce_trial_limits (supabase/migrations/0001_init.sql) — si cambia aquí,
// cambiar también allí.
export const TRIAL_LIMIT_PER_MODULE = 1
