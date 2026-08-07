import { CityStats, Grid, WeatherState, WeatherAlert } from "../types";

export type AdvisorRole = 'planner' | 'liaison' | 'emergency';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'advisor';
  role: AdvisorRole;
  text: string;
  timestamp: string;
}

export interface AdvisorRoleConfig {
  id: AdvisorRole;
  name: string;
  badge: string;
  description: string;
  iconName: string;
  systemInstruction: string;
}

export const ADVISOR_ROLES: Record<AdvisorRole, AdvisorRoleConfig> = {
  planner: {
    id: 'planner',
    name: 'Chief City Strategist',
    badge: 'Pro Reasoning',
    description: 'Complex urban planning, fiscal optimization & structural zoning',
    iconName: 'Brain',
    systemInstruction: `You are the Chief City Strategist for Sky Metropolis, a futuristic floating city simulation.
Your task is to analyze complex urban challenges, financial efficiency, building placement synergy, and long-term expansion plans.
Provide deep, highly actionable, strategic advice considering current population, money treasury, building counts, and resilience levels.
Keep responses clear, well-structured, professional, and directly tailored to the live city state provided.`
  },
  liaison: {
    id: 'liaison',
    name: 'District Liaison',
    badge: 'General Flash',
    description: 'Citizen sentiment, public welfare, events & community goals',
    iconName: 'MessageSquare',
    systemInstruction: `You are the District Liaison for Sky Metropolis.
Your task is to speak on behalf of the citizens, address public sentiment, offer community management advice, and guide civic development.
Be warm, engaging, perceptive, and focused on population growth, happiness, parks, commercial services, and general city living.`
  },
  emergency: {
    id: 'emergency',
    name: 'Tactical Emergency Officer',
    badge: 'Fast Lite',
    description: 'Rapid weather crisis dispatch, atmospheric shields & storm mitigation',
    iconName: 'Zap',
    systemInstruction: `You are the Tactical Emergency Officer for Sky Metropolis.
Your task is to respond rapidly to weather incidents, blizzards, monsoons, and atmospheric threats.
Give swift, direct, concise instructions regarding Atmospheric Shields, Resilience Beacons, and disaster defense protocols.
Keep advice urgent, precise, and fast-paced.`
  }
};

export async function sendAdvisorMessage(
  role: AdvisorRole,
  userMessage: string,
  history: ChatMessage[],
  cityContext: {
    stats: CityStats;
    grid: Grid;
    weather: WeatherState;
    weatherAlert: WeatherAlert | null;
  }
): Promise<string> {
  const roleConfig = ADVISOR_ROLES[role];

  try {
    const response = await fetch("/api/gemini/advisor", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [...history, { sender: 'user', role, text: userMessage, id: Date.now().toString(), timestamp: new Date().toLocaleTimeString() }],
        stats: cityContext.stats,
        systemPrompt: roleConfig.systemInstruction
      })
    });

    if (response.ok) {
      const data = await response.json();
      if (data.reply) {
        return data.reply;
      }
    }
  } catch (error) {
    console.warn("Server advisor call failed, using procedural advisor response:", error);
  }

  // Procedural intelligent fallback if server offline/no key
  if (role === 'planner') {
    return `**Strategic Advisory:** Your city currently has $${cityContext.stats.money} in treasury and ${cityContext.stats.population} citizens on Day ${cityContext.stats.day}.\n\nTo optimize revenue, ensure a balanced 2:1 ratio of Residential to Commercial zones. If severe weather occurs, upgrade high-value structures to Resilience Tier 3 to prevent severe economic output losses!`;
  } else if (role === 'liaison') {
    return `**Citizen Liaison:** Greetings Mayor! The citizens of Sky Metropolis are feeling positive about our growth! Placing Parks near Residential buildings significantly boosts local appeal. Consider adding a Monument once your treasury reaches $2,500!`;
  } else {
    return `**Emergency Dispatch:** Atmospheric status: ${cityContext.weather.condition}. ${cityContext.weatherAlert ? `CRISIS ALERT ACTIVE: ${cityContext.weatherAlert.title}` : 'Weather is currently manageable.'}\n\nDeploy Atmospheric Shield Domes at key intersections to protect surrounding buildings within a 4-tile radius from storm damage!`;
  }
}
