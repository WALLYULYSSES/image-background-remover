# Image Background Remover - MVP 需求文档

## 产品概述

一个小而美的在线背景移除工具，核心特点：垂直、速度快、效果好、便宜、页面简洁。

## 核心功能

### 1. 单图背景移除
- 用户上传一张图片
- 系统自动移除背景
- 返回透明背景的 PNG 图片
- 支持预览对比（原图 vs 处理后）

### 2. 批量处理
- 支持一次上传多张图片（拖拽或点击选择）
- 显示处理进度
- 批量下载结果（ZIP 格式）

### 3. 下载功能
- 单张下载：PNG（透明背景）或 JPG（白色背景）
- 批量下载：ZIP 压缩包

## 用户界面

### 页面布局
```
┌─────────────────────────────────────┐
│  Image Background Remover           │
├─────────────────────────────────────┤
│                                     │
│  拖拽上传或点击选择图片              │
│  [拖拽区域]                         │
│                                     │
├─────────────────────────────────────┤
│  处理中的图片列表                    │
│  [图片卡片] [图片卡片] [图片卡片]    │
│                                     │
├─────────────────────────────────────┤
│  [下载全部] [清空]                  │
└─────────────────────────────────────┘
```

### 图片卡片
- 缩略图预览
- 文件名
- 处理状态（处理中 / 完成 / 失败）
- 进度条（处理中时显示）
- 单张下载按钮（完成时显示）

## 技术���构

### 前端
- **框架：** React + Vite
- **样式：** TailwindCSS
- **上传：** 原生 File API + Dropzone 交互
- **状态管理：** Zustand
- **HTTP 客户端：** Fetch API

### 后端
- **平台：** Cloudflare Workers
- **模型：** REMBG（开源背景移除模型）
- **存储：** 内存处理，无持久化

### 部署
- **前端：** Cloudflare Pages
- **后端：** Cloudflare Workers
- **域名：** 自定义域名（可选）

## API 设计

### 单图处理
```
POST /api/remove-bg
Content-Type: multipart/form-data

Body:
  image: File

Response:
  {
    "success": true,
    "data": {
      "taskId": "uuid",
      "status": "processing|completed|failed",
      "result": "base64 encoded PNG" (completed 时)
    }
  }
```

### 批量处理
```
POST /api/batch-remove
Content-Type: multipart/form-data

Body:
  images: File[] (多个文件)

Response:
  {
    "success": true,
    "data": {
      "batchId": "uuid",
      "tasks": [
        { "taskId": "uuid", "filename": "xxx.jpg", "status": "processing" },
        ...
      ]
    }
  }
```

### 查询处理结果
```
GET /api/result/:taskId

Response:
  {
    "success": true,
    "data": {
      "status": "processing|completed|failed",
      "result": "base64 encoded PNG" (completed 时)
    }
  }
```

## 数据流

1. 用户上传图片 → 前端验证（格式、大小）
2. 前端发送到后端 API
3. 后端使用 REMBG 模型处理
4. 返回处理结果（base64 PNG）
5. 前端显示预览 + 下载按钮
6. 用户下载结果

## 约束条件

### 性能
- 单张图片处理时间：< 5 秒
- 支持批量处理（同时处理多张）

### 限制
- 单张图片大小：< 10 MB
- 批量处理：< 20 张
- 内存处理，无持久化存储

### 成本
- 部署成本：Cloudflare 免费额度内
- 无数据库成本
- 无存储成本

## 开发周期

- **Day 1-2：** 前端框架 + UI 搭建
- **Day 2-3：** 后端 API + REMBG 集成
- **Day 4：** 批量处理、错误处理、优化
- **Day 5：** 部署、测试、上线

## 成功指标

- [ ] 页面加载时间 < 2 秒
- [ ] 单张处理时间 < 5 秒
- [ ] 批量处理支持 20 张以上
- [ ] 移除效果准确率 > 95%
- [ ] 用户界面简洁易用
- [ ] 支持主流图片格式（JPG、PNG、WebP）

## 后续功能（非 MVP）

- 背景替换（选择颜色或上传背景图）
- 图片编辑（裁剪、调整大小）
- 历史记录
- 用户账户系统
- API 付费模式
