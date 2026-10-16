// Prueba del parser del marcador de pendiente (fase 52, plan 02). Node 24 importa el .ts sin compilar.
import test from 'node:test';
import assert from 'node:assert/strict';
import { splitPending, countPending, hasMalformedPending, PENDING_RE } from '../src/home/pending.ts';

test('un marcador en medio devuelve tres tramos', () => {
  assert.deepEqual(splitPending('Hola [PENDIENTE: dato] fin'), [
    { type: 'text', value: 'Hola ' },
    { type: 'pending', value: 'dato' },
    { type: 'text', value: ' fin' },
  ]);
});

test('sin marcador devuelve un tramo de texto; vacío devuelve lista vacía', () => {
  assert.deepEqual(splitPending('Solo texto'), [{ type: 'text', value: 'Solo texto' }]);
  assert.deepEqual(splitPending(''), []);
});

test('dos marcadores, juntos o separados, salen en orden', () => {
  assert.deepEqual(splitPending('[PENDIENTE: uno][PENDIENTE: dos]'), [
    { type: 'pending', value: 'uno' },
    { type: 'pending', value: 'dos' },
  ]);
  assert.deepEqual(splitPending('a [PENDIENTE: uno] b [PENDIENTE: dos] c'), [
    { type: 'text', value: 'a ' },
    { type: 'pending', value: 'uno' },
    { type: 'text', value: ' b ' },
    { type: 'pending', value: 'dos' },
    { type: 'text', value: ' c' },
  ]);
});

test('los marcadores mal formados se devuelven como texto plano', () => {
  for (const bad of ['[PENDIENTE: ]', '[PENDIENTE:dato', '[pendiente: dato]', '[PENDIENTE]']) {
    assert.deepEqual(splitPending(bad), [{ type: 'text', value: bad }], bad);
    assert.equal(countPending(bad), 0, bad);
  }
});

test('countPending cuenta solo los bien formados', () => {
  assert.equal(countPending('x'), 0);
  assert.equal(countPending('[PENDIENTE: a] y [PENDIENTE: b]'), 2);
  assert.equal(countPending('[PENDIENTE: a] y [PENDIENTE: ]'), 1);
});

test('hasMalformedPending detecta los intentos mal formados', () => {
  assert.equal(hasMalformedPending('[PENDIENTE: ]'), true);
  assert.equal(hasMalformedPending('[PENDIENTE:dato'), true);
  assert.equal(hasMalformedPending('[pendiente: dato]'), true);
  assert.equal(hasMalformedPending('[PENDIENTE: dato]'), false);
  assert.equal(hasMalformedPending('Texto sin marcador'), false);
  assert.equal(hasMalformedPending('[PENDIENTE: bien] y [PENDIENTE: ]'), true);
});

test('la descripción admite cualquier carácter salvo el corchete de cierre', () => {
  assert.deepEqual(splitPending('[PENDIENTE: foto (800x600), fecha: 2026/10; "ok"]'), [
    { type: 'pending', value: 'foto (800x600), fecha: 2026/10; "ok"' },
  ]);
});

test('PENDING_RE es una sola expresión compartida y no guarda estado entre llamadas', () => {
  assert.ok(PENDING_RE instanceof RegExp);
  assert.equal(countPending('[PENDIENTE: a]'), 1);
  assert.equal(countPending('[PENDIENTE: a]'), 1);
});
