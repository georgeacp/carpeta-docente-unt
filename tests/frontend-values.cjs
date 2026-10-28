const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('../frontend/node_modules/typescript');

function load(relative) {
  const file = path.resolve(__dirname, '../frontend/src', relative);
  const compiled = ts.transpileModule(fs.readFileSync(file, 'utf8'), {compilerOptions: {module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022}});
  const loaded = new Module(file);
  loaded._compile(compiled.outputText, file);
  return loaded.exports;
}

const {academicDeadline, validateSemester, formatAcademicDeadline} = load('lib/academic-dates.ts');
const {apiMessage} = load('lib/api-message.ts');
const {formatFileSize} = load('utils/format-file-size.ts');
const {ApiError, apiProblem} = load('lib/api-error.ts');
assert.equal(academicDeadline('2028-07-30','23:59'),'2028-07-31T04:59:00.000Z');
assert.throws(()=>validateSemester('2028-08-01','2028-07-30','2028-07-30'));
assert.throws(()=>validateSemester('2028-04-01','2028-07-30','2028-07-29'));
assert.ok(formatAcademicDeadline('2026-10-28T23:08:00Z').includes('6:08'));
assert.equal(apiMessage([{loc:['body','fecha_limite'],type:'timezone_aware',msg:'Input should have timezone info'}]),'Fecha límite: Indica una fecha con zona horaria.');
assert.equal(apiMessage([{loc:['body'],msg:'Value error, Revisa las fechas.'}]),'Revisa las fechas.');
assert.equal(formatFileSize(19/1024/1024),'19 B');
assert.equal(formatFileSize(0.5),'512 KB');
assert.equal(formatFileSize(2),'2 MB');
assert.equal(apiProblem(new ApiError(403,'Forbidden')).retry,false);
assert.equal(apiProblem(new ApiError(null,'Offline')).retry,true);
const {getTranslation} = load('lib/i18n/translations.ts');
assert.equal(getTranslation('es','docente.foldersCount',{count:1}),'1 carpeta');
assert.equal(getTranslation('en','revisor.results',{count:1}),'1 result');
console.log('PASS valores: plazos, hora de Perú, errores legibles y tamaños documentales');
