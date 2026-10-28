// Read-only UI checks against a running frontend; no uploads or academic decisions.
const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const path = require("node:path");
const { chromium } = require("../../frontend/node_modules/playwright");

async function main() {
  const base = process.env.UI_QA_FRONTEND;
  const artifacts = process.env.UI_QA_ARTIFACTS;
  assert(base && artifacts, "Defina UI_QA_FRONTEND y UI_QA_ARTIFACTS.");
  assert(["localhost", "127.0.0.1"].includes(new URL(base).hostname));
  await fs.mkdir(artifacts, { recursive: true });
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 950 } });
  const page = await context.newPage();
  page.setDefaultNavigationTimeout(120000);
  page.setDefaultTimeout(120000);
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const screenshot = (name) => page.screenshot({ path: path.join(artifacts, `${name}.png`), fullPage: true, caret: "initial" });
  const noOverflow = async () => assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `Desbordamiento: ${page.url()}`);
  const login = async (role) => {
    await page.goto(`${base}/login`);
    await page.waitForLoadState("networkidle");
    await page.getByRole("heading", { name: "Acceder a su carpeta" }).waitFor();
    await page.getByText("Entorno de demostración", { exact: true }).click();
    await page.locator("#demo-role-select").selectOption(role);
    await page.waitForFunction((selectedRole) => document.querySelector("#email").value === `${selectedRole}@unitru.edu.pe`, role);
    await page.getByRole("button", { name: "Acceso de demostración", exact: true }).click();
    await page.waitForURL(`**/${role}`);
    if (role === "admin") {
      await page.getByRole("combobox").first().waitFor();
    } else {
      await page.locator('[aria-busy="false"]').last().waitFor();
    }
  };

  try {
    await page.goto(`${base}/login`);
    await page.waitForLoadState("networkidle");
    await page.getByRole("heading", { name: "Acceder a su carpeta" }).waitFor();
    await screenshot("login-desktop");
    await page.getByLabel("Ver contraseña", { exact: true }).click();
    assert.equal(await page.locator("#password").getAttribute("type"), "text");
    await page.getByLabel("Ocultar contraseña", { exact: true }).click();
    await page.setViewportSize({ width: 390, height: 844 });
    await noOverflow();
    await screenshot("login-mobile");
    await page.setViewportSize({ width: 1440, height: 950 });
    await login("docente");
    await page.getByRole("heading", { name: "Mis carpetas", exact: true }).waitFor();
    await screenshot("docente-desktop");
    await page.getByRole("button", { name: "Contraer o expandir menú" }).click();
    assert.equal(await page.locator("aside").evaluate((el) => Math.round(el.getBoundingClientRect().width)), 80);
    await page.getByRole("button", { name: "Contraer o expandir menú" }).click();
    await page.getByRole("button", { name: "Notificaciones", exact: true }).click();
    await page.getByText("Sin notificaciones", { exact: true }).waitFor();
    await page.keyboard.press("Escape");
    await page.getByRole("button", { name: "Tema", exact: true }).click();
    await page.locator('html[data-theme="dark"]').waitFor();
    await screenshot("docente-dark");
    await page.getByRole("button", { name: "Tema", exact: true }).click();
    await page.locator('html[data-theme="light"]').waitFor();
    await page.emulateMedia({ reducedMotion: "reduce" });
    assert.equal(await page.locator('[role="progressbar"] > div > div').first().evaluate((el) => getComputedStyle(el).transitionDuration), "1e-05s");
    await page.emulateMedia({ reducedMotion: "no-preference" });
    for (const width of [360, 390, 768, 1024]) {
      await page.setViewportSize({ width, height: 844 });
      await noOverflow();
    }
    await page.setViewportSize({ width: 390, height: 844 });
    await screenshot("docente-mobile");
    await page.getByRole("button", { name: "Abrir menú", exact: true }).click();
    await page.getByRole("button", { name: "Cerrar menú", exact: true }).waitFor();
    await screenshot("menu-mobile");
    await page.keyboard.press("Escape");
    const folderLink = page.locator('article a[href^="/docente/carpeta/"]').first();
    if (await folderLink.count()) {
      await folderLink.click();
      await page.getByRole("heading", { name: "Documentos del curso", exact: true }).waitFor();
      await noOverflow();
      await screenshot("carpeta-mobile");
      await page.setViewportSize({ width: 1440, height: 950 });
      await screenshot("carpeta-desktop");
    }

    await page.setViewportSize({ width: 1440, height: 950 });
    await login("revisor");
    await screenshot("revisor-desktop");
    await page.getByRole("textbox", { name: "Buscar por docente o curso..." }).fill("zz-no-hay-resultados-zz");
    await page.getByText("No hay carpetas que coincidan", { exact: true }).waitFor();
    await page.getByRole("button", { name: "Limpiar búsqueda y filtros" }).click();
    assert.equal(await page.getByRole("textbox", { name: "Buscar por docente o curso..." }).inputValue(), "");
    await page.getByRole("button", { name: "Con observaciones", exact: true }).click();
    await page.locator('[aria-busy="false"]').last().waitFor();
    assert.equal(await page.getByRole("button", { name: "Con observaciones", exact: true }).getAttribute("aria-pressed"), "true");
    await page.getByRole("button", { name: "Todas", exact: true }).click();
    await page.locator('[aria-busy="false"]').last().waitFor();
    await page.setViewportSize({ width: 390, height: 844 });
    await noOverflow();
    await screenshot("revisor-mobile");

    await page.setViewportSize({ width: 1440, height: 950 });
    await login("admin");
    await page.getByRole("heading", { name: "Administración académica", exact: true }).waitFor();
    await screenshot("admin-desktop");
    for (const name of ["Cursos y docentes", "Semestres", "Plantilla de carpeta", "Carga lectiva"]) {
      await page.getByRole("button", { name, exact: true }).click();
      assert.equal(await page.getByRole("button", { name, exact: true }).getAttribute("aria-pressed"), "true");
    }
    await page.setViewportSize({ width: 390, height: 844 });
    await noOverflow();
    await screenshot("admin-mobile");

    await login("docente");
    // Network failures must not masquerade as an empty course list.
    await page.route("**/api/carpetas/mis-carpetas", (route) => route.fulfill({ status: 503, contentType: "application/json", body: '{"detail":"Servicio temporalmente no disponible"}' }));
    await page.reload();
    await page.getByText("No pudimos cargar las carpetas", { exact: true }).waitFor();
    await page.unroute("**/api/carpetas/mis-carpetas");
    await page.getByRole("button", { name: "Volver a intentar", exact: true }).click();
    await page.locator('[aria-busy="false"]').last().waitFor();
    assert.equal(await page.getByText("No pudimos cargar las carpetas", { exact: true }).count(), 0);
    await page.route("**/api/carpetas/mis-carpetas", (route) => route.fulfill({ status: 200, contentType: "application/json", body: "[]" }));
    await page.reload();
    await page.getByText("Aún no tiene carpetas asignadas", { exact: true }).waitFor();
    await page.unroute("**/api/carpetas/mis-carpetas");
    assert.deepEqual(errors, []);
    console.log(JSON.stringify({ passed: true, checks: ["acceso por rol", "contraseña visible", "menú móvil", "sidebar compacto", "notificaciones", "tema oscuro", "movimiento reducido", "360–1440px", "filtros", "búsqueda", "administración", "error y reintento", "carpetas vacías"], artifacts }));
  } catch (error) {
    await screenshot("failure");
    throw error;
  } finally {
    await browser.close();
  }
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
