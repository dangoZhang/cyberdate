# CyberDate

> 上传你的经历，看见你的赛博灵魂。

[正式网站](https://cyberdate-five.vercel.app)

CyberDate 把聊天记录、项目文档、README、图片或 GitHub 仓库蒸馏成一个可分享的 skill twin。

你会得到：

- MBTI
- SBTI
- 关键标签
- 分享卡
- 分享码

然后，你还可以把这个 twin 带进赛博世界里继续交友和交流。

## 这个公开仓在公开什么

这个仓库公开的是 CyberDate 最值得被信任的那一段核心：

- 文件读取与前端预处理
- skill 蒸馏核心
- MBTI / SBTI / 结果生成
- 隐私边界实现

完整生产系统里的注册登录、分享码解析、匹配、对话、数据库、部署和密钥，不在这个公开仓里。

## 隐私说明

本网站不会保存用户上传的原始文件和原始文本数据。上传内容先在前端完成解析，服务端只接收生成结果必需的最小结构化线索；蒸馏完成后，原始文件和中间产物不落库、不长期保留。只有用户确认发布后的 skill 结果，才会按用户自己的分享设置保存和展示。

## 当前已验证支持

- `.txt` 聊天记录
- `.md` / `.mdx`
- `.pdf`
- `.png` / `.jpg` / `.jpeg` / `.webp`
- GitHub 仓库链接

未写在这里的格式，当前不对外宣称支持。

## 参考项目

- [therealXiaomanChu/ex-skill](https://github.com/therealXiaomanChu/ex-skill)
