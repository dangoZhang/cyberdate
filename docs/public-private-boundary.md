# Public / Private Boundary

更新时间：`2026-04-14`

## Public Repo: `cyberdate`

用途：

- 对外建立信任
- 公开“读取文件 -> 蒸馏 -> 不保留原始文件”的核心实现
- 给官网和 README 提供公开代码入口

公开范围：

- `src/lib/parsers/client.ts`
- `src/lib/deterministic-distill.ts`
- `src/lib/deterministic-distill.test.ts`
- `src/lib/content-safety.ts`
- `src/lib/display-text.ts`
- `src/lib/personality-guide.ts`
- `src/lib/personality-quiz.ts`
- `src/lib/skill-file.ts`
- `src/lib/constants.ts`
- `src/lib/schemas.ts`
- `src/lib/types.ts`
- `src/lib/utils.ts`

公开仓不包含：

- 任何 API key
- 任何 Supabase key
- 任何部署配置
- 任何私有 prompt 与运营规则

## Private Repo: `cyberdate-private`

保留范围：

- `src/app/api/auth/**`
- `src/app/api/connect/**`
- `src/lib/account-store.ts`
- `src/lib/auth-session.ts`
- `src/lib/distill-queue.ts`
- `src/lib/exchange-quota.ts`
- `src/lib/persistence.ts`
- `src/lib/twin-registry.ts`
- `src/lib/turnstile.ts`
- `src/lib/ai/providers.ts`
- `src/lib/ai/exchange*.ts`
- `src/lib/supabase/**`
- `supabase/**`

保留原因：

- 这里面有认证、反机器人、持久化、配额、风控、分享码、聊天、部署和生产运行策略

## User-Facing Privacy Wording

面向用户统一用这套说法：

- 上传文档后，网站不会保存原始文件
- 网站不会保存蒸馏过程中的中间产物
- 原始文件只在处理窗口内短暂使用，处理完成后立即销毁

不能省略的补充：

- 产品运行时会保存账号、skill 文件、分享码、聊天记录

## Release Flow

1. 在完整仓里开发和验证
2. 运行 `pnpm export:public`
3. 发布 `output/public-repo/cyberdate` 为公开仓
