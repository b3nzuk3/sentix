// Simple template renderer for the theme extraction prompt
export interface Context {
  project: { name: string; description: string };
  signals: Array<{ id: string; text: string; source: string; account_name?: string }>;
  personas?: Array<{ name: string; description: string }>;
  architectureComponents?: Array<{ name: string; status?: string; description: string }>;
  past_decisions?: Array<{ title: string; description: string }>;
}

function renderTemplate(template: string, context: Context): string {
  // Helper to replace loops with indices
  const processLoop = (content: string, items: any[], indexName: string, itemName: string): string => {
    return items.map((item, idx) => {
      let itemContent = content;
      // Replace {{ loop.index0 }} with idx
      itemContent = itemContent.replace(/\{\{\s*loop\.index0\s*\}\}/g, String(idx));
      // Replace {{ loop.index }} with idx+1
      itemContent = itemContent.replace(/\{\{\s*loop\.index\s*\}\}/g, String(idx + 1));
      
      // Replace {{ item.xxx }}
      const replaceVar = (varName: string, value: any) => {
        const pattern = new RegExp(`\{\{\s*${varName}\s*\}\}`, 'g');
        return value != null ? itemContent.replace(pattern, String(value)) : itemContent;
      };
      
      for (const key of Object.keys(item)) {
        const placeholder = `${itemName}.${key}`;
        itemContent = replaceVar(placeholder, item[key]);
      }
      
      return itemContent;
    }).join('');
  };

  let result = template;
  
  // Replace simple project variables
  result = result.replace(/\{\{\s*project_name\s*\}\}/g, context.project.name);
  result = result.replace(/\{\{\s*project_description\s*\}\}/g, context.project.description);
  
  // Handle conditionals
  // {% if personas %}...{% endif %}
  result = result.replace(/\{% if personas %\}([\s\S]*?)\{% endif %\}/g, (match, content) => {
    return context.personas && context.personas.length > 0 ? content : '';
  });
  
  // {% if architecture_summary %}...{% endif %}
  result = result.replace(/\{% if architecture_summary %\}([\s\S]*?)\{% endif %\}/g, (match, content) => {
    return context.architectureComponents && context.architectureComponents.length > 0 ? content : '';
  });
  
  // {% if past_decisions %}...{% endif %}
  result = result.replace(/\{% if past_decisions %\}([\s\S]*?)\{% endif %\}/g, (match, content) => {
    return context.past_decisions && context.past_decisions.length > 0 ? content : '';
  });
  
  // Loops
  // {% for persona in personas %}...{% endfor %}
  result = result.replace(/\{% for persona in personas %\}([\s\S]*?)\{% endfor %\}/g, (match, content) => {
    return processLoop(content, context.personas || [], 'loop', 'persona');
  });
  
  // {% for comp in architecture_summary %}...{% endfor %}
  result = result.replace(/\{% for comp in architecture_summary %\}([\s\S]*?)\{% endfor %\}/g, (match, content) => {
    return processLoop(content, context.architectureComponents || [], 'loop', 'comp');
  });
  
  // {% for decision in past_decisions %}...{% endfor %}
  result = result.replace(/\{% for decision in past_decisions %\}([\s\S]*?)\{% endfor %\}/g, (match, content) => {
    return processLoop(content, context.past_decisions || [], 'loop', 'decision');
  });
  
  // {% for signal in signals %}...{% endfor %}
  result = result.replace(/\{% for signal in signals %\}([\s\S]*?)\{% endfor %\}/g, (match, content) => {
    return processLoop(content, context.signals, 'loop', 'signal');
  });
  
  // Clean up any remaining unreplaced placeholders (optional: could throw error)
  
  return result;
}

export const themeExtractionPrompt = {
  template: `You are a senior product analyst for a SaaS company. Your job: read customer signals (transcripts, support tickets, slack messages) and extract SPECIFIC product problems that require action.

## Project Context

Project: {{project_name}}
Description: {{project_description}}

{% if personas %}
## User Personas
{% for persona in personas %}
- {{ persona.name }}: {{ persona.description }}
{% endfor %}
{% endif %}

{% if architecture_summary %}
## Architecture Components
{% for comp in architecture_summary %}
- {{ comp.name }} ({{ comp.status }}): {{ comp.description }}
{% endfor %}
{% endif %}

{% if past_decisions %}
## Past Decisions
{% for decision in past_decisions %}
- {{ decision.title }}: {{ decision.description }}
{% endfor %}
{% endif %}

## Signals

{% for signal in signals %}
[{{ loop.index0 }}] ID: {{ signal.id }}
Source: {{ signal.source }}
Account: {{ signal.account_name or 'N/A' }}
Content: {{ signal.text }}

{% endfor %}

## Instructions

1. Read all signals carefully.
2. Identify specific product problems (NOT generic categories).
3. Each problem must be:
   - **Actionable**: Can be turned into a specific ticket or project
   - **Specific**: Includes WHO is affected and WHY it matters
   - **Evidence-based**: Referenced by signal ID(s)

## BAD OUTPUT (DO NOT DO)

- "Authentication issues"
- "Performance problems"
- "Feature requests"
- "UI/UX improvements"

## GOOD OUTPUT (DO THIS)

- "Missing SAML/SSO is blocking enterprise deals and delaying procurement (ref: signals 0, 3)" because customers cannot integrate with their identity providers.
- "CSV uploads fail for files >50MB, breaking weekly data import workflow for power users (ref: signal 7)" due to memory limits in the parser.
- "PM team output is too generic and not actionable (ref: signals 12, 15)" because the AI prompt lacks specificity constraints.

## Output Format

Respond with ONLY a JSON object:

{
  "themes": [
    {
      "title": "Specific product problem statement",
      "affected_users": "Who is affected (e.g., 'Enterprise admins', 'End users on free tier')",
      "reason": "Why this is a problem, including business impact if clear from signals",
      "evidence": ["signal_id_1", "signal_id_2", ...],  // IDs from above
      "confidence": 0.85  // 0-1 float, how certain are you this is a real problem? Consider signal clarity and agreement.
    }
  ]
}

Rules:
- Maximum 8 themes. If there are 20+ distinct problems, group by similarity.
- If a signal is noise (e.g., "great product!"), ignore it.
- Do NOT invent signal IDs - ONLY reference IDs that exist in the input.
- Title should be concise (5-10 words) but specific.`,
  
  build(context: Context): string {
    return renderTemplate(this.template, context);
  }
};
