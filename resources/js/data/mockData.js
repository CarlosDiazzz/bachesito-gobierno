export const mockReportes = [
  { id:1,  folio:'BCH-20067-20260511-0001', estado:'pendiente',  prioridad:'critica', score_prioridad:92, nombre_via:'Avenida Independencia',      colonia:'Centro Histórico', municipio:'Oaxaca de Juárez', latitud:17.0669, longitud:-96.7203, descripcion:'Cráter de gran tamaño en carril central', ciudadano:'Ana García',     fecha_reporte:'2026-05-11T08:12:00', foto:'https://placehold.co/400x300/F44C63/white?text=Bache+Crítico',  tipo_via:'avenida_principal' },
  { id:2,  folio:'BCH-20067-20260511-0002', estado:'validado',   prioridad:'alta',    score_prioridad:78, nombre_via:'Periférico',                  colonia:'Volcanes',         municipio:'Oaxaca de Juárez', latitud:17.0810, longitud:-96.7350, descripcion:'Bache profundo cerca de tope', ciudadano:'Carlos Ruiz',    fecha_reporte:'2026-05-11T09:30:00', foto:'https://placehold.co/400x300/F98927/white?text=Bache+Alto',    tipo_via:'avenida_principal' },
  { id:3,  folio:'BCH-20067-20260511-0003', estado:'en_proceso', prioridad:'alta',    score_prioridad:74, nombre_via:'Calzada Madero',              colonia:'Reforma',          municipio:'Oaxaca de Juárez', latitud:17.0589, longitud:-96.7350, descripcion:'Múltiples baches en cuadra', ciudadano:'María López',    fecha_reporte:'2026-05-10T14:00:00', foto:'https://placehold.co/400x300/F98927/white?text=En+Proceso',   tipo_via:'avenida_principal' },
  { id:4,  folio:'BCH-20067-20260511-0004', estado:'asignado',   prioridad:'media',   score_prioridad:55, nombre_via:'Calle García Vigil',          colonia:'Centro Histórico', municipio:'Oaxaca de Juárez', latitud:17.0680, longitud:-96.7190, descripcion:'Bache mediano junto a la banqueta', ciudadano:'Pedro Soto',     fecha_reporte:'2026-05-10T10:15:00', foto:'https://placehold.co/400x300/F6C541/333?text=Bache+Medio',    tipo_via:'calle_secundaria' },
  { id:5,  folio:'BCH-20067-20260511-0005', estado:'resuelto',   prioridad:'media',   score_prioridad:50, nombre_via:'Calle Rufino Tamayo',         colonia:'Jalatlaco',        municipio:'Oaxaca de Juárez', latitud:17.0621, longitud:-96.7109, descripcion:'Bache en esquina resuelto', ciudadano:'Laura Díaz',     fecha_reporte:'2026-05-09T11:00:00', foto:'https://placehold.co/400x300/59B038/white?text=Resuelto',     tipo_via:'calle_secundaria' },
  { id:6,  folio:'BCH-20067-20260511-0006', estado:'pendiente',  prioridad:'baja',    score_prioridad:28, nombre_via:'Callejón del Calvario',       colonia:'Jalatlaco',        municipio:'Oaxaca de Juárez', latitud:17.0615, longitud:-96.7098, descripcion:'Grieta pequeña sin urgencia', ciudadano:'José Martínez', fecha_reporte:'2026-05-11T07:00:00', foto:'https://placehold.co/400x300/9099B8/white?text=Bache+Bajo',   tipo_via:'callejon' },
  { id:7,  folio:'BCH-20067-20260511-0007', estado:'validado',   prioridad:'critica', score_prioridad:95, nombre_via:'Avenida Universidad',         colonia:'El Retiro',        municipio:'Oaxaca de Juárez', latitud:17.0750, longitud:-96.7180, descripcion:'Bache enorme frente a UABJO', ciudadano:'Sofía Ramos',    fecha_reporte:'2026-05-11T06:45:00', foto:'https://placehold.co/400x300/F44C63/white?text=Crítico+UABJO', tipo_via:'avenida_principal' },
  { id:8,  folio:'BCH-20067-20260510-0001', estado:'rechazado',  prioridad:'baja',    score_prioridad:10, nombre_via:'Calle Morelos',               colonia:'Centro Histórico', municipio:'Oaxaca de Juárez', latitud:17.0660, longitud:-96.7210, descripcion:'Foto no corresponde a bache', ciudadano:'Tomás Cruz',     fecha_reporte:'2026-05-10T16:00:00', foto:'https://placehold.co/400x300/F44C63/white?text=Rechazado',    tipo_via:'calle_secundaria' },
];

export const mockStats = {
  total: 247,
  pendientes: 89,
  en_proceso: 34,
  resueltos_mes: 58,
  criticos: 12,
  presupuesto_ejercido: 1840000,
  presupuesto_total: 3200000,
  tiempo_promedio_dias: 4.2,
};

export const mockReparadores = [
  { id:1, name:'Carlos Méndez',   asignados:4, resueltos:12, status:'activo' },
  { id:2, name:'Roberto Juárez',  asignados:3, resueltos:8,  status:'activo' },
  { id:3, name:'Ernesto Lima',    asignados:2, resueltos:15, status:'activo' },
  { id:4, name:'Patricia Ruiz',   asignados:1, resueltos:6,  status:'inactivo' },
];

export const mockPresupuestos = [
  { mes:'Ene', asignado:450000, ejercido:280000 },
  { mes:'Feb', asignado:1200000, ejercido:950000 },
  { mes:'Mar', asignado:320000, ejercido:320000 },
  { mes:'Abr', asignado:600000, ejercido:410000 },
  { mes:'May', asignado:630000, ejercido:280000 },
];

export const PRIORIDAD_COLOR = {
  critica: 'var(--prio-critica)',
  alta:    'var(--prio-alta)',
  media:   'var(--prio-media)',
  baja:    'var(--prio-baja)',
};

export const ESTADO_COLOR = {
  pendiente:  'var(--estado-pendiente)',
  validado:   'var(--estado-validado)',
  asignado:   'var(--estado-purpura, #8E418D)',
  en_proceso: 'var(--estado-en-proceso)',
  resuelto:   'var(--estado-resuelto)',
  rechazado:  'var(--estado-rechazado)',
  cerrado:    'var(--text-muted)',
};

export const ESTADO_LABEL = {
  pendiente:  'Pendiente',
  validado:   'Validado',
  asignado:   'Asignado',
  en_proceso: 'En proceso',
  resuelto:   'Resuelto',
  rechazado:  'Rechazado',
  cerrado:    'Cerrado',
};
