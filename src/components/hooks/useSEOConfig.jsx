import { useState, useEffect } from 'react';
import { SEOConfig } from '@/api/entities';

const DEFAULT_CONFIGS = {
  '/home': {
    title: 'CABPOE™ Pilot Console — Chaos-Based Business Process Optimization',
    meta_description: 'Chaos-informed, stability-aware decisioning for BPO: live stability signals, Lyapunov drift and attractors, with closed-loop orchestration.',
    focus_keyword: 'Chaos-Based Business Process Optimization',
    secondary_keywords: ['Lyapunov stability', 'attractor states', 'BPO orchestration', 'stability-aware decisions']
  },
  '/about': {
    title: 'About CABPOE™ — Chaos-Based Business Process Optimization',
    meta_description: 'What CABPOE is and how it works: Chaos Core, Lyapunov, attractors, orchestration and the Gigsgen R&D behind the architecture.',
    focus_keyword: 'CABPOE',
    secondary_keywords: ['chaos computing', 'Lyapunov exponent', 'attractor', 'orchestrator']
  },
  '/legal-terms': {
    title: 'Terms of Service — CABPOE™',
    meta_description: 'The terms and conditions for using the CABPOE Pilot Console by Gigsgen® Digital Innovation Ltd.',
    focus_keyword: 'CABPOE Terms of Service',
    secondary_keywords: ['user obligations', 'limitations of liability', 'acceptable use', 'governing law']
  },
  '/legal-privacy': {
    title: 'Privacy Policy — CABPOE™',
    meta_description: 'How we handle personal data in the CABPOE Pilot Console, in line with UK and EU GDPR.',
    focus_keyword: 'CABPOE Privacy Policy',
    secondary_keywords: ['data protection', 'UK GDPR', 'data retention', 'user rights']
  },
  '/legal-cookies': {
    title: 'Cookie Policy — CABPOE™',
    meta_description: 'Our use of cookies and how you can manage your preferences in the CABPOE Pilot Console.',
    focus_keyword: 'CABPOE Cookie Policy',
    secondary_keywords: ['cookie categories', 'consent', 'preferences', 'analytics']
  },
  '/legal-accessibility': {
    title: 'Accessibility — CABPOE™',
    meta_description: 'Our commitment to accessible, inclusive experiences and how to contact support if you need assistance.',
    focus_keyword: 'CABPOE Accessibility',
    secondary_keywords: ['WCAG', 'assistive technology', 'contact support', 'inclusive design']
  }
};

export function useSEOConfig(path) {
  const [config, setConfig] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const configs = await SEOConfig.filter({ path });
        const existing = configs.length > 0 ? configs[0] : null;
        const defaultConfig = DEFAULT_CONFIGS[path];
        
        setConfig(existing || { ...defaultConfig, path });
      } catch (error) {
        console.error('Failed to load SEO config:', error);
        setConfig({ ...DEFAULT_CONFIGS[path], path });
      } finally {
        setIsLoading(false);
      }
    };

    loadConfig();
  }, [path]);

  return { config, isLoading, defaults: DEFAULT_CONFIGS[path] };
}