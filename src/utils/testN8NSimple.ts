import { N8N_CONFIG } from '../config/n8n.config';

/**
 * 简化的 n8n 测试 - 只测试基本对话
 */

async function testSimpleChat() {
    console.log('=== 测试 AI 对话功能 ===\n');
    
    const webhookUrl = `${N8N_CONFIG.baseUrl}/webhook/${N8N_CONFIG.agentWebhookPath}`;
    console.log('Webhook URL:', webhookUrl);
    console.log('发送消息: "你好"\n');
    
    try {
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                chatInput: '你好',
                sessionId: 'test-' + Date.now(),
            }),
        });

        console.log('响应状态:', response.status, response.statusText);
        console.log('响应头:', Object.fromEntries(response.headers.entries()));
        
        const responseText = await response.text();
        console.log('\n原始响应:');
        console.log(responseText);
        
        if (response.ok) {
            try {
                const data = JSON.parse(responseText);
                console.log('\n解析后的 JSON:');
                console.log(JSON.stringify(data, null, 2));
                
                if (data.output) {
                    console.log('\n✓ AI 回复:', data.output);
                }
            } catch (e) {
                console.log('\n⚠️  响应不是有效的 JSON');
            }
        } else {
            console.log('\n✗ 请求失败');
        }
    } catch (error) {
        console.log('\n✗ 请求出错:', error);
    }
}

testSimpleChat().catch(console.error);
