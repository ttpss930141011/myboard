/**
 * 编辑系统测试
 * 验证新的三层编辑架构正确性
 */

import { renderHook, act } from '@testing-library/react'
import { useDocumentEditor } from '@/hooks/use-document-editor'
import { useContentEditor } from '@/hooks/use-content-editor'
import { useFormEditor } from '@/hooks/use-form-editor'

describe('新编辑系统架构测试', () => {
  describe('DocumentEditor (Note组件)', () => {
    it('应该允许Enter键换行而不结束编辑', () => {
      const onSave = jest.fn()
      const { result } = renderHook(() =>
        useDocumentEditor({
          layerId: 'note-1',
          initialValue: 'Line 1',
          onSave
        })
      )

      // 开始编辑
      act(() => {
        result.current.startEdit()
      })

      expect(result.current.isEditing).toBe(true)

      // 模拟Enter键事件
      const enterEvent = {
        key: 'Enter',
        preventDefault: jest.fn()
      } as any

      act(() => {
        result.current.handleKeyDown(enterEvent)
      })

      // Enter键不应该调用preventDefault（允许默认换行行为）
      expect(enterEvent.preventDefault).not.toHaveBeenCalled()
      // 应该仍在编辑状态
      expect(result.current.isEditing).toBe(true)
      // 不应该触发保存
      expect(onSave).not.toHaveBeenCalled()
    })

    it('应该在Escape键时取消编辑', () => {
      const onSave = jest.fn()
      const { result } = renderHook(() =>
        useDocumentEditor({
          layerId: 'note-1',
          initialValue: 'Original text',
          onSave
        })
      )

      act(() => {
        result.current.startEdit()
      })

      const escapeEvent = {
        key: 'Escape',
        preventDefault: jest.fn()
      } as any

      act(() => {
        result.current.handleKeyDown(escapeEvent)
      })

      expect(escapeEvent.preventDefault).toHaveBeenCalled()
      expect(result.current.isEditing).toBe(false)
      expect(onSave).not.toHaveBeenCalled()
    })
  })

  describe('ContentEditor (Text组件)', () => {
    it('应该允许Enter键换行而不结束编辑', () => {
      const onSave = jest.fn()
      const onDelete = jest.fn()
      const { result } = renderHook(() =>
        useContentEditor({
          layerId: 'text-1',
          initialValue: 'Title',
          onSave,
          onDelete
        })
      )

      act(() => {
        result.current.startEdit()
      })

      const enterEvent = {
        key: 'Enter',
        preventDefault: jest.fn()
      } as any

      act(() => {
        result.current.handleKeyDown(enterEvent)
      })

      // Enter键不应该调用preventDefault
      expect(enterEvent.preventDefault).not.toHaveBeenCalled()
      expect(result.current.isEditing).toBe(true)
      expect(onSave).not.toHaveBeenCalled()
    })

    it('应该在内容为空时删除组件', () => {
      const onSave = jest.fn()
      const onDelete = jest.fn()
      const { result } = renderHook(() =>
        useContentEditor({
          layerId: 'text-1',
          initialValue: 'Text',
          onSave,
          onDelete
        })
      )

      act(() => {
        result.current.startEdit()
      })

      // 清空内容
      act(() => {
        const event = { target: { value: '' } } as any
        result.current.handleChange(event)
      })

      // 触发失焦保存
      act(() => {
        result.current.handleBlur()
      })

      expect(onDelete).toHaveBeenCalled()
      expect(onSave).not.toHaveBeenCalled()
    })
  })

  describe('FormEditor (Frame组件)', () => {
    it('应该在Enter键时结束编辑', () => {
      const onSave = jest.fn()
      const { result } = renderHook(() =>
        useFormEditor({
          layerId: 'frame-1',
          initialValue: 'Frame Name',
          onSave
        })
      )

      act(() => {
        result.current.startEdit()
      })

      const enterEvent = {
        key: 'Enter',
        preventDefault: jest.fn()
      } as any

      act(() => {
        result.current.handleKeyDown(enterEvent)
      })

      // Enter键应该阻止默认行为
      expect(enterEvent.preventDefault).toHaveBeenCalled()
      // 应该结束编辑
      expect(result.current.isEditing).toBe(false)
      // 应该触发保存
      expect(onSave).toHaveBeenCalled()
    })

    it('应该不允许空值，使用默认值', () => {
      const onSave = jest.fn()
      const { result } = renderHook(() =>
        useFormEditor({
          layerId: 'frame-1',
          initialValue: '',
          onSave,
          defaultValue: 'Frame'
        })
      )

      act(() => {
        result.current.startEdit()
      })

      // 保持空值
      act(() => {
        result.current.handleBlur()
      })

      // 应该使用默认值保存
      expect(onSave).toHaveBeenCalledWith(expect.stringContaining('Frame'))
    })
  })

  describe('编辑互斥机制', () => {
    it('多个编辑器不应该同时处于编辑状态', () => {
      const { result: editor1 } = renderHook(() =>
        useDocumentEditor({
          layerId: 'layer-1',
          initialValue: 'Text 1',
          onSave: jest.fn()
        })
      )

      const { result: editor2 } = renderHook(() =>
        useDocumentEditor({
          layerId: 'layer-2',
          initialValue: 'Text 2',
          onSave: jest.fn()
        })
      )

      // 启动第一个编辑器
      act(() => {
        editor1.current.startEdit()
      })

      expect(editor1.current.isEditing).toBe(true)
      expect(editor2.current.isEditing).toBe(false)

      // 启动第二个编辑器
      act(() => {
        editor2.current.startEdit()
      })

      // 第一个应该自动退出
      expect(editor1.current.isEditing).toBe(false)
      expect(editor2.current.isEditing).toBe(true)
    })
  })
})

describe('安全性验证', () => {
  it('DocumentEditor应该净化文本输入', () => {
    const onSave = jest.fn()
    const { result } = renderHook(() =>
      useDocumentEditor({
        layerId: 'note-1',
        initialValue: '',
        onSave
      })
    )

    act(() => {
      result.current.startEdit()
    })

    // 输入包含HTML的文本
    const maliciousText = '<script>alert("XSS")</script>Hello'
    act(() => {
      const event = { target: { value: maliciousText } } as any
      result.current.handleChange(event)
    })

    act(() => {
      result.current.handleBlur()
    })

    // 应该净化HTML标签
    expect(onSave).toHaveBeenCalledWith(
      expect.not.stringContaining('<script>')
    )
  })
})

describe('性能优化验证', () => {
  it('编辑器应该正确处理快速切换', () => {
    const onSave = jest.fn()
    const { result } = renderHook(() =>
      useDocumentEditor({
        layerId: 'note-1',
        initialValue: 'Test',
        onSave
      })
    )

    // 快速开始和停止编辑
    for (let i = 0; i < 10; i++) {
      act(() => {
        result.current.startEdit()
        result.current.stopEdit()
      })
    }

    // 应该保持稳定状态
    expect(result.current.isEditing).toBe(false)
    // 每次停止都应该触发保存
    expect(onSave).toHaveBeenCalledTimes(10)
  })
})