# Más que Tinta · Carballo (A Coruña)

Web de una tienda de informática de barrio. **Primera plantilla del taller
para el sector tienda de informática / consumibles.**

Concepto propio: **«Cartucho»**. El nombre del negocio ya lo dice —tinta, y
«más»—, así que el sistema de color de toda la web son las cuatro tintas de
imprenta sobre papel, y el gesto que se repite es **el nivel**: depósitos que
se llenan de abajo arriba, barras finas que se rellenan con el scroll,
etiquetas mono con porcentajes y líneas punteadas de corte de página.

No se parece a ninguna otra de la carpeta y **no comparte esqueleto con
ninguna**: el lenguaje de Calidade Systems (la otra web de informática) son
pistas de circuito y servicios B2B; aquí no hay ni una.

---

## Lo que hay que confirmar antes de publicar

Toda la página está hecha **solo con datos verificables**. Lo que no lo es va
marcado con un corchete visible en pantalla, y además está listado en la
sección «Lo que falta por confirmar» de la propia web, para que el cliente lo
vea y lo rellene.

| # | Falta | Dónde está marcado |
|---|---|---|
| 01 | **Qué se vende exactamente** y con qué **marcas** | `[CONFIRMAR CON LA TIENDA]`, `[CONFIRMAR MARCAS]` en cada tarjeta de categoría y en Consumibles |
| 02 | **Servicios de reparación**, plazos y tarifas | `[SERVICIOS DE REPARACIÓN PENDIENTES]`, `[TARIFAS Y PLAZOS PENDIENTES]` |
| 03 | **Dirección**: Rúa Luis Calvo, 6, bajo izda. | `[DIRECCIÓN A CONFIRMAR]` en Contacto |
| 04 | **Logo** o foto del rótulo | el wordmark es una propuesta tipográfica provisional, y lo dice el pie |
| 05 | **Fotografías reales** de la tienda | cada foto lleva el pie «IMAGEN DE ARCHIVO · NO ES LA TIENDA» |
| 06 | **Textos de las reseñas** de Google | `[TEXTO DE RESEÑA PENDIENTE]` × 3 |
| 07 | **Email**, **WhatsApp** y a dónde lleva «Sitio web» en Google | `[EMAIL PENDIENTE]`, `[WHATSAPP PENDIENTE]`, `[URL PENDIENTE DE CONFIRMAR]` |
| 08 | **Equipo** y **año de apertura** | no hay sección «quiénes somos»: no se inventa |
| 09 | ¿Hay tienda en **Camariñas**? | listado en la sección de pendientes |
| 10 | **Transportistas** del punto PuntoPack | `[OPERADORES Y TRANSPORTISTAS A CONFIRMAR]` |
| 11 | El buscador de referencia **no busca** | `[FUNCIÓN PENDIENTE]`, y el propio formulario lo contesta al enviarlo |
| 12 | ¿Se admiten **devoluciones** en el punto? ¿Se hacen **copias**? | `[¿SE ADMITEN DEVOLUCIONES? A CONFIRMAR]`, `¿SE HACEN COPIAS? [PENDIENTE]` |

### Datos que sí son reales y de dónde salen

- **Nombre**: Más que Tinta.
- **Categoría**: tienda de informática (Google); informática y ofimática (directorios).
- **Teléfono**: 981 70 22 29 (coincide en Google y en QDQ).
  El 981 73 77 31 que aparece en Páginas Amarillas **no se publica**: parece antiguo.
- **Valoración**: 4,7 ★ con 36 reseñas (ficha de Google).
- **Horario**: L–V 10:00–14:00 y 16:30–20:00 · S 10:00–14:00 · **D 11:00–13:00**.
- **PuntoPack**: punto de recogida y envío de paquetes (Cylex).
- **Redes**: `facebook.com/mqt.es` e `instagram.com/masquetintacarballo`.

### Lo que se ha dejado fuera a propósito

- **mqt.es** no resuelve y **masquetinta.com es otro negocio distinto**: no se
  ha usado ni un dato de ahí.
- El «Más que Tinta» de Camariñas (Rúa do Viril, ligado a lineainfoeco.com)
  **no se da por hecho** que sea la misma empresa.
- Ninguna marca comercial, ningún «servicio técnico oficial de», ningún precio.
- Ninguna reseña inventada.

---

## Estructura

| Sección | Tinta | Qué es |
|---|---|---|
| Hero | las cuatro | panel de niveles CMYK que se llena al cargar y wordmark con la «á» como depósito |
| Marquesina | negro | las categorías en mono, en bucle lento |
| `#tienda` | cambia por tarjeta | pila pegajosa de 6 categorías; el fondo barre de una tinta a la siguiente |
| `#consumibles` | cian | originales / compatibles / papel + buscador-maqueta + estante de depósitos |
| `#reparacion` | magenta | qué se puede traer y los cuatro pasos del proceso |
| `#puntopack` | amarillo | qué es un punto de recogida y por qué el domingo importa |
| `#horario` | negro (+ domingo en amarillo) | gráfico semanal de franjas sobre un eje 10:00 → 20:00, con «hoy» y «ahora mismo» |
| `#resenas` | cian | 4,7 ★ · 36 reseñas reales; textos vacíos a propósito |
| `#contacto` | magenta | teléfono, dirección, horario, redes y mapa bajo demanda |
| `#pendiente` | negro | la lista de arriba, visible en la web |
| Cartucho fijo | la de la sección | indicador de scroll: se llena con lo leído y cambia de tinta con el mismo barrido de cabezal; pulsarlo sube al principio |

Regla de color: **una sola tinta por sección**. Las cuatro juntas solo en el
hero, la marquesina y la franja del pie.

---

## Cómo está hecho

- HTML + CSS + un solo `js/main.js`. Sin build, sin framework.
- GSAP + ScrollTrigger + Lenis desde CDN. **Si el CDN falla la web sigue
  entera**: los estados «vacíos» viven bajo `html.has-motion`, que solo se
  enciende desde el JS (verificado con las peticiones a GSAP abortadas).
- Las barras de nivel son `div` con `transform: scaleY` / `scaleX`. No hay
  ningún `stroke-dasharray` sobre un `viewBox` estirado, ni canvas, ni `blur`
  por frame.
- El barrido de tinta de la pila pegajosa es `clip-path: inset(0 100% 0 0)` →
  `inset(0 0 0 0)` en 0,5 s: un cabezal de impresión cruzando el papel.
- En la pila pegajosa **el `<li>` es el pegajoso** y su `margin-bottom` es el
  recorrido. Tres detalles que hay que respetar, porque las seis comparten
  contenedor y un sticky se recorta contra su **caja de margen**:
  1. las seis llevan **el mismo `margin-bottom`**, la última incluida (con
     margen 0 se soltaba 234 px después que el resto);
  2. las seis miden **lo mismo** (`--alto-carta`, que el JS recalcula al
     cambiar el ancho; por encima de 900 px hay un suelo fijo en CSS como
     respaldo). Una tarjeta 29 px más alta se despegaba antes y asomaba por
     detrás al salir la pila;
  3. el recorrido de la última lo da un **`::after` del contenedor**, del
     tamaño de un paso completo de la pila. Ni el `padding` del contenedor
     ni el margen del último hijo sirven, y con un `::after` demasiado corto
     PuntoPack se veía un tercio de lo que se ve el resto.
  El `min-height` va en la tarjeta, nunca en el `<li>` (eso deja fantasmas).
- **Cartucho del scroll** (abajo a la izquierda): el mismo gesto que el resto,
  un depósito con `transform: scaleY`. Va con **un rAF por evento de scroll**,
  así que no hay trabajo por frame con la página quieta (medido: 0 long tasks,
  60 fps). Tres detalles que costaron una iteración: va sobre una **placa de
  papel** porque cruza secciones cian, magenta, amarilla y negra y el
  porcentaje en gris no se leía encima; las rayas de nivel van **debajo** de la
  tinta, porque encima desaparecían con la tinta negra al 80 %; y la
  superficie lleva una **línea de menisco** posicionada con
  `top: calc(100% - var(--carga) * 100%)`, que no depende del color de la
  tinta.
- **Movimiento reducido**: los niveles salen ya llenos y no hay barrido, pero
  el contenido no cambia — los porcentajes, la nota 4,7, las 36 reseñas y **el
  nivel del cartucho** se pintan igual. El cartucho mide *cuánto llevas leído*:
  eso es estado, no adorno, así que se actualiza también sin GSAP.
- **Mapa**: `google.com/maps?q=…&output=embed`, sin API key, y **solo se monta
  al pulsar** (patrón `.map-consent`). Es lo que hace cierto el aviso de «sin
  cookies de terceros».
- **Aviso de cookies**: el banner se oculta con `[hidden]` y en el CSS no hay
  ningún `display` que pueda ganarle, así que el botón cierra de verdad.
- Modo claro siempre (`color-scheme: light only`). No hay tema oscuro.

### Tipografía

- Titulares: **Archivo** (OFL) en instancia ancha `wdth 112`.
- Etiquetas, porcentajes y referencias: **JetBrains Mono**.

---

## Marca

El wordmark de `assets/img/brand/mqt-wordmark.svg` es **provisional**: la
tienda no nos ha dado logo ni archivo del rótulo. Está escrito en Archivo
convertido a trazados —no depende de que cargue la fuente— con «Más» en cian
y la **á como depósito lleno al 62 %**. El favicon son las cuatro barras CMYK.

En cuanto llegue el rótulo real, se tira y se sustituye:
`python scripts/generate_brand.py` regenera wordmark, marca e iconos.

## Fotografía

**Aviso importante sobre el encargo**: el brief pedía *«genera fotografía
original acorde al concepto»*. En este entorno **no hay herramienta de
generación de imagen** (se comprobó), así que **ninguna foto está generada**:
todas son de archivo de Pexels (licencia comercial libre), elegidas a mano
sobre hojas de contacto (`scripts/contact_sheets/*.png`).

Ninguna es de Más que Tinta. Cada una lo dice en su pie, y el pie de página lo
repite. La gradación (`scripts/process_photos.py`) es por script, no con
filtros CSS: balance de blancos, curva en S, **desaturación selectiva que deja
una sola tinta CMYK por foto**, split-toning (sombras a `#111111`, luces a
`#FBFAF7`), viñeta leve y grano fino para que ocho procedencias distintas
parezcan la misma cámara.

Descartadas a propósito (el porqué está en la cabecera del script): una foto
de cartucho **con la marca legible** —las marcas están sin confirmar—, un
interior de tienda **con una persona reconocible**, y las fotos de catálogo de
teclados de marca sobre fondo blanco, que el brief prohíbe expresamente.

---

## Scripts

| Script | Qué hace |
|---|---|
| `python scripts/generate_brand.py` | wordmark, marca e iconos |
| `python scripts/process_photos.py` | descarga, recorta y gradúa las fotos |
| `node scripts/contact_sheets.js "consulta"…` | hojas de contacto de Pexels para elegir foto |
| `node scripts/generate_og.js` | imagen 1200×630 para compartir |
| `node scripts/shots.js <url> <ancho> <etiqueta> <alto>` | capturas por sección |
| `node scripts/verify.js <url>` | **la verificación**: 39 pruebas |

Los de Node necesitan `NODE_PATH=/c/Users/alvar/node_modules`.

### Verificación (Playwright)

```
python -m http.server 8247
NODE_PATH=/c/Users/alvar/node_modules node scripts/verify.js http://127.0.0.1:8247/
```

39/39 pruebas. Comprueba, entre otras: que los cuatro depósitos del hero
llegan a su nivel y el porcentaje coincide, que la «á» se rellena, que el
botón del aviso de cookies **cierra**, que **no hay iframe de Google antes de
pulsar** y sí después, que el barrido de tinta llega hasta la sexta tarjeta,
que el eje de horas cae exactamente sobre la columna de las franjas, que
**la pila pegajosa se suelta entera** —las seis tarjetas se pegan, miden lo
mismo y ninguna asoma por detrás al salir—, que los
contadores acaban en 4,7 y 36, que **el cartucho del scroll marca el avance
real de la página y lleva la tinta de la sección**, que a 400 px siguen estando las cuatro barras y
no hay scroll horizontal, que con movimiento reducido los niveles salen llenos
**sin perder ni un dato**, y que si el CDN de GSAP cae la marca y el teléfono
siguen ahí.

La página recorre con la **rueda del ratón**, no con `window.scrollTo`: con
Lenis, `scrollTo` no dispara los ScrollTrigger del final de la página.
