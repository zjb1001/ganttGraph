import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

/**
 * 导出甘特图为图片
 * @param element - 要导出的 DOM 元素
 * @param filename - 导出的文件名（不带扩展名）
 * @param format - 图片格式 'png' | 'jpeg'
 */
export async function exportAsImage(
  element: HTMLElement,
  filename: string = 'gantt-chart',
  format: 'png' | 'jpeg' = 'png'
): Promise<void> {
  try {
    // 显示加载提示
    showLoadingToast('正在生成图片...')

    // 使用 html2canvas 捕获元素，使用更高的 scale 提高清晰度
    const canvas = await html2canvas(element, {
      backgroundColor: '#ffffff',
      scale: 3, // 提高到 3 倍分辨率
      logging: false,
      useCORS: true,
      allowTaint: true,
      // 改进渲染质量
      windowWidth: element.scrollWidth,
      windowHeight: element.scrollHeight,
      scrollX: 0,
      scrollY: 0
    })

    // 转换为图片并下载
    canvas.toBlob((blob) => {
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
 * 导出甘特图为 PDF（高清晰度版本）
 * @param element - 要导出的 DOM 元素
 * @param filename - 导出的文件名（不带扩展名）
 * @param orientation - 页面方向 'portrait' | 'landscape'
 */
export async function exportAsPDF(
  element: HTMLElement,
  filename: string = 'gantt-chart',
  orientation: 'portrait' | 'landscape' = 'landscape'
): Promise<void> {
  try {
    // 显示加载提示
    showLoadingToast('正在生成高清 PDF...')

    // 获取元素的完整尺寸
    const width = element.scrollWidth
    const height = element.scrollHeight

    // 计算最佳缩放比例，确保 PDF 有足够的 DPI（300 DPI）
    // A4 纸横向尺寸：297mm × 210mm
    // 300 DPI = 11.81 px/mm
    const mmToPxAt300DPI = 11.81
    const a4WidthMm = orientation === 'landscape' ? 297 : 210
    const a4HeightMm = orientation === 'landscape' ? 210 : 297

    // 计算需要的缩放比例
    const targetWidthPx = a4WidthMm * mmToPxAt300DPI
    const scale = Math.max(3, Math.ceil(targetWidthPx / width))

    // 使用高 scale 捕获元素，确保清晰度
    const canvas = await html2canvas(element, {
      backgroundColor: '#ffffff',
      scale: scale, // 使用计算出的高缩放比例
      logging: false,
      useCORS: true,
      allowTaint: true,
      // 确保捕获完整内容
      windowWidth: width,
      windowHeight: height,
      scrollX: 0,
      scrollY: 0,
      // 改进文字渲染
      letterRendering: true
    })

    const imgData = canvas.toDataURL('image/png', 1.0) // 使用最高质量的 PNG

    // 计算图片尺寸（毫米）
    const imgWidthMm = (canvas.width / mmToPxAt300DPI)
    const imgHeightMm = (canvas.height / mmToPxAt300DPI)

    // 创建 PDF，使用 A4 格式
    const pdf = new jsPDF({
      orientation,
      unit: 'mm',
      format: 'a4',
      compress: false // 禁用压缩以保持质量
    })

    // 如果内容超过一页，需要分页
    const pageHeightMm = a4HeightMm
    const pagesNeeded = Math.ceil(imgHeightMm / pageHeightMm)

    if (pagesNeeded > 1) {
      // 多页处理
      let heightLeft = imgHeightMm
      let position = 0

      for (let i = 0; i < pagesNeeded; i++) {
        if (i > 0) {
          pdf.addPage()
        }

        // 计算当前页的高度
        const currentHeight = Math.min(heightLeft, pageHeightMm)

        // 添加图片（使用压缩以提高性能）
        pdf.addImage(
          imgData,
          'PNG',
          0,
          position,
          imgWidthMm,
          imgHeightMm,
          undefined,
          'FAST'
        )

        heightLeft -= pageHeightMm
        position = -(imgHeightMm - heightLeft)
      }
    } else {
      // 单页，直接添加
      pdf.addImage(
        imgData,
        'PNG',
        0,
        0,
        imgWidthMm,
        imgHeightMm,
        undefined,
        'FAST'
      )
    }

    // 设置 PDF 元数据
    pdf.setProperties({
      title: filename,
      subject: '甘特图',
      creator: 'Gantt Graph',
      keywords: '甘特图,项目,任务'
    })

    // 下载 PDF
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
