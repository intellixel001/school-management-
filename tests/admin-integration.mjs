// Checks only local Next.js authentication. Never contacts Railway.
// Start the local app first. Run: node --env-file=.env.local tests/admin-integration.mjs
import assert from 'node:assert/strict'
const origin = 'http://localhost:3005'
assert.ok(process.env.ADMIN_USERNAME && process.env.ADMIN_PASSWORD, 'Local admin credentials required')
let cookie = ''
async function request(path, body, extra = {}) {
  return fetch(origin + path, { redirect:'manual', method:body === undefined?'GET':'POST', headers:{ ...(cookie?{Cookie:cookie}:{}), ...(body===undefined?{}:{Origin:origin,'Content-Type':'application/json'}), ...extra }, ...(body===undefined?{}:{body:JSON.stringify(body)}) })
}
assert.equal((await request('/admin/users')).status,307)
assert.equal((await request('/admin/api/session')).status,401)
assert.equal((await request('/admin/api/login',{username:'invalid-test',password:'invalid-test'})).status,401)
const login=await request('/admin/api/login',{username:process.env.ADMIN_USERNAME,password:process.env.ADMIN_PASSWORD})
assert.equal(login.status,200)
const header=login.headers.getSetCookie().find(c=>c.startsWith('ec-admin-session='))
assert.match(header,/HttpOnly/i); assert.match(header,/SameSite=strict/i)
cookie=header.split(';')[0]
try {
  assert.equal((await request('/admin')).status,200)
  for (const path of ['', '/students', '/students/preview-student-1', '/students/preview-student-1/access', '/teachers', '/teachers/preview-teacher-1', '/teachers/preview-teacher-1/permissions', '/teachers/preview-teacher-1/assignments', '/teachers/preview-teacher-1/access', '/teachers/preview-teacher-1/activity', '/settings', '/kiosks', '/activity']) {
    const response = await request('/admin/colleges/nelson'+path)
    assert.equal(response.status,200,path)
    const html=await response.text()
    assert.ok(html.includes('Nelson College London'),path)
    assert.ok(!html.includes('Connect a teacher account'),path)
  }
  assert.equal((await request('/admin/colleges/unknown')).status,404)
  for (const path of ['users','teachers','kiosks','approvals']) assert.equal((await request('/admin/'+path)).status,307)
  assert.equal((await request('/admin/api/session')).status,200)
  assert.equal((await request('/admin/api/connection',{email:'unused@example.test',password:'unused'})).status,404)
  assert.equal((await request('/admin/api/students')).status,404)
  assert.equal((await request('/admin/api/students/unused/approve',{confirmed:true})).status,404)
  assert.equal((await request('/admin/api/logout',{}, {Origin:'https://foreign.example'})).status,403)
  assert.equal((await request('/admin/connection')).status,307)
} finally {
  const logout=await request('/admin/api/logout',{})
  assert.equal(logout.status,200)
  assert.ok(logout.headers.getSetCookie().some(c=>c.includes('ec-admin-session=') && c.includes('Max-Age=0')))
}
cookie=''
assert.equal((await request('/admin/api/session')).status,401)
console.log('PASS: local login, page/API guards, cookie flags, origin protection, removed backend routes, legacy redirect and logout. No external requests.')
