/* Software Engineer LIFE — content (acts, cast, scenes, endings, recap).
 * Pure data, no DOM. Works in the browser (window.SEL_DATA) and in Node (require).
 *
 * Text tokens:  {n} name · {o} o/a · {#cnt} counter value · {?cond|si|no} inline condition
 * Conditions:   flag · !flag · stat/counter>=N (e,p,c,v,stress,act, ot, raises, body, ...)
 * Outcome keys: fx{e,p,c,v} st(stress) set[] unset[] count{} raise res expr addProps[]
 */
(function (root) {
'use strict';
const D = {};

/* ---------- tuning knobs (change here, then run tools/sim.mjs) ---------- */
D.RULES = {
  start: { e: 70, p: 48, c: 40, v: 60, stress: 20 },
  cost:  { base: 2, rent: 2, baby: 2, debt: 2, raise: 2 },   // Plata lost every new year
  regenBase: 10,                                             // Energía regained every year (minus stress/10)
  stressDecay: 4,                                            // stress lost every year
  stressFromEnergy: 0.25,                                    // burning Energía also raises hidden stress
  gain: 0.85,                                                // positive effects are scaled: the system takes more than it gives
  absence: 3,                                                // Vida lost per "un ratito más" of the year that just ended
  lifeDrain: 2                                               // Vida erodes by default: people need maintenance
};

/* ---------- acts: one per year, 2019 → 2026 ---------- */
D.ACTS = [
  { year: 2019, title: 'Oficial', pool: 2, theme: 'parents', mid: 'frame',
    line: 'Una habitación en Lima. {n} lleva 3 meses trabajando “de prueba”, sin sueldo. Hoy firma.' },
  { year: 2020, title: 'Cuarentena', pool: 2, theme: 'quarantine', weather: 'gray', mid: 'calendar',
    line: 'El mundo se mudó a las pantallas. La webcam se volvió la única ventana.' },
  { year: 2021, title: 'Remoto para siempre', pool: 1, theme: { home: 'parents', rent: 'apartment' }, mid: 'frame',
    line: 'Nadie sabe dónde termina la oficina. Ni dónde empieza la casa.' },
  { year: 2022, title: 'Más con menos', pool: 1, theme: { home: 'parents', rent: 'apartment' }, mid: 'frame',
    line: 'Mismo cargo, más sombreros. La inflación sí recibió aumento.' },
  { year: 2023, title: 'Reestructuración', pool: 1, theme: 'slate', weather: 'gray', mid: 'frame',
    line: '“Reorganización” y “recorte” empiezan a sonar parecidos.' },
  { year: 2024, title: 'Tech Lead (sin aumento)', pool: 2, theme: 'rose', mid: 'frame',
    line: 'Más responsabilidad. El mismo sueldo. Es un reconocimiento.' },
  { year: 2025, title: 'Llega la IA', pool: 2, theme: 'violet', mid: 'chatai',
    line: 'Alguien instaló un agente que escribe código. Ahora entregarán el doble.' },
  { year: 2026, title: 'Cámara encendida', pool: 0, theme: 'sunrise', mid: 'helmet',
    line: 'Siete años. La webcam te vio crecer, cansarte y seguir. Esta vez, decides si se queda encendida.' }
];

/* ---------- cast ---------- */
D.APPS = { chat: 'Chat del equipo', rrhh: 'Recursos Humanos', familia: 'Familia', msg: 'Mensajes', clinica: 'Clínica',
           call: 'Videollamada', news: 'Noticias', bank: 'Banco', mail: 'Correo', sys: 'Sistema' };
D.NPC = {
  marcos:    { name: 'Marcos · Jefe',        av: 'M', col: '#B8C4FF', app: 'chat' },
  rodrigo:   { name: 'Rodrigo · Senior',     av: 'R', col: '#9EE6C1', app: 'chat' },
  paola:     { name: 'Paola · RRHH',         av: 'P', col: '#F2B679', app: 'rrhh' },
  mama:      { name: 'Mamá',                 av: 'M', col: '#FFB4A2', app: 'familia' },
  papa:      { name: 'Papá',                 av: 'P', col: '#FFD6A5', app: 'familia' },
  pareja:    { name: 'Tu pareja',            av: '♥', col: '#FF9CB1', app: 'msg' },
  dra:       { name: 'Dra. Ríos',            av: 'R', col: '#BFE3F5', app: 'clinica' },
  fer:       { name: 'Fer',                  av: 'F', col: '#9EE6C1', app: 'msg' },
  lucho:     { name: 'Lucho · QA',           av: 'L', col: '#FFE27A', app: 'chat' },
  tomas:     { name: 'Tomás · Practicante',  av: 'T', col: '#C7B2FF', app: 'chat' },
  equipo:    { name: 'Daily · 14 personas',  av: '▶', col: '#FFC857', app: 'call' },
  direccion: { name: 'Dirección',            av: 'D', col: '#C7B2FF', app: 'chat' },
  noticias:  { name: 'Noticias',             av: '●', col: '#FF8A80', app: 'news' },
  banco:     { name: 'Tu banco',             av: 'S/', col: '#4ADE80', app: 'bank' },
  cliente:   { name: 'Cliente',              av: 'C', col: '#FFD479', app: 'mail' },
  bot:       { name: 'Reclutador (IA)',      av: '✦', col: '#C7B2FF', app: 'mail' },
  nueva:     { name: 'Nueva empresa',        av: 'N', col: '#F2B679', app: 'mail' },
  bandeja:   { name: 'Tu bandeja de entrada', av: '✉', col: '#BFE3F5', app: 'mail' },
  espalda:   { name: 'Tu espalda',           av: '!', col: '#FF8A80', app: 'sys' },
  calendario:{ name: 'Tu calendario',        av: '▦', col: '#BFE3F5', app: 'sys' },
  prod:      { name: 'Producción',           av: '!', col: '#FF5A4E', app: 'sys' },
  luz:       { name: 'Se fue la luz',        av: '⚡', col: '#FFC857', app: 'sys' },
  red:       { name: 'Tu red profesional',   av: '★', col: '#8FA3C7', app: 'sys' }
};

/* ---------- scenes ---------- *
 * kind: anchor (fixed per act, by `act`) · pool (random, by `acts`) · trigger (injected by hidden state) · fate (rolled)
 * Anchors with unmet `needs` are skipped when their turn comes (so cards can depend on earlier cards of the same act).
 */
D.CARDS = [

/* ============ 2019 · Oficial ============ */
{ id: 'contrato', kind: 'anchor', first: true, fix: true, act: 0, m: 'OCT', time: '09:12', expr: 'happy', from: 'paola',
  text: '“{n}, se acabaron los 3 meses de ‘prueba’ sin sueldo. Ahora sí eres oficial: S/ 1,800 al mes.”',
  A: { t: 'Firmar ya. “Gracias por la oportunidad”', fx: { c: 8, p: 4, v: 4 }, set: ['underpaid'], count: { yes: 1 },
       res: 'Firmaste en 4 minutos. Tu mamá lloró de orgullo. Nadie preguntó por los 3 meses.', expr: 'happy' },
  B: { t: 'Pedir S/ 2,200 con argumentos', roll: { base: 0.5 },
       win:  { fx: { p: 14, c: 4 }, set: ['negotiated'], raise: 1, res: 'Funcionó: S/ 2,100. Paola: “Qué raro, nadie pide”.', expr: 'happy' },
       lose: { fx: { c: -6, p: 2 }, res: '“Lo conversamos más adelante.” Nunca se conversó.', expr: 'tired' } } },

{ id: 'rodrigo', kind: 'anchor', act: 0, m: 'DIC', time: '19:40', expr: 'neutral', from: 'rodrigo',
  text: '“Quédate 30 minutos y te explico cómo depurar esto bien. Eso no te lo enseñan en la universidad.”',
  A: { t: 'Quedarte a aprender', fx: { c: 12, e: -6 }, set: ['mentor'], count: { learn: 1 },
       res: 'Aprendiste más en 30 minutos que en 5 años de carrera. Rodrigo anotó tu número.', expr: 'happy' },
  B: { t: 'Cerrar el ticket y salir a tu hora', fx: { e: 6, v: 6, c: -4 },
       res: 'Llegaste a cenar con tus papás. El bug siguió ahí. Rodrigo asintió, sin rencor.', expr: 'neutral' } },

{ id: 'aporte', kind: 'pool', acts: [0], m: 'NOV', time: '13:30', expr: 'neutral', from: 'mama',
  text: '“¿Ya cobraste, {n}? Falta el recibo de luz y el internet. Con tu sueldo ya podemos respirar.”',
  A: { t: 'Aportar a la casa', fx: { v: 10, p: -10 }, set: ['helps_home'],
       res: 'Mamá guardó el billete en la lonchera y no dijo nada. Se le notó en los ojos.', expr: 'happy' },
  B: { t: 'Ahorrar para una laptop que no suene como avión', fx: { c: 5, e: 5, v: -8 }, set: ['new_laptop'],
       res: 'Tu laptop vieja descansó. Tu mamá, en silencio, hizo cuentas.', expr: 'neutral' } },

{ id: 'favor', kind: 'pool', acts: [0], m: 'NOV', time: '18:50', expr: 'tired', from: 'marcos',
  text: '“Es un favorcito: 2 horas más. No se pagan, pero se valoran mucho.”',
  A: { t: 'Quedarte', fx: { c: 8, e: -10 }, st: 10, count: { ot: 1, yes: 1 },
       res: '“Se valora mucho” fue todo lo que recibiste. A las 9 pm te sonó el estómago.', expr: 'tired' },
  B: { t: 'Salir a tu hora', fx: { e: 5, c: -8, v: 3 }, count: { bound: 1 },
       res: 'Marcos escribió “ok” sin emoji. Tú viste tu primer atardecer en meses.', expr: 'neutral' } },

{ id: 'meetup', kind: 'pool', acts: [0], m: 'DIC', time: '08:20', expr: 'neutral', from: 'fer',
  text: '“Hay un meetup de devs el sábado. Gratis, con pizza y gente que sí sabe.”',
  A: { t: 'Ir', fx: { c: 8, v: 4, e: -5 }, count: { learn: 1 },
       res: 'Conociste a alguien que cobra en dólares. No lo olvidarás.', expr: 'happy' },
  B: { t: 'Dormir hasta las 11', fx: { e: 10, c: -3 },
       res: 'Dormiste. Fue glorioso. La pizza, en cambio, nunca la probaste.', expr: 'relief' } },

{ id: 'viernes-prod', kind: 'pool', acts: [0], m: 'DIC', time: '17:55', expr: 'stressed', from: 'marcos',
  text: 'Viernes, 5:55 pm. Producción se cae. Marcos: “¿Tú sabes de eso? Nadie más está conectado.”',
  A: { t: 'Arreglarlo tú mismo', fx: { c: 7, e: -8 }, st: 8, count: { ot: 1 },
       res: 'Lo arreglaste a las 9:10 pm. El lunes nadie lo mencionó.', expr: 'tired' },
  B: { t: 'Avisar y dejarlo para el lunes', fx: { e: 4, c: -6 }, count: { bound: 1 },
       res: 'El lunes, Marcos habló de “ownership”. Tú no sabías que era una indirecta.', expr: 'neutral' } },

/* ============ 2020 · Cuarentena ============ */
{ id: 'emergencia', kind: 'anchor', first: true, fix: true, act: 1, m: 'MAR', time: '20:05', expr: 'shock', from: 'marcos',
  ambient: 'mom', ambientText: '¡Lávate las manos!',
  ticker: 'ÚLTIMO MOMENTO · ESTADO DE EMERGENCIA NACIONAL · CUARENTENA DESDE ESTA NOCHE · QUÉDATE EN CASA ·',
  text: '“Hay cuarentena desde esta noche. Mañana todos remoto: llévate lo que necesites de la oficina.”',
  A: { t: 'Cargar el monitor de la oficina', fx: { c: 5, e: 6, p: -2 }, res: 'Ahora tienes dos pantallas. Y ninguna salida.', expr: 'neutral' },
  B: { t: 'Trabajar con tu laptop vieja', fx: { p: 5, e: -8 }, res: 'Tu laptop suena como un avión. Ahorraste S/ 600.', expr: 'stressed' },
  variants: [ { needs: ['new_laptop'], over: {
    B: { t: 'Trabajar con tu laptop nueva', fx: { p: 5, e: 2 }, res: 'Tu laptop nueva aguanta. Aquella decisión de 2019 rindió.', expr: 'neutral' } } } ] },

{ id: 'nueve-a-nueve', kind: 'anchor', act: 1, m: 'SEP', time: '22:48', expr: 'tired', from: 'marcos',
  text: '“Como estás en casa, ¿te conectas un ratito más? Es urgente. {?ot>=1|Como la otra vez. |}Las horas extra no se pagan, pero se valoran.”',
  A: { t: 'Quedarte. “Un ratito”', fx: { c: 9, e: -14, v: -4 }, st: 15, count: { ot: 1, yes: 1 }, set: ['always_on'],
       res: 'Terminaste a las 11:47 pm. Nadie lo agradeció. El “ratito” duró 3 horas.', expr: 'tired' },
  B: { t: 'Desconectarte a las 6', fx: { v: 8, c: -8, e: 4 }, count: { bound: 1 }, set: ['boundaries'],
       res: 'Marcos dejó un 👍 frío. Pero cenaste caliente.', expr: 'neutral' } },

{ id: 'almuerzo', kind: 'pool', acts: [1, 2], m: 'JUN', time: '13:05', expr: 'shock', from: 'equipo',
  ambient: 'mom', ambientText: '¡ALMUERZO!',
  text: 'Tu mamá abre la puerta en pleno daily y grita: “¡ALMUERZO!”. Tu cámara está encendida.',
  A: { t: 'Silenciar y sonreír', fx: { c: 3, v: -2 }, res: 'Fingiste que no la oías. Ella, en cambio, sí te oyó pensar.', expr: 'stressed' },
  B: { t: 'Presentar a tu mamá al equipo', fx: { v: 8, c: -3 }, res: 'Mamá saludó a 14 personas. Marcos puso “¡qué lindo!”. Lucho pidió la receta.', expr: 'happy' } },

{ id: 'internet', kind: 'pool', acts: [1, 2, 3], m: 'AGO', time: '11:25', expr: 'stressed', from: 'cliente', ambient: 'lag',
  text: 'Demo con el cliente en 5 minutos. Tu internet empieza a parpadear.',
  A: { t: 'Usar el hotspot de tu celular', fx: { p: -6, c: 8 }, res: 'Salvaste la demo con 3 GB de datos. Tu plan, no tanto.', expr: 'tired' },
  B: { t: 'Reprogramar la demo', fx: { c: -10, e: 3 }, res: 'El cliente “entiende”. Su tono, no tanto.', expr: 'neutral' } },

{ id: 'camotero', kind: 'pool', acts: [1, 2, 3], m: 'JUL', time: '16:15', expr: 'neutral', from: 'equipo', ambient: 'camotero',
  text: 'El silbato del camotero suena justo cuando te toca hablar.',
  A: { t: 'Mutear y seguir', fx: { c: 2 }, res: 'Muteaste a tiempo. El camotero, no.', expr: 'neutral' },
  B: { t: 'Reír: “Es el camotero, es Lima”', fx: { v: 6, c: -2 }, res: 'Todos rieron. Alguien preguntó a qué hora pasa.', expr: 'happy' } },

{ id: 'reuniones', kind: 'pool', acts: [1, 2], m: 'OCT', time: '09:30', expr: 'tired', from: 'calendario',
  text: 'Hoy tienes 7 reuniones. 5 pudieron ser un correo. 1 pudo ser un mensaje.',
  A: { t: 'Cámara apagada, escuchar a medias', fx: { c: -4, e: 6 }, res: 'Escuchaste a medias. Te salvó que nadie preguntó nada.', expr: 'neutral' },
  B: { t: 'Cámara encendida, modo actor', fx: { c: 5, e: -8 }, count: { cam: 1 }, res: 'Asentiste 40 veces. Entendiste 2.', expr: 'tired' } },

{ id: 'camara-on', kind: 'pool', acts: [1, 2], m: 'MAY', time: '10:10', expr: 'neutral', from: 'marcos',
  text: '“¿Puedes prender la cámara? Se siente más cercano.” Esta noche dormiste 4 horas.',
  A: { t: 'Prender la cámara', fx: { c: 4, e: -5 }, st: 4, count: { cam: 1 }, res: 'Te peinaste solo de la cintura para arriba. Funcionó.', expr: 'tired' },
  B: { t: 'Decir que tu cámara falla', fx: { e: 4, c: -3, v: -2 }, res: 'Tu cámara “falla”. Marcos te cree. Tú, un poquito menos.', expr: 'neutral' } },

{ id: 'feria', kind: 'pool', acts: [1], weight: 2, m: 'JUN', time: '19:30', expr: 'neutral', from: 'papa',
  text: '“{n}, la feria cerró hasta nueva orden. No te preocupes por nosotros.” {?helps_home|Tu aporte ya sostiene el recibo de luz.|Se nota que sí hay que preocuparse.}',
  A: { t: 'Subir tu aporte a la casa', fx: { p: -12, v: 10 }, set: ['family_anchor', 'helps_home'],
       res: 'Papá dijo “no hacía falta”. Luego te abrazó 5 segundos de más.', expr: 'happy' },
  B: { t: 'Decirle que por ahora no puedes', fx: { p: 2, v: -10 },
       res: 'Papá asintió. Esa noche cenaron en silencio.', expr: 'tired' } },

/* ============ 2021 · Remoto para siempre ============ */
{ id: 'mentor-renuncia', kind: 'anchor', act: 2, m: 'JUN', time: '10:30', expr: 'stressed', from: 'marcos',
  text: 'Rodrigo se va a una empresa que paga en dólares. Marcos: “Te quedas con su módulo. Es una oportunidad.”',
  A: { t: 'Aceptar su módulo, sin aumento', fx: { c: 12, e: -10 }, st: 12, set: ['unpaid_resp'], count: { extra: 1, yes: 1 },
       res: 'Ahora respondes por 3 sistemas que no escribiste. “Es crecimiento”, dijeron.', expr: 'stressed' },
  B: { t: 'Pedir aumento antes de aceptar', roll: { base: 0.45, mods: [['negotiated', 0.05], ['c>=60', 0.1]] },
       win:  { fx: { p: 14, c: 8 }, raise: 1, res: 'Te dieron S/ 300 más. Un récord… de 2021.', expr: 'happy' },
       lose: { fx: { c: -10, e: -4 }, res: 'Lo verán “en la evaluación”. La evaluación es en 2024.', expr: 'tired' } },
  variants: [ { needs: ['mentor'], over: { from: 'rodrigo',
    enter: { set: ['rodrigo_contact'] },
    text: '“Me voy a una empresa que paga en dólares. Te dejo mi módulo… y mi número, por si algún día lo necesitas.”' } } ] },

{ id: 'dar-el-paso', kind: 'anchor', act: 2, m: 'NOV', time: '20:15', expr: 'happy', from: 'pareja',
  text: '“¿Y si damos el paso? Un departamento… y un hijo.” {?family_anchor|Sabes que en casa también te necesitan.|}',
  A: { t: 'Sí, vamos por ello', fx: { v: 16, p: -14, e: -8 }, set: ['baby', 'rent'],
       res: 'Alquiler, pañales y una caja de ilusión. Las cuentas hicieron yoga.', expr: 'happy' },
  B: { t: 'Todavía no, primero estabilidad', fx: { c: 6, v: -6, p: 4 }, set: ['postponed'],
       res: '“Estabilidad” sigue siendo un proyecto pendiente.', expr: 'neutral' },
  variants: [ { needs: ['family_anchor'], over: {
    A: { t: 'Sí, y seguir aportando en casa', fx: { v: 16, p: -18, e: -8 }, set: ['baby', 'rent'],
         res: 'Alquiler, pañales y el aporte de casa. Tus finanzas hicieron malabares.', expr: 'happy' } } } ] },

{ id: 'cumple-amigo', kind: 'pool', acts: [2], m: 'AGO', time: '19:00', expr: 'neutral', from: 'fer',
  text: '“Hoy celebro mi cumple. ¡Vienes! (Sé que mañana hay release.)”',
  A: { t: 'Ir', fx: { v: 10, e: -6, p: -4 }, res: 'Bailaste mal y reíste bien. Valió cada sol del taxi.', expr: 'happy' },
  B: { t: 'Quedarte a terminar', fx: { c: 6, v: -10 }, res: 'El release salió. Fer te mandó un audio: “te extrañamos”.', expr: 'tired' } },

{ id: 'pizza', kind: 'pool', acts: [2], m: 'DIC', time: '15:00', expr: 'neutral', from: 'marcos',
  text: '“No hay bono este año, pero invitamos una pizza virtual a todo el equipo.”',
  A: { t: 'Aceptar con una sonrisa', fx: { v: 2 }, res: 'La pizza virtual no llenó a nadie. El emoji, eso sí, era enorme.', expr: 'neutral' },
  B: { t: 'Pedir el bono en efectivo', roll: { base: 0.35 },
       win:  { fx: { p: 12 }, res: 'Marcos suspiró y aprobó S/ 400. Una guerra ganada.', expr: 'happy' },
       lose: { fx: { c: -6 }, res: '“Qué lástima, pensé que eras más de equipo.”', expr: 'tired' } } },

{ id: 'silla', kind: 'pool', acts: [2], m: 'MAR', time: '14:20', expr: 'tired', from: 'espalda',
  text: 'Llevas un año trabajando en una silla de comedor. Tu espalda manda mensajes.',
  A: { t: 'Comprar una silla ergonómica', fx: { p: -8, e: 8 }, st: -5, res: 'Costó S/ 380. Tu espalda te mandó un “gracias”.', expr: 'relief' },
  B: { t: 'Seguir en la silla de comedor', fx: { e: -8 }, st: 8, res: 'Tu espalda anotó la deuda. Cobra con intereses.', expr: 'tired' } },

{ id: 'cliente-sabado', kind: 'pool', acts: [2, 3], m: 'SEP', time: '10:05', expr: 'stressed', from: 'cliente',
  text: '“Disculpe, ¿podría hacer el cambio hoy? Es sábado, pero para nosotros es urgente.”',
  A: { t: 'Hacerlo hoy', fx: { c: 6, e: -8, v: -4 }, count: { ot: 1 }, res: 'Lo entregaste a las 4 pm. El cliente respondió: “gracias, ahora otro cambio”.', expr: 'tired' },
  B: { t: 'Responder el lunes a primera hora', fx: { e: 5, c: -5, v: 3 }, count: { bound: 1 }, res: 'El lunes fuiste amable… y firme. Nadie se murió.', expr: 'relief' } },

{ id: 'cafe-lucho', kind: 'pool', acts: [2, 3], m: 'OCT', time: '15:30', expr: 'neutral', from: 'lucho',
  text: '“Café virtual de 15 minutos. Hablaremos de renunciar. Bueno, de ‘crecer’.”',
  A: { t: 'Ir al café virtual', fx: { v: 6, e: 3, c: 2 }, res: 'Descubriste que 4 de 6 piensan igual. En el daily, nadie dijo nada.', expr: 'happy' },
  B: { t: 'No tienes tiempo', fx: { c: 3, v: -4 }, res: 'Terminaste un ticket. Perdiste una conversación necesaria.', expr: 'neutral' } },

/* ============ 2022 · Más con menos ============ */
{ id: 'daily-ruido', kind: 'anchor', act: 3, m: 'MAR', time: '09:58', expr: 'stressed', from: 'equipo', ambient: 'drill',
  text: 'Un taladro vecino arranca justo cuando te toca hablar. La obra durará 3 semanas.',
  A: { t: 'Audífonos y gritar más fuerte', fx: { c: 5, e: -8 }, res: 'Se te escuchó perfecto. A ti, a 14 personas y a todo el edificio.', expr: 'stressed' },
  B: { t: 'Pedir reprogramar el daily', fx: { e: 4, c: -5 }, res: '“Claro, sin problema.” (Sí había problema.)', expr: 'neutral' },
  variants: [ { needs: ['baby'], over: { ambient: 'baby',
    text: 'Tu bebé llora de fondo. Tu cámara está encendida: 14 personas te miran y te toca hablar.',
    A: { t: 'Silenciar el micro y seguir', fx: { c: 6, v: -8, e: -4 }, res: 'Hablaste 90 segundos. Tu bebé lloró 90 segundos. Todo salió “perfecto”.', expr: 'stressed' },
    B: { t: 'Cargarlo en cámara y explicar', fx: { v: 10, c: -5 }, res: 'Todos sonrieron. Marcos escribió “seguimos”. Lucho, “qué ternura”.', expr: 'happy' } } } ] },

{ id: 'sin-ajuste', kind: 'anchor', act: 3, m: 'JUN', time: '11:00', expr: 'tired', from: 'paola',
  text: '“Este año no habrá ajuste salarial por el contexto económico.” {?raises>=1|Tu aumento anterior “ya cubre” la inflación.|La inflación, en cambio, sí recibió aumento.}',
  A: { t: 'Aceptar: cambiar da miedo', fx: { p: -6, e: -4 }, set: ['stayed'], res: 'Te quedaste. El precio del pan, en cambio, subió sin avisar.', expr: 'tired' },
  B: { t: 'Salir a entrevistar', fx: { c: 4, e: -10 }, set: ['interviewing'], res: 'Dos entrevistas en el almuerzo. Tu estómago negoció contigo.', expr: 'stressed' } },

{ id: 'rumores', kind: 'anchor', act: 3, m: 'AGO', time: '21:30', expr: 'tired', from: 'lucho',
  text: '“Marcos canceló todas las 1:1 y RRHH no contesta. Algo huele raro.”',
  A: { t: 'Actualizar el CV en secreto', fx: { e: -5, c: 3 }, set: ['prepared'], res: 'Dos noches de CV. Tu pareja preguntó si estabas bien.', expr: 'tired' },
  B: { t: 'Confiar. “A mí no me pasa”', fx: { e: 4, v: 2 }, set: ['naive'], res: 'Dormiste tranquilo. Por última vez en un tiempo.', expr: 'neutral' },
  variants: [ { needs: ['rodrigo_contact'], over: { from: 'rodrigo',
    text: '“Marcos canceló todas las 1:1, ¿no? Actualiza tu CV, por si acaso.”' } } ] },

{ id: 'sombreros', kind: 'pool', acts: [3], m: 'MAY', time: '10:40', expr: 'stressed', from: 'marcos',
  text: '“Desde hoy también eres QA, DevOps y Scrum Master. Mismo cargo, por supuesto.”',
  A: { t: 'Aceptar', fx: { c: 8, e: -12 }, st: 12, count: { extra: 1, yes: 1 }, res: 'Tres sombreros y una sola cabeza. Tu cabeza lo notó.', expr: 'stressed' },
  B: { t: 'Poner límites', fx: { c: -6, e: 6, v: 4 }, count: { bound: 1 }, res: 'Marcos te anotó como “difícil”. Tu calendario te anotó como “humano”.', expr: 'neutral' } },

{ id: 'fiebre', kind: 'pool', acts: [3], weight: 3, needs: ['baby'], m: 'OCT', time: '02:10', expr: 'tired', from: 'pareja',
  text: '“Tiene fiebre y el release es a las 7 am. ¿Qué hacemos?”',
  A: { t: 'Pedir el día libre', fx: { c: -6, v: 10, e: 6 }, res: 'Marcos respondió “ok” a las 9 am. Tu bebé, a las 3 am: ya dormía.', expr: 'relief' },
  B: { t: 'Cumplir con el release', fx: { c: 8, v: -10, e: -12 }, st: 12, count: { ot: 1 }, res: 'El release salió. Tu bebé durmió en brazos de tu pareja. Tú, en el teclado.', expr: 'tired' } },

{ id: 'integracion', kind: 'pool', acts: [3, 4], m: 'NOV', time: '12:00', expr: 'neutral', from: 'marcos',
  text: '“Este sábado hay integración de equipo. Es opcional (pero se nota quién va).”',
  A: { t: 'Ir, con sonrisa', fx: { c: 6, v: -6, e: -6 }, res: 'Hubo karaoke. Tu voz fue más honesta que tu sonrisa.', expr: 'tired' },
  B: { t: 'Decir que no', fx: { v: 4, c: -4 }, count: { bound: 1 }, res: 'Te quedaste sin foto grupal, pero con sábado completo.', expr: 'relief' } },

/* ============ 2023 · Reestructuración ============ */
{ id: 'reunion-rrhh', kind: 'fate', first: true, fix: true, act: 4, m: 'ENE', time: '10:00', expr: 'shock', from: 'paola', camOff: true,
  text: 'Reunión urgente de 15 minutos para toda el área. “Cámara apagada, por favor.”',
  btn: 'Entrar a la reunión',
  roll: { base: 0.35, mods: [['prepared', 0.3], ['c>=60', 0.2], ['rodrigo_contact', 0.05]] },
  win:  { fx: { e: -14, c: 4 }, set: ['survivor'], res: '“Quedaron 3 para el trabajo de 8.” Te felicitan por seguir.', expr: 'stressed' },
  lose: { fx: { p: -14, c: -8, e: -6, v: -4 }, set: ['laid_off'], addProps: ['boxes'],
          res: '“Tu puesto fue eliminado.” Liquidación: 2 sueldos. Duración de la reunión: 6 minutos.', expr: 'shock' } },

{ id: 'postulaciones', kind: 'anchor', act: 4, needs: ['laid_off'], m: 'MAR', time: '23:40', expr: 'tired', from: 'bandeja',
  text: '100 postulaciones, 3 respuestas, 0 entrevistas reales. Son las 11:40 pm y refrescas el correo.',
  A: { t: 'Aceptar la primera oferta', fx: { p: 6, c: -8, e: -6 }, set: ['rehired'], res: 'Menos sueldo, más tranquilidad. Por ahora.', expr: 'tired' },
  B: { t: 'Esperar una oferta mejor', fx: { p: -14, c: 10, v: -6 }, set: ['rehired'], res: 'Mes y medio más. Tu mamá preguntó por tus “reuniones”, con cariño y miedo.', expr: 'stressed' },
  variants: [ { needs: ['rodrigo_contact'], over: { from: 'rodrigo',
    text: '“Vi lo de tu empresa. Mi equipo está buscando gente. Te puedo referir, si quieres.”',
    A: { t: 'Aceptar la referencia de Rodrigo', fx: { p: 10, c: 8 }, set: ['rehired', 'referred'], res: 'Rodrigo hizo una llamada. Un mes después tenías oferta. Aquel “quédate 30 minutos” de 2019 seguía rindiendo.', expr: 'happy' },
    B: { t: 'Seguir buscando por tu cuenta', fx: { c: 4, p: -8, v: -4 }, set: ['rehired'], res: 'Querías demostrar que podías sin ayuda. Orgullo caro.', expr: 'tired' } } } ] },

{ id: 'sobreviviente', kind: 'anchor', act: 4, needs: ['!laid_off'], m: 'MAR', time: '19:30', expr: 'stressed', from: 'marcos',
  text: '“Gracias por quedarte. Ahora el equipo es más pequeño, pero más comprometido.” Tu carga: la de tres.',
  A: { t: 'Estirarte: “yo puedo”', fx: { c: 10, e: -14 }, st: 12, count: { ot: 1, extra: 1 }, res: 'Hiciste el trabajo de tres. Te agradecieron con un emoji.', expr: 'tired' },
  B: { t: 'Poner límites', fx: { c: -8, e: 5, v: 4 }, count: { bound: 1 }, res: 'Dijiste “no llego a todo”. Por primera vez, alguien tomó nota.', expr: 'neutral' } },

{ id: 'cuerpo-avisa', kind: 'trigger', needs: ['stress>=50'], max: 2, gap: 1, m: 'JUN', time: '03:12', expr: 'sick', from: 'dra', left: 'pills',
  text: '“Gastritis, migraña y contractura. Es estrés: necesitas descansar, no pastillas.”',
  A: { t: 'Pedir 3 días de descanso médico', fx: { e: 20, c: -6, v: 4 }, st: -25, set: ['rested'], unset: ['sick_now'],
       res: 'Dormiste 11 horas. El mundo no se cayó.', expr: 'relief' },
  B: { t: 'Tomar la pastilla y seguir', fx: { c: 4, e: -10, p: -3 }, st: 12, count: { body: 1 }, set: ['sick_now'],
       res: 'El chat no se cura con ibuprofeno. Tu cuerpo tomó nota.', expr: 'sick' } },

{ id: 'quincena', kind: 'pool', acts: [4], m: 'ABR', time: '09:00', expr: 'stressed', from: 'banco',
  text: 'Tu quincena se retrasa 10 días. {?rent|El alquiler|La luz de casa} no espera.',
  A: { t: 'Pedir un adelanto', fx: { p: 8, c: -4 }, res: 'RRHH te lo aprobó con cara de “otra vez”.', expr: 'tired' },
  B: { t: 'Pagar con tarjeta', fx: { p: 10 }, set: ['debt'], res: 'Dos cuotas, tres meses, cinco intereses. Las matemáticas del banco.', expr: 'stressed' } },

{ id: 'linkedin', kind: 'pool', acts: [4, 5], m: 'MAY', time: '21:10', expr: 'neutral', from: 'red',
  text: 'Todos celebran su “nuevo reto”. {?laid_off|Tú sigues reinventándote.|Tú sigues aquí.}',
  A: { t: 'Publicar: “Emocionad{o} de anunciar…”', fx: { c: 6, v: -4 }, res: '47 likes, 3 reclutadores y 1 mensaje de tu tía. Todo bien.', expr: 'neutral' },
  B: { t: 'No publicar nada', fx: { v: 3, c: -2 }, res: 'Cerraste la app. El mundo siguió siendo “emocionante” sin ti.', expr: 'relief' } },

{ id: 'liquidacion', kind: 'pool', acts: [4], needs: ['laid_off'], weight: 3, m: 'FEB', time: '16:00', expr: 'tired', from: 'banco',
  text: 'Llegó tu liquidación: 2 sueldos. Es dinero, pero también es un reloj.',
  A: { t: 'Guardarla y buscar rápido', fx: { p: 10, e: -4 }, res: 'La pusiste en la cuenta de “no tocar”. La tocaste en el mes 2.', expr: 'tired' },
  B: { t: 'Tomarte 2 semanas para respirar', fx: { e: 12, p: -6, v: 4 }, res: 'Caminaste, dormiste y llamaste a tu mamá. Respirar también es inversión.', expr: 'relief' } },

{ id: 'apagon', kind: 'pool', acts: [2, 3, 4, 5], m: 'SEP', time: '10:45', expr: 'shock', from: 'luz', ambient: 'apagon',
  text: 'Se fue la luz en todo el barrio. Tu laptop tiene 23 % y un daily en 5 minutos.',
  A: { t: 'Seguir con el 23 % y rezar', fx: { c: 4, e: -4 }, res: 'Terminaste con 2 %. La laptop se apagó con la dignidad intacta.', expr: 'stressed' },
  B: { t: 'Avisar y desconectarte', fx: { e: 4, c: -3 }, res: 'Apagaste todo. Por una hora, nada fue urgente.', expr: 'relief' } },

/* ============ 2024 · Tech Lead (sin aumento) ============ */
{ id: 'ascenso', kind: 'anchor', act: 5, m: 'MAR', time: '17:45', expr: 'neutral', from: 'marcos',
  text: '“Felicidades, {n}: eres el nuevo Tech Lead. {?ot>=3|Siempre te quedas cuando hace falta. Por eso.|Confiamos en ti.} Mismo sueldo, claro.”',
  A: { t: 'Aceptar con orgullo', fx: { c: 14, e: -10 }, st: 10, set: ['unpaid_promo'], count: { extra: 1, yes: 1 },
       res: 'Ahora haces tu trabajo, el de Rodrigo y el de Marcos. El título llegó sin sueldo.', expr: 'tired' },
  B: { t: 'Condicionarlo al aumento', roll: { base: 0.4, mods: [['negotiated', 0.1], ['c>=65', 0.1]] },
       win:  { fx: { p: 16, c: 8 }, raise: 1, res: 'Te aprobaron S/ 700 más. Marcos “lo estaba conversando” (ya lo había aprobado).', expr: 'happy' },
       lose: { fx: { c: -12, e: -4 }, res: '“Entonces lo vemos con otra persona.”', expr: 'stressed' } },
  variants: [ { needs: ['rehired'], over: { from: 'nueva',
    text: '“Te contratamos como Senior… con sueldo de semi-senior. Para empezar.”',
    A: { t: 'Aceptar el título', fx: { p: 8, c: 8 }, res: 'Nuevo título, mismo problema, otro logo.', expr: 'neutral' },
    B: { t: 'Negociar el sueldo', roll: { base: 0.45, mods: [['referred', 0.15]] },
         win:  { fx: { p: 12, c: 6 }, raise: 1, res: 'Subieron la banda. “Es la primera vez que lo hacemos.”', expr: 'happy' },
         lose: { fx: { c: -6 }, res: '“Ese es el rango.” Y el rango es el rango.', expr: 'tired' } } } } ] },

{ id: 'entrevista', kind: 'pool', acts: [5], m: 'MAY', time: '13:10', expr: 'stressed', from: 'nueva',
  text: 'Una entrevista en dólares, a escondidas, a la hora de almuerzo. Tu fondo de cámara es una “biblioteca”.',
  A: { t: 'Seguir el proceso', fx: { c: 8, e: -6 }, set: ['offer'], res: 'Pasaste a la ronda final. Tu “cita médica” duró 3 horas.', expr: 'happy' },
  B: { t: 'Cancelarla', fx: { e: 3, v: 3 }, res: 'Cancelaste. Te quedó el sabor a “¿y si?”.', expr: 'neutral' } },

{ id: 'vacaciones', kind: 'pool', acts: [5], m: 'JUL', time: '18:20', expr: 'tired', from: 'calendario',
  text: 'Hace 2 años que no tomas vacaciones. Y hay release.',
  A: { t: 'Tomar una semana', fx: { e: 16, v: 10, c: -8 }, st: -15, res: 'Dormiste, comiste y no abriste el chat. Tu cuerpo escribió una carta de agradecimiento.', expr: 'relief' },
  B: { t: 'Posponer otra vez', fx: { c: 8, e: -10 }, st: 10, count: { ot: 1 }, res: 'Vacaciones acumuladas: 61 días. Valor para la empresa: gratis.', expr: 'tired' } },

{ id: 'presente-ausente', kind: 'pool', acts: [5], m: 'AGO', time: '20:30', expr: 'tired', from: 'pareja',
  text: '“Estás aquí, pero no estás.” Tu pareja lo dice bajito. La cena está servida.',
  A: { t: 'Cerrar la laptop y cenar juntos', fx: { v: 14, c: -4 }, count: { bound: 1 }, res: 'Cenaron sin pantallas. La sopa estaba tibia; la conversación, calentita.', expr: 'happy' },
  B: { t: 'Cinco minutos más…', fx: { c: 4, v: -12 }, res: 'Fueron 40 minutos. La cena se enfrió; la conversación, también.', expr: 'stressed' } },

{ id: 'yoga', kind: 'pool', acts: [5], m: 'SEP', time: '12:00', expr: 'neutral', from: 'paola',
  text: '“Yoga corporativo de 15 min, en horario de trabajo. Cámara encendida, por favor.”',
  A: { t: 'Ir y respirar de verdad', fx: { e: 6, c: -2 }, res: 'Por 15 minutos, nadie te pidió nada. Fue lo más productivo del mes.', expr: 'relief' },
  B: { t: 'Seguir trabajando, cámara apagada', fx: { c: 4, e: -5 }, res: 'Estiraste una pierna y respondiste 6 correos.', expr: 'tired' } },

{ id: 'colapso', kind: 'trigger', needs: ['body>=1', 'stress>=55', 'act>=4'], max: 1, m: 'OCT', time: '11:20', expr: 'sick', from: 'equipo',
  text: 'En plena reunión el mundo da vueltas. Te sientas en el piso. Tu cámara sigue encendida.',
  A: { t: 'Pedir ayuda y cortar la reunión', fx: { e: 12, p: -8, v: 4 }, st: -30, set: ['collapsed', 'rested', 'asked_help'], unset: ['sick_now'],
       res: 'Emergencia, suero y una frase de la doctora: “Te lo avisé”. Tenía razón.', expr: 'relief' },
  B: { t: '“Estoy bien, sigamos”', fx: { e: -18, c: 4 }, st: 10, set: ['collapsed'],
       res: 'Seguiste 12 minutos más. Luego llegó el silencio de 14 cámaras.', expr: 'sick' } },

/* ============ 2025 · Llega la IA ============ */
{ id: 'agente-ia', kind: 'anchor', act: 6, m: 'FEB', time: '23:05', expr: 'neutral', from: 'direccion',
  text: '“Desde hoy tenemos un agente de IA. Ahora entregarán el doble, con el mismo equipo y el mismo sueldo.”',
  A: { t: 'Aprender a dirigirlo', fx: { c: 12, e: -6 }, set: ['ai_friend'], res: 'Dejaste de picar código. Empezaste a revisar el de un robot. Cansa más de lo que parece.', expr: 'tired' },
  B: { t: 'Resistirte: “yo escribo mi código”', fx: { c: -10, e: 6, v: 2 }, set: ['ai_resist'], res: 'Tu código es artesanal. También lento. Marcos lo anotó.', expr: 'neutral' } },

{ id: 'alucinacion', kind: 'pool', acts: [6], m: 'ABR', time: '16:50', expr: 'shock', from: 'prod',
  text: 'El agente inventó una función que no existe… y rompió producción un viernes.',
  A: { t: 'Culpar a la IA en el reporte', fx: { c: -8 }, res: 'El informe decía “error del modelo”. Marcos preguntó: “¿Y quién lo supervisa?”.', expr: 'stressed' },
  B: { t: 'Revisar cada línea de ahora en adelante', fx: { c: 8, e: -8 }, res: 'Ahora la IA escribe y tú lees. Dos trabajos en uno. Ya te acostumbraste.', expr: 'tired' } },

{ id: 'equity', kind: 'pool', acts: [6], m: 'MAY', time: '11:30', expr: 'neutral', from: 'nueva',
  text: 'Una startup te ofrece 0.2 % de acciones… y un sueldo “simbólico”.',
  A: { t: 'Aceptar las acciones', roll: { base: 0.3 },
       win:  { fx: { p: 22, c: 10 }, res: 'La startup despegó. Tus acciones, también. (Esto es ficción, ¿ok?)', expr: 'happy' },
       lose: { fx: { p: -14, c: 4 }, res: 'La startup “pivotó”. Tus acciones, hacia cero.', expr: 'stressed' } },
  B: { t: 'Quedarte con tu sueldo fijo', fx: { p: 8, c: -4 }, res: 'Sueldo fijo, miedo fijo, café fijo.', expr: 'neutral' } },

{ id: 'bot-entrevista', kind: 'pool', acts: [6], m: 'JUN', time: '15:15', expr: 'neutral', from: 'bot',
  text: 'Tu entrevista técnica empieza. El entrevistador es un bot muy amable… y no parpadea.',
  A: { t: 'Responder al bot', fx: { c: 4 }, res: 'Respondiste 12 preguntas. “Gracias, nos pondremos en contacto.” (No lo hicieron.)', expr: 'neutral' },
  B: { t: 'Pedir hablar con un humano', fx: { c: -4, v: 2 }, res: 'Un humano apareció 4 días después. Era el mismo bot con otra foto.', expr: 'tired' } },

{ id: 'peque-camara', kind: 'pool', acts: [6], weight: 3, needs: ['baby'], m: 'MAR', time: '10:20', expr: 'happy', from: 'equipo', ambient: 'kid',
  text: 'Tu peque se cuela en cámara con una crayola y saluda a todo el equipo. 14 personas sonríen.',
  A: { t: 'Dejarlo saludar', fx: { v: 10, c: -4 }, res: 'Tu peque dijo “¡hola!”. Marcos escribió: “qué tierno, luego hablamos de profesionalismo”.', expr: 'happy' },
  B: { t: 'Sacarlo rápido de cámara', fx: { c: 4, v: -8 }, res: 'Quedaste impecable. Tu peque lloró; tu pareja te miró.', expr: 'stressed' } },

{ id: 'junior', kind: 'pool', acts: [6], weight: 3, needs: ['mentor'], m: 'ABR', time: '14:30', expr: 'neutral', from: 'tomas',
  text: '“Perdón, {n}, ¿me ayudas con este bug? Es mi primera semana y nadie me responde.”',
  A: { t: 'Quedarte 30 minutos a enseñarle', fx: { c: 6, v: 6, e: -5 }, set: ['mentored'], count: { learn: 1 },
       res: 'Le enseñaste a depurar. Recordaste una tarde de 2019 con luz anaranjada.', expr: 'happy' },
  B: { t: '“Ahorita no puedo”', fx: { e: 4 }, res: 'Tomás asintió y buscó en un foro. A las 5 pm, el bug seguía.', expr: 'neutral' } },

/* ============ 2026 · Cámara encendida ============ */
{ id: 'siete-anios', kind: 'anchor', fix: true, act: 7, m: 'SEP', time: '09:05', expr: 'neutral', from: 'paola',
  text: '“¡Felicidades por tus 7 años en la empresa! Sigues en la misma banda salarial.” {?raises>=1|(Bueno, casi.)|(Qué estabilidad.)}',
  A: { t: 'Imprimirlo y enmarcarlo (con ironía)', fx: { v: 6, c: -2 }, res: 'Está en tu pared, junto al calendario. Nadie lo entiende… excepto tú.', expr: 'happy' },
  B: { t: 'Pedir una reunión de compensación', roll: { base: 0.4, mods: [['c>=60', 0.15], ['offer', 0.15]] },
       win:  { fx: { p: 16, c: 6 }, raise: 1, res: 'Con una oferta en la mano, la banda subió un nivel. Pedirlo cuesta menos cada vez.', expr: 'happy' },
       lose: { fx: { c: -6, e: -4 }, res: '“No hay presupuesto.” Pero sí para el sillón de la sala de espera.', expr: 'tired' } } },

{ id: 'sabado-17', kind: 'anchor', fix: true, act: 7, last: true, m: '17 OCT', time: '08:30', expr: 'neutral', from: 'fer',
  text: '“Sábado 17 de octubre. Hay un hackathon en Lima. ¿Y si haces un juego sobre tu propia vida?”',
  A: { t: 'Dejar la cámara encendida y vibecodear', fx: { c: 8, e: -8 }, set: ['vibe'], res: 'Abriste la laptop. La cámara se encendió. Empezaste a escribir esta historia.', expr: 'happy' },
  B: { t: 'Cerrar la laptop y salir a caminar', fx: { e: 14, v: 10 }, set: ['walk'], res: 'Cerraste la tapa. La cámara se apagó por primera vez en 7 años. Afuera había sol.', expr: 'relief' } }
];

/* ---------- endings ---------- *
 * over:   a meter reached 0 (key = e|p|c|v). Others are evaluated in order; first match wins.
 * special endings only unlock when nothing state-driven matched; the finale choice is an epilogue stamp on any ending.
 */
D.CARES = [
  'Descansar no es un logro desbloqueable.',
  'Tu valor no es tu velocidad de entrega.',
  'Cerrar la laptop también es una decisión técnica.'
];
D.ENDINGS = [
  { id: 'burnout', over: 'e', title: 'Burnout Certificado', roast: 'Tu batería llegó a 0 %. No hay cargador en esta oficina remota.',
    story: 'La webcam sigue encendida frente a una silla vacía. Esta vez, descansar no fue una decisión: fue un diagnóstico.',
    care: 'Pide ayuda antes de llegar a 0 %. No es debilidad; es mantenimiento.' },
  { id: 'cuenta-cero', over: 'p', title: 'Cuenta en Cero', roast: 'Trabajaste todo el mes. El mes terminó antes que tu sueldo.',
    story: 'El banco te mandó un mensaje amable. Tu mamá, otro más amable aún: “¿Necesitas algo, {n}?”.',
    care: 'Pedir ayuda con la plata también es una habilidad técnica.' },
  { id: 'ghosteado', over: 'c', title: 'Ghosteado por RRHH', roast: 'Tu perfil dice “Open to work” desde 2023.',
    story: 'Mandaste 212 CVs. Recibiste 3 respuestas automáticas y un “gracias por tu interés”. La webcam te vio refrescar el correo a las 3 am.',
    care: 'Tu valor no es tu tasa de respuesta.' },
  { id: 'solo', over: 'v', title: 'Cero Bugs, Cero Invitados', roast: 'Cumpliste todos los sprints. Faltaste a todo lo demás.',
    story: 'Hubo cumpleaños, cenas y una obra de teatro. La webcam tiene los tres recordatorios del calendario. Todos dicen “ocupado”.',
    care: 'Las personas también necesitan mantenimiento. Tú, incluido.' },

  { id: 'equilibrista', needs: ['e>=55', 'p>=55', 'c>=55', 'v>=55'], title: 'El Equilibrista', roast: 'Sueldo, salud, carrera y gente. Existes y nadie te cree.',
    story: 'Dijiste “no” a tiempo, “sí” a lo importante y negociaste cuando tocaba. La webcam anota: esto no fue suerte… del todo.' },
  { id: 'cuerpo-cobra', needs: ['collapsed'], title: 'El Cuerpo Cobra', roast: 'Tu cuerpo pidió renuncia antes que tú.',
    story: 'Te sentaste en el piso en plena reunión y 14 cámaras se quedaron en silencio. {?asked_help|Esta vez pediste ayuda: la doctora, por fin, tuvo la última palabra.|Fue la única reunión que terminó a tiempo.}',
    care: 'Escucha las señales pequeñas para no necesitar las grandes.' },
  { id: 'dolares', needs: ['offer', 'p>=55'], title: 'Freelancer en Dólares', roast: 'Cobras en USD. La ansiedad también cotiza.',
    story: 'Rodrigo tenía razón. Lo que no te dijo es que el soporte técnico, la factura y el dentista ahora son tu departamento.' },
  { id: 'mentor', needs: ['mentored', 'c>=50', 'v>=45'], title: 'Mentor de Alguien', roast: 'Ahora tú dices: “quédate 30 minutos, te explico”.',
    story: 'Tomás depuró su primer bug sin ti. Miró a la cámara, sonrió y dijo “gracias”. Tú recordaste 2019, con luz de tarde.' },
  { id: 'techlead', needs: ['c>=70', 'p<40'], title: 'Tech Lead sin Aumento', roast: 'Tienes el título. El banco no lo acepta.',
    story: 'Lideras a siete personas, tres sistemas y un calendario inhumano. Tu perfil dice “Tech Lead”. Tu estado de cuenta dice “¿quién?”.' },
  { id: 'fantasma', needs: ['e<40'], title: 'Fantasma del Chat', roast: 'Siempre en línea. Nunca presente.',
    story: 'Respondes en 40 segundos y a las 2 am. Tu círculo verde brilla más que tú. La webcam recuerda tu risa; ya casi no la usa.' },
  { id: 'superviviente', needs: ['laid_off', 'c>=50'], title: 'Despedid{o} y Mejor Pagad{o}', roast: 'Te sacaron por videollamada. Volviste por la puerta grande.',
    story: 'Fue el peor martes de tu vida. Dos meses después firmaste algo mejor. ¿Rodrigo? ¿La preparación? ¿La suerte? Un poco de todo.' },
  { id: 'mute-parental', needs: ['baby', 'v>=55'], title: 'Cámara Apagada, Corazón Encendido', roast: 'Tu mejor release fue un “te quiero” con el micro en mute.',
    story: 'Tu peque aprendió a decir “reunión” antes que “agua”. Cuando cierras la laptop, ya sabe que llegaste.' },
  { id: 'vibecoder', special: true, needs: ['vibe', 'c>=45'], title: 'Vibecoder del Sábado', roast: 'Convertiste tu vida en un juego. Ahora la gente lo está jugando.',
    story: 'El sábado 17 abriste la laptop y la cámara se encendió. Escribiste tu historia en 30 horas. Por una vez, el jefe eras tú.' },
  { id: 'caminante', special: true, needs: ['walk', 'v>=50'], title: 'El que Cerró la Laptop', roast: 'Salió el sol. El deploy pudo esperar.',
    story: 'Cerraste la tapa y la webcam se apagó por primera vez en 7 años. Afuera, Lima olía a pan caliente, bocinazos y garúa.' },
  { id: 'promedio', default: true, title: 'Dev Promedio (Sobrevivió)', roast: 'Llegaste a 2026. Eso ya es un logro.',
    story: 'No ganaste nada espectacular ni lo perdiste todo. La webcam registra a alguien que sigue aquí, y eso es más raro de lo que parece.' }
];

/* ---------- "lo que la webcam recuerda": shown on the ending + share card ---------- */
D.RECAP = [
  { id: 'raises', always: true, icon: '📈', text: 'Aumentos conseguidos: {#raises}' },
  { id: 'ot',     needs: ['ot>=1'],     icon: '⏰', text: 'Veces que dijiste “un ratito más”: {#ot}' },
  { id: 'extra',  needs: ['extra>=1'],  icon: '🧾', text: 'Responsabilidades extra sin sueldo extra: {#extra}' },
  { id: 'body',   needs: ['body>=1'],   icon: '🌙', text: 'Señales del cuerpo ignoradas: {#body}' },
  { id: 'bound',  needs: ['bound>=1'],  icon: '🚪', text: 'Veces que pusiste un límite: {#bound}' },
  { id: 'learn',  needs: ['learn>=2'],  icon: '📚', text: 'Cosas que aprendiste de otros devs: {#learn}' },
  { id: 'cam',    needs: ['cam>=1'],    icon: '📷', text: 'Veces que prendiste la cámara sin ganas: {#cam}' },
  { id: 'yes',    needs: ['yes>=3'],    icon: '🙂', text: 'Veces que dijiste “sí” sin preguntar el precio: {#yes}' }
];

if (typeof module !== 'undefined' && module.exports) module.exports = D;
else root.SEL_DATA = D;
})(typeof self !== 'undefined' ? self : this);
