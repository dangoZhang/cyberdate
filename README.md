# CyberDate

> Public trust-facing core for CyberDate.

- Web: [skill-deploy-c7c76y96ge-codex-agent-deploys.vercel.app](https://skill-deploy-c7c76y96ge-codex-agent-deploys.vercel.app)
- Scope: local parsing, skill distill, MBTI / SBTI scoring, skill file generation, safety filter, zero-retention boundary

## What This Public Repo Contains

- 聊天记录、PDF、Markdown、文本、图片 OCR、GitHub README / repo 的读取与解析
- 结构化 skill 蒸馏核心
- MBTI / SBTI / 技能档案生成
- 黑名单与最小安全文本拼装
- 对“不存原始上传文件”的实现边界与测试

## What This Public Repo Does Not Contain

- 注册登录
- Cloudflare Turnstile
- Supabase
- 分享码解析
- 匹配与对话
- 配额、限流、运营策略
- 部署配置和任何生产密钥

## Privacy Boundary

- 网站不保存用户上传的原始文件
- 网站不保存蒸馏过程中的中间产物
- 原始文件只在处理窗口内临时使用，处理完成后立即销毁
- 生产站点会保存账号、skill 文件、分享码、聊天记录，这部分运行时不在这个公开仓里

## Source Layout

- `src/lib/parsers/client.ts`
- `src/lib/deterministic-distill.ts`
- `src/lib/display-text.ts`
- `src/lib/personality-guide.ts`
- `src/lib/personality-quiz.ts`
- `src/lib/content-safety.ts`
- `src/lib/skill-file.ts`
- `src/lib/constants.ts`
- `src/lib/schemas.ts`
- `src/lib/types.ts`
- `src/lib/utils.ts`

## Reference

- [therealXiaomanChu/ex-skill](https://github.com/therealXiaomanChu/ex-skill)
