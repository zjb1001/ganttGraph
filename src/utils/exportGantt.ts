import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

// 浏览器 canvas 限制：单边 ≤ 32767px（Chrome），总面积约 268MP；留余量
const MAX_CANVAS_SIDE = 16384
const MAX_CANVAS_AREA = 120_000_000
// PDF 规范（Acrobat）单页最大 200 英寸 ≈ 5080mm
const MAX_PDF_SIDE_MM = 5080

/**
 * 截取滚动容器的完整内容（不受当前视口和滚动位置限制）。
 * 在 html2canvas 的克隆文档里把容器展开为 scrollWidth × scrollHeight，
 * 吸顶表头 / 冻结列在克隆里回到自然位置，因此整张图从左上角完整排布。
 */
async function captureFullContent(element: HTMLElement, preferredScale: number) {
  const fullW = element.scrollWidth
  const fullH = element.scrollHeight
  const scale = Math.max(
    0.5,
    Math.min(preferredScale, MAX_CANVAS_SIDE / fullW, MAX_CANVAS_SIDE / fullH, Math.sqrt(MAX_CANVAS_AREA / (fullW * fullH)))
  )
  const canvas = await html2canvas(element, {
    backgroundColor: '#ffffff',
    scale,
    logging: false,
    useCORS: true,
    allowTaint: true,
    windowWidth: Math.max(document.documentElement.clientWidth, fullW),
    windowHeight: Math.max(document.documentElement.clientHeight, fullH),
    scrollX: 0,
    scrollY: 0,
    onclone: (_doc, cloned) => {
      cloned.style.overflow = 'visible'
      cloned.style.flex = 'none'
      cloned.style.width = `${fullW}px`
      cloned.style.height = `${fullH}px`
      cloned.style.maxWidth = 'none'
      cloned.style.maxHeight = 'none'
      cloned.scrollTop = 0
      cloned.scrollLeft = 0
    },
  })
  return { canvas, fullW, fullH }
}

/**
 * 导出甘特图为图片：包含全部行和完整时间轴（不再只截当前可视区域）
 * @param element   - 要导出的 DOM 元素（滚动容器）
 * @param filename  - 导出的文件名（不带扩展名）
 * @param format    - 图片格式
 */
export async function exportAsImage(
  element: HTMLElement,
  filename: string = 'gantt-chart',
  format: 'png' | 'jpeg' = 'png'
): Promise<void> {
  try {
    showLoadingToast('正在生成图片...')

    const { canvas: outCanvas } = await captureFullContent(element, 3)

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
 * 导出甘特图为 PDF：包含全部行和完整时间轴（不再只截当前可视区域），
 * 单页自定义尺寸，超过 PDF 单页上限时等比缩小页面。
 * @param element     - 要导出的 DOM 元素（滚动容器）
 * @param filename    - 导出的文件名（不带扩展名）
 */
export async function exportAsPDF(
  element: HTMLElement,
  filename: string = 'gantt-chart'
): Promise<void> {
  try {
    showLoadingToast('正在生成 PDF...')

    const pxToMm = 0.264583 // 96 dpi: 1px = 0.264583mm
    const { canvas, fullW, fullH } = await captureFullContent(element, 2)

    let pageWidthMm  = fullW * pxToMm
    let pageHeightMm = fullH * pxToMm
    const fit = Math.min(1, MAX_PDF_SIDE_MM / pageWidthMm, MAX_PDF_SIDE_MM / pageHeightMm)
    pageWidthMm  *= fit
    pageHeightMm *= fit
    const orientation: 'landscape' | 'portrait' = pageWidthMm >= pageHeightMm ? 'landscape' : 'portrait'

    const pdf = new jsPDF({
      orientation,
      unit: 'mm',
      format: [pageWidthMm, pageHeightMm],
      compress: true
    })

    pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, pageWidthMm, pageHeightMm, undefined, 'FAST')
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
