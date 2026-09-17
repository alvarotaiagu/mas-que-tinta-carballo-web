# -*- coding: utf-8 -*-
"""Fotografia de la web de Mas que Tinta: descarga, recorte y gradacion.

AVISO IMPORTANTE SOBRE EL ENCARGO
---------------------------------
El brief pedia "genera fotografia original acorde al concepto". En este
entorno NO hay herramienta de generacion de imagen (se comprobo), asi
que ninguna de estas fotos esta generada: todas son de archivo de
Pexels (licencia comercial libre, sin atribucion obligatoria), elegidas
a mano sobre hojas de contacto (scripts/contact_sheets/*.png).

NINGUNA foto es de Mas que Tinta. Cada una lleva en la web el pie
"IMAGEN DE ARCHIVO · NO ES LA TIENDA", y el pie de pagina lo repite.

Criterio de seleccion:
  mostrador limpio y luminoso, luz de dia, objetos reales de una tienda
  de barrio. Descartado a proposito: fotos de catalogo de teclados y
  ratones de marca recortados sobre blanco (el brief las prohibe
  expresamente), placas base y pistas de circuito (ese lenguaje es de
  Calidade Systems, otra plantilla de la carpeta), tiendas de marca
  reconocible (Apple) y personas identificables posando.

GRADACION (por script, no con filtros CSS: costarian por frame)
  1. balance de blancos gray-world suave
  2. curva en S leve -> "blancos limpios, negros de tinta"
  3. desaturacion selectiva: se conserva UN solo tono CMYK por foto y
     el resto se va a gris. Es lo que pedia el brief ("una caja cian,
     una etiqueta amarilla"). Si la foto no tiene ese tono, sale casi
     monocroma, que es la misma paleta de la pagina: no se inventa un
     color que no esta en la imagen.
  4. split-toning: sombras a negro tinta #111111, luces a papel #FBFAF7
  5. vineta muy leve y grano fino, para que ocho procedencias distintas
     parezcan la misma camara

Correspondencias (id de Pexels -> uso -> tinta que se conserva):
  7014415   impresora clara con copias recien salidas -> consumibles -> CIAN
  8092315   escritorio claro con portatil y flexo     -> equipos     -> MAGENTA
  7639373   portatil abierto con destornillador       -> reparacion  -> MAGENTA
  30342541  teclado y cables blancos, cenital         -> accesorios  -> NEGRO
  7718866   cubilete, regla y cuadernos sobre mesa    -> ofimatica   -> NEGRO
  6169026   cajas en estanteria, pared de ladrillo    -> puntopack   -> AMARILLO
  6755075   manos con destornillador de precision     -> taller      -> MAGENTA
  12354555  cajas etiquetadas sobre mostrador         -> paquetes    -> AMARILLO

Descartadas a proposito, ya graduadas:
  7639358   cartucho con la MARCA legible: las marcas que trabaja la
            tienda estan sin confirmar, y una foto de marca es una
            afirmacion comercial que no podemos hacer.
  23534042  carro de cartuchos: demasiado oscura, no es "luminosa".
  5490917   interior de tienda con una persona reconocible de fondo
            (y ademas era una tienda de decoracion, no de informatica).
  19197878  panel perforado: esquina negra enorme y un mando de consola
            que no pinta nada en el catalogo de la tienda.

Salida: assets/img/photos/<nombre>-<ancho>.jpg + LQIP en lqip.txt
Uso: python scripts/process_photos.py
"""
import base64
import concurrent.futures
import io
import os
import urllib.request

import numpy as np
from PIL import Image

RAIZ = os.path.join(os.path.dirname(__file__), "..")
SRC = os.path.join(os.path.dirname(__file__), "photos_src")
OUT = os.path.join(RAIZ, "assets", "img", "photos")
os.makedirs(SRC, exist_ok=True)
os.makedirs(OUT, exist_ok=True)

# nombre: (id Pexels, proporcion, anclaje vertical, anclaje horizontal, tinta, anchos)
PHOTOS = {
    "cartuchos":  ("7014415",  4 / 3, 0.50, 0.50, "cian",     (900, 560)),
    "equipos":    ("8092315",  4 / 3, 0.52, 0.50, "magenta",  (900, 560)),
    "reparacion": ("7639373",  4 / 3, 0.50, 0.50, "magenta",  (900, 560)),
    "accesorios": ("30342541", 4 / 3, 0.50, 0.50, "negro",    (900, 560)),
    "ofimatica":  ("7718866",  4 / 3, 0.52, 0.50, "negro",    (900, 560)),
    "puntopack":  ("6169026",  4 / 3, 0.50, 0.50, "amarillo", (900, 560)),
    "taller":     ("6755075",  4 / 3, 0.50, 0.50, "magenta",  (1100, 700)),
    "paquetes":   ("12354555", 16 / 9, 0.52, 0.50, "amarillo", (1100, 700)),
}

# tono que se conserva (grados en el circulo HSV) y anchura de la pinza
TINTAS = {
    "cian":     (196.0, 46.0),
    "magenta":  (328.0, 46.0),
    "amarillo": (44.0, 34.0),
    "negro":    (None, None),   # monocromo de verdad
}

PAPEL = np.array([0xFB, 0xFA, 0xF7]) / 255.0
NEGRO = np.array([0x11, 0x11, 0x11]) / 255.0
LUMA = np.array([0.299, 0.587, 0.114])

# cuanto color queda FUERA de la pinza (0 = gris puro)
RESTO = 0.16
# cuanto se refuerza el color DENTRO de la pinza
REFUERZO = 1.5

UA = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36")


def origen(nombre, src):
    destino = os.path.join(SRC, "%s-%s.jpg" % (nombre, src))
    if os.path.exists(destino) and os.path.getsize(destino) > 40000:
        return destino
    url = ("https://images.pexels.com/photos/%s/pexels-photo-%s.jpeg"
           "?auto=compress&cs=tinysrgb&w=2400" % (src, src))
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=180) as r, open(destino, "wb") as f:
        f.write(r.read())
    return destino


def recortar(im, prop, anclaje, anclaje_x=0.5):
    w, h = im.size
    if w / h > prop:                       # sobra ancho
        nw = int(round(h * prop))
        x = int(round((w - nw) * anclaje_x))
        x = max(0, min(w - nw, x))
        return im.crop((x, 0, x + nw, h))
    nh = int(round(w / prop))              # sobra alto
    y = int(round((h - nh) * anclaje))
    y = max(0, min(h - nh, y))
    return im.crop((0, y, w, y + nh))


def hsv(rgb):
    """rgb en 0..1 (H, W, 3) -> h en grados, s 0..1, v 0..1."""
    mx = rgb.max(axis=2)
    mn = rgb.min(axis=2)
    d = mx - mn
    h = np.zeros_like(mx)
    seg = (mx == rgb[:, :, 0]) & (d > 0)
    h[seg] = ((rgb[:, :, 1] - rgb[:, :, 2])[seg] / d[seg]) % 6
    seg = (mx == rgb[:, :, 1]) & (d > 0)
    h[seg] = ((rgb[:, :, 2] - rgb[:, :, 0])[seg] / d[seg]) + 2
    seg = (mx == rgb[:, :, 2]) & (d > 0)
    h[seg] = ((rgb[:, :, 0] - rgb[:, :, 1])[seg] / d[seg]) + 4
    h = h * 60.0
    s = np.where(mx > 0, d / np.maximum(mx, 1e-6), 0.0)
    return h, s, mx


def graduar(im, tinta):
    a = np.asarray(im.convert("RGB"), dtype=np.float32) / 255.0

    # 1) balance de blancos gray-world, a medias (no queremos lavar el color)
    medias = a.reshape(-1, 3).mean(axis=0)
    objetivo = medias.mean()
    a = np.clip(a * (1.0 + 0.55 * (objetivo / np.maximum(medias, 1e-5) - 1.0)), 0, 1)

    # 2) curva en S leve: negros de tinta, blancos limpios
    a = np.clip((a - 0.5) * 1.085 + 0.5, 0, 1)
    a = a ** 0.985

    # 3) desaturacion selectiva: solo sobrevive una tinta
    h, s, v = hsv(a)
    gris = (a * LUMA).sum(axis=2, keepdims=True)
    centro, pinza = TINTAS[tinta]
    if centro is None:
        peso = np.zeros_like(s)
    else:
        d = np.abs(((h - centro + 180.0) % 360.0) - 180.0)
        peso = np.exp(-(d / pinza) ** 2)
        # los grises casi puros no se "recolorean": no tienen tono fiable
        peso = peso * np.clip((s - 0.07) / 0.18, 0, 1)
    k = (RESTO + (REFUERZO - RESTO) * peso)[:, :, None]
    a = np.clip(gris + (a - gris) * k, 0, 1)

    # 4) split-toning: sombras a tinta, luces a papel
    lum = (a * LUMA).sum(axis=2, keepdims=True)
    sombra = np.clip(1.0 - lum / 0.5, 0, 1) ** 1.5
    luz = np.clip((lum - 0.55) / 0.45, 0, 1) ** 1.3
    a = np.clip(a + sombra * (NEGRO - a) * 0.17 + luz * (PAPEL - a) * 0.2, 0, 1)

    # 5) vineta muy leve
    H, W = a.shape[:2]
    yy = np.linspace(-1, 1, H)[:, None]
    xx = np.linspace(-1, 1, W)[None, :]
    r = np.sqrt(xx ** 2 + yy ** 2) / 1.42
    a = np.clip(a * (1.0 - 0.1 * np.clip(r - 0.45, 0, 1) ** 1.6)[:, :, None], 0, 1)

    # 6) grano fino comun: ocho camaras distintas -> una sola
    rng = np.random.default_rng(7)
    a = np.clip(a + rng.normal(0, 0.0055, a.shape).astype(np.float32), 0, 1)

    return Image.fromarray((a * 255.0 + 0.5).astype(np.uint8), "RGB")


def lqip(im):
    mini = im.copy()
    mini.thumbnail((20, 20), Image.LANCZOS)
    buf = io.BytesIO()
    mini.save(buf, "JPEG", quality=38)
    return "data:image/jpeg;base64," + base64.b64encode(buf.getvalue()).decode()


def procesa(item):
    nombre, (src, prop, anclaje, anclaje_x, tinta, anchos) = item
    ruta = origen(nombre, src)
    im = Image.open(ruta)
    im = recortar(im, prop, anclaje, anclaje_x)
    im = graduar(im, tinta)
    lineas = []
    for w in anchos:
        h = int(round(w / prop))
        chico = im.resize((w, h), Image.LANCZOS)
        chico.save(os.path.join(OUT, "%s-%d.jpg" % (nombre, w)),
                   "JPEG", quality=86, optimize=True, progressive=True)
    lineas.append("%s: %s" % (nombre, lqip(im)))
    return "%-11s %s  tinta=%s  %s" % (nombre, src, tinta, anchos), lineas


if __name__ == "__main__":
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as ex:
        resultados = list(ex.map(procesa, PHOTOS.items()))
    todas = []
    for msg, lineas in resultados:
        print(msg)
        todas.extend(lineas)
    with open(os.path.join(os.path.dirname(__file__), "lqip.txt"), "w", encoding="utf-8") as f:
        f.write("\n".join(sorted(todas)))
    print("fotos listas en", OUT)
