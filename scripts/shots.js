const { chromium } = require('playwright');
const URL = process.argv[2] || 'http://127.0.0.1:8247/';
const W = parseInt(process.argv[3] || '1440', 10);
const tag = process.argv[4] || 'd';
async function rueda(page, hasta, paso) {
  paso = paso || 700;
  let y = await page.evaluate(() => window.scrollY);
  while (y < hasta) {
    await page.mouse.wheel(0, Math.max(60, Math.min(paso, hasta - y)));
    await page.waitForTimeout(140);
    const ny = await page.evaluate(() => window.scrollY);
    if (ny <= y + 1) break; y = ny;
  }
  await page.waitForTimeout(2500); return y;
}
(async () => {
  const b = await chromium.launch();
  const H = parseInt(process.argv[5] || String(Math.round(W * 0.625)), 10);
  const ctx = await b.newContext({ viewport: { width: W, height: H } });
  const page = await ctx.newPage();
  const errs = [];
  page.on('console', m => { if (m.type()==='error') errs.push(m.text()); });
  page.on('pageerror', e => errs.push('PE: '+e.message));
  page.on('response', r => { if (r.status()>=400) errs.push(r.status()+' '+r.url()); });
  await page.goto(URL, { waitUntil: 'networkidle' });
  await page.waitForTimeout(3200);
  await page.screenshot({ path: `screenshots/${tag}-01-hero.png` });
  await page.click('.cookie-ack');
  const secs = ['#tienda','.cats-lista','#consumibles','#reparacion','#puntopack','#horario','#resenas','#contacto','#pendiente'];
  for (let i=0;i<secs.length;i++){
    const y = await page.evaluate(s=>{const e=document.querySelector(s);return e?e.getBoundingClientRect().top+window.scrollY-70:0;}, secs[i]);
    await rueda(page, y);
    await page.screenshot({ path: `screenshots/${tag}-${String(i+2).padStart(2,'0')}-${secs[i].replace(/[#.]/g,'')}.png` });
  }
  await rueda(page, 999999);
  await page.screenshot({ path: `screenshots/${tag}-99-pie.png` });
  console.log(errs.length? 'ERRORES:\n'+errs.join('\n') : 'sin errores de consola');
  await b.close();
})();
