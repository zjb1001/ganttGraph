#!/usr/bin/env python3
"""快速测试智谱API连接"""
import os
from dotenv import load_dotenv

load_dotenv()

print("🚀 智谱API快速测试")
print("=" * 50)

api_key = os.getenv('LLM_API_KEY')
print(f"API Key: {api_key[:20]}...{api_key[-10:]}")
print(f"Provider: {os.getenv('LLM_PROVIDER')}")
print(f"Base URL: {os.getenv('LLM_BASE_URL')}")
print(f"Model: {os.getenv('LLM_MODEL')}")

print("\n正在测试API连接...")
try:
    from openai import OpenAI
    client = OpenAI(
        api_key=api_key,
        base_url=os.getenv('LLM_BASE_URL')
    )
    
    response = client.chat.completions.create(
        model=os.getenv('LLM_MODEL'),
        messages=[
            {"role": "system", "content": "你是一个项目管理助手"},
            {"role": "user", "content": "请用一句话介绍甘特图的作用"}
        ],
        temperature=0.3,
        max_tokens=100
    )
    
    print("\n✅ API连接成功!")
    print(f"🤖 AI回复: {response.choices[0].message.content}")
    print(f"📊 使用token: {response.usage.total_tokens}")
    
except Exception as e:
    print(f"\n❌ 错误: {e}")
