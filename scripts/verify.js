/* Verificacion de la web de Mas que Tinta con Playwright.

   Recorre la pagina con la RUEDA del raton, no con window.scrollTo: con
   Lenis, scrollTo no dispara los ScrollTrigger del final de la pagina.

   Comprueba: errores de consola y recursos 404, que el boton del aviso
   de cookies cierra de verdad, que NO hay iframe de Google antes de
   pulsar el mapa (y que si lo hay despues), el llenado de los cuatro
   depositos del hero, el barrido de tinta de la pila pegajosa, la barra
   de nivel de cada seccion, el buscador-maqueta, el menu movil, el
   desbordamiento horizontal a 400 px, la variante de movimiento
   reducido (niveles ya llenos, sin barrido) y que la pila pegajosa se
   suelta entera, sin que ninguna tarjeta asome por detras.

   Uso: NODE_PATH=/c/Users/alvar/node_modules node scripts/verify.js [url] */
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const URL = process.argv[2] || 'http://127.0.0.1:8247/';
const SHOTS = path.join(__dirname, '..', 'screenshots');
fs.mkdirSync(SHOTS, { recursive: true });

const informe = { url: URL, consola: [], fallos: [], pruebas: [] };
const ok = (n, v, extra) => {
  informe.pruebas.push({ prueba: n, ok: !!v, extra: extra || null });
  console.log((v ? 'OK  ' : 'MAL ') + n + (extra ? '  ' + JSON.stringify(extra) : ''));
};

function vigila(page) {
  page.on('console', (m) => {
    if (m.type() === 'error' || m.type() === 'warning') informe.consola.push(m.type() + ': ' + m.text());
  });
  page.on('pageerror', (e) => informe.consola.push('pageerror: ' + e.message));
  page.on('response', (r) => { if (r.status() >= 400) informe.fallos.push(r.status() + ' ' + r.url()); });
}

async function rueda(page, hasta, paso) {
  paso = paso || 700;
  let y = await page.evaluate(() => window.scrollY);
  while (y < hasta) {
    await page.mouse.wheel(0, Math.max(60, Math.min(paso, hasta - y)));
    await page.waitForTimeout(140);
    const ny = await page.evaluate(() => window.scrollY);
    if (ny <= y + 1) break;
    y = ny;
  }
  await page.waitForTimeout(2600);
  return y;
}
const donde = (page, sel, margen) => page.evaluate(([s, m]) => {
  const el = document.querySelector(s);
  return el ? el.getBoundingClientRect().top + window.scrollY - m : 0;
}, [sel, margen || 90]);

const escalaY = (page, sel) => page.evaluate((s) => {
  const el = document.querySelector(s);
  if (!el) return null;
  const m = new DOMMatrixReadOnly(getComputedStyle(el).transform);
  return Math.round(m.d * 1000) / 1000;
}, sel);
const escalaX = (page, sel) => page.evaluate((s) => {
  const el = document.querySelector(s);
  if (!el) return null;
  const m = new DOMMatrixReadOnly(getComputedStyle(el).transform);
  return Math.round(m.a * 1000) / 1000;
}, sel);

(async () => {
  const browser = await chromium.launch();

  /* ---------------- escritorio ---------------- */
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  vigila(page);
  await page.goto(URL, { waitUntil: 'networkidle' });
  await page.waitForTimeout(3400);

  ok('la fuente Archivo esta cargada',
    await page.evaluate(() => document.fonts.check('800 40px Archivo')));

  /* --- hero: los cuatro depositos llegan a su nivel --- */
  const niveles = await page.evaluate(() => Array.from(document.querySelectorAll('.tanque')).map((t) => ({
    letra: t.querySelector('.tanque-pie b').textContent,
    objetivo: +t.dataset.nivel,
    escala: Math.round(new DOMMatrixReadOnly(getComputedStyle(t.querySelector('.tanque-tinta')).transform).d * 100),
    pct: t.querySelector('.tanque-pct').textContent
  })));
  ok('los 4 tanques del hero se llenan a su nivel',
    niveles.length === 4 && niveles.every((n) => Math.abs(n.escala - n.objetivo) <= 1
      && n.pct === n.objetivo + '%'), niveles);

  /* --- la "a" de Mas es un deposito y se llena --- */
  const carga = await page.evaluate(() => getComputedStyle(document.querySelector('.hero-a-tinta')).clipPath);
  ok('la "a" del wordmark se rellena', /inset\(\s*3[6-9](\.\d+)?%/.test(carga.replace(/px/g, '')) || /38%/.test(carga), { carga });

  /* --- aviso de cookies: el boton tiene que cerrarlo --- */
  ok('el aviso de cookies se ve al entrar', await page.isVisible('.cookie-banner'));
  await page.click('.cookie-ack');
  await page.waitForTimeout(250);
  ok('el boton "Entendido" cierra el aviso', !(await page.isVisible('.cookie-banner')));

  /* --- marquesina: clonada lo bastante para el bucle --- */
  const marq = await page.evaluate(() => {
    const c = document.querySelector('.marquesina-cinta');
    return { ancho: c.scrollWidth, ventana: window.innerWidth };
  });
  ok('la marquesina mide mas de dos pantallas', marq.ancho >= marq.ventana * 2, marq);

  /* --- pila pegajosa: el fondo barre de tinta en tinta ---
     clip-path se lee "inset(arriba derecha abajo izquierda)": la capa
     esta puesta cuando el recorte por la DERECHA es 0 (y escondida
     cuando es 100%). Comparar la cadena entera no vale: el navegador
     mezcla px y % segun quien la haya escrito. */
  const derecha = (txt) => {
    const m = /inset\(([^)]+)\)/.exec(txt);
    if (!m) return null;
    const p = m[1].trim().split(/\s+/);
    return p.length > 1 ? p[1] : p[0];
  };
  const puesta = (txt) => ['0', '0px', '0%'].includes(derecha(txt));

  await rueda(page, await donde(page, '.cats-lista', 60));
  const capa0 = await page.evaluate(() => getComputedStyle(document.querySelector('.cats-capa[data-capa="0"]')).clipPath);
  ok('la primera tinta ya ha barrido el fondo', puesta(capa0), { capa0 });
  await page.screenshot({ path: path.join(SHOTS, 'v-cats-1.png') });

  const ultima = await page.$$('.cat');
  await rueda(page, await donde(page, '.cat:last-child', 60));
  const capa5 = await page.evaluate(() => getComputedStyle(document.querySelector('.cats-capa[data-capa="5"]')).clipPath);
  ok('la ultima tinta (amarillo) ha barrido al llegar la tarjeta 06',
    puesta(capa5), { capa5, tarjetas: ultima.length });
  await page.screenshot({ path: path.join(SHOTS, 'v-cats-6.png') });

  /* --- la pila no se deshace al salir ---
     Un sticky se recorta contra su caja de MARGEN dentro de la caja de
     contenido del contenedor. Como las seis comparten contenedor, si una
     tarjeta mide distinto o lleva otro margen se despega antes que el
     resto y, al irse la pila, asoma la de debajo. Aqui se recorre la
     seccion entera y se exige el invariante: toda tarjeta que YA se haya
     pegado tiene que estar exactamente a la misma altura que las demas
     que ya se pegaron. (Se usa scrollTo a proposito: esto es geometria
     pura, no depende de ningun ScrollTrigger.) */
  const pila = await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll('.cat'));
    const tope = parseFloat(getComputedStyle(cards[0]).top);
    const sec = document.querySelector('.cats').getBoundingClientRect();
    const desde = sec.top + window.scrollY;
    const hasta = desde + sec.height + 600;
    const y0 = window.scrollY;
    const pegadas = new Set();
    const fallos = [];
    let sueltas = new Set();
    for (let y = desde; y <= hasta; y += 20) {
      window.scrollTo(0, y);
      const tops = cards.map((c) => Math.round(c.getBoundingClientRect().top - tope));
      tops.forEach((t, i) => { if (t <= 1) pegadas.add(i); });
      const puestas = [...pegadas].map((i) => tops[i]);
      if (puestas.length > 1 && Math.max(...puestas) - Math.min(...puestas) > 1) {
        if (fallos.length < 3) fallos.push({ y: Math.round(y), tops });
      }
      if (y > desde + 200) tops.forEach((t, i) => { if (pegadas.has(i) && t < -1) sueltas.add(i); });
    }
    window.scrollTo(0, y0);
    return {
      alturas: cards.map((c) => Math.round(c.getBoundingClientRect().height)),
      margenes: cards.map((c) => getComputedStyle(c).marginBottom),
      pegadas: pegadas.size, sueltas: sueltas.size, fallos
    };
  });
  ok('las seis tarjetas llegan a pegarse (tambien la ultima)', pila.pegadas === 6, { pegadas: pila.pegadas });
  ok('las seis miden lo mismo y llevan el mismo margen',
    new Set(pila.alturas).size === 1 && new Set(pila.margenes).size === 1,
    { alturas: pila.alturas, margenes: pila.margenes });
  ok('la pila se suelta entera: ninguna asoma por detras', pila.fallos.length === 0, pila.fallos);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(600);
  await rueda(page, await donde(page, '.cat:last-child', 60));

  /* --- los depositos de las tarjetas se llenan --- */
  const deps = await page.evaluate(() => Array.from(document.querySelectorAll('.deposito-tinta'))
    .map((d) => Math.round(new DOMMatrixReadOnly(getComputedStyle(d).transform).d * 100)));
  ok('los depositos de las tarjetas estan llenos', deps.every((d) => d >= 99), deps);

  /* --- buscador maqueta --- */
  await rueda(page, await donde(page, '#consumibles', 60));
  await page.fill('#ref', 'XXX-123');
  await page.click('#buscador button[type="submit"]');
  await page.waitForTimeout(400);
  const aviso = await page.textContent('.buscador-aviso');
  ok('el buscador contesta que es una maqueta',
    /FUNCI[ÓO]N PENDIENTE/.test(aviso) && /XXX-123/.test(aviso) && /981 70 22 29/.test(aviso));

  /* --- nivel de seccion al 100 % al salir del bloque --- */
  await rueda(page, await donde(page, '#reparacion', 60) + 200);
  await rueda(page, await donde(page, '#puntopack', 60));
  const nivelRep = await page.evaluate(() => {
    const n = document.querySelector('#reparacion .nivel');
    return { escala: Math.round(new DOMMatrixReadOnly(getComputedStyle(n.querySelector('.nivel-tinta')).transform).a * 100),
             texto: n.querySelector('.nivel-pct').textContent };
  });
  ok('la barra de nivel de Reparacion llega al 100 %', nivelRep.escala >= 99 && nivelRep.texto === 'M 100%', nivelRep);

  /* --- franjas del horario --- */
  await rueda(page, await donde(page, '#horario', 60));
  const franjas = await page.evaluate(() => Array.from(document.querySelectorAll('.hor-franja'))
    .map((f) => Math.round(new DOMMatrixReadOnly(getComputedStyle(f).transform).a * 100)));
  ok('las 12 franjas del horario estan pintadas', franjas.length === 12 && franjas.every((f) => f >= 99), franjas);
  /* el eje y las franjas comparten caja: si no, el marcador miente */
  const eje = await page.evaluate(() => {
    const pista = document.querySelector('.hor-dia .hor-pista').getBoundingClientRect();
    const ejeP = document.querySelector('.hor-eje-pista').getBoundingClientRect();
    return { pista: [Math.round(pista.left), Math.round(pista.right)], eje: [Math.round(ejeP.left), Math.round(ejeP.right)] };
  });
  ok('el eje de horas cae sobre la misma columna que las franjas',
    Math.abs(eje.pista[0] - eje.eje[0]) <= 1 && Math.abs(eje.pista[1] - eje.eje[1]) <= 1, eje);

  /* --- contadores reales --- */
  await rueda(page, await donde(page, '#resenas', 60));
  const res = await page.evaluate(() => ({
    nota: document.querySelector('.res-nota').textContent,
    n: document.querySelector('[data-contador-n]').textContent
  }));
  ok('el contador termina en los datos reales 4,7 y 36', res.nota === '4,7' && res.n === '36', res);

  /* --- cartucho del scroll ---
     El nivel tiene que coincidir con el avance real de la página y la
     tinta con la de la sección que estás cruzando. */
  const cartucho = async () => page.evaluate(() => {
    const c = document.querySelector('.cartucho');
    const base = c.querySelector('[data-capa="base"]');
    const max = document.documentElement.scrollHeight - window.innerHeight;
    return {
      real: Math.round((window.scrollY / max) * 100),
      pct: parseInt(c.querySelector('.cartucho-pct').textContent, 10),
      escala: Math.round(new DOMMatrixReadOnly(getComputedStyle(base).transform).d * 100),
      tinta: getComputedStyle(base).backgroundColor,
      visible: c.classList.contains('is-visible')
    };
  });
  /* aquí el recorrido está en Reseñas, que es cian */
  const cRes = await cartucho();
  ok('el cartucho marca el avance real de la página',
    Math.abs(cRes.pct - cRes.real) <= 1 && Math.abs(cRes.escala - cRes.real) <= 1, cRes);
  ok('el cartucho lleva la tinta de la sección (cian en Reseñas)',
    cRes.tinta === 'rgb(0, 169, 224)' && cRes.visible, { tinta: cRes.tinta });

  /* --- mapa bajo demanda --- */
  await rueda(page, await donde(page, '#contacto', 60));
  const cCon = await cartucho();
  ok('el cartucho cambia de tinta al entrar en Contacto (magenta)',
    cCon.tinta === 'rgb(229, 0, 125)' && cCon.pct > cRes.pct, { tinta: cCon.tinta, pct: cCon.pct });

  ok('NO hay iframe de Google antes de pedirlo', (await page.$$('iframe')).length === 0);
  await page.click('.map-consent');
  await page.waitForTimeout(2500);
  const src = await page.getAttribute('iframe', 'src');
  ok('el mapa se monta al pulsar, sin API key',
    !!src && src.includes('google.com/maps?q=') && src.includes('output=embed') && !src.includes('key='), { src });
  await page.screenshot({ path: path.join(SHOTS, 'v-mapa.png') });

  /* --- sin desbordamiento horizontal --- */
  const desb1440 = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  ok('sin scroll horizontal a 1440 px', desb1440 <= 0, { sobra: desb1440 });

  /* ---------------- movil 400 px ---------------- */
  const ctxM = await browser.newContext({ viewport: { width: 400, height: 820 }, isMobile: true, hasTouch: true });
  const pm = await ctxM.newPage();
  vigila(pm);
  await pm.goto(URL, { waitUntil: 'networkidle' });
  await pm.waitForTimeout(3200);
  const cuatro = await pm.evaluate(() => {
    const t = Array.from(document.querySelectorAll('.tanque'));
    return { n: t.length, anchos: t.map((x) => Math.round(x.getBoundingClientRect().width)) };
  });
  ok('a 400 px siguen estando las cuatro barras', cuatro.n === 4 && cuatro.anchos.every((a) => a > 20), cuatro);
  const desb400 = await pm.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  ok('sin scroll horizontal a 400 px', desb400 <= 0, { sobra: desb400 });
  await pm.click('.cookie-ack');
  await pm.click('.nav-toggle');
  await pm.waitForTimeout(300);
  ok('el menu movil se abre', await pm.isVisible('.nav-movil'));
  await pm.screenshot({ path: path.join(SHOTS, 'v-movil-menu.png') });
  await pm.click('.nav-movil a[href="#horario"]');
  await pm.waitForTimeout(2200);
  ok('el menu movil se cierra al elegir', !(await pm.isVisible('.nav-movil')));

  /* ---------------- movimiento reducido ---------------- */
  const ctxR = await browser.newContext({ viewport: { width: 1280, height: 860 }, reducedMotion: 'reduce' });
  const pr = await ctxR.newPage();
  vigila(pr);
  await pr.goto(URL, { waitUntil: 'networkidle' });

  await pr.waitForTimeout(2200);
  ok('sin movimiento no se enciende has-motion',
    !(await pr.evaluate(() => document.documentElement.classList.contains('has-motion'))));
  const rm = await pr.evaluate(() => ({
    tanques: Array.from(document.querySelectorAll('.tanque')).map((t) => ({
      escala: Math.round(new DOMMatrixReadOnly(getComputedStyle(t.querySelector('.tanque-tinta')).transform).d * 100),
      pct: t.querySelector('.tanque-pct').textContent
    })),
    niveles: Array.from(document.querySelectorAll('.nivel-pct')).map((n) => n.textContent),
    capas: Array.from(document.querySelectorAll('.cats-capa')).map((c) => getComputedStyle(c).clipPath),
    nota: document.querySelector('.res-nota').textContent,
    resenas: document.querySelector('[data-contador-n]').textContent,
    franjas: Array.from(document.querySelectorAll('.hor-franja')).map((f) => Math.round(new DOMMatrixReadOnly(getComputedStyle(f).transform).a * 100))
  }));
  ok('con movimiento reducido los depositos ya estan llenos',
    rm.tanques.every((t) => t.escala === 100) , rm.tanques);
  ok('con movimiento reducido los porcentajes siguen siendo su dato',
    rm.tanques.map((t) => t.pct).join(',') === '100%,96%,99%,94%', rm.tanques.map((t) => t.pct));
  ok('con movimiento reducido los niveles de seccion marcan 100 %',
    rm.niveles.every((n) => /100%$/.test(n)), rm.niveles);
  ok('con movimiento reducido no hay barrido (todas las tintas puestas)',
    rm.capas.every(puesta), rm.capas);
  ok('con movimiento reducido el contenido no se pierde (4,7 y 36)',
    rm.nota === '4,7' && rm.resenas === '36', { nota: rm.nota, resenas: rm.resenas });
  await pr.evaluate(() => window.scrollTo(0, Math.round((document.documentElement.scrollHeight - innerHeight) * 0.6)));
  await pr.waitForTimeout(500);
  const crm = await pr.evaluate(() => {
    const c = document.querySelector('.cartucho');
    const max = document.documentElement.scrollHeight - innerHeight;
    return { real: Math.round(window.scrollY / max * 100),
             pct: parseInt(c.querySelector('.cartucho-pct').textContent, 10),
             escala: Math.round(new DOMMatrixReadOnly(getComputedStyle(c.querySelector('[data-capa="base"]')).transform).d * 100) };
  });
  ok('con movimiento reducido el cartucho SIGUE midiendo el avance',
    Math.abs(crm.pct - crm.real) <= 1 && Math.abs(crm.escala - crm.real) <= 1, crm);

  ok('con movimiento reducido las franjas del horario estan pintadas',
    rm.franjas.length === 12 && rm.franjas.every((f) => f === 100));
  await pr.screenshot({ path: path.join(SHOTS, 'v-reduced.png'), fullPage: false });

  /* ---------------- sin GSAP (CDN caido) ---------------- */
  const ctxS = await browser.newContext({ viewport: { width: 1280, height: 860 } });
  const ps = await ctxS.newPage();
  await ps.route('**/gsap*/**', (r) => r.abort());
  await ps.route('**/lenis*/**', (r) => r.abort());
  await ps.goto(URL, { waitUntil: 'domcontentloaded' });
  await ps.waitForTimeout(2600);
  await ps.evaluate(() => window.scrollTo(0, Math.round((document.documentElement.scrollHeight - innerHeight) * 0.5)));
  await ps.waitForTimeout(400);
  const sin = await ps.evaluate(() => ({
    marca: !!document.querySelector('.hero-marca') && getComputedStyle(document.querySelector('.hero-marca')).opacity,
    tel: document.querySelector('a[href^="tel:"]').getAttribute('href'),
    tanque: Math.round(new DOMMatrixReadOnly(getComputedStyle(document.querySelector('.tanque-tinta')).transform).d * 100),
    cartucho: parseInt(document.querySelector('.cartucho-pct').textContent, 10)
  }));
  ok('si el CDN falla la marca y el telefono siguen visibles',
    sin.marca === '1' && sin.tel === 'tel:+34981702229' && sin.tanque === 100, sin);
  ok('si el CDN falla el cartucho sigue midiendo el avance',
    Math.abs(sin.cartucho - 50) <= 2, { cartucho: sin.cartucho });
  await ps.screenshot({ path: path.join(SHOTS, 'v-sin-gsap.png') });

  ok('sin errores de consola', informe.consola.length === 0, informe.consola.slice(0, 6));
  ok('sin recursos 404', informe.fallos.length === 0, informe.fallos.slice(0, 6));

  fs.writeFileSync(path.join(__dirname, 'verify-report.json'), JSON.stringify(informe, null, 2));
  const mal = informe.pruebas.filter((p) => !p.ok).length;
  console.log('\n' + (informe.pruebas.length - mal) + '/' + informe.pruebas.length + ' pruebas OK');
  await browser.close();
  process.exit(mal ? 1 : 0);
})();
