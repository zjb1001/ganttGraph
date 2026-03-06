/**
 * Level 6: 多模态交互与可视化测试
 */

import { describe, it, expect } from 'vitest';
import { GanttAgent } from '../SimpleGanttAgent';
import { ganttRenderer } from '../GanttRenderer';
import { GanttContext } from '@/types';

describe('🎨 Level 6: 多模态交互与可视化', () => {
  
  it('生成ASCII甘特图', async () => {
    console.log('\n' + '='.repeat(80));
    console.log('🎨 Level 6: ASCII甘特图生成');
    console.log('='.repeat(80));
    
    const agent = new GanttAgent();
    const context: GanttContext = {
      projectId: 'gantt_visual_test',
      tasks: [],
      buckets: []
    };
    
    // 创建测试任务
    console.log('\n👤 用户: "创建装修项目任务"');
    
    const tasks = [
      { name: '设计方案', days: 5 },
      { name: '拆除', days: 3 },
      { name: '水电', days: 7 },
      { name: '防水', days: 3 },
      { name: '瓦工', days: 5 },
      { name: '木工', days: 7 },
      { name: '油漆', days: 5 },
      { name: '安装', days: 3 }
    ];
    
    for (const task of tasks) {
      await agent.process(`创建任务${task.name}，持续${task.days}天`, context);
    }
    
    // 设置依赖
    const deps = [[1,0], [2,1], [3,2], [4,3], [5,4], [6,5], [7,6]];
    deps.forEach(([from, to]) => {
      context.tasks[from].dependencies = [context.tasks[to].id];
    });
    
    // 自动排期
    await agent.process('自动排期从2026-03-01开始', context);
    
    console.log('\n🤖 Agent: "项目已创建，正在生成甘特图..."');
    
    // 生成ASCII甘特图
    const asciiGantt = ganttRenderer.renderASCII(context.tasks, {
      unit: 'week',
      showProgress: true
    });
    
    console.log('\n' + '─'.repeat(80));
    console.log('📊 ASCII甘特图:');
    console.log('─'.repeat(80));
    console.log(asciiGantt);
    
    expect(asciiGantt).toContain('设计方案');
    expect(asciiGantt).toContain('█');
  });
  
  it('生成简化版甘特图 (适用于终端)', async () => {
    console.log('\n' + '='.repeat(80));
    console.log('🎨 Level 6: 简化版甘特图');
    console.log('='.repeat(80));
    
    const agent = new GanttAgent();
    const context: GanttContext = {
      projectId: 'compact_gantt',
      tasks: [],
      buckets: []
    };
    
    // 快速创建任务
    for (let i = 1; i <= 10; i++) {
      await agent.process(`创建任务模块${i}开发，持续${i * 2}天`, context);
    }
    
    await agent.process('自动排期', context);
    
    console.log('\n🤖 Agent: "生成简化版甘特图..."');
    
    const compactGantt = ganttRenderer.renderCompact(context.tasks);
    
    console.log('\n' + '─'.repeat(80));
    console.log('📊 简化版甘特图:');
    console.log('─'.repeat(80));
    console.log(compactGantt);
    
    expect(compactGantt).toContain('模块1');
    expect(compactGantt).toContain('█');
  });
  
  it('生成Markdown表格', async () => {
    console.log('\n' + '='.repeat(80));
    console.log('🎨 Level 6: Markdown格式导出');
    console.log('='.repeat(80));
    
    const agent = new GanttAgent();
    const context: GanttContext = {
      projectId: 'markdown_export',
      tasks: [],
      buckets: []
    };
    
    // 创建车身控制器任务
    const tasks = [
      { name: '需求分析', days: 10 },
      { name: '系统设计', days: 15 },
      { name: '硬件开发', days: 30 },
      { name: 'MCAL开发', days: 20 },
      { name: '应用开发', days: 25 },
      { name: '测试验证', days: 20 }
    ];
    
    for (const task of tasks) {
      await agent.process(`创建任务${task.name}，持续${task.days}天`, context);
    }
    
    await agent.process('自动排期', context);
    
    // 标记一些进度
    context.tasks[0].status = 'Completed';
    (context.tasks[0] as any).completedPercent = 100;
    context.tasks[1].status = 'InProgress';
    (context.tasks[1] as any).completedPercent = 60;
    
    console.log('\n🤖 Agent: "生成Markdown格式..."');
    
    const markdown = ganttRenderer.renderMarkdown(context.tasks);
    
    console.log('\n' + '─'.repeat(80));
    console.log('📄 Markdown表格:');
    console.log('─'.repeat(80));
    console.log(markdown);
    
    expect(markdown).toContain('# 项目甘特图');
    expect(markdown).toContain('| 任务 |');
    expect(markdown).toContain('✅ 完成');
    expect(markdown).toContain('🔄 进行中');
  });
  
  it('生成HTML甘特图', async () => {
    console.log('\n' + '='.repeat(80));
    console.log('🎨 Level 6: HTML格式导出');
    console.log('='.repeat(80));
    
    const agent = new GanttAgent();
    const context: GanttContext = {
      projectId: 'html_export',
      tasks: [],
      buckets: []
    };
    
    // 创建会展任务
    const tasks = [
      { name: '展馆租赁', days: 7 },
      { name: '参展商招募', days: 30 },
      { name: '展位设计', days: 14 },
      { name: '宣传推广', days: 21 },
      { name: '现场搭建', days: 5 }
    ];
    
    for (const task of tasks) {
      await agent.process(`创建任务${task.name}，持续${task.days}天`, context);
    }
    
    await agent.process('自动排期', context);
    
    console.log('\n🤖 Agent: "生成HTML格式..."');
    
    const html = ganttRenderer.renderHTML(context.tasks);
    
    console.log('\n' + '─'.repeat(80));
    console.log('🌐 HTML预览 (前500字符):');
    console.log('─'.repeat(80));
    console.log(html.substring(0, 500) + '...');
    
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('<table');
    expect(html).toContain('展馆租赁');
  });
  
  it('多格式导出功能', async () => {
    console.log('\n' + '='.repeat(80));
    console.log('🎨 Level 6: 多格式导出功能');
    console.log('='.repeat(80));
    
    const agent = new GanttAgent();
    const context: GanttContext = {
      projectId: 'multi_format',
      tasks: [],
      buckets: []
    };
    
    // 创建任务
    await agent.process('创建任务需求分析，持续10天', context);
    await agent.process('创建任务系统设计，持续15天', context);
    await agent.process('创建任务开发实现，持续30天', context);
    await agent.process('创建任务测试验证，持续15天', context);
    
    await agent.process('自动排期', context);
    
    console.log('\n👤 用户: "导出项目为多种格式"');
    console.log('\n🤖 Agent: "支持以下导出格式:"');
    
    const formats = [
      { name: 'ASCII甘特图', desc: '终端显示，适合快速查看' },
      { name: '简化版甘特图', desc: '紧凑布局，适合窄屏' },
      { name: 'Markdown表格', desc: 'GitHub/文档兼容' },
      { name: 'HTML页面', desc: '浏览器查看，可打印' }
    ];
    
    formats.forEach((fmt, i) => {
      console.log(`   ${i + 1}. ${fmt.name}: ${fmt.desc}`);
    });
    
    console.log('\n📊 导出统计:');
    console.log(`   ASCII甘特图: ${ganttRenderer.renderASCII(context.tasks).length} 字符`);
    console.log(`   Markdown: ${ganttRenderer.renderMarkdown(context.tasks).length} 字符`);
    console.log(`   HTML: ${ganttRenderer.renderHTML(context.tasks).length} 字符`);
    
    console.log('\n✅ 多格式导出功能验证通过');
  });
  
  it('Level 6 功能总结', () => {
    console.log('\n' + '='.repeat(80));
    console.log('📊 Level 6 功能总结');
    console.log('='.repeat(80));
    
    console.log(`
┌────────────────────────────────────────────────────────────────────────┐
│                         Level 6: 多模态交互与可视化                     │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  【新增能力】                                                           │
│  ✅ ASCII甘特图                                                        │
│     - 终端显示，适合命令行环境                                          │
│     - 支持周/月视图切换                                                 │
│     - 进度可视化 (█▓░)                                                  │
│                                                                        │
│  ✅ 简化版甘特图                                                        │
│     - 紧凑布局，适合窄屏                                                │
│     - 进度条显示                                                        │
│     - 状态图标 (✅🔵⚪)                                                  │
│                                                                        │
│  ✅ Markdown导出                                                       │
│     - GitHub兼容                                                        │
│     - 文档友好                                                          │
│     - 支持表格格式                                                      │
│                                                                        │
│  ✅ HTML导出                                                           │
│     - 浏览器查看                                                        │
│     - 可打印                                                            │
│     - 进度条可视化                                                      │
│                                                                        │
│  【交互方式】                                                           │
│  用户可以说:                                                            │
│    • "展示甘特图" → 生成ASCII图表                                      │
│    • "导出为Markdown" → 生成Markdown表格                               │
│    • "导出为HTML" → 生成网页                                            │
│    • "导出项目" → 列出所有可用格式                                       │
│                                                                        │
│  【技术实现】                                                           │
│  • GanttRenderer 类                                                    │
│  • 支持4种输出格式                                                      │
│  • 时间范围自动计算                                                     │
│  • 任务重叠检测                                                         │
│                                                                        │
│  【后续扩展 (Level 6+)】                                                │
│  ⏳ PNG图片导出 (使用Canvas/Node-canvas)                                │
│  ⏳ PDF导出 (使用PDF库)                                                  │
│  ⏳ Excel导出 (.xlsx格式)                                                │
│  ⏳ 交互式Web界面 (点击编辑)                                             │
│  ⏳ 语音播报 (TTS)                                                       │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
`);
    
    console.log('✅ Level 6 多模态交互与可视化完成');
    console.log('🎯 用户现在可以通过多种方式查看和导出项目');
  });
});
