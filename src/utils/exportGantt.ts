import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

/**
 * 导出甘特图为图片
 * @param element   - 要导出的 DOM 元素（滚动容器）
 * @param filename  - 导出的文件名（不带扩展名）
 * @param format    - 图片格式
 * @param frozenWidth - 左侧冻结列宽度（px），用于拼接导出内容
 */
export async function exportAsImage(
  element: HTMLElement,
  filename: string = 'gantt-chart',
  format: 'png' | 'jpeg' = 'png',
  frozenWidth: number = 0
): Promise<void> {
  try {
    showLoadingToast('正在生成图片...')

    const scale       = 3
    const scrollLeft  = element.scrollLeft
    const scrollTop   = element.scrollTop
    const clientW     = element.clientWidth
    const clientH     = element.clientHeight
    const timelineVisW = clientW - frozenWidth

    // 截取全宽内容（x=0）且高度限制在当前可视区域
    const fullCanvas = await html2canvas(element, {
      backgroundColor: '#ffffff',
      scale,
      logging: false,
      useCORS: true,
      allowTaint: true,
      x: 0,
      y: scrollTop,
      width: element.scrollWidth,
      height: clientH,
      windowWidth:  element.scrollWidth,
      windowHeight: element.scrollHeight,
      scrollX: 0,
      scrollY: 0
    })

    // 手动合成：冻结列 + 当前可视时间轴区域
    const outCanvas = document.createElement('canvas')
    outCanvas.width  = clientW * scale
    outCanvas.height = clientH * scale
    const ctx = outCanvas.getContext('2d')!

    // 左侧冻结列（始终在 x=0）
    ctx.drawImage(
      fullCanvas,
      0, 0, frozenWidth * scale, clientH * scale,
      0, 0, frozenWidth * scale, clientH * scale
    )

    // 当前可视时间轴：canvas 中时间轴起始位置 = frozenWidth + scrollLeft
    ctx.drawImage(
      fullCanvas,
      (frozenWidth + scrollLeft) * scale, 0, timelineVisW * scale, clientH * scale,
      frozenWidth * scale,                0, timelineVisW * scale, clientH * scale
    )

    outCanvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.download = `${filename}.${format}`
        link.href = url
        link.click()
        URL.revokeObjectURL(url)
        hideLoadingToast()
        showSuccessToast('图片导出成功！')
      } else {
        hideLoadingToast()
        showErrorToast('图片生成失败')
      }
    }, `image/${format}`, format === 'jpeg' ? 0.95 : 1.0)
  } catch (error) {
    hideLoadingToast()
    console.error('导出图片失败:', error)
    showErrorToast('导出图片失败')
  }
}

/**
 * 导出甘特图为 PDF（自定义页面尺寸，匹配屏幕当前可视内容）
 * @param element     - 要导出的 DOM 元素（滚动容器）
 * @param filename    - 导出的文件名（不带扩展名）
 * @param frozenWidth - 左侧冻结列宽度（px）
 */
export async function exportAsPDF(
  element: HTMLElement,
  filename: string = 'gantt-chart',
  frozenWidth: number = 0
): Promise<void> {
  try {
    showLoadingToast('正在生成 PDF...')

    const scale        = 2
    const scrollLeft   = element.scrollLeft
    const scrollTop    = element.scrollTop
    const clientW      = element.clientWidth
    const clientH      = element.clientHeight
    const timelineVisW = clientW - frozenWidth
    const pxToMm       = 0.264583 // 96 dpi: 1px = 0.264583mm

    // 截取全宽内容（x=0）且高度限制在当前可视区域
    const fullCanvas = await html2canvas(element, {
      backgroundColor: '#ffffff',
      scale,
      logging: false,
      useCORS: true,
      allowTaint: true,
      x: 0,
      y: scrollTop,
      width: element.scrollWidth,
      height: clientH,
      windowWidth:  element.scrollWidth,
      windowHeight: element.scrollHeight,
      scrollX: 0,
      scrollY: 0
    })

    // 手动合成：冻结列 + 当前可视时间轴区域
    const outCanvas = document.createElement('canvas')
    outCanvas.width  = clientW * scale
    outCanvas.height = clientH * scale
    const ctx = outCanvas.getContext('2d')!

    ctx.drawImage(
      fullCanvas,
      0, 0, frozenWidth * scale, clientH * scale,
      0, 0, frozenWidth * scale, clientH * scale
    )
    ctx.drawImage(
      fullCanvas,
      (frozenWidth + scrollLeft) * scale, 0, timelineVisW * scale, clientH * scale,
      frozenWidth * scale,                0, timelineVisW * scale, clientH * scale
    )

    const imgData      = outCanvas.toDataURL('image/png', 1.0)
    const pageWidthMm  = clientW * pxToMm
    const pageHeightMm = clientH * pxToMm
    const orientation: 'landscape' | 'portrait' = pageWidthMm >= pageHeightMm ? 'landscape' : 'portrait'

    const pdf = new jsPDF({
      orientation,
      unit: 'mm',
      format: [pageWidthMm, pageHeightMm],
      compress: false
    })

    pdf.addImage(imgData, 'PNG', 0, 0, pageWidthMm, pageHeightMm, undefined, 'FAST')
    pdf.setProperties({ title: filename, subject: '甘特图', creator: 'Gantt Graph', keywords: '甘特图,项目,任务' })
    pdf.save(`${filename}.pdf`)

    hideLoadingToast()
    showSuccessToast('PDF 导出成功！')
  } catch (error) {
    hideLoadingToast()
    console.error('导出 PDF 失败:', error)
    showErrorToast('导出 PDF 失败')
  }
}

/**
 * 导出甘特图为高质量图片（适合打印）
 * @param element - 要导出的 DOM 元素
 * @param filename - 导出的文件名（不带扩展名）
 */
export async function exportAsHighQualityImage(
  element: HTMLElement,
  filename: string = 'gantt-chart'
): Promise<void> {
  try {
    showLoadingToast('正在生成高清图片...')

    const canvas = await html2canvas(element, {
      backgroundColor: '#ffffff',
      scale: 4, // 更高的分辨率
      logging: false,
      useCORS: true,
      allowTaint: true,
      windowWidth: element.scrollWidth,
      windowHeight: element.scrollHeight,
      scrollX: 0,
      scrollY: 0
    })

    canvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.download = `${filename}_hd.png`
        link.href = url
        link.click()
        URL.revokeObjectURL(url)
        hideLoadingToast()
        showSuccessToast('高清图片导出成功！')
      } else {
        hideLoadingToast()
        showErrorToast('图片生成失败')
      }
    }, 'image/png', 1.0)
  } catch (error) {
    hideLoadingToast()
    console.error('导出高清图片失败:', error)
    showErrorToast('导出失败')
  }
}

// Toast 提示函数
function showLoadingToast(message: string): void {
  const existingToast = document.querySelector('.export-loading-toast')
  if (existingToast) {
    existingToast.remove()
  }

  const toast = document.createElement('div')
  toast.className = 'export-loading-toast'
  toast.innerHTML = `
    <div style="
      position: fixed;
      top: 20px;
      right: 20px;
      background: #2563eb;
      color: white;
      padding: 16px 24px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 10000;
      display: flex;
      align-items: center;
      gap: 12px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      animation: slideIn 0.3s ease;
    ">
      <div style="
        width: 20px;
        height: 20px;
        border: 2px solid rgba(255,255,255,0.3);
        border-top-color: white;
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
      "></div>
      <span>${message}</span>
    </div>
    <style>
      @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
    </style>
  `
  document.body.appendChild(toast)
}

function hideLoadingToast(): void {
  const toast = document.querySelector('.export-loading-toast')
  if (toast) {
    toast.remove()
  }
}

function showSuccessToast(message: string): void {
  const toast = document.createElement('div')
  toast.className = 'export-success-toast'
  toast.innerHTML = `
    <div style="
      position: fixed;
      top: 20px;
      right: 20px;
      background: #10b981;
      color: white;
      padding: 16px 24px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 10000;
      display: flex;
      align-items: center;
      gap: 12px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      animation: slideIn 0.3s ease;
    ">
      <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
        <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
      </svg>
      <span>${message}</span>
    </div>
    <style>
      @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
    </style>
  `
  document.body.appendChild(toast)
  setTimeout(() => toast.remove(), 3000)
}

function showErrorToast(message: string): void {
  const toast = document.createElement('div')
  toast.className = 'export-error-toast'
  toast.innerHTML = `
    <div style="
      position: fixed;
      top: 20px;
      right: 20px;
      background: #ef4444;
      color: white;
      padding: 16px 24px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 10000;
      display: flex;
      align-items: center;
      gap: 12px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      animation: slideIn 0.3s ease;
    ">
      <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
        <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
      </svg>
      <span>${message}</span>
    </div>
    <style>
      @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
    </style>
  `
  document.body.appendChild(toast)
  setTimeout(() => toast.remove(), 3000)
}
