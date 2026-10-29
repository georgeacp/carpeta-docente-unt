const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const { chromium } = require('../../frontend/node_modules/playwright');
const {base,user,seed,catalogo,folder} = require('./impeccable.cjs');
async function main() {
  const output=process.env.UI_QA_ARTIFACTS || path.resolve('.impeccable/review/final');
  await fs.mkdir(output,{recursive:true});
  const browser=await chromium.launch({channel:'chrome',headless:true});
  const errors=[];
  try {
    for(const role of ['docente','revisor','admin']) {
      const context=await browser.newContext({viewport:{width:1440,height:1000}});await seed(context,{...user,rol:role});
      const data=structuredClone(folder);
      data.curso.nombre='Curso ficticio con nombre extenso de ingeniería y documentación académica';
      await context.route('**/api/auth/me',r=>r.fulfill({json:{...user,rol:role,nombre:'QA Nombre institucional extenso para comprobar adaptación de contenidos'}}));
      await context.route('**/api/admin/catalogo',r=>r.fulfill({json:catalogo}));
      await context.route('**/api/carpetas/*',r=>r.fulfill({json:data}));
      const page=await context.newPage();page.setDefaultNavigationTimeout(120000);page.on('pageerror',e=>errors.push(e.message));
      const routes=role==='admin'?['/admin/semestres','/profile/account']:[`/${role}/carpeta/1`,'/profile/account'];
      for(const route of routes) {
        await page.goto(base+route);
        if(route.includes('profile')) await page.getByText(user.email,{exact:true}).waitFor();
        else if(role==='admin') await page.locator('#semestre').waitFor();
        else await page.getByRole('button',{name:'Actualizar carpeta',exact:true}).waitFor();
        for(const width of [360,768,1440]) {
          await page.setViewportSize({width,height:1000});
          assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,`Overflow ${route} ${width}`);
          await page.screenshot({path:path.join(output,`${role}-${route.includes('profile')?'perfil':'carpeta'}-${width}.png`),fullPage:true});
          await page.locator('main').evaluate(el=>el.scrollTop=el.scrollHeight);
          await page.screenshot({path:path.join(output,`${role}-${route.includes('profile')?'perfil':'carpeta'}-${width}-lower.png`),fullPage:true});
          await page.locator('main').evaluate(el=>el.scrollTop=0);
        }
        await page.getByRole('button',{name:'Tema',exact:true}).click();
        await page.locator('html[data-theme="dark"]').waitFor();
        await page.screenshot({path:path.join(output,`${role}-${route.includes('profile')?'perfil':'carpeta'}-dark.png`),fullPage:true});
        await page.getByRole('button',{name:'Tema',exact:true}).click();
        await page.emulateMedia({reducedMotion:'reduce'});
        await page.keyboard.press('Tab');
        assert.notEqual(await page.evaluate(()=>document.activeElement?.tagName),'BODY');
        await page.evaluate(()=>document.documentElement.style.zoom='2');
        assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,`Reflow ${route}`);
        await page.screenshot({path:path.join(output,`${role}-${route.includes('profile')?'perfil':'carpeta'}-zoom200.png`),fullPage:true});
        await page.evaluate(()=>document.documentElement.style.zoom='');
      }
      await context.close();
    }
    assert.deepEqual(errors,[]);console.log('PASS visual: 360/768/1440, oscuro, teclado, movimiento reducido y zoom de contenido al 200%; capturas en '+output);
  } finally {await browser.close();}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
