import test from 'node:test'
import assert from 'node:assert/strict'
import { PREVIEW_STUDENTS, updatePreviewStudent } from '../lib/admin/preview.ts'

test('approval sets placement and enables only the local record', () => {
  const original = PREVIEW_STUDENTS[0]
  const result = updatePreviewStudent(original, 'approve', 'entry-3')
  assert.equal(result.status, 'active')
  assert.equal(result.level, 'entry-3')
  assert.equal(result.accessEnabled, true)
  assert.equal(original.status, 'pending')
  assert.throws(() => updatePreviewStudent(result, 'approve', 'entry-3'))
})
test('preview rejection retains the account and blocks access', () => {
  const result = updatePreviewStudent(PREVIEW_STUDENTS[0], 'reject')
  assert.equal(result.status, 'rejected')
  assert.equal(result.id, PREVIEW_STUDENTS[0].id)
  assert.equal(result.accessEnabled, false)
})
test('access control does not overwrite registration status', () => {
  const active = PREVIEW_STUDENTS[2]
  const suspended = updatePreviewStudent(active, 'suspend')
  assert.equal(suspended.status, 'active')
  assert.equal(suspended.accessEnabled, false)
  assert.equal(updatePreviewStudent(suspended, 'reactivate').accessEnabled, true)
  assert.throws(() => updatePreviewStudent(PREVIEW_STUDENTS[0], 'reactivate'))
})
test('invalid levels are rejected and recovery does not manufacture credentials', () => {
  assert.throws(() => updatePreviewStudent(PREVIEW_STUDENTS[0], 'approve', 'invalid'))
  const active = PREVIEW_STUDENTS[2]
  assert.equal(updatePreviewStudent(active, 'recovery'), active)
  assert.equal('pin' in active, false)
})
