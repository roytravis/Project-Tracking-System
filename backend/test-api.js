// Quick API integration test
const http = require('http');

function request(method, path, body) {
    return new Promise((resolve, reject) => {
        const opts = {
            hostname: 'localhost',
            port: 3001,
            path,
            method,
            headers: { 'Content-Type': 'application/json' },
        };
        const req = http.request(opts, (res) => {
            let data = '';
            res.on('data', (c) => (data += c));
            res.on('end', () => {
                try {
                    resolve({ status: res.statusCode, body: JSON.parse(data) });
                } catch {
                    resolve({ status: res.statusCode, body: data });
                }
            });
        });
        req.on('error', reject);
        if (body) req.write(JSON.stringify(body));
        req.end();
    });
}

async function main() {
    console.log('=== API Integration Tests ===\n');

    // Test 1: Create project
    const r1 = await request('POST', '/api/projects', { name: 'Test Project', clientName: 'QA Client' });
    console.log(`1. CREATE: ${r1.status === 201 ? '✅ PASS' : '❌ FAIL'} (status=${r1.status})`);
    const testId = r1.body.data.id;

    // Test 2: Get project by ID
    const r2 = await request('GET', `/api/projects/${testId}`);
    console.log(`2. GET BY ID: ${r2.status === 200 && r2.body.data.name === 'Test Project' ? '✅ PASS' : '❌ FAIL'}`);

    // Test 3: Search
    const r3 = await request('GET', '/api/projects?search=Banking');
    console.log(`3. SEARCH: ${r3.status === 200 && r3.body.data.length >= 1 ? '✅ PASS' : '❌ FAIL'} (found ${r3.body.data.length})`);

    // Test 4: Filter by status
    const r4 = await request('GET', '/api/projects?status=completed');
    const allCompleted = r4.body.data.every(p => p.status === 'completed');
    console.log(`4. FILTER: ${allCompleted ? '✅ PASS' : '❌ FAIL'} (${r4.body.data.length} completed)`);

    // Test 5: Valid status transition (active → on_hold)
    const r5 = await request('PATCH', `/api/projects/${testId}/status`, { status: 'on_hold' });
    console.log(`5. VALID TRANSITION (active→on_hold): ${r5.status === 200 ? '✅ PASS' : '❌ FAIL'}`);

    // Test 6: Invalid status transition (on_hold → active should be valid per spec)
    const r6 = await request('PATCH', `/api/projects/${testId}/status`, { status: 'active' });
    console.log(`6. VALID TRANSITION (on_hold→active): ${r6.status === 200 ? '✅ PASS' : '❌ FAIL'}`);

    // Test 7: Valid transition to completed (terminal)
    const r7 = await request('PATCH', `/api/projects/${testId}/status`, { status: 'completed' });
    console.log(`7. TRANSITION TO TERMINAL (active→completed): ${r7.status === 200 ? '✅ PASS' : '❌ FAIL'}`);

    // Test 8: Try transition from terminal state (completed → active should fail)
    const r8 = await request('PATCH', `/api/projects/${testId}/status`, { status: 'active' });
    console.log(`8. TERMINAL STATE BLOCKED (completed→active): ${r8.status === 400 ? '✅ PASS' : '❌ FAIL'} (status=${r8.status})`);

    // Test 9: on_hold → completed should be allowed per spec
    const r9a = await request('POST', '/api/projects', { name: 'Transition Test', clientName: 'Test Corp' });
    const transId = r9a.body.data.id;
    await request('PATCH', `/api/projects/${transId}/status`, { status: 'on_hold' });
    const r9 = await request('PATCH', `/api/projects/${transId}/status`, { status: 'completed' });
    console.log(`9. TRANSITION (on_hold→completed): ${r9.status === 200 ? '✅ PASS' : '❌ FAIL'}`);

    // Test 10: Update project fields
    const r10 = await request('PUT', `/api/projects/${testId}`, { name: 'Updated Name' });
    console.log(`10. UPDATE FIELDS: ${r10.status === 200 && r10.body.data.name === 'Updated Name' ? '✅ PASS' : '❌ FAIL'}`);

    // Test 11: endDate < startDate should fail
    const r11 = await request('POST', '/api/projects', {
        name: 'Date Validation',
        clientName: 'Test',
        startDate: '2026-06-01',
        endDate: '2026-01-01',
    });
    console.log(`11. ENDDATE VALIDATION: ${r11.status === 400 ? '✅ PASS' : '❌ FAIL'} (status=${r11.status})`);

    // Test 12: Soft delete
    const r12 = await request('DELETE', `/api/projects/${testId}`);
    console.log(`12. SOFT DELETE: ${r12.status === 200 ? '✅ PASS' : '❌ FAIL'}`);

    // Test 13: Confirm deleted project not found
    const r13 = await request('GET', `/api/projects/${testId}`);
    console.log(`13. DELETED NOT FOUND: ${r13.status === 404 ? '✅ PASS' : '❌ FAIL'}`);

    // Test 14: Validation error (missing required fields)
    const r14 = await request('POST', '/api/projects', { name: '' });
    console.log(`14. VALIDATION ERROR: ${r14.status === 400 ? '✅ PASS' : '❌ FAIL'}`);

    // Cleanup transition test project
    await request('DELETE', `/api/projects/${transId}`);

    console.log('\n=== Done ===');
}

main().catch(console.error);
