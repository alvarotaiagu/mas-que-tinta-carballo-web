# -*- coding: utf-8 -*-
"""Marca PROVISIONAL de Mas que Tinta (Carballo).

La tienda no nos ha dado logo ni foto del rotulo, asi que aqui se dibuja
un wordmark tipografico y se marca como provisional en la web y en el
README. En cuanto llegue el archivo del rotulo, esto se tira.

Idea: el nombre lo dice todo, tinta. El wordmark se escribe en Archivo
(OFL) convertido a trazados -- asi no depende de que cargue la fuente --
y la "a" con tilde de "Mas" es un deposito: cian lleno hasta el 62 %, el
resto en cian muy tenue. La marca cuadrada son las cuatro tintas CMYK
como el panel de niveles de una impresora.

Salidas:
  assets/img/brand/mqt-wordmark.svg   "Mas que Tinta" en trazados
  assets/img/brand/mqt-marca.svg      cuatro barras de nivel (favicon)
  assets/img/brand/icon-{96,180,192,512}.png

Uso: python scripts/generate_brand.py
"""
import os
import urllib.request

from fontTools.ttLib import TTFont
from fontTools.varLib import instancer
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.boundsPen import BoundsPen

RAIZ = os.path.join(os.path.dirname(__file__), "..")
BRAND = os.path.join(RAIZ, "assets", "img", "brand")
CACHE = os.path.join(os.path.dirname(__file__), "fonts")
os.makedirs(BRAND, exist_ok=True)
os.makedirs(CACHE, exist_ok=True)

PAPEL = "#FBFAF7"
TINTA = "#111111"
CIAN = "#00A9E0"
MAGENTA = "#E5007D"
AMARILLO = "#FFD500"

URL = "https://github.com/google/fonts/raw/main/ofl/archivo/Archivo%5Bwdth,wght%5D.ttf"
UA = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36")

A_TILDE = u"á"


def fuente():
    destino = os.path.join(CACHE, "Archivo-var.ttf")
    if not os.path.exists(destino) or os.path.getsize(destino) < 100000:
        req = urllib.request.Request(URL, headers={"User-Agent": UA})
        with urllib.request.urlopen(req, timeout=180) as r, open(destino, "wb") as f:
            f.write(r.read())
    var = TTFont(destino)
    # la misma instancia que titula la web: ancha y contundente
    return instancer.instantiateVariableFont(var, {"wght": 800, "wdth": 112})


def trazados(font, texto, tam):
    """[(caracter, path, x, avance, escala)] a cuerpo `tam`."""
    upm = font["head"].unitsPerEm
    esc = tam / upm
    cmap = font.getBestCmap()
    glifos = font.getGlyphSet()
    hmtx = font["hmtx"]
    salida = []
    x = 0.0
    for ch in texto:
        nombre = cmap.get(ord(ch))
        if nombre is None:
            x += tam * 0.3
            continue
        pen = SVGPathPen(glifos, ntos=lambda v: "%.2f" % v)
        glifos[nombre].draw(pen)
        avance = hmtx[nombre][0] * esc
        salida.append((ch, pen.getCommands(), x, avance, esc))
        x += avance
    return salida, x


def caja(font, nombre_glifo, esc):
    pen = BoundsPen(font.getGlyphSet())
    font.getGlyphSet()[nombre_glifo].draw(pen)
    if pen.bounds is None:
        return (0.0, 0.0, 0.0, 0.0)
    x0, y0, x1, y1 = pen.bounds
    return (x0 * esc, y0 * esc, x1 * esc, y1 * esc)


def wordmark(font):
    TAM = 120.0
    texto = u"M" + A_TILDE + u"s que Tinta"
    piezas, ancho = trazados(font, texto, TAM)
    esc = TAM / font["head"].unitsPerEm
    asc = font["hhea"].ascent * esc
    desc = -font["hhea"].descent * esc
    pad = 10.0
    W = ancho + pad * 2
    H = asc + desc + pad
    base = asc + pad * 0.5

    idx_a = next(i for i, p in enumerate(piezas) if p[0] == A_TILDE)
    cuerpo = []
    for i, (ch, d, x, av, e) in enumerate(piezas):
        if not d or i == idx_a:
            continue
        tr = 'transform="translate(%.2f %.2f) scale(%.5f -%.5f)"' % (pad + x, base, e, e)
        color = CIAN if i < 3 else TINTA
        cuerpo.append('  <path %s d="%s" fill="%s"/>' % (tr, d, color))

    # la "a" con tilde: deposito de tinta lleno hasta el 62 %
    ch, d, x, av, e = piezas[idx_a]
    cmap = font.getBestCmap()
    _, gy0, _, gy1 = caja(font, cmap[ord(A_TILDE)], e)
    tr = 'transform="translate(%.2f %.2f) scale(%.5f -%.5f)"' % (pad + x, base, e, e)
    # en coordenadas de usuario (y hacia abajo) el glifo va de base-gy1 a base-gy0
    y_arriba = base - gy1
    y_abajo = base - gy0
    nivel = y_abajo - (y_abajo - y_arriba) * 0.62
    cuerpo.append('  <path %s d="%s" fill="%s" opacity="0.22"/>' % (tr, d, CIAN))
    cuerpo.append('  <clipPath id="mqt-nivel-a"><rect x="%.2f" y="%.2f" width="%.2f" height="%.2f"/></clipPath>'
                  % (pad + x - 4, nivel, av + 8, y_abajo - nivel + 2))
    cuerpo.append('  <g clip-path="url(#mqt-nivel-a)"><path %s d="%s" fill="%s"/></g>' % (tr, d, CIAN))

    svg = (
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 %.2f %.2f" '
        'width="%.0f" height="%.0f" role="img" aria-label="%s">\n'
        '  <title>%s (wordmark provisional)</title>\n%s\n</svg>\n'
    ) % (W, H, W, H, texto, texto, "\n".join(cuerpo))
    ruta = os.path.join(BRAND, "mqt-wordmark.svg")
    with open(ruta, "w", encoding="utf-8") as f:
        f.write(svg)
    return round(W, 1), round(H, 1)


TINTAS = [(CIAN, 0.74), (MAGENTA, 0.52), (AMARILLO, 0.88), (TINTA, 0.64)]


def marca():
    """Cuatro barras de nivel CMYK dentro de un cuadrado de papel."""
    x0, y0, y1 = 11.0, 13.0, 51.0
    ancho, hueco = 7.5, 4.0
    partes = ['<rect x="1.5" y="1.5" width="61" height="61" rx="9" fill="%s" stroke="%s" stroke-width="3"/>'
              % (PAPEL, TINTA)]
    for i, (color, nivel) in enumerate(TINTAS):
        x = x0 + i * (ancho + hueco)
        alto = (y1 - y0) * nivel
        partes.append('<rect x="%.1f" y="%.1f" width="%.1f" height="%.1f" rx="2.4" fill="%s" opacity="0.13"/>'
                      % (x, y0, ancho, y1 - y0, TINTA))
        partes.append('<rect x="%.1f" y="%.1f" width="%.1f" height="%.1f" rx="2.4" fill="%s"/>'
                      % (x, y1 - alto, ancho, alto, color))
    svg = ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64" '
           'role="img" aria-label="M' + A_TILDE + 's que Tinta">\n  <title>M' + A_TILDE + 's que Tinta</title>\n  '
           + "\n  ".join(partes) + "\n</svg>\n")
    with open(os.path.join(BRAND, "mqt-marca.svg"), "w", encoding="utf-8") as f:
        f.write(svg)


def iconos():
    """PNG del favicon sin cairosvg: son rectangulos, se dibujan con PIL."""
    from PIL import Image, ImageDraw
    for px in (96, 180, 192, 512):
        k = px / 64.0
        im = Image.new("RGB", (px, px), PAPEL)
        d = ImageDraw.Draw(im)
        borde = max(2, int(round(3 * k)))
        d.rounded_rectangle([1.5 * k, 1.5 * k, px - 1.5 * k, px - 1.5 * k],
                            radius=max(2, int(9 * k)), fill=PAPEL, outline=TINTA, width=borde)
        x0, y0, y1 = 11.0 * k, 13.0 * k, 51.0 * k
        ancho, hueco = 7.5 * k, 4.0 * k
        for i, (color, nivel) in enumerate(TINTAS):
            x = x0 + i * (ancho + hueco)
            alto = (y1 - y0) * nivel
            rr = max(1, int(2.4 * k))
            d.rounded_rectangle([x, y0, x + ancho, y1], radius=rr, fill="#E5E2DB")
            d.rounded_rectangle([x, y1 - alto, x + ancho, y1], radius=rr, fill=color)
        im.save(os.path.join(BRAND, "icon-%d.png" % px), quality=95)


if __name__ == "__main__":
    f = fuente()
    print("wordmark", wordmark(f))
    marca()
    iconos()
    print("marca + iconos OK")
