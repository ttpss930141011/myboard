# Selection Tool Fix Test Scenario

## Problem Fixed
當編輯文字時，SelectionTool 不會消失了。

## 修改內容
在 `canvas.tsx` 的 `onPointerUp` 處理器中，添加了編輯狀態檢查：

```typescript
if (!editingLayerId) {
  unselectLayersHandler()
}
```

## 測試步驟

1. **創建文字物件**
   - 選擇文字工具
   - 在畫布上點擊創建文字

2. **測試選擇行為**
   - 點擊文字物件 → SelectionTool 應該出現
   - 再次點擊文字進入編輯模式 → SelectionTool 應該保持顯示
   - 在文字內多次點擊 → SelectionTool 應該始終保持顯示

3. **測試退出編輯**
   - 按 Escape → 退出編輯，SelectionTool 保持顯示
   - 點擊畫布空白處 → 退出編輯並取消選擇，SelectionTool 消失

4. **測試其他功能**
   - 選擇多個物件 → 正常工作
   - 拖動物件 → 正常工作
   - 使用形狀工具 → 正常工作

## 預期結果
- ✅ 編輯文字時 SelectionTool 不會消失
- ✅ 符合 Miro 的行為模式：選中 = SelectionTool 顯示
- ✅ 不影響其他功能的正常運作

## 設計原則
此修復遵循了：
- **單一職責原則**：Canvas 統一管理選擇邏輯
- **DRY**：不需要在多個組件重複邏輯
- **KISS**：簡單的條件檢查解決問題
- **開放封閉原則**：新增可編輯組件無需修改