// Solo instancia principal y backend ficticio en memoria.
const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const path = require("node:path");
const { chromium, request } = require("../../frontend/node_modules/playwright");

async function main() {
  const frontend = process.env.CICLO_QA_FRONTEND;
  const backend = process.env.CICLO_QA_BACKEND;
  const artifacts = process.env.CICLO_QA_ARTIFACTS;
  assert(frontend && backend && artifacts, "Defina las URLs principales y CICLO_QA_ARTIFACTS.");
  assert.equal(new URL(frontend).port, "3000");
  assert(["localhost", "127.0.0.1"].includes(new URL(frontend).hostname));
  assert.equal(new URL(backend).port, "8000");
  assert(["localhost", "127.0.0.1"].includes(new URL(backend).hostname));
  const http = await request.newContext({ baseURL: backend });
  const json = async response => {
    assert(response.ok(), `${response.status()}: ${await response.text()}`);
    return response.json();
  };
  assert.equal((await json(await http.get("/api/health"))).mode, "fictitious-visual-qa");
  const sessions = {};
  for (const rol of ["admin", "docente", "revisor"]) sessions[rol] = await json(await http.post("/api/auth/demo-login", { data: { rol } }));
  const headers = { Authorization: `Bearer ${sessions.admin.access_token}` };
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage();
  page.setDefaultTimeout(30000);
  page.setDefaultNavigationTimeout(120000);
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await fs.mkdir(artifacts, { recursive: true });
  const login = async rol => {
    await page.goto(`${frontend}/login`);
    await page.evaluate(session => {
      localStorage.setItem("unt_jwt_token", session.access_token);
      localStorage.setItem("unt_user", JSON.stringify(session.usuario));
      localStorage.setItem("unt_locale", "es");
    }, sessions[rol]);
    await page.goto(`${frontend}/${rol}`);
  };
  const capture = async name => {
    await page.evaluate(() => document.fonts.ready);
    await page.locator('[data-sonner-toast]').last().waitFor({ state: "hidden", timeout: 7000 }).catch(() => {});
    await page.locator("main").evaluate(el => { el.scrollTop = 0; });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, page.url());
    await page.screenshot({ path: path.join(artifacts, `${name}.png`), fullPage: true });
    const main = page.locator("main");
    if (await main.evaluate(el => el.scrollHeight > el.clientHeight + 40)) {
      await main.evaluate(el => { el.scrollTop = el.scrollHeight; });
      await page.screenshot({ path: path.join(artifacts, `${name}-end.png`), fullPage: true });
      await main.evaluate(el => { el.scrollTop = 0; });
    }
  };
  try {
    await login("admin");
    await page.getByRole("heading", { name: "Administración académica", exact: true }).waitFor();
    await page.getByText("Con carpeta docente generada", { exact: true }).waitFor();
    await capture("admin-resumen");
    for (const route of ["usuarios", "cursos", "semestres", "asignaciones"]) {
      await page.goto(`${frontend}/admin/${route}`);
      await page.locator("form").waitFor();
      await capture(`admin-${route}`);
    }
    const code = `QA-MOD-${Date.now()}`;
    await page.goto(`${frontend}/admin/cursos`);
    await page.locator("#admin-curCodigo").fill(code);
    await page.locator("#admin-curNombre").fill("Curso ficticio de módulos");
    await page.getByRole("button", { name: "Guardar Curso", exact: true }).click();
    await page.getByText(code, { exact: true }).waitFor();
    const catalog = await json(await http.get("/api/admin/catalogo", { headers }));
    const course = catalog.cursos.find(c => c.codigo === code);
    const semester = catalog.semestres.find(s => s.activo);
    const configUrl = `/api/admin/cursos/${course.id}/semestres/${semester.id}/configuracion`;
    await page.goto(`${frontend}/admin/configuracion`);
    await page.getByRole("combobox", { name: "Curso", exact: true }).selectOption(String(course.id));
    await page.getByRole("combobox", { name: "Semestre", exact: true }).selectOption(String(semester.id));
    await page.getByText("Configuración editable hasta la primera carga de documentos.", { exact: true }).waitFor();
    await Promise.all([
      page.waitForResponse(r => r.url().includes(configUrl) && r.request().method() === "PUT" && r.ok()),
      page.getByRole("button", { name: "Guardar configuración", exact: true }).click(),
    ]);
    const saved = await json(await http.get(configUrl, { headers }));
    assert.equal(saved.version, 1);
    await capture("admin-configuracion-desktop");
    const teacherId = sessions.docente.usuario.id;
    const folder = await json(await http.post("/api/admin/asignaciones", { headers, data: { docente_id: teacherId, curso_id: course.id, semestre_id: semester.id, seccion: "QA" } }));
    const teacherHeaders = { Authorization: `Bearer ${sessions.docente.access_token}` };
    const detail = await json(await http.get(`/api/carpetas/${folder.id}`, { headers: teacherHeaders }));
    await json(await http.post(`/api/carpetas/secciones/${detail.secciones[0].id}/documentos`, { headers: teacherHeaders, multipart: { archivo: { name: "qa-modulos.pdf", mimeType: "application/pdf", buffer: Buffer.from("%PDF-1.4\n%%EOF") } } }));
    await page.getByRole("button", { name: "Actualizar", exact: true }).click();
    await page.getByText(/Configuración bloqueada:/).waitFor();
    assert(await page.getByRole("button", { name: "Guardar configuración", exact: true }).isDisabled());
    await page.setViewportSize({ width: 390, height: 844 });
    await capture("admin-configuracion-mobile");
    await page.setViewportSize({ width: 1440, height: 1000 });
    await login("docente");
    await page.getByRole("searchbox", { name: "Buscar", exact: true }).fill(code);
    assert(new URL(page.url()).searchParams.get("q") === code);
    await page.reload();
    assert.equal(await page.getByRole("searchbox", { name: "Buscar", exact: true }).inputValue(), code);
    await page.getByText("Curso ficticio de módulos", { exact: true }).last().waitFor();
    await page.goto(`${frontend}/docente/carpeta/${folder.id}`);
    await page.getByRole("heading", { name: "Documentos del curso", exact: true }).waitFor();
    await capture("docente-documentacion");
    for (const [vista, label] of [["entregas", "Entregas"], ["observaciones", "Observaciones"], ["historial", "Historial"]]) {
      await page.getByRole("button", { name: label, exact: true }).click();
      assert.equal(new URL(page.url()).searchParams.get("vista"), vista);
      await page.reload();
      await page.getByRole("button", { name: label, exact: true }).waitFor();
      await capture(`docente-${vista}`);
    }
    await page.goto(`${frontend}/admin/usuarios`);
    await page.getByRole("heading", { name: "No tienes acceso a este módulo" }).waitFor();
    await login("revisor");
    await page.getByRole("heading", { name: "Entregas pendientes", exact: true }).waitFor();
    await page.locator('a[href^="/revisor/carpeta/"]').first().waitFor();
    await capture("revisor-bandeja");
    await page.goto(`${frontend}/revisor/seguimiento`);
    await page.getByRole("combobox", { name: "Curso", exact: true }).selectOption(String(course.id));
    await page.getByText("Curso ficticio de módulos", { exact: true }).last().waitFor();
    await capture("revisor-seguimiento");
    for (const width of [360, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: 950 });
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    }
    await page.getByRole("searchbox", { name: "Buscar", exact: true }).focus();
    await page.keyboard.press("Tab");
    assert(await page.getByRole("combobox", { name: "Semestre", exact: true }).evaluate(el => el === document.activeElement));
    await page.getByRole("button", { name: "Tema", exact: true }).click();
    await page.waitForFunction(() => document.documentElement.getAttribute("data-theme") === "dark");
    await page.setViewportSize({ width: 390, height: 844 });
    await page.emulateMedia({ colorScheme: "dark", reducedMotion: "reduce" });
    assert.equal(await page.locator("html").getAttribute("data-theme"), "dark");
    await capture("revisor-mobile-dark");
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.route("**/api/revision/carpetas?*", route => route.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify({ detail: "Fallo ficticio QA" }) }));
    await page.goto(`${frontend}/revisor/seguimiento`);
    await page.getByRole("button", { name: "Volver a intentar", exact: true }).waitFor();
    await page.unroute("**/api/revision/carpetas?*");
    await page.getByRole("button", { name: "Volver a intentar", exact: true }).click();
    await page.getByText("Curso ficticio de módulos", { exact: true }).last().waitFor();
    assert.deepEqual(errors, []);
    console.log(JSON.stringify({ passed: true, checked: ["rutas administrativas", "configuración", "bloqueo por carga", "filtros URL", "apartados de carpeta", "permisos", "bandeja", "seguimiento", "responsive", "tema oscuro", "reintento"], artifacts }));
  } catch (error) {
    await page.screenshot({ path: path.join(artifacts, "failure.png"), fullPage: true });
    throw error;
  } finally {
    await browser.close();
    await http.dispose();
  }
}

main().catch(error => { console.error(error); process.exitCode = 1; });
