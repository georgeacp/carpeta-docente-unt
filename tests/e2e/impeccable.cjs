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

const catalogo = {
  usuarios: [{...user, rol:'docente'}],
  cursos: [{id:99102,codigo:'QA-01',nombre:'Curso ficticio QA',ciclo:1,escuela:'Escuela QA'}],
  semestres: [{id:99103,nombre:'QA-I',inicio:'2027-04-01',fin:'2027-07-30',fecha_limite:'2027-07-31T04:59:00Z',activo:true}],
  plantillas: [], asignaciones: [],
};
async function adminForms(browser) {
  const context = await browser.newContext(); await seed(context,{...user,rol:'admin'});
  await context.route('**/api/admin/catalogo', r => r.fulfill({json:catalogo}));
  let requests = 0, fail = true;
  await context.route('**/api/admin/cursos', async r => {
    requests++; await new Promise(resolve => setTimeout(resolve, 400));
    await r.fulfill({status:fail?400:200,json:fail?{detail:'QA código ya registrado'}:{id:99104}});
  });
  const page = await context.newPage(); page.setDefaultTimeout(60000); page.setDefaultNavigationTimeout(120000);
  await page.goto(`${base}/admin`);
  for (const name of ['Carga lectiva','Cursos y docentes','Semestres']) {
    await page.getByRole('button',{name,exact:true}).click();
    await page.locator('form input, form select').first().waitFor();
    const unlabeled = await page.locator('form input, form select').evaluateAll(fields => fields.filter(f => !f.labels?.length).length);
    assert.equal(unlabeled,0,`Etiquetas: ${name}`);
  }
  await page.getByRole('button',{name:'Cursos y docentes',exact:true}).click();
  await page.getByLabel(/^Código/).fill('QA-TEST');
  await page.getByLabel('Nombre de la Asignatura', {exact:true}).fill('Curso ficticio de prueba');
  await page.locator('#curso').evaluate(form => {form.requestSubmit();form.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}));});
  await page.locator('#curso').getByRole('alert').filter({hasText:'QA código ya registrado'}).waitFor();
  assert.equal(requests,1); assert.equal(await page.getByLabel(/^Código/).inputValue(),'QA-TEST');
  await page.getByLabel(/^Código/).click();
  await page.locator('label[for="admin-curCodigo"]').click();
  assert.equal(await page.locator('#admin-curCodigo').evaluate(el => el === document.activeElement),true);
  fail=false;
  await page.getByRole('button',{name:'Guardar Curso',exact:true}).click();
  await page.locator('#curso').getByText('Operación completada.',{exact:true}).waitFor();
  assert.equal(requests,2); assert.equal(await page.getByLabel(/^Código/).inputValue(),'');
  await context.close();
}


async function semesterDeadline(browser) {
  const context = await browser.newContext({timezoneId:'Asia/Tokyo'}); await seed(context,{...user,rol:'admin'});
  await context.route('**/api/admin/catalogo',r => r.fulfill({json:catalogo}));
  let saved;
  await context.route('**/api/admin/semestres',async r => {saved = r.request().postDataJSON();await r.fulfill({json:{id:99105}});});
  const page = await context.newPage();page.setDefaultNavigationTimeout(120000);
  await page.goto(`${base}/admin`);
  await page.getByRole('button',{name:'Semestres',exact:true}).click();
  await page.getByLabel('Fecha de Inicio',{exact:true}).fill('2028-04-01');
  await page.getByLabel('Fecha de Término',{exact:true}).fill('2028-07-30');
  assert.equal(await page.getByLabel('Fecha límite de cierre (hora de Perú)',{exact:true}).inputValue(),'2028-07-30');
  await page.getByLabel('Hora límite (hora de Perú)',{exact:true}).fill('22:30');
  await page.getByRole('button',{name:'Crear y Activar Semestre',exact:true}).click();
  await page.locator('#semestre').getByText('Operación completada.',{exact:true}).waitFor();
  assert.equal(saved.fecha_limite,'2028-07-31T03:30:00.000Z');
  await context.close();
}

async function main() {
  const browser = await chromium.launch({channel:'chrome',headless:true});
  try {
    if (!process.argv[2] || process.argv[2] === 'profile') { await profile(browser); console.log('PASS perfil: roles, recuperación, rutas antiguas y cierre de sesión'); }
    if (!process.argv[2] || process.argv[2] === 'semester') { await semesterDeadline(browser); console.log('PASS semestre: año nuevo, zona de navegador independiente y UTC correcto'); }
    if (!process.argv[2] || process.argv[2] === 'admin') { await adminForms(browser); console.log('PASS administración: etiquetas, bloqueo de envío, error y reintento'); }
  }
  finally { await browser.close(); }
}
if (require.main === module) main().catch(e => {console.error(e);process.exitCode=1;});
module.exports = {base,user,seed,profile,catalogo,adminForms};

