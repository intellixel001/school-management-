import test from 'node:test'
import assert from 'node:assert/strict'
import { credentialsMatch, createSession, verifySession, allowAttempt, SESSION_SECONDS } from '../lib/admin/security.ts'

// Isolated test process; never reads or prints .env.local.
process.env.ADMIN_USERNAME = 'test-admin'
process.env.ADMIN_PASSWORD = 'test-only-random-long-password'

test('credential comparison rejects incorrect or unconfigured credentials', () => {
  assert.equal(credentialsMatch('test-admin', 'test-only-random-long-password'), true)
  assert.equal(credentialsMatch('someone-else', 'test-only-random-long-password'), false)
  assert.equal(credentialsMatch('test-admin', 'wrong'), false)
  const password = process.env.ADMIN_PASSWORD
  delete process.env.ADMIN_PASSWORD
  assert.equal(credentialsMatch('test-admin', ''), false)
  process.env.ADMIN_PASSWORD = password
})
test('sessions reject forgery, expiry and credential rotation', () => {
  const now = Date.now(); const token = createSession(now)
  assert.equal(verifySession(token, now), true)
  assert.equal(verifySession(`${token}x`, now), false)
  assert.equal(verifySession(token, now + SESSION_SECONDS * 1000), false)
  assert.equal(verifySession('malformed'), false)
  assert.equal(verifySession(`${token}.extra`), false)
  const old = process.env.ADMIN_PASSWORD
  process.env.ADMIN_PASSWORD = 'rotated'
  assert.equal(verifySession(token), false)
  process.env.ADMIN_PASSWORD = old
})
test('per-instance throttle blocks repeated attempts and expires', () => {
  for (let i = 0; i < 8; i++) assert.equal(allowAttempt('test', 1000), true)
  assert.equal(allowAttempt('test', 1000), false)
  assert.equal(allowAttempt('test', 1000 + 15 * 60 * 1000), true)
})
