#!/usr/bin/env node

/**
 * Integration test script for the enhanced API routes
 * Tests the connection between API routes and Inngest functions
 */

const API_BASE = 'http://localhost:3001/api';

async function testApiIntegration() {
  console.log('🧪 Testing API Integration...\n');

  try {
    // Test 1: Health check
    console.log('1. Testing health endpoint...');
    const healthResponse = await fetch(`${API_BASE}/health`);
    const healthData = await healthResponse.json();
    console.log('✅ Health check:', healthData.status);

    // Test 2: List tasks (should return empty initially)
    console.log('\n2. Testing task listing...');
    const tasksResponse = await fetch(`${API_BASE}/tasks`);
    const tasksData = await tasksResponse.json();
    console.log('✅ Tasks listed:', tasksData.success ? 'Success' : 'Failed');
    console.log('   Task count:', tasksData.count || 0);

    // Test 3: Get task metrics
    console.log('\n3. Testing task metrics...');
    const metricsResponse = await fetch(`${API_BASE}/tasks/metrics`);
    const metricsData = await metricsResponse.json();
    console.log('✅ Metrics retrieved:', metricsData.success ? 'Success' : 'Failed');

    // Test 4: Create a test task
    console.log('\n4. Testing task creation...');
    const createTaskResponse = await fetch(`${API_BASE}/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'code-generation',
        payload: {
          prompt: 'Create a simple Hello World function in TypeScript',
          context: { language: 'typescript' },
        },
        agentId: 'test-agent-1',
        priority: 'normal',
        timeoutMs: 60000,
        maxRetries: 3,
        sessionId: 'test-session-1',
      }),
    });

    if (createTaskResponse.ok) {
      const createTaskData = await createTaskResponse.json();
      console.log('✅ Task created:', createTaskData.success ? 'Success' : 'Failed');
      
      if (createTaskData.data && createTaskData.data.id) {
        const taskId = createTaskData.data.id;
        console.log('   Task ID:', taskId);

        // Test 5: Get specific task
        console.log('\n5. Testing task retrieval...');
        const getTaskResponse = await fetch(`${API_BASE}/tasks/${taskId}`);
        const getTaskData = await getTaskResponse.json();
        console.log('✅ Task retrieved:', getTaskData.success ? 'Success' : 'Failed');

        // Test 6: Get task progress
        console.log('\n6. Testing task progress...');
        const progressResponse = await fetch(`${API_BASE}/tasks/${taskId}/progress`);
        const progressData = await progressResponse.json();
        console.log('✅ Progress retrieved:', progressData.success ? 'Success' : 'Failed');

        // Test 7: Update task
        console.log('\n7. Testing task update...');
        const updateResponse = await fetch(`${API_BASE}/tasks/${taskId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            status: 'in_progress',
            progress: 50,
          }),
        });
        const updateData = await updateResponse.json();
        console.log('✅ Task updated:', updateData.success ? 'Success' : 'Failed');

        // Test 8: Execute task action
        console.log('\n8. Testing task action...');
        const actionResponse = await fetch(`${API_BASE}/tasks/${taskId}/action`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'pause',
            reason: 'Testing pause functionality',
          }),
        });
        const actionData = await actionResponse.json();
        console.log('✅ Task action executed:', actionData.success ? 'Success' : 'Failed');

        // Test 9: Delete task
        console.log('\n9. Testing task deletion...');
        const deleteResponse = await fetch(`${API_BASE}/tasks/${taskId}`, {
          method: 'DELETE',
        });
        const deleteData = await deleteResponse.json();
        console.log('✅ Task deleted:', deleteData.success ? 'Success' : 'Failed');
      }
    } else {
      console.log('❌ Task creation failed:', createTaskResponse.status);
      const errorData = await createTaskResponse.json();
      console.log('   Error:', errorData.message || 'Unknown error');
    }

    console.log('\n🎉 Integration test completed!');

  } catch (error) {
    console.error('❌ Integration test failed:', error.message);
    console.error('   Make sure the API server is running on port 3001');
    process.exit(1);
  }
}

// WebSocket test
async function testWebSocketConnection() {
  console.log('\n🔌 Testing WebSocket connection...');
  
  try {
    const { default: WebSocket } = await import('ws');
    const ws = new WebSocket('ws://localhost:3002/ws');

    ws.on('open', () => {
      console.log('✅ WebSocket connected');
      
      // Subscribe to tasks channel
      ws.send(JSON.stringify({
        type: 'subscribe',
        channel: 'tasks',
      }));
      
      console.log('✅ Subscribed to tasks channel');
    });

    ws.on('message', (data) => {
      const message = JSON.parse(data.toString());
      console.log('📨 WebSocket message:', message.type, message.eventType || '');
    });

    ws.on('error', (error) => {
      console.log('❌ WebSocket error:', error.message);
    });

    ws.on('close', () => {
      console.log('🔌 WebSocket connection closed');
    });

    // Keep connection open for a few seconds
    setTimeout(() => {
      ws.close();
    }, 3000);

  } catch (error) {
    console.log('❌ WebSocket test failed:', error.message);
    console.log('   Make sure the WebSocket server is running on port 3002');
  }
}

// Run tests
async function runAllTests() {
  await testApiIntegration();
  await testWebSocketConnection();
}

// Run if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests();
}

export { testApiIntegration, testWebSocketConnection };
