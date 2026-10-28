const assert = require('node:assert/strict');
const { chromium } = require('../../frontend/node_modules/playwright');
const base = process.env.UI_QA_FRONTEND || 'http://localhost:3000';
assert.equal(new URL(base).port, '3000');
const user = { id: 99101, nombre: 'QA Perfil Ficticio', email: 'qa-perfil@unitru.edu.pe', rol: 'docente', escuela: 'Escuela QA', categoria: 'Categoría QA' };
async function seed(context, usuario = user) {
  await context.addInitScript((u) => {
    localStorage.setItem('unt_jwt_token', 'qa-token');
    localStorage.setItem('unt_user', JSON.stringify({...u, nombre: 'Dato anterior'}));
    localStorage.setItem('unt_locale', 'es');
  }, usuario);
}
async function profile(browser) {
  for (const rol of ['docente', 'revisor', 'admin']) {
    const context = await browser.newContext();
    await seed(context, {...user, rol});
    let fail = true;
    await context.route('**/api/auth/me', r => r.fulfill({status: fail ? 500 : 200, json: fail ? {detail:'QA error'} : {...user, rol}}));
    const page = await context.newPage(); page.setDefaultTimeout(60000); page.setDefaultNavigationTimeout(120000);
    await page.goto(`${base}/profile/account`);
    await page.getByRole('alert').filter({hasText:'No se pudo consultar'}).waitFor();
    fail = false;
    await page.getByRole('button', {name:'Volver a intentar',exact:true}).click();
    await page.getByText(user.email, {exact:true}).waitFor();
    assert.equal(await page.getByRole('region', {name:'Perfil institucional'}).locator('form, input, textarea').count(), 0);
    assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('unt_user')).nombre), user.nombre);
    for (const old of ['security', 'notification']) {
      await page.goto(`${base}/profile/${old}`);
      await page.waitForURL('**/profile/account');
      await page.getByText(user.email, {exact:true}).waitFor();
    }
    await page.getByRole('button', {name:'Cerrar sesión en este navegador',exact:true}).click();
    await page.waitForURL('**/login');
    assert.equal(await page.evaluate(() => localStorage.getItem('unt_jwt_token')), null);
    await context.close();
  }
}
async function main() {
  const browser = await chromium.launch({channel:'chrome',headless:true});
  try { await profile(browser); console.log('PASS perfil: roles, recuperación, rutas antiguas y cierre de sesión'); }
  finally { await browser.close(); }
}
if (require.main === module) main().catch(e => {console.error(e);process.exitCode=1;});
module.exports = {base,user,seed,profile};

