import { N8N_CONFIG } from '../config/n8n.config';

/**
 * 测试 n8n 配置
 * 运行此脚本来验证 n8n API 连接和配置是否正确
 */

// 测试 1: 检查配置
console.log('=== n8n 配置检查 ===');
console.log('Base URL:', N8N_CONFIG.baseUrl);
console.log('API Key:', N8N_CONFIG.apiKey ? '✓ 已配置' : '✗ 未配置');
console.log('Webhook Path:', N8N_CONFIG.agentWebhookPath);
console.log('Workflow ID:', N8N_CONFIG.agentWorkflowId);
console.log('');

// 测试 2: 测试健康检查
async function testHealthCheck() {
    console.log('=== 测试 n8n 健康状态 ===');
    try {
        const response = await fetch(`${N8N_CONFIG.baseUrl}/healthz`);
        if (response.ok) {
            console.log('✓ n8n 服务器运行正常');
            return true;
        } else {
            console.log('✗ n8n 服务器响应异常:', response.status);
            return false;
        }
    } catch (error) {
        console.log('✗ 无法连接到 n8n 服务器:', error);
        return false;
    }
}

// 测试 3: 测试 Webhook 调用
async function testWebhook() {
    console.log('\n=== 测试 Webhook 调用 ===');
    const webhookUrl = `${N8N_CONFIG.baseUrl}/webhook/${N8N_CONFIG.agentWebhookPath}`;
    console.log('Webhook URL:', webhookUrl);
    
    try {
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                chatInput: '你好，这是一个测试消息',
                sessionId: 'test-session-' + Date.now(),
            }),
        });

        console.log('响应状态:', response.status, response.statusText);
        
        if (response.ok) {
            const data = await response.json();
            console.log('✓ Webhook 调用成功');
            console.log('响应数据:', JSON.stringify(data, null, 2));
            return true;
        } else {
            const text = await response.text();
            console.log('✗ Webhook 调用失败');
            console.log('错误信息:', text);
            return false;
        }
    } catch (error) {
        console.log('✗ Webhook 调用出错:', error);
        return false;
    }
}

// 测试 4: 测试 API 调用（使用 API Key）
async function testAPICall() {
    console.log('\n=== 测试 API 调用（使用 API Key）===');
    const apiUrl = `${N8N_CONFIG.baseUrl}/api/v1/workflows/${N8N_CONFIG.agentWorkflowId}`;
    console.log('API URL:', apiUrl);
    
    try {
        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
                'X-N8N-API-KEY': N8N_CONFIG.apiKey,
            },
        });

        console.log('响应状态:', response.status, response.statusText);
        
        if (response.ok) {
            const data = await response.json();
            console.log('✓ API 调用成功');
            console.log('Workflow 信息:');
            console.log('  - ID:', data.id);
            console.log('  - Name:', data.name);
            console.log('  - Active:', data.active ? '✓ 已激活' : '✗ 未激活');
            return true;
        } else {
            const text = await response.text();
            console.log('✗ API 调用失败');
            console.log('错误信息:', text);
            return false;
        }
    } catch (error) {
        console.log('✗ API 调用出错:', error);
        return false;
    }
}

// 运行所有测试
export async function runAllTests() {
    console.log('开始测试 n8n 配置...\n');
    
    const healthOk = await testHealthCheck();
    
    if (!healthOk) {
        console.log('\n⚠️  n8n 服务器无法访问，请检查：');
        console.log('1. 服务器地址是否正确');
        console.log('2. 服务器是否正在运行');
        console.log('3. 网络连接是否正常');
        return;
    }
    
    const webhookOk = await testWebhook();
    const apiOk = await testAPICall();
    
    console.log('\n=== 测试总结 ===');
    console.log('健康检查:', healthOk ? '✓ 通过' : '✗ 失败');
    console.log('Webhook 调用:', webhookOk ? '✓ 通过' : '✗ 失败');
    console.log('API 调用:', apiOk ? '✓ 通过' : '✗ 失败');
    
    if (webhookOk && apiOk) {
        console.log('\n🎉 所有测试通过！n8n 配置正确。');
    } else {
        console.log('\n⚠️  部分测试失败，请检查配置。');
        
        if (!webhookOk) {
            console.log('\nWebhook 问题排查：');
            console.log('1. 检查 Workflow 是否已激活');
            console.log('2. 检查 Webhook 路径是否正确');
            console.log('3. 检查 Webhook 节点配置');
        }
        
        if (!apiOk) {
            console.log('\nAPI 问题排查：');
            console.log('1. 检查 API Key 是否正确');
            console.log('2. 检查 Workflow ID 是否正确');
            console.log('3. 检查 API 权限设置');
        }
    }
}

// 如果直接运行此文件
if (require.main === module) {
    runAllTests().catch(console.error);
}
