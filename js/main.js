/* Más que Tinta · Carballo — movimiento y utilidades.

   GSAP, ScrollTrigger y Lenis llegan de un CDN. Si fallan (bloqueador,
   red, CDN caído) nada de aquí puede romper la página: los depósitos
   salen llenos, los textos visibles y el teléfono, las redes y el mapa
   funcionan igual. Por eso los estados "vacíos" del CSS viven bajo
   html.has-motion, que solo se enciende desde este archivo.

   Movimiento de esta plantilla: MECÁNICO. Niveles que se llenan de
   abajo arriba (transform: scaleY, nunca dasharray), barridos
   horizontales como un cabezal de impresión, y porcentajes en mono que
   cuentan de verdad. Nada de canvas, nada de blur por frame. */
(function () {
  "use strict";

  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const gsapReady = typeof gsap !== "undefined" && typeof ScrollTrigger !== "undefined";
  const motion = gsapReady && !reduce;
  const html = document.documentElement;
  if (gsapReady) gsap.registerPlugin(ScrollTrigger);
  if (motion) html.classList.add("has-motion");
  if (!gsapReady) html.classList.add("sin-gsap");

  const $ = (sel, ctx) => (ctx || document).querySelector(sel);
  const $$ = (sel, ctx) => Array.from((ctx || document).querySelectorAll(sel));
  const rem = () => parseFloat(getComputedStyle(html).fontSize) || 16;

  /* el cartucho del scroll y la pila de categorías comparten tinta: la pila
     manda mientras estás dentro de ella, las demás secciones la declaran en
     su atributo data-ink */
  let aplicaTinta = function () {};
  let tintaCats = "cian";
  let enCats = false;
  const navH = () => parseFloat(getComputedStyle(html).getPropertyValue("--nav-h")) * rem() || 72;

  /* ---------- División en caracteres (accesible) ----------
     El texto se sustituye por spans, así que la frase entera se
     conserva en aria-label y los spans quedan ocultos al lector.
     La palabra va en inline-block + nowrap: si no, con las letras en
     inline-block el navegador parte las palabras por la mitad. */
  function splitChars(el) {
    const text = el.textContent.replace(/\s+/g, " ").trim();
    el.setAttribute("aria-label", text);
    /* el <em class="mas"> se pierde al reescribir: se anota qué palabra
       llevaba la tinta para devolvérsela letra a letra */
    const limpia = (t) => t.replace(/[^0-9A-Za-zÁÉÍÓÚÜÑáéíóúüñ]/g, "").toLowerCase();
    const destacada = limpia((el.querySelector(".mas") || {}).textContent || "");
    el.textContent = "";
    const chars = [];
    text.split(" ").forEach((word, i, arr) => {
      const ws = document.createElement("span");
      /* se compara sin signos: en "un paquete más," la palabra lleva coma */
      ws.className = "split-word" + (destacada && limpia(word) === destacada ? " mas" : "");
      ws.setAttribute("aria-hidden", "true");
      Array.from(word).forEach((ch) => {
        const cs = document.createElement("span");
        cs.className = "split-char";
        cs.textContent = ch;
        ws.appendChild(cs);
        chars.push(cs);
      });
      el.appendChild(ws);
      if (i < arr.length - 1) el.appendChild(document.createTextNode(" "));
    });
    return chars;
  }
  const splitMap = new Map();
  if (motion) $$("[data-split-char]").forEach((el) => splitMap.set(el, splitChars(el)));

  /* ---------- Aviso de cookies ----------
     El botón tiene que cerrar el aviso de verdad: se oculta con
     [hidden] y en el CSS no hay ningún display que pueda ganarle. */
  (function initCookieBanner() {
    const banner = $(".cookie-banner");
    const ack = $(".cookie-ack");
    if (!banner || !ack) return;
    const KEY = "mqt-cookie-ack";
    let visto = false;
    try { visto = localStorage.getItem(KEY) === "1"; } catch (e) {}
    if (!visto) banner.hidden = false;
    ack.addEventListener("click", () => {
      banner.hidden = true;
      try { localStorage.setItem(KEY, "1"); } catch (e) {}
    });
  })();

  /* ---------- Menú móvil ---------- */
  (function initNavMovil() {
    const toggle = $(".nav-toggle");
    const menu = $(".nav-movil");
    if (!toggle || !menu) return;
    toggle.addEventListener("click", () => {
      const abierto = toggle.getAttribute("aria-expanded") === "true";
      toggle.setAttribute("aria-expanded", abierto ? "false" : "true");
      menu.hidden = abierto;
    });
    $$("a", menu).forEach((a) => a.addEventListener("click", () => {
      toggle.setAttribute("aria-expanded", "false");
      menu.hidden = true;
    }));
  })();

  /* ---------- Mapa bajo demanda ----------
     Sin API key y sin contactar con Google hasta que el visitante
     pulsa. Es lo que hace cierto el aviso de "sin cookies de terceros":
     si el iframe se montara solo, el aviso sería mentira. */
  (function initMapConsent() {
    const btn = $(".map-consent");
    if (!btn) return;
    btn.addEventListener("click", () => {
      const q = encodeURIComponent("Más que Tinta, Rúa Luis Calvo 6, 15102 Carballo, A Coruña");
      const iframe = document.createElement("iframe");
      iframe.src = "https://www.google.com/maps?q=" + q + "&output=embed";
      iframe.title = "Mapa: Más que Tinta, Rúa Luis Calvo 6, Carballo";
      iframe.loading = "lazy";
      iframe.referrerPolicy = "no-referrer-when-downgrade";
      iframe.setAttribute("allowfullscreen", "");
      btn.replaceWith(iframe);
    });
  })();

  /* ---------- Buscador de referencia (maqueta) ----------
     No hay catálogo ni backend: el formulario existe para enseñar la
     pieza al cliente, y lo dice en pantalla en vez de fingir que busca. */
  (function initBuscador() {
    const form = $("#buscador");
    if (!form) return;
    const aviso = $(".buscador-aviso", form);
    const input = $("input", form);
    form.addEventListener("submit", (ev) => {
      ev.preventDefault();
      const ref = (input.value || "").trim();
      aviso.innerHTML = ref
        ? "<strong>[FUNCIÓN PENDIENTE]</strong> Todavía no hay catálogo conectado, así que no podemos comprobar «"
          + ref.replace(/[<>&]/g, "") + "» desde aquí. Llama al <a href=\"tel:+34981702229\">981 70 22 29</a> "
          + "y te decimos al momento si está en tienda."
        : "<strong>[FUNCIÓN PENDIENTE]</strong> Escribe la referencia del cartucho o el modelo de la impresora. "
          + "De momento el buscador es una maqueta: llama al <a href=\"tel:+34981702229\">981 70 22 29</a>.";
      aviso.hidden = false;
    });
  })();

  /* ---------- Cabecera y botón flotante ---------- */
  (function initCabecera() {
    const cabecera = $(".cabecera");
    const hero = $(".hero");
    const fab = $(".call-fab");
    function onScroll() {
      if (cabecera) cabecera.classList.toggle("is-scrolled", window.scrollY > 24);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    const cart = $(".cartucho");
    if (hero && "IntersectionObserver" in window) {
      new IntersectionObserver(([e]) => {
        if (fab) fab.classList.toggle("is-visible", !e.isIntersecting);
        if (cart) cart.classList.toggle("is-visible", !e.isIntersecting);
      }, { threshold: 0.12 }).observe(hero);
    }
  })();

  /* ---------- Enlace activo en la navegación ---------- */
  (function initNavActiva() {
    const enlaces = $$(".nav a");
    if (!enlaces.length || !("IntersectionObserver" in window)) return;
    const porId = new Map();
    enlaces.forEach((a) => {
      const sec = document.getElementById(a.getAttribute("href").slice(1));
      if (sec) porId.set(sec, a);
    });
    const obs = new IntersectionObserver((entradas) => {
      entradas.forEach((e) => {
        const a = porId.get(e.target);
        if (a && e.isIntersecting) {
          enlaces.forEach((x) => x.classList.remove("is-activo"));
          a.classList.add("is-activo");
        }
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    porId.forEach((_, sec) => obs.observe(sec));
  })();

  /* ---------- Marquesina ----------
     Se clona la cinta hasta que mida al menos dos pantallas: el
     keyframe la mueve un -50 %, así que hace falta el doble de ancho
     visible para que no aparezca un hueco al reiniciar el bucle. */
  (function initMarquesina() {
    const cinta = $(".marquesina-cinta");
    if (!cinta) return;
    const base = cinta.innerHTML;
    let copias = 1;
    while (cinta.scrollWidth < window.innerWidth * 2.2 && copias < 12) {
      cinta.innerHTML += base;
      copias++;
    }
    if (copias % 2 === 1) cinta.innerHTML += base;  // par: el -50 % debe caer en un corte limpio
  })();

  /* ---------- Horario: hoy y "ahora mismo" ----------
     Con el horario real de la ficha de Google. No se inventa nada:
     si el día no encaja en ninguna franja, dice que está cerrado. */
  const FRANJAS = {
    0: [[11, 13]],
    1: [[10, 14], [16.5, 20]],
    2: [[10, 14], [16.5, 20]],
    3: [[10, 14], [16.5, 20]],
    4: [[10, 14], [16.5, 20]],
    5: [[10, 14], [16.5, 20]],
    6: [[10, 14]]
  };
  const NOMBRES = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];

  (function initHoy() {
    const ahora = new Date();
    const dia = ahora.getDay();
    const hora = ahora.getHours() + ahora.getMinutes() / 60;
    const fila = $('.hor-dia[data-dia="' + dia + '"]');
    if (fila) fila.classList.add("es-hoy");

    const nota = $("[data-ahora]");
    if (!nota) return;
    const hoy = FRANJAS[dia] || [];
    const abierto = hoy.some(([a, b]) => hora >= a && hora < b);
    const pinta = (h) => (h % 1 ? Math.floor(h) + ":30" : h + ":00");
    let texto;
    if (abierto) {
      const franja = hoy.find(([a, b]) => hora >= a && hora < b);
      texto = "AHORA MISMO: ABIERTO · HOY " + NOMBRES[dia].toUpperCase() + " HASTA LAS " + pinta(franja[1]);
    } else {
      const siguiente = hoy.find(([a]) => hora < a);
      texto = siguiente
        ? "AHORA MISMO: CERRADO · HOY " + NOMBRES[dia].toUpperCase() + " ABRIMOS A LAS " + pinta(siguiente[0])
        : "AHORA MISMO: CERRADO · MAÑANA " + NOMBRES[(dia + 1) % 7].toUpperCase()
          + " ABRIMOS A LAS " + pinta((FRANJAS[(dia + 1) % 7] || [[10]])[0][0]);
    }
    nota.textContent = texto;
    nota.hidden = false;
  })();

  /* ---------- Contadores ----------
     La nota (4,7) y el número de reseñas (36) son datos reales de la
     ficha de Google. Con movimiento reducido se pintan directamente:
     el contenido no depende del movimiento. */
  function initContadores() {
    $$("[data-contador]").forEach((el) => {
      const valor = parseFloat((el.dataset.valor || "").replace(",", "."));
      if (!isFinite(valor)) return;
      const pinta = (n) => { el.textContent = n.toFixed(1).replace(".", ","); };
      if (!motion) { pinta(valor); return; }
      const obj = { n: 0 };
      pinta(0);
      ScrollTrigger.create({
        trigger: el, start: "top 92%", once: true,
        onEnter: () => gsap.to(obj, {
          n: valor, duration: 1.2, ease: "power2.out", onUpdate: () => pinta(obj.n)
        })
      });
    });
    $$("[data-contador-n]").forEach((el) => {
      const valor = parseInt(el.dataset.valor, 10);
      if (!isFinite(valor)) return;
      if (!motion) { el.textContent = String(valor); return; }
      const obj = { n: 0 };
      el.textContent = "0";
      ScrollTrigger.create({
        trigger: el, start: "top 92%", once: true,
        onEnter: () => gsap.to(obj, {
          n: valor, duration: 1.4, ease: "power2.out",
          onUpdate: () => { el.textContent = String(Math.round(obj.n)); }
        })
      });
    });
  }

  /* ---------- Cartucho: el nivel de lectura de toda la página ----------
     El nivel se actualiza SIEMPRE, también con movimiento reducido y sin
     GSAP: es estado (cuánto llevas leído), no decoración. Lo que se cae sin
     GSAP es solo el barrido al cambiar de tinta, que pasa a ser un corte.
     Va con un rAF por evento de scroll, así que no hay trabajo por frame
     cuando la página está quieta. */
  function initCartucho() {
    const cart = $(".cartucho");
    if (!cart) return;
    const cuerpo = $(".cartucho-cuerpo", cart);
    const base = $('.cartucho-tinta[data-capa="base"]', cart);
    const nueva = $('.cartucho-tinta[data-capa="nueva"]', cart);
    const pct = $(".cartucho-pct", cart);
    const VARS = { cian: "--cian", magenta: "--magenta", amarillo: "--amarillo", tinta: "--negro" };
    const color = (n) => getComputedStyle(html).getPropertyValue(VARS[n] || "--negro").trim();

    let actual = "";
    aplicaTinta = function (nombre) {
      if (!VARS[nombre] || nombre === actual) return;
      actual = nombre;
      const c = color(nombre);
      if (!motion) { base.style.background = c; return; }
      nueva.style.background = c;
      gsap.fromTo(nueva, { clipPath: "inset(0 100% 0 0)" }, {
        clipPath: "inset(0 0% 0 0)", duration: 0.5, ease: "power2.inOut",
        onComplete: () => {
          base.style.background = c;
          gsap.set(nueva, { clipPath: "inset(0 100% 0 0)" });
        }
      });
    };
    aplicaTinta("cian");

    let pedido = false;
    function nivel() {
      pedido = false;
      const max = html.scrollHeight - window.innerHeight;
      const p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      cuerpo.style.setProperty("--carga", p.toFixed(4));
      pct.textContent = Math.round(p * 100) + "%";
    }
    window.addEventListener("scroll", () => {
      if (!pedido) { pedido = true; requestAnimationFrame(nivel); }
    }, { passive: true });
    window.addEventListener("resize", nivel);
    nivel();

    /* la tinta de la sección que está cruzando la mitad de la pantalla */
    if ("IntersectionObserver" in window) {
      const obs = new IntersectionObserver((entradas) => {
        entradas.forEach((e) => {
          if (!e.isIntersecting) return;
          enCats = e.target.classList.contains("cats");
          aplicaTinta(enCats ? tintaCats : e.target.dataset.ink);
        });
      }, { rootMargin: "-45% 0px -50% 0px" });
      $$("[data-ink]").forEach((sec) => obs.observe(sec));
    }

    cart.addEventListener("click", () => {
      if (lenis) lenis.scrollTo(0, { duration: 1.1 });
      else window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
    });
  }

  /* ---------- Botones magnéticos ---------- */
  function initMagneticos() {
    if (!motion || window.matchMedia("(hover: none)").matches) return;
    $$(".magnetico").forEach((el) => {
      const fuerza = 0.3;
      el.addEventListener("mousemove", (ev) => {
        const r = el.getBoundingClientRect();
        gsap.to(el, {
          x: (ev.clientX - (r.left + r.width / 2)) * fuerza,
          y: (ev.clientY - (r.top + r.height / 2)) * fuerza,
          duration: 0.45, ease: "power3.out"
        });
      });
      el.addEventListener("mouseleave", () => {
        gsap.to(el, { x: 0, y: 0, duration: 0.7, ease: "elastic.out(1, 0.45)" });
      });
    });
  }

  /* ---------- Hero: el panel se llena y luego aparece la marca ----------
     Las barras son divs con transform: scaleY y origen abajo. El
     "rebote al tope" es el overshoot de back.out, que el depósito
     recorta: la barra golpea el borde superior y se asienta. */
  function initHero() {
    const tanques = $$(".tanque");
    if (!motion) {
      tanques.forEach((t) => {
        const pct = $(".tanque-pct", t);
        if (pct) pct.textContent = (t.dataset.nivel || "100") + "%";
      });
      return;
    }

    const tl = gsap.timeline({ defaults: { ease: "power3.out" }, paused: true });
    /* el hero no se entinta hasta que salen las planchas: lo primero que
       se ve de la pagina ya esta en movimiento */
    cortina.alAbrirse(() => tl.play());
    tl.to(".hero-texto > .etiqueta", { opacity: 1, duration: 0.5 }, 0);

    tanques.forEach((t, i) => {
      const nivel = Math.min(100, parseFloat(t.dataset.nivel) || 100) / 100;
      const barra = $(".tanque-tinta", t);
      const pct = $(".tanque-pct", t);
      const obj = { n: 0 };
      const cuando = 0.12 + i * 0.12;
      tl.to(barra, { scaleY: nivel, duration: 1.05, ease: "back.out(1.5)" }, cuando);
      tl.to(obj, {
        n: nivel * 100, duration: 1.05, ease: "power2.out",
        onUpdate: () => { if (pct) pct.textContent = Math.round(Math.min(100, obj.n)) + "%"; }
      }, cuando);
    });

    /* cuando el panel está lleno entra la marca, y la "á" se llena
       como un depósito más */
    tl.to(".hero-marca", { opacity: 1, duration: 0.5 }, 1.05)
      .fromTo(".hero-mas, .hero-resto", { yPercent: 14 }, { yPercent: 0, duration: 0.7, stagger: 0.06 }, 1.05)
      .to(".hero-a-tinta", { "--carga": "62%", duration: 0.8, ease: "power2.inOut" }, 1.35)
      .to(".hero-sub", { opacity: 1, duration: 0.5 }, 1.5)
      .to(".hero-marcas", { opacity: 1, duration: 0.5 }, 1.62)
      .to(".hero-botones", { opacity: 1, duration: 0.5 }, 1.74)
      .to(".hero-nota", { opacity: 1, duration: 0.5 }, 1.86);
  }

  /* ---------- Titulares carácter a carácter ---------- */
  function initTitulares() {
    if (!motion) return;
    splitMap.forEach((chars, el) => {
      gsap.fromTo(chars,
        { yPercent: 112, opacity: 0 },
        {
          yPercent: 0, opacity: 1, duration: 0.55, ease: "expo.out",
          stagger: { each: 0.014 },
          scrollTrigger: { trigger: el, start: "top 88%", once: true }
        });
    });
  }

  /* ---------- Barra de nivel de cada sección ----------
     Ligada al scroll (scrub): llega al 100 % justo cuando el bloque
     termina de pasar. El porcentaje en mono cuenta con ella. */
  function initNivelesSeccion() {
    $$(".nivel").forEach((n) => {
      const letra = n.dataset.nivelSeccion || "K";
      const barra = $(".nivel-tinta", n);
      const pct = $(".nivel-pct", n);
      const sec = n.closest("section");
      if (!motion || !sec) {
        if (pct) pct.textContent = letra + " 100%";
        return;
      }
      ScrollTrigger.create({
        trigger: sec, start: "top 72%", end: "bottom bottom", scrub: 0.4,
        onUpdate: (st) => {
          gsap.set(barra, { scaleX: st.progress });
          if (pct) pct.textContent = letra + " " + Math.round(st.progress * 100) + "%";
        }
      });
    });
  }

  /* ---------- Categorías: todas las tarjetas a la misma altura ----------
     Las seis comparten contenedor pegajoso, así que cada una se suelta
     cuando el fondo del contenedor sube por encima de "su" altura. Si una
     mide 29 px más que las otras se despega antes y, al salir la pila, se
     ve asomar la de debajo. Se mide la más alta y se iguala; se rehace al
     cambiar el ancho porque el reparto de columnas cambia con él. */
  function igualaCartas() {
    const lista = $(".cats-lista");
    const cartas = $$(".cat-carta");
    if (!lista || !cartas.length) return;
    lista.style.setProperty("--alto-carta", "0px");
    const alto = cartas.reduce((m, c) => Math.max(m, c.getBoundingClientRect().height), 0);
    lista.style.setProperty("--alto-carta", Math.ceil(alto) + "px");
  }

  /* ---------- Categorías: pila pegajosa + barrido de tinta ----------
     El <li> es el pegajoso y su margin-bottom es el recorrido. El
     disparo de cada barrido se calcula con el mismo `top` pegajoso que
     usa el CSS, para que el color cambie justo cuando la tarjeta se
     engancha arriba. El barrido va de derecha a izquierda, como el
     cabezal de una impresora. */
  function initCategorias() {
    const capas = $$(".cats-capa");
    const cartas = $$(".cat");
    if (!capas.length || !cartas.length || !gsapReady) return;

    /* la tinta que enseña el cartucho mientras cruzas la pila */
    const TINTA_CARTA = ["cian", "magenta", "magenta", "tinta", "tinta", "amarillo"];
    const estado = capas.map(() => false);
    function pinta(hasta) {
      tintaCats = TINTA_CARTA[hasta] || "cian";
      if (enCats) aplicaTinta(tintaCats);
      capas.forEach((capa, i) => {
        const visible = i <= hasta;
        if (estado[i] === visible) return;
        estado[i] = visible;
        gsap.to(capa, {
          clipPath: visible ? "inset(0 0% 0 0)" : "inset(0 100% 0 0)",
          duration: 0.5, ease: "power2.inOut"
        });
      });
    }
    if (!motion) { capas.forEach((c) => { c.style.clipPath = "inset(0 0 0 0)"; }); return; }

    const tope = (carta) => {
      const t = parseFloat(getComputedStyle(carta).top);
      return isFinite(t) ? t : navH() + 24;
    };
    cartas.forEach((carta, i) => {
      ScrollTrigger.create({
        trigger: carta,
        start: () => "top " + (tope(carta) + 6) + "px",
        onEnter: () => pinta(i),
        onLeaveBack: () => pinta(i - 1)
      });
    });
  }

  /* ---------- Depósitos de las tarjetas ---------- */
  function initDepositos() {
    if (!motion) return;
    $$(".deposito").forEach((dep) => {
      gsap.to($(".deposito-tinta", dep), {
        scaleY: 1, duration: 0.85, ease: "back.out(1.3)",
        scrollTrigger: { trigger: dep.closest(".cat-carta") || dep, start: "top 85%", once: true }
      });
    });
  }

  /* ---------- Estante de consumibles ---------- */
  function initEstante() {
    const tanques = $$(".estante-tanque i");
    if (!tanques.length) return;
    const niveles = [0.92, 0.58, 0.8, 0.68];
    if (!motion) { tanques.forEach((t) => { t.style.transform = "scaleY(1)"; }); return; }
    tanques.forEach((t, i) => {
      gsap.to(t, {
        scaleY: niveles[i % niveles.length], duration: 1, ease: "back.out(1.4)",
        scrollTrigger: { trigger: ".estante", start: "top 85%", once: true },
        delay: i * 0.09
      });
    });
  }

  /* ---------- Pasos de reparación ---------- */
  function initPasos() {
    const barras = $$(".paso-nivel i");
    if (!barras.length || !motion) return;
    gsap.to(barras, {
      scaleX: 1, duration: 0.7, ease: "power2.out", stagger: 0.12,
      scrollTrigger: { trigger: ".pasos", start: "top 84%", once: true }
    });
  }

  /* ---------- Franjas del horario ---------- */
  function initHorario() {
    const franjas = $$(".hor-franja");
    if (!franjas.length || !motion) return;
    gsap.to(franjas, {
      scaleX: 1, duration: 0.6, ease: "power2.out", stagger: 0.05,
      scrollTrigger: { trigger: ".hor-grafico", start: "top 82%", once: true }
    });
  }

  /* ---------- Entradas suaves de bloques ---------- */
  function initEntradas() {
    if (!motion) return;
    const grupos = [".ficha", ".pack-card", ".res-carta", ".paso", ".rep-que li"];
    grupos.forEach((sel) => {
      const els = $$(sel);
      if (!els.length) return;
      gsap.fromTo(els, { y: 22, opacity: 0 }, {
        y: 0, opacity: 1, duration: 0.6, ease: "power2.out", stagger: 0.07,
        scrollTrigger: { trigger: els[0].parentElement, start: "top 86%", once: true }
      });
    });
  }


  /* ---------- Cortina de entrada (preloader) ----------
     Gesto propio: la pasada de impresion a cuatro tintas. La tira de
     registro se entinta C, M, Y, K por ese orden, sube el wordmark y la
     hoja sale en cuatro bandas que se van ALTERNANDO LADO, como cuatro
     planchas separandose. No llena ningun deposito a proposito: eso ya lo
     hacen los tanques del hero.

     Dos momentos distintos:
       · alAbrirse(fn) → cuando las bandas EMPIEZAN a salir, para que el
         hero ya se este entintando cuando asoma la pagina.
       · retirar()     → al terminar: quita el nodo, devuelve el scroll y
         refresca ScrollTrigger, que midio con overflow:hidden.

     `lenis` se declara con let mas abajo, asi que en el camino sincrono
     (sin GSAP) hay que retirar SIN tocarlo: leerlo antes de su linea es
     un error de zona muerta. De ahi el parametro `sinLenis`. */
  const cortina = (function initCortina() {
    const el = $("[data-cortina]");
    const espera = [];
    let abierta = false;
    let fuera = false;

    function abrir() {
      if (abierta) return;
      abierta = true;
      espera.splice(0).forEach((fn) => { try { fn(); } catch (e) {} });
    }
    function retirar(sinLenis) {
      abrir();
      if (fuera) return;
      fuera = true;
      if (el) el.hidden = true;
      html.classList.remove("cortina-puesta");
      if (!sinLenis && lenis) lenis.start();
      if (gsapReady) ScrollTrigger.refresh();
    }

    const api = { alAbrirse: (fn) => (abierta ? fn() : espera.push(fn)) };
    if (!el || !motion) { retirar(true); return api; }

    html.classList.add("cortina-puesta");

    const centro = $(".cortina-centro", el);
    const wordmark = $(".cortina-wordmark", el);
    const registros = $$(".cortina-registro", el);
    const pie = $(".cortina-pie", el);
    const bandas = $$(".cortina-banda", el);
    const SALE = 1.35;

    const tl = gsap.timeline({ onComplete: () => retirar(false) });
    if (wordmark) tl.to(wordmark, { opacity: 1, duration: 0.75, ease: "power2.out" }, 0.1);
    if (registros.length) tl.to(registros, { scaleX: 1, duration: 0.28, stagger: 0.16, ease: "power2.out" }, 0.4);
    if (pie) tl.to(pie, { opacity: 1, duration: 0.6, ease: "power2.out" }, 0.95);

    tl.add(abrir, SALE);
    if (centro) tl.to(centro, { opacity: 0, duration: 0.32, ease: "power2.in" }, SALE);
    bandas.forEach((b, i) => {
      /* alternando lado: plancha que sale a la izquierda, plancha que sale
         a la derecha. Cada una se va la ventana entera de ancho. */
      tl.to(b, {
        xPercent: i % 2 === 0 ? -105 : 105,
        duration: 0.95,
        ease: "expo.inOut"
      }, SALE + 0.08 + i * 0.075);
    });

    setTimeout(() => retirar(false), 5200);
    return api;
  })();

  /* ---------- Lenis ---------- */
  let lenis = null;
  function initLenis() {
    if (!motion || typeof Lenis === "undefined") return;
    lenis = new Lenis({ lerp: 0.12, wheelMultiplier: 0.95 });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    $$('a[href^="#"]').forEach((a) => {
      const id = a.getAttribute("href");
      if (id.length < 2) return;
      a.addEventListener("click", (ev) => {
        const destino = document.querySelector(id);
        if (!destino) return;
        ev.preventDefault();
        lenis.scrollTo(destino, { offset: -navH() - 8 });
      });
    });
  }

  /* ---------- Arranque ----------
     Se espera a las fuentes: el reparto por caracteres se mide con
     Archivo, no con la de respaldo, y así el titular no salta. */
  function arranca() {
    igualaCartas();
    initLenis();
    initCartucho();
    initHero();
    initTitulares();
    initNivelesSeccion();
    initCategorias();
    initDepositos();
    initEstante();
    initPasos();
    initHorario();
    initEntradas();
    initMagneticos();
    initContadores();
    if (gsapReady) ScrollTrigger.refresh();
  }

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(arranca).catch(arranca);
  } else {
    window.addEventListener("load", arranca);
  }

  let t;
  window.addEventListener("resize", () => {
    clearTimeout(t);
    t = setTimeout(() => {
      igualaCartas();
      if (gsapReady) ScrollTrigger.refresh();
    }, 220);
  });
})();
