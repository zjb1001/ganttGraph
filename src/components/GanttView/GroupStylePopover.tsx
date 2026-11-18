import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  PALETTE,
  MILESTONE_FONT_MIN,
  MILESTONE_FONT_MAX,
  MILESTONE_FONT_DEFAULT,
  resolveColor,
} from '@/utils/colors'
import styles from './GroupStylePopover.module.css'

export interface GroupStyle {
  color: string
  labelFontSize?: number
  labelBold?: boolean
}

interface SwatchButtonProps {
  value: GroupStyle
  onChange: (next: Partial<GroupStyle>) => void
  /** 里程碑分组：显示字号 / 加粗控制 */
  showFontControls?: boolean
  title?: string
  /** 预览文字（里程碑分组时显示示例标签） */
  previewText?: string
}

/**
 * 分组样式按钮：显示当前颜色色块，点击弹出样式面板（色板 + 自定义色 + 里程碑字号）。
 * 面板通过 portal 渲染到 body，避免被冻结列 overflow:hidden 裁剪。
 */
export default function GroupStyleButton({ value, onChange, showFontControls, title, previewText }: SwatchButtonProps) {
  const [open, setOpen] = useState(false)
  const btnRef = useRef<HTMLButtonElement>(null)
  const color = resolveColor(value.color)

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        className={styles.swatchBtn}
        style={{ background: color }}
        title={title || 'Group style'}
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation()
          setOpen((v) => !v)
        }}
      >
        {showFontControls && <span className={styles.swatchGlyph}>A</span>}
      </button>
      {open && btnRef.current && (
        <GroupStylePanel
          anchor={btnRef.current}
          value={value}
          onChange={onChange}
          showFontControls={showFontControls}
          previewText={previewText}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  )
}

interface PanelProps {
  anchor: HTMLElement
  value: GroupStyle
  onChange: (next: Partial<GroupStyle>) => void
  showFontControls?: boolean
  previewText?: string
  onClose: () => void
}

function GroupStylePanel({ anchor, value, onChange, showFontControls, previewText, onClose }: PanelProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState<{ left: number; top: number }>({ left: -9999, top: -9999 })
  // 本地草稿：写库是异步的，连续点击 A+/A− 时不能依赖尚未回传的 props
  const [draft, setDraft] = useState<GroupStyle>(value)
  const color = resolveColor(draft.color)
  const fontSize = draft.labelFontSize ?? MILESTONE_FONT_DEFAULT
  const bold = !!draft.labelBold
  const apply = (next: Partial<GroupStyle>) => {
    setDraft((d) => ({ ...d, ...next }))
    onChange(next)
  }

  // 定位：锚点下方，超出视口时翻到上方 / 向左收
  useLayoutEffect(() => {
    const place = () => {
      const a = anchor.getBoundingClientRect()
      const p = panelRef.current?.getBoundingClientRect()
      const w = p?.width ?? 240
      const h = p?.height ?? 200
      let left = a.left
      let top = a.bottom + 6
      if (left + w > window.innerWidth - 8) left = window.innerWidth - w - 8
      if (top + h > window.innerHeight - 8) top = a.top - h - 6
      setPos({ left: Math.max(8, left), top: Math.max(8, top) })
    }
    place()
    window.addEventListener('resize', place)
    window.addEventListener('scroll', place, true)
    return () => {
      window.removeEventListener('resize', place)
      window.removeEventListener('scroll', place, true)
    }
  }, [anchor])

  // 点击外部 / Esc 关闭
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node
      if (panelRef.current?.contains(t) || anchor.contains(t)) return
      onClose()
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [anchor, onClose])

  const setSize = (n: number) =>
    apply({ labelFontSize: Math.max(MILESTONE_FONT_MIN, Math.min(MILESTONE_FONT_MAX, n)) })

  const isPreset = PALETTE.some((c) => c.hex === color)

  return createPortal(
    <div
      ref={panelRef}
      className={styles.panel}
      style={{ left: pos.left, top: pos.top }}
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      <div className={styles.sectionTitle}>Color</div>
      <div className={styles.swatchGrid}>
        {PALETTE.map((c) => (
          <button
            key={c.hex}
            type="button"
            className={`${styles.swatch} ${c.hex === color ? styles.swatchActive : ''}`}
            style={{ background: c.hex }}
            title={c.name}
            onClick={() => apply({ color: c.hex })}
          />
        ))}
      </div>
      <label className={`${styles.customRow} ${!isPreset ? styles.customActive : ''}`}>
        <input
          type="color"
          className={styles.customInput}
          value={color}
          onChange={(e) => apply({ color: e.target.value })}
        />
        <span>Custom color…</span>
        {!isPreset && <span className={styles.customHex}>{color}</span>}
      </label>

      {showFontControls && (
        <>
          <div className={styles.divider} />
          <div className={styles.sectionTitle}>Milestone label</div>
          <div className={styles.fontRow}>
            <button
              type="button"
              className={styles.stepBtn}
              onClick={() => setSize(fontSize - 1)}
              disabled={fontSize <= MILESTONE_FONT_MIN}
              title="Smaller"
            >
              A−
            </button>
            <input
              type="range"
              className={styles.range}
              min={MILESTONE_FONT_MIN}
              max={MILESTONE_FONT_MAX}
              step={1}
              value={fontSize}
              onChange={(e) => setSize(Number(e.target.value))}
              style={{ accentColor: color }}
            />
            <button
              type="button"
              className={styles.stepBtn}
              onClick={() => setSize(fontSize + 1)}
              disabled={fontSize >= MILESTONE_FONT_MAX}
              title="Larger"
            >
              A+
            </button>
            <span className={styles.sizeValue}>{fontSize}px</span>
          </div>
          <div className={styles.fontRow}>
            <button
              type="button"
              className={`${styles.toggleBtn} ${bold ? styles.toggleOn : ''}`}
              onClick={() => apply({ labelBold: !bold })}
              title="Bold"
            >
              <b>B</b> Bold
            </button>
            <button
              type="button"
              className={styles.resetBtn}
              onClick={() => apply({ labelFontSize: MILESTONE_FONT_DEFAULT, labelBold: false })}
            >
              Reset
            </button>
          </div>
          <div className={styles.preview}>
            <span className={styles.previewDiamond} style={{ background: color }} />
            <span
              className={styles.previewLabel}
              style={{ fontSize, fontWeight: bold ? 700 : 500, color: "var(--color-text)", borderLeftColor: color }}
            >
              {previewText || 'Milestone'}
              <span
                className={styles.previewDate}
                style={{ fontSize: Math.max(9, fontSize - 2) }}
              >
                {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </span>
            </span>
          </div>
        </>
      )}
    </div>,
    document.body
  )
}
