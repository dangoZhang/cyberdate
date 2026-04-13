const SKILL_NAME_MAP: Record<string, string> = {
  "AI Workflow": "AI 工作流",
  "Browser Automation": "浏览器自动化",
  "Frontend Systems": "前端系统",
  "Product Thinking": "产品思维",
  "Growth Ops": "增长运营",
  "Backend APIs": "后端接口",
  "Data Ops": "数据工程",
  "Design Systems": "设计系统",
  "Mobile Craft": "移动端开发",
  "Infra Shipping": "部署与基础设施",
  "Realtime UX": "实时体验",
  "Creator Engine": "内容表达",
  "Collaboration Signal": "协作信号",
};

const ROLE_MAP: Record<string, string> = {
  "AI builder": "AI 构建者",
  "AI tinkerer": "AI 实验者",
  "Growth engineer": "增长工程师",
  "Infra strategist": "基础设施策略工程师",
};

export function displaySkillName(value: string) {
  return SKILL_NAME_MAP[value] ?? value;
}

export function displayRole(value: string) {
  return ROLE_MAP[value] ?? value;
}
