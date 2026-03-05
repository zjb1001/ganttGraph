/**
 * 制动产品项目初始化
 * 创建完整的制动系统开发项目，作为Web应用默认展示
 */

import { db } from './index';

export async function initializeBrakingProject() {
  console.log('🚗 初始化制动产品项目...');
  
  // 检查是否已存在制动项目
  const existingProjects = await db.projects.toArray();
  const hasBrakingProject = existingProjects.some((p: { name: string }) => 
    p.name.includes('制动') || p.name.includes('刹车') || p.name.includes('Braking')
  );
  
  if (hasBrakingProject) {
    console.log('制动项目已存在，跳过初始化');
    return existingProjects.find((p: { name: string }) => p.name.includes('制动'));
  }
  
  // 创建项目
  const projectId = `braking_${Date.now()}`;
  const now = new Date();
  
  await db.projects.add({
    id: projectId,
    name: '🚗 底盘制动系统开发 (ASIL-D)',
    description: '新能源车型底盘制动系统开发，符合ASIL-D功能安全标准，包含ABS/EBD/ESC/TCS等核心功能',
    bucketIds: [],
    createdAt: now,
    updatedAt: now
  });
  
  // 创建分组
  const buckets = [
    { id: `bucket_req_${projectId}`, name: '📋 需求阶段', color: '#3b82f6', order: 1, bucketType: 'task' as const },
    { id: `bucket_design_${projectId}`, name: '🏗️ 系统设计', color: '#8b5cf6', order: 2, bucketType: 'task' as const },
    { id: `bucket_hw_${projectId}`, name: '🔧 硬件开发', color: '#f59e0b', order: 3, bucketType: 'task' as const },
    { id: `bucket_mcal_${projectId}`, name: '⚙️ MCAL开发', color: '#10b981', order: 4, bucketType: 'task' as const },
    { id: `bucket_algo_${projectId}`, name: '🧮 算法开发', color: '#ec4899', order: 5, bucketType: 'task' as const },
    { id: `bucket_test_${projectId}`, name: '🔍 测试验证', color: '#ef4444', order: 6, bucketType: 'task' as const },
    { id: `bucket_milestone_${projectId}`, name: '🎯 项目里程碑', color: '#d83b01', order: 7, bucketType: 'milestone' as const }
  ];
  
  for (const bucket of buckets) {
    await db.buckets.add(bucket);
  }
  
  // 创建任务
  type TaskStatus = 'NotStarted' | 'InProgress' | 'Completed';
  
  const tasks: Array<{
    title: string;
    days: number;
    bucketId: string;
    priority: string;
    progress: number;
    status: TaskStatus;
    isMilestone?: boolean;
  }> = [
    // 需求阶段
    {
      title: '制动系统需求分析',
      days: 10,
      bucketId: buckets[0].id,
      priority: 'High',
      progress: 100,
      status: 'Completed'
    },
    {
      title: '功能安全概念(HARA)',
      days: 15,
      bucketId: buckets[0].id,
      priority: 'High',
      progress: 80,
      status: 'InProgress'
    },
    {
      title: '网络安全威胁分析(TARA)',
      days: 10,
      bucketId: buckets[0].id,
      priority: 'Medium',
      progress: 60,
      status: 'InProgress'
    },
    
    // 系统设计
    {
      title: '制动系统架构设计',
      days: 15,
      bucketId: buckets[1].id,
      priority: 'High',
      progress: 30,
      status: 'InProgress'
    },
    {
      title: '液压系统方案设计',
      days: 12,
      bucketId: buckets[1].id,
      priority: 'High',
      progress: 0,
      status: 'NotStarted'
    },
    {
      title: '电机控制方案设计',
      days: 12,
      bucketId: buckets[1].id,
      priority: 'High',
      progress: 0,
      status: 'NotStarted'
    },
    {
      title: '传感器接口设计',
      days: 10,
      bucketId: buckets[1].id,
      priority: 'Medium',
      progress: 0,
      status: 'NotStarted'
    },
    {
      title: 'DFMEA分析',
      days: 10,
      bucketId: buckets[1].id,
      priority: 'High',
      progress: 0,
      status: 'NotStarted'
    },
    
    // 硬件开发
    {
      title: '制动主缸开发',
      days: 30,
      bucketId: buckets[2].id,
      priority: 'High',
      progress: 0,
      status: 'NotStarted'
    },
    {
      title: 'ESC控制器硬件开发',
      days: 35,
      bucketId: buckets[2].id,
      priority: 'High',
      progress: 0,
      status: 'NotStarted'
    },
    {
      title: '轮速传感器开发',
      days: 20,
      bucketId: buckets[2].id,
      priority: 'Medium',
      progress: 0,
      status: 'NotStarted'
    },
    {
      title: '液压阀体开发',
      days: 25,
      bucketId: buckets[2].id,
      priority: 'High',
      progress: 0,
      status: 'NotStarted'
    },
    {
      title: 'PCB设计与验证',
      days: 25,
      bucketId: buckets[2].id,
      priority: 'High',
      progress: 0,
      status: 'NotStarted'
    },
    
    // MCAL开发
    {
      title: 'ADC配置(制动压力采集)',
      days: 7,
      bucketId: buckets[3].id,
      priority: 'High',
      progress: 0,
      status: 'NotStarted'
    },
    {
      title: 'PWM配置(电机控制)',
      days: 10,
      bucketId: buckets[3].id,
      priority: 'High',
      progress: 0,
      status: 'NotStarted'
    },
    {
      title: 'ICU配置(轮速采集)',
      days: 8,
      bucketId: buckets[3].id,
      priority: 'High',
      progress: 0,
      status: 'NotStarted'
    },
    {
      title: 'CAN配置(底盘网络)',
      days: 10,
      bucketId: buckets[3].id,
      priority: 'High',
      progress: 0,
      status: 'NotStarted'
    },
    
    // 算法开发
    {
      title: 'ABS算法开发',
      days: 20,
      bucketId: buckets[4].id,
      priority: 'High',
      progress: 0,
      status: 'NotStarted'
    },
    {
      title: 'EBD算法开发',
      days: 15,
      bucketId: buckets[4].id,
      priority: 'High',
      progress: 0,
      status: 'NotStarted'
    },
    {
      title: 'ESC算法开发',
      days: 25,
      bucketId: buckets[4].id,
      priority: 'High',
      progress: 0,
      status: 'NotStarted'
    },
    {
      title: 'TCS牵引力控制',
      days: 20,
      bucketId: buckets[4].id,
      priority: 'Medium',
      progress: 0,
      status: 'NotStarted'
    },
    {
      title: 'HDC陡坡缓降',
      days: 15,
      bucketId: buckets[4].id,
      priority: 'Medium',
      progress: 0,
      status: 'NotStarted'
    },
    {
      title: 'AutoHold自动驻车',
      days: 18,
      bucketId: buckets[4].id,
      priority: 'Medium',
      progress: 0,
      status: 'NotStarted'
    },
    
    // 测试验证
    {
      title: 'HIL仿真测试',
      days: 25,
      bucketId: buckets[5].id,
      priority: 'High',
      progress: 0,
      status: 'NotStarted'
    },
    {
      title: '实车制动测试',
      days: 30,
      bucketId: buckets[5].id,
      priority: 'High',
      progress: 0,
      status: 'NotStarted'
    },
    {
      title: '极端工况测试',
      days: 20,
      bucketId: buckets[5].id,
      priority: 'High',
      progress: 0,
      status: 'NotStarted'
    },
    {
      title: 'EMC电磁兼容测试',
      days: 15,
      bucketId: buckets[5].id,
      priority: 'High',
      progress: 0,
      status: 'NotStarted'
    },
    {
      title: '功能安全验证',
      days: 20,
      bucketId: buckets[5].id,
      priority: 'Critical',
      progress: 0,
      status: 'NotStarted'
    },
    
    // 里程碑
    {
      title: '需求冻结',
      days: 0,
      bucketId: buckets[6].id,
      priority: 'High',
      progress: 100,
      status: 'Completed',
      isMilestone: true
    },
    {
      title: '设计评审',
      days: 0,
      bucketId: buckets[6].id,
      priority: 'High',
      progress: 0,
      status: 'NotStarted',
      isMilestone: true
    },
    {
      title: 'ESC功能完成',
      days: 0,
      bucketId: buckets[6].id,
      priority: 'High',
      progress: 0,
      status: 'NotStarted',
      isMilestone: true
    },
    {
      title: '系统测试完成',
      days: 0,
      bucketId: buckets[6].id,
      priority: 'High',
      progress: 0,
      status: 'NotStarted',
      isMilestone: true
    },
    {
      title: 'SOP量产',
      days: 0,
      bucketId: buckets[6].id,
      priority: 'Critical',
      progress: 0,
      status: 'NotStarted',
      isMilestone: true
    }
  ];
  
  // 计算任务日期
  let currentDate = new Date(now);
  let taskOrder = 1;
  
  for (const task of tasks) {
    const startDate = new Date(currentDate);
    const endDate = new Date(currentDate.getTime() + task.days * 24 * 60 * 60 * 1000);
    
    await db.tasks.add({
      id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      projectId,
      title: task.title,
      description: '',
      status: task.status,
      priority: task.priority as any,
      taskType: task.isMilestone ? 'milestone' : 'task',
      startDateTime: startDate,
      dueDateTime: endDate,
      completedPercent: task.progress,
      bucketId: task.bucketId,
      assigneeIds: [],
      labelIds: [],
      order: taskOrder++,
      createdAt: now,
      updatedAt: now
    });
    
    if (!task.isMilestone) {
      currentDate = new Date(endDate.getTime() + 2 * 24 * 60 * 60 * 1000); // 2天间隔
    }
  }
  
  // 创建一些延期风险（用于演示Level 6功能）
  // 让HARA分析和ESC算法开发看起来有延期风险
  const allTasks = await db.tasks.where('projectId').equals(projectId).toArray();
  
  const haraTask = allTasks.find((t: { title: string }) => t.title.includes('HARA'));
  const escTask = allTasks.find((t: { title: string }) => t.title.includes('ESC算法'));
  
  if (haraTask) {
    await db.tasks.update(haraTask.id, {
      completedPercent: 45, // 应该完成80%，但只有45%
      status: 'InProgress'
    });
  }
  
  if (escTask && haraTask) {
    await db.tasks.update(escTask.id, {
      // ESC算法依赖HARA，设置依赖关系
      dependencyTaskIds: [haraTask.id],
      dependencies: [{ taskId: haraTask.id, lagDays: 2 }]
    });
  }
  
  console.log(`✅ 制动项目创建完成: ${tasks.length} 个任务`);
  console.log(`   项目ID: ${projectId}`);
  console.log(`   已模拟延期风险用于演示`);
  
  return { id: projectId, name: '底盘制动系统开发' };
}

// 快速创建制动项目的函数
export async function createQuickBrakingProject() {
  return initializeBrakingProject();
}
