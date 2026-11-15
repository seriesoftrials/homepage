import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mountEventMotion } from '../grainy/src/event-motion.js';

function fixture(t) {
  const properties = new Map();
  const state = { top: 900, height: 360, visual: 0, available: 100 };
  const listeners = {};
  const classes = () => {
    const values = new Set();
    return { add: k => values.add(k), remove: k => values.delete(k), contains: k => values.has(k),
      toggle: (k, on) => on ? values.add(k) : values.delete(k) };
  };
  const root = { classList: classes() };
  const card = {
    classList: classes(),
    style: { setProperty: (k, v) => properties.set(k, v), removeProperty: k => properties.delete(k) },
    getBoundingClientRect: () => ({ top: state.top - window.scrollY + state.visual, bottom: state.top + state.height - window.scrollY + state.visual, height: state.height }),
  };
  const following = { getBoundingClientRect: () => ({ top: state.top + state.height + state.available + 12 - window.scrollY }) };
  const globals = {
    window: { scrollY: 0, innerHeight: 600, innerWidth: 900, addEventListener: (k, fn) => { listeners[k] = fn; } },
    document: { hidden: false, documentElement: root, querySelector: selector => selector === '.site-sections' ? following : null, addEventListener: (k, fn) => { listeners[k] = fn; } },
    getComputedStyle: element => element === card ? { transform: 'matrix(1, 0, 0, 1, 0, 0)', getPropertyValue: () => '160' } : { marginTop: '12px' },
    DOMMatrixReadOnly: class { constructor() { this.m42 = state.visual; } },
    ResizeObserver: class { observe() {} },
  };
  for (const [key, value] of Object.entries(globals)) {
    const original = Object.getOwnPropertyDescriptor(globalThis, key);
    Object.defineProperty(globalThis, key, { value, writable: true, configurable: true });
    t.after(() => original ? Object.defineProperty(globalThis, key, original) : delete globalThis[key]);
  }
  const preference = { matches: false, addEventListener: (_type, fn) => { listeners.preference = fn; } };
  const motion = mountEventMotion(card, preference);
  return { motion, properties, state, root, preference, listeners,
    offset: () => Number.parseFloat(properties.get('--event-motion-offset') || '0') };
}

test('an interpolating transform cannot drift the scroll baseline on repeated updates', t => {
  const f = fixture(t);
  window.scrollY = 700;
  f.motion.refresh();
  const target = f.offset();
  assert.ok(target > 0 && target < 100);
  f.state.visual = target / 4;
  for (let i = 0; i < 20; i++) f.motion.refresh();
  assert.equal(f.offset(), target);
  f.listeners.resize();
  assert.equal(f.offset(), target);
  window.scrollY = 0;
  f.motion.refresh();
  assert.equal(f.offset(), 0);
});

test('resizing caps travel to the following section, and reduced motion resets it', t => {
  const f = fixture(t);
  window.scrollY = 1000;
  f.motion.refresh();
  assert.ok(f.offset() > 10);
  f.state.available = 10;
  f.state.visual = 4;
  f.listeners.resize();
  assert.ok(f.offset() <= 10);
  assert.equal(f.root.classList.contains('has-event-motion'), true);
  f.preference.matches = true;
  f.listeners.preference();
  assert.equal(f.offset(), 0);
  assert.equal(f.root.classList.contains('has-event-motion'), false);
  window.scrollY = 2000;
  f.motion.refresh();
  assert.equal(f.offset(), 0);
});

test('opening a modal freezes the card target until normal scrolling resumes', t => {
  const f = fixture(t);
  window.scrollY = 700;
  f.motion.refresh();
  const target = f.offset();
  f.root.classList.add('has-card-dialog');
  window.scrollY = 0;
  f.motion.refresh();
  f.listeners.resize();
  assert.equal(f.offset(), target);
  f.root.classList.remove('has-card-dialog');
  f.motion.refresh();
  assert.equal(f.offset(), 0);
});
