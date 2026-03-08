/**
 * MKC2制动器项目初始化
 * 高端乘用车制动系统开发 (线控制动 + 电子助力)
 */

import { db } from './index';
import type { TaskStatus } from '@/types';

export async function initializeMKC2Project() {
  console.log('🔧 初始化MKC2制动器项目...');
  
  // 检查是否已存在MKC2项目
  const existingProjects = await db.projects.toArray();
  const hasMKC2Project = existingProjects.some((p: { name: string }) => 
    p.name.includes('MKC2') || p.name.includes('mkc2')
  );
  
  if (hasMKC2Project) {
    console.log('MKC2项目已存在，跳过初始化');
    return existingProjects.find((p: { name: string }) => p.name.includes('MKC2'));
  }
  
  // 创建项目
  const projectId = `mkc2_${Date.now()}`;
  const now = new Date();
  const eighteenMonthsLater = new Date(now.getTime() + 18 * 30 * 24 * 60 * 60 * 1000);
  
  await db.projects.add({
    id: projectId,
    name: '🔧 MKC2线控制动系统开发 (One-Box)',
    description: '下一代高端乘用车线控制动系统(One-Box架构)，集成ESC/eBooster/EPB，支持L3/L4自动驾驶，符合ASIL-D功能安全标准',
    bucketIds: [],
    createdAt: now,
    updatedAt: now
  });
  
  // 创建分组 - 按制动系统开发阶段组织
  const buckets = [
    // 系统需求
    { id: `bucket_req_${projectId}`, name: '📋 系统需求', color: '#8b5cf6', order: 1, bucketType: 'task' as const },
    // 系统设计
    { id: `bucket_design_${projectId}`, name: '🏗️ 系统设计', color: '#3b82f6', order: 2, bucketType: 'task' as const },
    // 硬件开发
    { id: `bucket_hw_${projectId}`, name: '🔩 硬件开发', color: '#f59e0b', order: 3, bucketType: 'task' as const },
    // 软件开发
    { id: `bucket_sw_${projectId}`, name: '💻 软件开发', color: '#10b981', order: 4, bucketType: 'task' as const },
    // 标定匹配
    { id: `bucket_cali_${projectId}`, name: '⚖️ 标定匹配', color: '#ec4899', order: 5, bucketType: 'task' as const },
    // 测试验证
    { id: `bucket_test_${projectId}`, name: '🔍 测试验证', color: '#ef4444', order: 6, bucketType: 'task' as const },
    // 量产准备
    { id: `bucket_prod_${projectId}`, name: '🏭 量产准备', color: '#22c55e', order: 7, bucketType: 'task' as const },
    // 里程碑
    { id: `bucket_milestone_${projectId}`, name: '🎯 关键里程碑', color: '#d83b01', order: 8, bucketType: 'milestone' as const }
  ];
  
  for (const bucket of buckets) {
    await db.buckets.add(bucket);
  }
  
  // 创建任务 - MKC2线控制动系统完整开发流程
  const tasks = [
    // ========== 系统需求 ==========
    { title: '客户需求收集与分析', days: 20, bucketId: buckets[0].id, priority: 'High', progress: 100, status: 'Completed' },
    { title: '竞品制动系统对标分析(Benchmark)', days: 30, bucketId: buckets[0].id, priority: 'High', progress: 100, status: 'Completed' },
    { title: '系统需求规格书(SRS)', days: 25, bucketId: buckets[0].id, priority: 'Critical', progress: 90, status: 'InProgress' },
    { title: '功能安全需求(HARA分析)', days: 30, bucketId: buckets[0].id, priority: 'Critical', progress: 80, status: 'InProgress' },
    { title: '网络安全需求(TARA分析)', days: 20, bucketId: buckets[0].id, priority: 'High', progress: 60, status: 'InProgress' },
    { title: 'DFMEA潜在失效分析', days: 25, bucketId: buckets[0].id, priority: 'Critical', progress: 40, status: 'InProgress' },
    
    // ========== 系统设计 ==========
    { title: '系统架构设计(One-Box方案)', days: 30, bucketId: buckets[1].id, priority: 'Critical', progress: 20, status: 'InProgress' },
    { title: '液压系统方案设计', days: 25, bucketId: buckets[1].id, priority: 'Critical', progress: 0, status: 'NotStarted' },
    { title: '电机选型与传动设计', days: 25, bucketId: buckets[1].id, priority: 'Critical', progress: 0, status: 'NotStarted' },
    { title: '传感器方案设计(压力/行程/温度)', days: 20, bucketId: buckets[1].id, priority: 'High', progress: 0, status: 'NotStarted' },
    { title: '冗余安全架构设计', days: 30, bucketId: buckets[1].id, priority: 'Critical', progress: 0, status: 'NotStarted' },
    { title: '电磁兼容(EMC)设计', days: 20, bucketId: buckets[1].id, priority: 'High', progress: 0, status: 'NotStarted' },
    { title: '热管理设计', days: 15, bucketId: buckets[1].id, priority: 'Medium', progress: 0, status: 'NotStarted' },
    
    // ========== 硬件开发 ==========
    { title: '主缸阀体设计开发', days: 45, bucketId: buckets[2].id, priority: 'Critical', progress: 0, status: 'NotStarted' },
    { title: 'ESC控制器PCB设计', days: 35, bucketId: buckets[2].id, priority: 'Critical', progress: 0, status: 'NotStarted' },
    { title: '功率器件选型(IGBT/MOSFET)', days: 20, bucketId: buckets[2].id, priority: 'Critical', progress: 0, status: 'NotStarted' },
    { title: '无刷直流电机(BLDC)开发', days: 40, bucketId: buckets[2].id, priority: 'Critical', progress: 0, status: 'NotStarted' },
    { title: '压力传感器集成开发', days: 25, bucketId: buckets[2].id, priority: 'High', progress: 0, status: 'NotStarted' },
    { title: '线束与接插件设计', days: 20, bucketId: buckets[2].id, priority: 'Medium', progress: 0, status: 'NotStarted' },
    { title: '壳体与密封设计', days: 25, bucketId: buckets[2].id, priority: 'High', progress: 0, status: 'NotStarted' },
    { title: '工装检具开发', days: 30, bucketId: buckets[2].id, priority: 'Medium', progress: 0, status: 'NotStarted' },
    
    // ========== 软件开发 ==========
    { title: 'MCAL底层驱动开发', days: 30, bucketId: buckets[3].id, priority: 'Critical', progress: 0, status: 'NotStarted' },
    { title: 'BSW基础软件配置', days: 35, bucketId: buckets[3].id, priority: 'Critical', progress: 0, status: 'NotStarted' },
    { title: '电机控制算法开发(FOC)', days: 40, bucketId: buckets[3].id, priority: 'Critical', progress: 0, status: 'NotStarted' },
    { title: '液压控制算法开发', days: 35, bucketId: buckets[3].id, priority: 'Critical', progress: 0, status: 'NotStarted' },
    { title: 'ABS控制算法开发', days: 25, bucketId: buckets[3].id, priority: 'High', progress: 0, status: 'NotStarted' },
    { title: 'EBD电子制动力分配开发', days: 20, bucketId: buckets[3].id, priority: 'High', progress: 0, status: 'NotStarted' },
    { title: 'ESC车身稳定控制开发', days: 35, bucketId: buckets[3].id, priority: 'Critical', progress: 0, status: 'NotStarted' },
    { title: 'TCS牵引力控制开发', days: 25, bucketId: buckets[3].id, priority: 'Medium', progress: 0, status: 'NotStarted' },
    { title: 'HDC陡坡缓降开发', days: 20, bucketId: buckets[3].id, priority: 'Medium', progress: 0, status: 'NotStarted' },
    { title: 'AutoHold自动驻车开发', days: 20, bucketId: buckets[3].id, priority: 'Medium', progress: 0, status: 'NotStarted' },
    { title: 'EPB电子驻车制动开发', days: 25, bucketId: buckets[3].id, priority: 'High', progress: 0, status: 'NotStarted' },
    { title: '线控制动解耦算法开发', days: 35, bucketId: buckets[3].id, priority: 'Critical', progress: 0, status: 'NotStarted' },
    { title: '能量回收策略开发', days: 25, bucketId: buckets[3].id, priority: 'High', progress: 0, status: 'NotStarted' },
    { title: '诊断与故障管理(DEM)', days: 20, bucketId: buckets[3].id, priority: 'High', progress: 0, status: 'NotStarted' },
    { title: '功能安全监控(E2E/SafeMonitor)', days: 30, bucketId: buckets[3].id, priority: 'Critical', progress: 0, status: 'NotStarted' },
    { title: 'CAN/CANFD通信开发', days: 20, bucketId: buckets[3].id, priority: 'High', progress: 0, status: 'NotStarted' },
    { title: 'LIN总线通信开发(EPB)', days: 15, bucketId: buckets[3].id, priority: 'Medium', progress: 0, status: 'NotStarted' },
    { title: '网络安全模块开发(HSM/Crypto)', days: 25, bucketId: buckets[3].id, priority: 'High', progress: 0, status: 'NotStarted' },
    
    // ========== 标定匹配 ==========
    { title: '基础制动性能标定', days: 30, bucketId: buckets[4].id, priority: 'Critical', progress: 0, status: 'NotStarted' },
    { title: 'ABS标定(低附/高附/对接)', days: 25, bucketId: buckets[4].id, priority: 'Critical', progress: 0, status: 'NotStarted' },
    { title: 'ESC标定(稳态/瞬态/切换)', days: 30, bucketId: buckets[4].id, priority: 'Critical', progress: 0, status: 'NotStarted' },
    { title: '能量回收标定', days: 20, bucketId: buckets[4].id, priority: 'High', progress: 0, status: 'NotStarted' },
    { title: '踏板感标定(解耦特性)', days: 25, bucketId: buckets[4].id, priority: 'High', progress: 0, status: 'NotStarted' },
    { title: 'NVH振动噪声优化', days: 20, bucketId: buckets[4].id, priority: 'Medium', progress: 0, status: 'NotStarted' },
    { title: '冬季低温标定(-30℃)', days: 30, bucketId: buckets[4].id, priority: 'Critical', progress: 0, status: 'NotStarted' },
    { title: '夏季高温标定(50℃)', days: 25, bucketId: buckets[4].id, priority: 'Critical', progress: 0, status: 'NotStarted' },
    { title: '高原标定(4000m)', days: 20, bucketId: buckets[4].id, priority: 'Medium', progress: 0, status: 'NotStarted' },
    { title: '轮胎匹配标定', days: 15, bucketId: buckets[4].id, priority: 'Medium', progress: 0, status: 'NotStarted' },
    
    // ========== 测试验证 ==========
    { title: 'HIL硬件在环测试', days: 45, bucketId: buckets[5].id, priority: 'Critical', progress: 0, status: 'NotStarted' },
    { title: '台架性能测试', days: 30, bucketId: buckets[5].id, priority: 'Critical', progress: 0, status: 'NotStarted' },
    { title: 'EMC电磁兼容测试', days: 25, bucketId: buckets[5].id, priority: 'Critical', progress: 0, status: 'NotStarted' },
    { title: '环境可靠性测试', days: 35, bucketId: buckets[5].id, priority: 'Critical', progress: 0, status: 'NotStarted' },
    { title: '耐久寿命测试(100万次)', days: 60, bucketId: buckets[5].id, priority: 'Critical', progress: 0, status: 'NotStarted' },
    { title: '盐雾腐蚀测试', days: 20, bucketId: buckets[5].id, priority: 'Medium', progress: 0, status: 'NotStarted' },
    { title: '实车匹配测试', days: 40, bucketId: buckets[5].id, priority: 'Critical', progress: 0, status: 'NotStarted' },
    { title: 'ADAS联调测试(AEB/ACC)', days: 30, bucketId: buckets[5].id, priority: 'Critical', progress: 0, status: 'NotStarted' },
    { title: '网络安全渗透测试', days: 20, bucketId: buckets[5].id, priority: 'High', progress: 0, status: 'NotStarted' },
    { title: '功能安全验证(FTA/FTA)', days: 25, bucketId: buckets[5].id, priority: 'Critical', progress: 0, status: 'NotStarted' },
    { title: '法规认证测试(ECE R13/GB)', days: 30, bucketId: buckets[5].id, priority: 'Critical', progress: 0, status: 'NotStarted' },
    
    // ========== 量产准备 ==========
    { title: 'PFMEA过程失效分析', days: 20, bucketId: buckets[6].id, priority: 'High', progress: 0, status: 'NotStarted' },
    { title: '控制计划(CP)制定', days: 15, bucketId: buckets[6].id, priority: 'High', progress: 0, status: 'NotStarted' },
    { title: '产线布局与设备安装', days: 45, bucketId: buckets[6].id, priority: 'Critical', progress: 0, status: 'NotStarted' },
    { title: '试生产(PPAP)', days: 30, bucketId: buckets[6].id, priority: 'Critical', progress: 0, status: 'NotStarted' },
    { title: '产能爬坡计划', days: 25, bucketId: buckets[6].id, priority: 'High', progress: 0, status: 'NotStarted' },
    { title: '售后诊断手册编制', days: 15, bucketId: buckets[6].id, priority: 'Medium', progress: 0, status: 'NotStarted' },
    { title: '备件目录建立', days: 10, bucketId: buckets[6].id, priority: 'Low', progress: 0, status: 'NotStarted' },
    
    // ========== 关键里程碑 ==========
    { title: 'TR1-需求冻结', days: 0, bucketId: buckets[7].id, priority: 'Critical', progress: 0, status: 'NotStarted', isMilestone: true },
    { title: 'TR2-方案冻结', days: 0, bucketId: buckets[7].id, priority: 'Critical', progress: 0, status: 'NotStarted', isMilestone: true },
    { title: 'TR3-设计冻结', days: 0, bucketId: buckets[7].id, priority: 'Critical', progress: 0, status: 'NotStarted', isMilestone: true },
    { title: 'TR4-工程样件', days: 0, bucketId: buckets[7].id, priority: 'Critical', progress: 0, status: 'NotStarted', isMilestone: true },
    { title: 'TR5-生产样件', days: 0, bucketId: buckets[7].id, priority: 'Critical', progress: 0, status: 'NotStarted', isMilestone: true },
    { title: 'TR6-SOP量产', days: 0, bucketId: buckets[7].id, priority: 'Critical', progress: 0, status: 'NotStarted', isMilestone: true }
  ];
  
  // 计算任务日期并创建任务
  let currentDate = new Date(now);
  
  for (let i = 0; i < tasks.length; i++) {
    const task = tasks[i];
    const startDate = new Date(currentDate);
    const endDate = task.isMilestone 
      ? new Date(currentDate)
      : new Date(currentDate.getTime() + task.days * 24 * 60 * 60 * 1000);
    
    await db.tasks.add({
      id: `task_${projectId}_${i}`,
      projectId,
      title: task.title,
      description: '',
      status: task.status as TaskStatus,
      priority: task.priority as any,
      taskType: task.isMilestone ? 'milestone' : 'task',
      startDateTime: startDate,
      dueDateTime: endDate,
      completedPercent: task.progress,
      bucketId: task.bucketId,
      assigneeIds: [],
      labelIds: [],
      order: i,
      createdAt: now,
      updatedAt: now
    });
    
    if (!task.isMilestone) {
      currentDate = new Date(endDate.getTime() + 3 * 24 * 60 * 60 * 1000); // 3天间隔
    }
  }
  
  // 模拟一些高风险任务的进度
  const allTasks = await db.tasks.where('projectId').equals(projectId).toArray();
  
  // 线控制动解耦算法是关键，模拟延期风险
  const decoupleTask = allTasks.find(t => t.title.includes('线控制动解耦'));
  if (decoupleTask) {
    await db.tasks.update(decoupleTask.id, {
      completedPercent: 25,
      status: 'InProgress'
    });
  }
  
  // 功能安全监控也很重要
  const safetyTask = allTasks.find(t => t.title.includes('功能安全监控'));
  if (safetyTask) {
    await db.tasks.update(safetyTask.id, {
      completedPercent: 30,
      status: 'InProgress'
    });
  }
  
  console.log(`✅ MKC2制动器项目创建完成: ${tasks.length} 个任务`);
  console.log(`   项目ID: ${projectId}`);
  console.log(`   开发周期: 约18个月`);
  console.log(`   技术特点: One-Box线控 + ASIL-D + L3/L4支持`);
  
  return { id: projectId, name: 'MKC2线控制动系统开发' };
}
