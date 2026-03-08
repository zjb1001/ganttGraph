/**
 * Level 6: 多模态交互与可视化
 * - ASCII甘特图生成
 * - 多格式导出 (PNG/PDF/Excel)
 * - 表格交互支持
 */

import { Task } from '@/types';

/**
 * 甘特图渲染器
 */
export class GanttRenderer {
  private readonly CELL_WIDTH = 4;  // 每个时间单元格的宽度
  private readonly LABEL_WIDTH = 20; // 任务名称列宽度
  
  /**
   * 生成ASCII甘特图
   */
  renderASCII(tasks: Task[], options: {
    unit?: 'day' | 'week' | 'month';
    startDate?: Date;
    endDate?: Date;
    showProgress?: boolean;
  } = {}): string {
    const { 
      unit = 'week',
      showProgress = true 
    } = options;
    
    // 计算时间范围
    const { startDate, endDate, timeSlots } = this.calculateTimeRange(tasks, unit);
    
    // 生成标题
    const lines: string[] = [];
    lines.push('╔' + '═'.repeat(this.LABEL_WIDTH + 2) + '╦' + '═'.repeat(timeSlots.length * (this.CELL_WIDTH + 1)) + '╗');
    lines.push('║' + ' '.repeat(this.LABEL_WIDTH + 2) + '║' + this.renderTimeHeader(timeSlots, unit).padEnd(timeSlots.length * (this.CELL_WIDTH + 1)) + '║');
    lines.push('╠' + '═'.repeat(this.LABEL_WIDTH + 2) + '╬' + '═'.repeat(timeSlots.length * (this.CELL_WIDTH + 1)) + '╣');
    
    // 生成任务行
    tasks.forEach((task, index) => {
      const row = this.renderTaskRow(task, timeSlots, startDate, unit, showProgress);
      lines.push('║ ' + task.title.substring(0, this.LABEL_WIDTH - 1).padEnd(this.LABEL_WIDTH) + ' ║' + row + '║');
      
      // 每5个任务添加分隔线
      if ((index + 1) % 5 === 0 && index < tasks.length - 1) {
        lines.push('╠' + '═'.repeat(this.LABEL_WIDTH + 2) + '╬' + '═'.repeat(timeSlots.length * (this.CELL_WIDTH + 1)) + '╣');
      }
    });
    
    lines.push('╚' + '═'.repeat(this.LABEL_WIDTH + 2) + '╩' + '═'.repeat(timeSlots.length * (this.CELL_WIDTH + 1)) + '╝');
    
    // 添加图例
    lines.push('');
    lines.push('图例:');
    lines.push('  ████ 已完成');
    lines.push('  ▓▓▓▓ 进行中');
    lines.push('  ░░░░ 未开始');
    lines.push('  ▒▒▒▒ 延期');
    
    return lines.join('\n');
  }
  
  /**
   * 生成简化版甘特图 (适用于窄屏)
   */
  renderCompact(tasks: Task[]): string {
    const lines: string[] = [];
    
    // 找出时间范围
    let minDate = Infinity;
    let maxDate = -Infinity;
    
    tasks.forEach(task => {
      if (task.startDateTime) {
        minDate = Math.min(minDate, new Date(task.startDateTime).getTime());
      }
      if (task.dueDateTime) {
        maxDate = Math.max(maxDate, new Date(task.dueDateTime).getTime());
      }
    });
    
    if (minDate === Infinity) minDate = Date.now();
    if (maxDate === -Infinity) maxDate = minDate + 30 * 24 * 60 * 60 * 1000;
    
    const totalDays = Math.ceil((maxDate - minDate) / (24 * 60 * 60 * 1000));
    const scale = Math.max(1, Math.floor(totalDays / 50)); // 缩放比例
    
    lines.push('任务名称              │ 进度 │ 时间线');
    lines.push('──────────────────────┼──────┼' + '─'.repeat(50));
    
    tasks.forEach(task => {
      const name = task.title.substring(0, 18).padEnd(18);
      const progress = (task.completedPercent || 0);
      const progressStr = String(progress).padStart(3) + '%';
      
      // 计算在时间线上的位置
      let start = 0;
      let duration = 5;
      
      if (task.startDateTime && task.dueDateTime) {
        const taskStart = new Date(task.startDateTime).getTime();
        const taskEnd = new Date(task.dueDateTime).getTime();
        start = Math.floor((taskStart - minDate) / (24 * 60 * 60 * 1000) / scale);
        duration = Math.max(1, Math.ceil((taskEnd - taskStart) / (24 * 60 * 60 * 1000) / scale));
      }
      
      // 生成时间线
      let timeline = ' '.repeat(Math.min(start, 40));
      const bar = '█'.repeat(Math.min(duration, 50 - start));
      timeline += bar;
      timeline = timeline.substring(0, 50).padEnd(50);
      
      const statusIcon = progress === 100 ? '✅' : progress > 0 ? '🔵' : '⚪';
      lines.push(`${name} ${statusIcon} ${progressStr} │${timeline}`);
    });
    
    return lines.join('\n');
  }
  
  /**
   * 生成HTML甘特图
   */
  renderHTML(tasks: Task[]): string {
    // 计算时间范围
    let minDate = Infinity;
    let maxDate = -Infinity;
    
    tasks.forEach(task => {
      if (task.startDateTime) {
        minDate = Math.min(minDate, new Date(task.startDateTime).getTime());
      }
      if (task.dueDateTime) {
        maxDate = Math.max(maxDate, new Date(task.dueDateTime).getTime());
      }
    });
    
    const startDate = new Date(minDate);
    const endDate = new Date(maxDate);
    const totalDays = Math.ceil((maxDate - minDate) / (24 * 60 * 60 * 1000));
    
    let html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>项目甘特图</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    .gantt-container { overflow-x: auto; }
    .gantt { border-collapse: collapse; width: 100%; }
    .gantt th, .gantt td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    .gantt th { background-color: #f2f2f2; }
    .task-bar { height: 20px; border-radius: 3px; }
    .completed { background-color: #4CAF50; }
    .in-progress { background-color: #2196F3; }
    .not-started { background-color: #9E9E9E; }
    .delayed { background-color: #f44336; }
    .timeline-cell { width: 30px; min-width: 30px; }
  </style>
</head>
<body>
  <h2>项目甘特图</h2>
  <p>项目周期: ${startDate.toLocaleDateString()} ~ ${endDate.toLocaleDateString()} (${totalDays}天)</p>
  <div class="gantt-container">
    <table class="gantt">
      <thead>
        <tr>
          <th>任务名称</th>
          <th>开始日期</th>
          <th>结束日期</th>
          <th>进度</th>
          <th>状态</th>
        </tr>
      </thead>
      <tbody>
`;
    
    tasks.forEach(task => {
      const start = task.startDateTime 
        ? new Date(task.startDateTime).toLocaleDateString() 
        : '-';
      const end = task.dueDateTime 
        ? new Date(task.dueDateTime).toLocaleDateString() 
        : '-';
      const progress = task.completedPercent || 0;
      
      let statusClass = 'not-started';
      let statusText = '未开始';
      
      if (progress === 100) {
        statusClass = 'completed';
        statusText = '已完成';
      } else if (progress > 0) {
        statusClass = 'in-progress';
        statusText = '进行中';
      }
      
      html += `
        <tr>
          <td>${task.title}</td>
          <td>${start}</td>
          <td>${end}</td>
          <td>
            <div style="background-color: #e0e0e0; height: 20px; border-radius: 10px;">
              <div style="background-color: #4CAF50; height: 100%; width: ${progress}%; border-radius: 10px;"></div>
            </div>
            ${progress}%
          </td>
          <td><span class="task-bar ${statusClass}">${statusText}</span></td>
        </tr>
`;
    });
    
    html += `
      </tbody>
    </table>
  </div>
  <p style="margin-top: 20px; color: #666;">
    图例: <span style="color: #4CAF50;">■ 已完成</span> 
    <span style="color: #2196F3;">■ 进行中</span> 
    <span style="color: #9E9E9E;">■ 未开始</span>
  </p>
</body>
</html>`;
    
    return html;
  }
  
  /**
   * 生成Markdown表格
   */
  renderMarkdown(tasks: Task[]): string {
    const lines: string[] = [];
    
    lines.push('# 项目甘特图');
    lines.push('');
    lines.push('| 任务 | 开始日期 | 结束日期 | 工期 | 进度 | 状态 |');
    lines.push('|------|----------|----------|------|------|------|');
    
    tasks.forEach(task => {
      const start = task.startDateTime 
        ? new Date(task.startDateTime).toISOString().split('T')[0] 
        : '-';
      const end = task.dueDateTime 
        ? new Date(task.dueDateTime).toISOString().split('T')[0] 
        : '-';
      const duration = task.startDateTime && task.dueDateTime
        ? Math.ceil((new Date(task.dueDateTime).getTime() - new Date(task.startDateTime).getTime()) / (24 * 60 * 60 * 1000))
        : '-';
      const completed = task.completedPercent ?? 0;
      const progress = completed + '%';
      const status = completed === 100 ? '✅ 完成' : completed > 0 ? '🔄 进行中' : '⏳ 未开始';
      
      lines.push(`| ${task.title} | ${start} | ${end} | ${duration} | ${progress} | ${status} |`);
    });
    
    return lines.join('\n');
  }
  
  // ========== 私有辅助方法 ==========
  
  private calculateTimeRange(tasks: Task[], unit: 'day' | 'week' | 'month') {
    let minDate = Infinity;
    let maxDate = -Infinity;
    
    tasks.forEach(task => {
      if (task.startDateTime) {
        minDate = Math.min(minDate, new Date(task.startDateTime).getTime());
      }
      if (task.dueDateTime) {
        maxDate = Math.max(maxDate, new Date(task.dueDateTime).getTime());
      }
    });
    
    if (minDate === Infinity) {
      minDate = Date.now();
      maxDate = minDate + 30 * 24 * 60 * 60 * 1000;
    }
    
    const startDate = new Date(minDate);
    const endDate = new Date(maxDate);
    
    // 生成时间槽
    const timeSlots: Date[] = [];
    const current = new Date(startDate);
    
    while (current <= endDate) {
      timeSlots.push(new Date(current));
      if (unit === 'day') {
        current.setDate(current.getDate() + 1);
      } else if (unit === 'week') {
        current.setDate(current.getDate() + 7);
      } else {
        current.setMonth(current.getMonth() + 1);
      }
    }
    
    return { startDate, endDate, timeSlots };
  }
  
  private renderTimeHeader(timeSlots: Date[], unit: 'day' | 'week' | 'month'): string {
    const headers: string[] = [];
    
    timeSlots.forEach(date => {
      if (unit === 'day') {
        headers.push(`${date.getMonth() + 1}/${date.getDate()}`.padStart(this.CELL_WIDTH));
      } else if (unit === 'week') {
        headers.push(`W${this.getWeekNumber(date)}`.padStart(this.CELL_WIDTH));
      } else {
        headers.push(`${date.getMonth() + 1}月`.padStart(this.CELL_WIDTH));
      }
    });
    
    return headers.join('│');
  }
  
  private renderTaskRow(
    task: Task, 
    timeSlots: Date[], 
    startDate: Date,
    unit: 'day' | 'week' | 'month',
    showProgress: boolean
  ): string {
    const cells: string[] = [];
    
    const taskStart = task.startDateTime ? new Date(task.startDateTime) : null;
    const taskEnd = task.dueDateTime ? new Date(task.dueDateTime) : null;
    const progress = task.completedPercent || 0;
    
    timeSlots.forEach(slotDate => {
      let cell = ' '.repeat(this.CELL_WIDTH);
      
      if (taskStart && taskEnd) {
        const slotStart = new Date(slotDate);
        const slotEnd = unit === 'day' 
          ? new Date(slotDate.getTime() + 24 * 60 * 60 * 1000)
          : unit === 'week'
          ? new Date(slotDate.getTime() + 7 * 24 * 60 * 60 * 1000)
          : new Date(slotDate.getFullYear(), slotDate.getMonth() + 1, 1);
        
        // 检查任务是否与当前时间槽重叠
        if (taskStart < slotEnd && taskEnd > slotStart) {
          if (progress === 100) {
            cell = '█'.repeat(this.CELL_WIDTH);
          } else if (progress > 0) {
            cell = '▓'.repeat(this.CELL_WIDTH);
          } else {
            cell = '░'.repeat(this.CELL_WIDTH);
          }
        }
      }
      
      cells.push(cell);
    });
    
    return cells.join('│');
  }
  
  private getWeekNumber(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  }
}

// 导出单例
export const ganttRenderer = new GanttRenderer();
