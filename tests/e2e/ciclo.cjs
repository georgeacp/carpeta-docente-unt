// Verificación en la instancia principal con backend ficticio en memoria; nunca usar registros reales.
const assert = require("node:assert/strict");
const path = require("node:path");
const fs = require("node:fs/promises");
const { chromium, request } = require("../../frontend/node_modules/playwright");

async function main() {
  const backend = process.env.CICLO_QA_BACKEND;
  const frontend = process.env.CICLO_QA_FRONTEND;
  const artifacts = process.env.CICLO_QA_ARTIFACTS;
  assert(backend && frontend && artifacts, "Defina CICLO_QA_BACKEND, CICLO_QA_FRONTEND y CICLO_QA_ARTIFACTS para la instancia principal ficticia.");
  assert.equal(new URL(backend).port, "8000", "La prueba solo escribe en el puerto principal 8000.");
  assert.equal(new URL(frontend).port, "3000", "La prueba solo navega por el puerto principal 3000.");
  const http = await request.newContext({ baseURL: backend });
  const json = async (response) => {
    assert(response.ok(), `${response.status()}: ${await response.text()}`);
    return response.json();
  };
  const health = await json(await http.get("/api/health"));
  assert.equal(health.mode, "fictitious-visual-qa", "Esta prueba requiere el backend ficticio visual_app; no escribe en bases reales.");
  const admin = await json(await http.post("/api/auth/demo-login", { data: { rol: "admin" } }));
  const adminHeaders = { Authorization: `Bearer ${admin.access_token}` };
  const catalog = await json(await http.get("/api/admin/catalogo", { headers: adminHeaders }));
  const docente = catalog.usuarios.find((usuario) => usuario.email === "docente@unitru.edu.pe");
  const semester = catalog.semestres.find((semestre) => semestre.activo);
  const course = await json(await http.post("/api/admin/cursos", { headers: adminHeaders, data: { codigo: `QA-${Date.now()}`, nombre: "Curso ficticio de verificación del ciclo", escuela: docente.escuela, ciclo: 1 } }));
  const folder = await json(await http.post("/api/admin/asignaciones", { headers: adminHeaders, data: { docente_id: docente.id, curso_id: course.id, semestre_id: semester.id, seccion: "A" } }));
  const teacher = await json(await http.post("/api/auth/demo-login", { data: { rol: "docente" } }));
  const teacherHeaders = { Authorization: `Bearer ${teacher.access_token}` };
  const detail = () => http.get(`/api/carpetas/${folder.id}`, { headers: teacherHeaders }).then(json);
  let snapshot = await detail();
  const firstMilestone = snapshot.ciclo.hitos.find((hito) => hito.codigo === "inicio");
  const pdf = Buffer.from("%PDF-1.4\n1 0 obj << /Type /Catalog >> endobj\n%%EOF");
  const upload = async (seccion) => json(await http.post(`/api/carpetas/secciones/${seccion.id}/documentos`, { headers: teacherHeaders, multipart: { archivo: { name: "evidencia-ficticia.pdf", mimeType: "application/pdf", buffer: pdf } } }));
  for (const seccion of snapshot.secciones) {
    if (firstMilestone.item_ids.includes(seccion.plantilla.id) && seccion.plantilla.obligatoria) await upload(seccion);
  }
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const teacherContext = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const directorContext = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await teacherContext.newPage();
  const director = await directorContext.newPage();
  for (const target of [page, director]) {
    target.setDefaultTimeout(120000);
    target.setDefaultNavigationTimeout(120000);
  }
  const errors = [];
  for (const target of [page, director]) target.on("pageerror", (error) => errors.push(error.message));
  const login = async (target, role) => {
    await target.goto(`${frontend}/login`);
    await target.waitForLoadState("networkidle");
    await target.locator('button[type="submit"]').waitFor();
    await target.getByText("Entorno de demostración", { exact: true }).click();
    await target.locator("#demo-role-select").selectOption(role);
    await target.getByRole("button", { name: "Acceso de demostración", exact: true }).click();
    await target.waitForURL(`**/${role === "revisor" ? "revisor" : "docente"}`);
  };
  const waitForCycle = (target, state) => target.locator('[aria-label="Ciclo de entregas"]').getByText(state, { exact: true }).waitFor();
  const submit = async (name) => {
    await page.getByRole("button", { name, exact: true }).click();
    await page.getByRole("button", { name: "Confirmar envío", exact: true }).click();
  };
  const evaluateRemaining = async () => {
    const items = director.getByRole("navigation", { name: "Documentos de la entrega", exact: true }).getByRole("button");
    for (let index = 0; index < await items.count(); index++) {
      await items.nth(index).click();
      const panel = director.locator('[id^="review-document-"]');
      if (!await panel.getByText("Pendiente de evaluación", { exact: true }).count()) continue;
      await Promise.all([
        director.waitForResponse(response => response.request().method() === "PUT" && response.url().includes("/api/revision/entregas/")),
        panel.getByRole("button", { name: "Marcar conforme", exact: true }).click(),
      ]);
      await panel.getByText("Conforme", { exact: true }).waitFor();
    }
  };
  const conclude = async () => {
    await director.getByRole("button", { name: "Concluir dictamen de la entrega", exact: true }).click();
    await director.getByRole("button", { name: "Confirmar dictamen", exact: true }).click();
  };
  try {
    await login(page, "docente");
    await page.goto(`${frontend}/docente/carpeta/${folder.id}`);
    await submit("Enviar a revisión");
    await waitForCycle(page, "enviada");
    assert(await page.locator('input[type="file"]').isDisabled());
    await login(director, "revisor");
    await director.goto(`${frontend}/revisor/carpeta/${folder.id}`);
    await director.getByRole("button", { name: "Marcar conforme" }).first().waitFor();
    await director.locator("textarea").first().fill("Precisar el contenido del sílabo.");
    await director.getByRole("button", { name: "Guardar observación" }).first().click();
    await director.getByText("Evaluación guardada. Falta concluir el dictamen de la entrega.", { exact: true }).first().waitFor();
    await evaluateRemaining();
    await conclude();
    await waitForCycle(director, "observada");
    await page.reload();
    await waitForCycle(page, "observada");
    await page.locator('input[type="file"]').setInputFiles({ name: "correccion-ficticia.pdf", mimeType: "application/pdf", buffer: Buffer.concat([pdf, Buffer.from("\ncorreccion")]) });
    await page.getByText(/Nueva versión subida exitosamente/).waitFor();
    await submit("Reenviar a revisión");
    await waitForCycle(page, "reenviada");
    await director.reload();
    await director.getByRole("button", { name: "Marcar conforme" }).first().waitFor();
    await evaluateRemaining();
    await conclude();
    await waitForCycle(director, "en progreso");
    snapshot = await detail();
    assert.equal(snapshot.ciclo.entregas.length, 2);
    assert.equal(snapshot.ciclo.entregas[1].estado, "observada");
    assert.equal(snapshot.ciclo.entregas[0].estado, "aprobada");
    for (const seccion of snapshot.secciones) if (seccion.plantilla.obligatoria && !seccion.documentos.length) await upload(seccion);
    await page.reload();
    await page.locator("#hito-entrega").selectOption({ label: "Cierre integral" });
    await submit("Enviar a revisión");
    await waitForCycle(page, "enviada");
    await director.reload();
    await director.getByRole("button", { name: "Marcar conforme" }).first().waitFor();
    await evaluateRemaining();
    await conclude();
    await director.getByText("Carpeta aprobada definitivamente", { exact: true }).waitFor();
    await page.reload();
    await page.getByText("Carpeta aprobada definitivamente", { exact: true }).waitFor();
    assert(await page.locator('input[type="file"]').isDisabled());
    await fs.mkdir(artifacts, { recursive: true });
    await page.screenshot({ path: path.join(artifacts, "docente-desktop.png"), fullPage: true });
    await director.screenshot({ path: path.join(artifacts, "director-desktop.png"), fullPage: true });
    for (const width of [360, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: 950 });
      await page.waitForTimeout(200);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `Desbordamiento a ${width}px`);
    }
    await page.setViewportSize({ width: 390, height: 844 });
    await page.screenshot({ path: path.join(artifacts, "docente-mobile.png"), fullPage: true });
    assert.deepEqual(errors, []);
    console.log(JSON.stringify({ passed: true, folderId: folder.id, checked: ["envío parcial", "bloqueo", "observación", "corrección", "reenvío", "aprobación parcial", "cierre sin seguimiento", "aprobación final", "historial", "responsive"], artifacts }));
  } catch (error) {
    await fs.mkdir(artifacts, { recursive: true });
    await page.screenshot({ path: path.join(artifacts, "failure-docente.png"), fullPage: true });
    await director.screenshot({ path: path.join(artifacts, "failure-director.png"), fullPage: true });
    throw error;
  } finally {
    await browser.close();
    await http.dispose();
  }
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
