import test from 'node:test';
import assert from 'node:assert/strict';
import { blogSchema, contactSchema, normalizeTags, parsePayload, projectSchema, slugify } from '../src/validation.js';

test('slugify creates stable slugs', () => {
  assert.equal(slugify('How Chunking Affects RAG Performance'), 'how-chunking-affects-rag-performance');
});

test('normalizeTags handles string and array', () => {
  assert.deepEqual(normalizeTags('a, b, c'), ['a', 'b', 'c']);
  assert.deepEqual(normalizeTags(['x', ' y ']), ['x', 'y']);
});

test('project schema validates required fields', () => {
  const payload = parsePayload(projectSchema, { title: 'Demo Project', category: 'rag' });
  assert.equal(payload.title, 'Demo Project');
});

test('blog schema validates required fields', () => {
  const payload = parsePayload(blogSchema, { title: 'Demo Blog', content: 'Body' });
  assert.equal(payload.title, 'Demo Blog');
});

test('contact schema validates email', () => {
  assert.throws(() => parsePayload(contactSchema, { name: 'A', email: 'x', subject: 's', message: 'm' }));
});
