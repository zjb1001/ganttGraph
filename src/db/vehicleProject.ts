/**
 * 整车项目初始化
 * 完整的整车开发流程：从概念到量产
 */

import { db } from './index';

export async function initializeVehicleProject() {
  console.log('🚗 初始化整车项目...');
  
  // 检查是否已存在整车项目
  const existingProjects = await db.projects.toArray();
  const hasVehicleProject = existingProjects.some((p: { name: string }) => 
    p.name.includes('整车') || p.name.includes('车型') || p.name.includes('Vehicle')
  );
  
  if (hasVehicleProject) {
    console.log('整车项目已存在，跳过初始化');
    return existingProjects.find((p: { name: string }) => p.name.includes('整车'));
  }
  
  // 创建项目
  const projectId = `vehicle_${Date.now()}`;
  const now = new Date();
  const threeYearsLater = new Date(now.getTime() + 36 * 30 * 24 * 60 * 60 * 1000);
  
  await db.projects.add({
    id: projectId,
    name: '🚗 全新电动SUV整车开发 (V-Platform)',
    description: '基于全新纯电平台的智能电动SUV开发，涵盖造型、工程、三电、智驾、座舱等全领域，目标2028年SOP量产',
    bucketIds: [],
    createdAt: now,
    updatedAt: now
  });
  
  // 创建分组 - 按整车开发阶段组织
  const buckets = [
    // Phase 0: 产品战略
    { id: `bucket_strategy_${projectId}`, name: '🎯 产品战略', color: '#8b5cf6', order: 1, bucketType: 'task' as const },
    
    // Phase 1: 概念设计
    { id: `bucket_concept_${projectId}`, name: '💡 概念设计', color: '#ec4899', order: 2, bucketType: 'task' as const },
    
    // Phase 2: 工程设计
    { id: `bucket_design_${projectId}`, name: '🏗️ 工程设计', color: '#3b82f6', order: 3, bucketType: 'task' as const },
    { id: `bucket_body_${projectId}`, name: '🚗 车身工程', color: '#06b6d4', order: 4, bucketType: 'task' as const },
    { id: `bucket_chassis_${projectId}`, name: '⚙️ 底盘工程', color: '#10b981', order: 5, bucketType: 'task' as const },
    { id: `bucket_powertrain_${projectId}`, name: '🔋 三电系统', color: '#f59e0b', order: 6, bucketType: 'task' as const },
    { id: `bucket_electronics_${projectId}`, name: '📟 电子电器', color: '#6366f1', order: 7, bucketType: 'task' as const },
    
    // Phase 3: 样车开发
    { id: `bucket_prototype_${projectId}`, name: '🔧 样车开发', color: '#f97316', order: 8, bucketType: 'task' as const },
    
    // Phase 4: 验证测试
    { id: `bucket_validation_${projectId}`, name: '🔍 验证测试', color: '#ef4444', order: 9, bucketType: 'task' as const },
    { id: `bucket_adas_${projectId}`, name: '🤖 智驾验证', color: '#14b8a6', order: 10, bucketType: 'task' as const },
    { id: `bucket_cockpit_${projectId}`, name: '🖥️ 座舱验证', color: '#a855f7', order: 11, bucketType: 'task' as const },
    
    // Phase 5: 量产准备
    { id: `bucket_production_${projectId}`, name: '🏭 量产准备', color: '#22c55e', order: 12, bucketType: 'task' as const },
    
    // 里程碑
    { id: `bucket_milestone_${projectId}`, name: '🎯 关键里程碑', color: '#d83b01', order: 13, bucketType: 'milestone' as const }
  ];
  
  for (const bucket of buckets) {
    await db.buckets.add(bucket);
  }
  
  // 创建任务 - 完整的整车开发流程
  const tasks = [
    // ========== Phase 0: 产品战略 ==========
    { title: '市场调研与竞品分析', days: 45, bucketId: buckets[0].id, priority: 'High', progress: 100, status: 'Completed' },
    { title: '产品定位与目标用户定义', days: 30, bucketId: buckets[0].id, priority: 'High', progress: 100, status: 'Completed' },
    { title: '产品需求规格书(PRS)', days: 60, bucketId: buckets[0].id, priority: 'Critical', progress: 90, status: 'InProgress' },
    { title: '整车技术规格书(VTS)', days: 90, bucketId: buckets[0].id, priority: 'Critical', progress: 70, status: 'InProgress' },
    { title: '项目可行性分析', days: 30, bucketId: buckets[0].id, priority: 'High', progress: 80, status: 'InProgress' },
    { title: '项目立项评审(G0)', days: 15, bucketId: buckets[0].id, priority: 'Critical', progress: 60, status: 'InProgress' },
    
    // ========== Phase 1: 概念设计 ==========
    { title: '创意草图与方案发散', days: 45, bucketId: buckets[1].id, priority: 'High', progress: 40, status: 'InProgress' },
    { title: '造型方案评审与选定', days: 30, bucketId: buckets[1].id, priority: 'High', progress: 20, status: 'InProgress' },
    { title: '油泥模型制作(1:4)', days: 60, bucketId: buckets[1].id, priority: 'High', progress: 0, status: 'NotStarted' },
    { title: '油泥模型制作(1:1)', days: 90, bucketId: buckets[1].id, priority: 'High', progress: 0, status: 'NotStarted' },
    { title: 'CAS曲面设计', days: 60, bucketId: buckets[1].id, priority: 'High', progress: 0, status: 'NotStarted' },
    { title: '空气动力学仿真优化', days: 45, bucketId: buckets[1].id, priority: 'Medium', progress: 0, status: 'NotStarted' },
    { title: '风洞试验验证', days: 30, bucketId: buckets[1].id, priority: 'Medium', progress: 0, status: 'NotStarted' },
    { title: '概念设计冻结(G1)', days: 0, bucketId: buckets[1].id, priority: 'Critical', progress: 0, status: 'NotStarted', isMilestone: true },
    
    // ========== Phase 2: 工程设计 ==========
    // 总体设计
    { title: '总布置设计(DMU)', days: 120, bucketId: buckets[2].id, priority: 'Critical', progress: 0, status: 'NotStarted' },
    { title: '整车架构设计', days: 90, bucketId: buckets[2].id, priority: 'Critical', progress: 0, status: 'NotStarted' },
    { title: '轻量化方案设计', days: 60, bucketId: buckets[2].id, priority: 'High', progress: 0, status: 'NotStarted' },
    { title: '碰撞安全性能设计', days: 90, bucketId: buckets[2].id, priority: 'Critical', progress: 0, status: 'NotStarted' },
    { title: 'NVH性能设计', days: 60, bucketId: buckets[2].id, priority: 'High', progress: 0, status: 'NotStarted' },
    
    // 车身工程
    { title: '车身结构设计', days: 120, bucketId: buckets[3].id, priority: 'Critical', progress: 0, status: 'NotStarted' },
    { title: '车身强度刚度分析', days: 60, bucketId: buckets[3].id, priority: 'High', progress: 0, status: 'NotStarted' },
    { title: '碰撞仿真分析(CAE)', days: 90, bucketId: buckets[3].id, priority: 'Critical', progress: 0, status: 'NotStarted' },
    { title: '车身工艺设计', days: 90, bucketId: buckets[3].id, priority: 'High', progress: 0, status: 'NotStarted' },
    { title: '开闭件设计(四门两盖)', days: 90, bucketId: buckets[3].id, priority: 'High', progress: 0, status: 'NotStarted' },
    { title: '外饰件设计(保险杠/格栅)', days: 60, bucketId: buckets[3].id, priority: 'Medium', progress: 0, status: 'NotStarted' },
    { title: '内饰件设计(IP/门板/座椅)', days: 90, bucketId: buckets[3].id, priority: 'High', progress: 0, status: 'NotStarted' },
    
    // 底盘工程
    { title: '悬架系统设计(前/后)', days: 90, bucketId: buckets[4].id, priority: 'Critical', progress: 0, status: 'NotStarted' },
    { title: '转向系统设计', days: 60, bucketId: buckets[4].id, priority: 'Critical', progress: 0, status: 'NotStarted' },
    { title: '制动系统设计', days: 60, bucketId: buckets[4].id, priority: 'Critical', progress: 0, status: 'NotStarted' },
    { title: 'EPS电控转向开发', days: 90, bucketId: buckets[4].id, priority: 'High', progress: 0, status: 'NotStarted' },
    { title: 'ESC车身稳定系统开发', days: 90, bucketId: buckets[4].id, priority: 'Critical', progress: 0, status: 'NotStarted' },
    { title: '轮胎选型与匹配', days: 30, bucketId: buckets[4].id, priority: 'Medium', progress: 0, status: 'NotStarted' },
    
    // 三电系统
    { title: '电池包系统设计', days: 150, bucketId: buckets[5].id, priority: 'Critical', progress: 0, status: 'NotStarted' },
    { title: '电芯选型与测试', days: 120, bucketId: buckets[5].id, priority: 'Critical', progress: 0, status: 'NotStarted' },
    { title: 'BMS电池管理系统开发', days: 120, bucketId: buckets[5].id, priority: 'Critical', progress: 0, status: 'NotStarted' },
    { title: '电机选型与匹配', days: 90, bucketId: buckets[5].id, priority: 'Critical', progress: 0, status: 'NotStarted' },
    { title: 'MCU电机控制器开发', days: 120, bucketId: buckets[5].id, priority: 'Critical', progress: 0, status: 'NotStarted' },
    { title: 'OBC车载充电机开发', days: 90, bucketId: buckets[5].id, priority: 'High', progress: 0, status: 'NotStarted' },
    { title: 'DCDC转换器开发', days: 60, bucketId: buckets[5].id, priority: 'High', progress: 0, status: 'NotStarted' },
    { title: '高压配电系统设计', days: 60, bucketId: buckets[5].id, priority: 'Critical', progress: 0, status: 'NotStarted' },
    { title: '热管理系统设计', days: 90, bucketId: buckets[5].id, priority: 'High', progress: 0, status: 'NotStarted' },
    { title: '能量回收系统标定', days: 60, bucketId: buckets[5].id, priority: 'Medium', progress: 0, status: 'NotStarted' },
    
    // 电子电器
    { title: '整车电气架构设计', days: 120, bucketId: buckets[6].id, priority: 'Critical', progress: 0, status: 'NotStarted' },
    { title: '域控制器设计', days: 150, bucketId: buckets[6].id, priority: 'Critical', progress: 0, status: 'NotStarted' },
    { title: '网关与网络设计', days: 90, bucketId: buckets[6].id, priority: 'High', progress: 0, status: 'NotStarted' },
    { title: '低压配电设计', days: 60, bucketId: buckets[6].id, priority: 'High', progress: 0, status: 'NotStarted' },
    { title: '线束设计(整车)', days: 120, bucketId: buckets[6].id, priority: 'High', progress: 0, status: 'NotStarted' },
    { title: '功能安全设计(HARA/DFMEA)', days: 90, bucketId: buckets[6].id, priority: 'Critical', progress: 0, status: 'NotStarted' },
    { title: '网络安全设计(TARA)', days: 60, bucketId: buckets[6].id, priority: 'High', progress: 0, status: 'NotStarted' },
    { title: '诊断系统设计(OBD/UDS)', days: 60, bucketId: buckets[6].id, priority: 'Medium', progress: 0, status: 'NotStarted' },
    
    // ========== Phase 3: 样车开发 ==========
    { title: '软模件开发(车身)', days: 90, bucketId: buckets[7].id, priority: 'High', progress: 0, status: 'NotStarted' },
    { title: '骡子车(Mule Car)搭建', days: 60, bucketId: buckets[7].id, priority: 'High', progress: 0, status: 'NotStarted' },
    { title: '工程样车(EP1)制造', days: 90, bucketId: buckets[7].id, priority: 'Critical', progress: 0, status: 'NotStarted' },
    { title: '工程样车(EP2)制造', days: 90, bucketId: buckets[7].id, priority: 'Critical', progress: 0, status: 'NotStarted' },
    { title: '设计样车(DV)制造', days: 90, bucketId: buckets[7].id, priority: 'Critical', progress: 0, status: 'NotStarted' },
    { title: '工艺样车(PV)制造', days: 90, bucketId: buckets[7].id, priority: 'Critical', progress: 0, status: 'NotStarted' },
    { title: '零部件OTS认可', days: 120, bucketId: buckets[7].id, priority: 'High', progress: 0, status: 'NotStarted' },
    { title: '工程发布(G3)', days: 0, bucketId: buckets[7].id, priority: 'Critical', progress: 0, status: 'NotStarted', isMilestone: true },
    
    // ========== Phase 4: 验证测试 ==========
    // 整车验证
    { title: '整车可靠性试验', days: 180, bucketId: buckets[8].id, priority: 'Critical', progress: 0, status: 'NotStarted' },
    { title: '三高试验(高温/高寒/高原)', days: 120, bucketId: buckets[8].id, priority: 'Critical', progress: 0, status: 'NotStarted' },
    { title: '碰撞安全试验', days: 90, bucketId: buckets[8].id, priority: 'Critical', progress: 0, status: 'NotStarted' },
    { title: 'NVH试验验证', days: 90, bucketId: buckets[8].id, priority: 'High', progress: 0, status: 'NotStarted' },
    { title: 'EMC电磁兼容测试', days: 60, bucketId: buckets[8].id, priority: 'Critical', progress: 0, status: 'NotStarted' },
    { title: '耐久试验(24万公里)', days: 240, bucketId: buckets[8].id, priority: 'Critical', progress: 0, status: 'NotStarted' },
    { title: '法规认证(公告/3C/环保)', days: 120, bucketId: buckets[8].id, priority: 'Critical', progress: 0, status: 'NotStarted' },
    { title: '欧盟认证(ECE/EEC)', days: 150, bucketId: buckets[8].id, priority: 'High', progress: 0, status: 'NotStarted' },
    
    // 智驾验证
    { title: '感知系统标定(摄像头/雷达)', days: 90, bucketId: buckets[9].id, priority: 'Critical', progress: 0, status: 'NotStarted' },
    { title: 'ADAS功能开发(L2+)', days: 180, bucketId: buckets[9].id, priority: 'Critical', progress: 0, status: 'NotStarted' },
    { title: '自动驾驶算法训练', days: 240, bucketId: buckets[9].id, priority: 'High', progress: 0, status: 'NotStarted' },
    { title: 'NOA高速领航功能验证', days: 120, bucketId: buckets[9].id, priority: 'High', progress: 0, status: 'NotStarted' },
    { title: '自动泊车功能验证', days: 90, bucketId: buckets[9].id, priority: 'Medium', progress: 0, status: 'NotStarted' },
    { title: 'AEB自动紧急制动验证', days: 60, bucketId: buckets[9].id, priority: 'Critical', progress: 0, status: 'NotStarted' },
    { title: 'ADAS场地测试', days: 90, bucketId: buckets[9].id, priority: 'Critical', progress: 0, status: 'NotStarted' },
    { title: 'ADAS道路测试(10万公里)', days: 180, bucketId: buckets[9].id, priority: 'Critical', progress: 0, status: 'NotStarted' },
    
    // 座舱验证
    { title: '智能座舱域控制器开发', days: 150, bucketId: buckets[10].id, priority: 'Critical', progress: 0, status: 'NotStarted' },
    { title: '中控大屏软件开发', days: 180, bucketId: buckets[10].id, priority: 'High', progress: 0, status: 'NotStarted' },
    { title: '仪表软件开发', days: 150, bucketId: buckets[10].id, priority: 'High', progress: 0, status: 'NotStarted' },
    { title: '语音交互系统开发', days: 120, bucketId: buckets[10].id, priority: 'Medium', progress: 0, status: 'NotStarted' },
    { title: '车联网T-Box开发', days: 120, bucketId: buckets[10].id, priority: 'High', progress: 0, status: 'NotStarted' },
    { title: 'OTA升级系统开发', days: 90, bucketId: buckets[10].id, priority: 'High', progress: 0, status: 'NotStarted' },
    { title: '数字钥匙开发', days: 90, bucketId: buckets[10].id, priority: 'Medium', progress: 0, status: 'NotStarted' },
    { title: '座舱系统压力测试', days: 60, bucketId: buckets[10].id, priority: 'Medium', progress: 0, status: 'NotStarted' },
    
    // ========== Phase 5: 量产准备 ==========
    { title: '生产线规划与设计', days: 180, bucketId: buckets[11].id, priority: 'Critical', progress: 0, status: 'NotStarted' },
    { title: '工装夹具开发', days: 150, bucketId: buckets[11].id, priority: 'High', progress: 0, status: 'NotStarted' },
    { title: '检具开发', days: 120, bucketId: buckets[11].id, priority: 'High', progress: 0, status: 'NotStarted' },
    { title: '生产线安装调试', days: 120, bucketId: buckets[11].id, priority: 'Critical', progress: 0, status: 'NotStarted' },
    { title: '设备能力验证(Cmk)', days: 60, bucketId: buckets[11].id, priority: 'High', progress: 0, status: 'NotStarted' },
    { title: '过程能力验证(Ppk)', days: 90, bucketId: buckets[11].id, priority: 'High', progress: 0, status: 'NotStarted' },
    { title: '小批量试生产(SOP前)', days: 90, bucketId: buckets[11].id, priority: 'Critical', progress: 0, status: 'NotStarted' },
    { title: '生产人员培训', days: 60, bucketId: buckets[11].id, priority: 'High', progress: 0, status: 'NotStarted' },
    { title: '供应链量产准备', days: 120, bucketId: buckets[11].id, priority: 'Critical', progress: 0, status: 'NotStarted' },
    { title: '质量管控体系建立', days: 90, bucketId: buckets[11].id, priority: 'High', progress: 0, status: 'NotStarted' },
    
    // ========== 关键里程碑 ==========
    { title: 'G0-项目立项', days: 0, bucketId: buckets[12].id, priority: 'Critical', progress: 0, status: 'NotStarted', isMilestone: true },
    { title: 'G1-概念冻结', days: 0, bucketId: buckets[12].id, priority: 'Critical', progress: 0, status: 'NotStarted', isMilestone: true },
    { title: 'G2-造型冻结', days: 0, bucketId: buckets[12].id, priority: 'Critical', progress: 0, status: 'NotStarted', isMilestone: true },
    { title: 'G3-工程发布', days: 0, bucketId: buckets[12].id, priority: 'Critical', progress: 0, status: 'NotStarted', isMilestone: true },
    { title: 'G4-设计验证完成', days: 0, bucketId: buckets[12].id, priority: 'Critical', progress: 0, status: 'NotStarted', isMilestone: true },
    { title: 'G5-生产验证完成', days: 0, bucketId: buckets[12].id, priority: 'Critical', progress: 0, status: 'NotStarted', isMilestone: true },
    { title: 'G6-SOP量产启动', days: 0, bucketId: buckets[12].id, priority: 'Critical', progress: 0, status: 'NotStarted', isMilestone: true }
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
      status: task.status,
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
      currentDate = new Date(endDate.getTime() + 5 * 24 * 60 * 60 * 1000); // 5天间隔
    }
  }
  
  // 设置一些延期风险（用于演示）
  const allTasks = await db.tasks.where('projectId').equals(projectId).toArray();
  
  // 三电系统是电动车关键，模拟一些延期
  const batteryTasks = allTasks.filter(t => t.title.includes('电池') || t.title.includes('BMS'));
  for (const task of batteryTasks.slice(0, 2)) {
    await db.tasks.update(task.id, {
      completedPercent: 30,
      status: 'InProgress'
    });
  }
  
  // 智驾功能也是重点
  const adasTasks = allTasks.filter(t => t.title.includes('ADAS') || t.title.includes('自动驾驶'));
  for (const task of adasTasks.slice(0, 1)) {
    await db.tasks.update(task.id, {
      completedPercent: 20,
      status: 'InProgress'
    });
  }
  
  console.log(`✅ 整车项目创建完成: ${tasks.length} 个任务`);
  console.log(`   项目ID: ${projectId}`);
  console.log(`   阶段: 产品战略 → 概念设计 → 工程设计 → 样车开发 → 验证测试 → 量产准备`);
  console.log(`   周期: 约36个月`);
  
  return { id: projectId, name: '全新电动SUV整车开发' };
}
