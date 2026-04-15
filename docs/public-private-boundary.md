# Public / Private Boundary

更新时间：`2026-04-14`

## Public Repo: `cyberdate`

用途：

- 对外宣传 CyberDate 产品和正式站点
- 公开“读取文件 -> 蒸馏 -> 结果生成”的核心实现
- 公开一条最重要的隐私合规说明

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

## Private Repo: `cyberdate-private`

保留范围：

- 所有注册登录、分享码、匹配、对话、持久化、部署和密钥相关实现
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

- 这里面有真实生产运行能力和所有不适合公开的运行细节

## 面向用户的统一隐私说法

本网站不会保存用户上传的原始文件和原始文本数据。上传内容先在前端完成解析，服务端只接收生成结果必需的最小结构化线索；蒸馏完成后，原始文件和中间产物不落库、不长期保留。只有用户确认发布后的 skill 结果，才会按用户自己的分享设置保存和展示。
