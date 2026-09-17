/* Imagen para compartir (1200x630) de Mas que Tinta.
   Se dibuja con el mismo lenguaje que la web: papel, retícula fina,
   cuatro depositos CMYK y el wordmark en trazados (el SVG de marca,
   que no depende de que cargue la fuente).
   Uso: NODE_PATH=/c/Users/alvar/node_modules node scripts/generate_og.js */
const { chromium } = require('playwright');
const { pathToFileURL } = require('url');
const path = require('path');

const RAIZ = path.join(__dirname, '..');
const html = `<!DOCTYPE html><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@112,500;112,700&family=JetBrains+Mono:wght@500&display=swap" rel="stylesheet">
<style>
  *{box-sizing:border-box;margin:0}
  body{width:1200px;height:630px;background:#FBFAF7;font-family:Archivo,sans-serif;font-stretch:112%;
       background-image:linear-gradient(to right,rgba(17,17,17,.04) 1px,transparent 1px),
                        linear-gradient(to bottom,rgba(17,17,17,.04) 1px,transparent 1px);
       background-size:46px 46px;display:grid;grid-template-columns:1fr 330px;gap:52px;
       padding:64px 68px 0;position:relative}
  .et{font-family:"JetBrains Mono",monospace;font-size:15px;letter-spacing:.2em;color:#6B6862}
  img{width:660px;margin:30px 0 0}
  .sub{margin-top:26px;font-size:29px;line-height:1.3;color:#2B2B2B;max-width:640px;font-weight:500}
  .row{display:flex;gap:12px;margin-top:30px}
  .b{border:2px solid #111;border-radius:4px;padding:9px 16px;font-size:18px;font-weight:700;background:#FBFAF7}
  .b.y{background:#FFD500;font-family:"JetBrains Mono",monospace;font-size:15px;letter-spacing:.12em}
  .panel{border:2px solid #111;border-radius:4px;background:#FBFAF7;padding:18px;height:330px;
         display:flex;flex-direction:column;margin-top:34px}
  .ph{display:flex;justify-content:space-between;font-family:"JetBrains Mono",monospace;font-size:12px;
      letter-spacing:.14em;color:#6B6862;padding-bottom:12px;border-bottom:1px solid rgba(17,17,17,.08)}
  .tanques{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;flex:1;margin-top:16px}
  .t{display:flex;flex-direction:column;gap:8px}
  .p{flex:1;background:#E7E4DC;border:1px solid rgba(17,17,17,.08);border-radius:3px;position:relative;overflow:hidden}
  .p i{position:absolute;left:0;right:0;bottom:0;display:block;border-radius:2px}
  .lb{display:flex;justify-content:space-between;font-family:"JetBrains Mono",monospace;font-size:12px}
  .lb b{font-weight:700}.lb em{font-style:normal;color:#6B6862;font-size:10px}
  .tintas{position:absolute;left:0;right:0;bottom:0;height:14px;display:grid;grid-template-columns:repeat(4,1fr)}
</style>
<body>
  <div>
    <p class="et">TIENDA DE INFORM&Aacute;TICA &middot; CARBALLO (A CORU&Ntilde;A)</p>
    <img src="../assets/img/brand/mqt-wordmark.svg">
    <p class="sub">Consumibles, equipos, reparaci&oacute;n y PuntoPack.<br>En R&uacute;a Luis Calvo.</p>
    <div class="row">
      <span class="b">4,7 &#9733; &middot; 36 rese&ntilde;as</span>
      <span class="b y">ABRIMOS DOMINGOS 11&ndash;13</span>
    </div>
  </div>
  <div class="panel">
    <div class="ph"><span>NIVELES DE TINTA</span><span style="color:#0089B6">LISTA</span></div>
    <div class="tanques">
      <div class="t"><span class="p"><i style="background:#00A9E0;height:100%"></i></span><span class="lb"><b>C</b><em>100%</em></span></div>
      <div class="t"><span class="p"><i style="background:#E5007D;height:96%"></i></span><span class="lb"><b>M</b><em>96%</em></span></div>
      <div class="t"><span class="p"><i style="background:#FFD500;height:99%"></i></span><span class="lb"><b>Y</b><em>99%</em></span></div>
      <div class="t"><span class="p"><i style="background:#111;height:94%"></i></span><span class="lb"><b>K</b><em>94%</em></span></div>
    </div>
  </div>
  <div class="tintas"><i style="background:#00A9E0"></i><i style="background:#E5007D"></i><i style="background:#FFD500"></i><i style="background:#111"></i></div>
</body>`;


require('fs').writeFileSync(path.join(__dirname, 'og.html'), html);

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
  await p.goto(pathToFileURL(path.join(__dirname, 'og.html')).href);
  await p.waitForTimeout(2500);
  await p.screenshot({ path: path.join(RAIZ, 'assets', 'img', 'og-mas-que-tinta.jpg'), type: 'jpeg', quality: 92 });
  await b.close();
  console.log('og listo');
})();
