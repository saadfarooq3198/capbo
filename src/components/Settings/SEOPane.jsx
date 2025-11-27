import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { SEOConfig } from '@/api/entities';
import { useToast } from '@/components/ui/use-toast';
import { Search, AlertCircle, CheckCircle, X } from 'lucide-react';
import { useRole } from '../auth/RoleProvider';

const PAGES = [
  { path: '/home', label: 'Home Page' },
  { path: '/about', label: 'About CABPOE' },
  { path: '/legal-terms', label: 'Terms of Service' },
  { path: '/legal-privacy', label: 'Privacy Policy' },
  { path: '/legal-cookies', label: 'Cookie Policy' },
  { path: '/legal-accessibility', label: 'Accessibility Statement' }
];

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

function SERPPreview({ title, description, path, focusKeyword }) {
  const url = `https://console.cabpoe.com${path}`;
  const truncatedTitle = title?.length > 60 ? title.substring(0, 57) + '...' : title;
  const truncatedDesc = description?.length > 160 ? description.substring(0, 157) + '...' : description;
  
  const highlightKeyword = (text, keyword) => {
    if (!keyword || !text) return text;
    const regex = new RegExp(`(${keyword})`, 'gi');
    return text.split(regex).map((part, i) => 
      regex.test(part) ? <strong key={i}>{part}</strong> : part
    );
  };

  return (
    <Card className="bg-white border-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <Search className="h-4 w-4" />
          Search Preview
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        <div className="text-blue-600 text-lg leading-tight hover:underline cursor-pointer">
          {truncatedTitle || 'Page Title'}
        </div>
        <div className="text-green-700 text-sm">{url}</div>
        <div className="text-gray-600 text-sm leading-normal">
          {highlightKeyword(truncatedDesc || 'Meta description will appear here...', focusKeyword)}
        </div>
      </CardContent>
    </Card>
  );
}

function ValidationMessage({ type, message }) {
  const icons = {
    error: <AlertCircle className="h-4 w-4 text-red-500" />,
    warning: <AlertCircle className="h-4 w-4 text-yellow-500" />,
    success: <CheckCircle className="h-4 w-4 text-green-500" />
  };

  const colors = {
    error: 'text-red-600',
    warning: 'text-yellow-600',
    success: 'text-green-600'
  };

  return (
    <div className={`flex items-center gap-2 text-sm ${colors[type]}`}>
      {icons[type]}
      <span>{message}</span>
    </div>
  );
}

export default function SEOPane() {
  const [selectedPath, setSelectedPath] = useState('/home');
  const [config, setConfig] = useState({});
  const [newKeyword, setNewKeyword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const { effectiveRole } = useRole();

  const isReadOnly = effectiveRole !== 'admin';

  const loadConfig = useCallback(async (path) => {
    setIsLoading(true);
    try {
      const configs = await SEOConfig.filter({ path });
      const existing = configs.length > 0 ? configs[0] : null;
      const defaults = DEFAULT_CONFIGS[path] || {};
      
      setConfig(existing || { path, ...defaults, secondary_keywords: defaults.secondary_keywords || [] });
    } catch (error) {
      console.error('Failed to load SEO config:', error);
      const defaults = DEFAULT_CONFIGS[path] || {};
      setConfig({ path, ...defaults, secondary_keywords: defaults.secondary_keywords || [] });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConfig(selectedPath);
  }, [selectedPath, loadConfig]);

  const handleSave = async () => {
    if (isReadOnly) return;
    
    setIsSaving(true);
    try {
      // Check if config already exists
      const existing = await SEOConfig.filter({ path: selectedPath });
      
      if (existing.length > 0) {
        await SEOConfig.update(existing[0].id, config);
      } else {
        await SEOConfig.create(config);
      }
      
      toast({ title: 'Success', description: 'SEO configuration saved successfully.' });
    } catch (error) {
      console.error('Failed to save SEO config:', error);
      toast({ title: 'Error', description: 'Failed to save SEO configuration.', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const addKeyword = () => {
    if (!newKeyword.trim() || config.secondary_keywords?.length >= 4) return;
    const keywords = config.secondary_keywords || [];
    if (keywords.includes(newKeyword.trim())) return;
    
    setConfig({
      ...config,
      secondary_keywords: [...keywords, newKeyword.trim()]
    });
    setNewKeyword('');
  };

  const removeKeyword = (index) => {
    const keywords = config.secondary_keywords || [];
    setConfig({
      ...config,
      secondary_keywords: keywords.filter((_, i) => i !== index)
    });
  };

  // Validation
  const titleLength = config.title?.length || 0;
  const descLength = config.meta_description?.length || 0;
  const focusInTitle = config.title?.toLowerCase().includes(config.focus_keyword?.toLowerCase()) || false;
  const focusInDesc = config.meta_description?.toLowerCase().includes(config.focus_keyword?.toLowerCase()) || false;
  const hasSecondaryInDesc = config.secondary_keywords?.some(kw => 
    config.meta_description?.toLowerCase().includes(kw.toLowerCase())
  ) || false;

  const getTitleColor = () => {
    if (titleLength >= 30 && titleLength <= 60) return 'text-green-600';
    if (titleLength > 70) return 'text-red-600';
    return 'text-yellow-600';
  };

  const getDescColor = () => {
    if (descLength >= 70 && descLength <= 160) return 'text-green-600';
    if (descLength > 200) return 'text-red-600';
    return 'text-yellow-600';
  };

  const canSave = !isReadOnly && focusInTitle && focusInDesc;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">SEO Configuration</h2>
          <p className="text-gray-600 mt-1">Optimize how your pages appear in search results</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Page Selection</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={selectedPath} onValueChange={setSelectedPath}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a page" />
                </SelectTrigger>
                <SelectContent>
                  {PAGES.map(page => (
                    <SelectItem key={page.path} value={page.path}>
                      {page.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {isLoading ? (
            <Card>
              <CardContent className="py-12 text-center">
                <div className="animate-spin h-8 w-8 border-2 border-indigo-600 border-t-transparent rounded-full mx-auto"></div>
                <p className="mt-4 text-gray-500">Loading configuration...</p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>SEO Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Page Title <span className={getTitleColor()}>({titleLength}/60)</span>
                  </label>
                  <Input
                    value={config.title || ''}
                    onChange={(e) => setConfig({...config, title: e.target.value})}
                    placeholder="Enter page title"
                    disabled={isReadOnly}
                  />
                  {!focusInTitle && config.focus_keyword && (
                    <ValidationMessage type="error" message="Title should include the focus keyword" />
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Meta Description <span className={getDescColor()}>({descLength}/160)</span>
                  </label>
                  <Textarea
                    value={config.meta_description || ''}
                    onChange={(e) => setConfig({...config, meta_description: e.target.value})}
                    placeholder="Enter meta description"
                    rows={3}
                    disabled={isReadOnly}
                  />
                  {!focusInDesc && config.focus_keyword && (
                    <ValidationMessage type="error" message="Description should include the focus keyword" />
                  )}
                  {focusInDesc && !hasSecondaryInDesc && (
                    <ValidationMessage type="warning" message="Consider including a secondary keyword in the description" />
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Focus Keyword</label>
                  <Input
                    value={config.focus_keyword || ''}
                    onChange={(e) => setConfig({...config, focus_keyword: e.target.value})}
                    placeholder="Main keyword for this page"
                    disabled={isReadOnly}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Secondary Keywords ({config.secondary_keywords?.length || 0}/4)
                  </label>
                  <div className="flex gap-2 mb-2">
                    <Input
                      value={newKeyword}
                      onChange={(e) => setNewKeyword(e.target.value)}
                      placeholder="Add secondary keyword"
                      disabled={isReadOnly || (config.secondary_keywords?.length >= 4)}
                      onKeyPress={(e) => e.key === 'Enter' && addKeyword()}
                    />
                    <Button 
                      onClick={addKeyword}
                      disabled={isReadOnly || !newKeyword.trim() || (config.secondary_keywords?.length >= 4)}
                    >
                      Add
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {config.secondary_keywords?.map((keyword, index) => (
                      <Badge key={index} variant="outline" className="flex items-center gap-1">
                        {keyword}
                        {!isReadOnly && (
                          <button
                            onClick={() => removeKeyword(index)}
                            className="ml-1 hover:text-red-500"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        )}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Open Graph Image URL</label>
                  <Input
                    value={config.og_image_url || ''}
                    onChange={(e) => setConfig({...config, og_image_url: e.target.value})}
                    placeholder="https://example.com/image.jpg"
                    disabled={isReadOnly}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Canonical URL Override</label>
                  <Input
                    value={config.canonical_override || ''}
                    onChange={(e) => setConfig({...config, canonical_override: e.target.value})}
                    placeholder="https://console.cabpoe.com/home"
                    disabled={isReadOnly}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="noindex"
                    checked={config.noindex || false}
                    onCheckedChange={(checked) => setConfig({...config, noindex: checked})}
                    disabled={isReadOnly}
                  />
                  <label htmlFor="noindex" className="text-sm font-medium">
                    Prevent search engine indexing (noindex)
                  </label>
                </div>

                {!isReadOnly && (
                  <Button 
                    onClick={handleSave}
                    disabled={!canSave || isSaving}
                    className="w-full"
                  >
                    {isSaving ? 'Saving...' : 'Save SEO Configuration'}
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <SERPPreview 
            title={config.title}
            description={config.meta_description}
            path={selectedPath}
            focusKeyword={config.focus_keyword}
          />

          <Card>
            <CardHeader>
              <CardTitle>SEO Guidelines</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="space-y-2">
                <h4 className="font-semibold">Title Optimization</h4>
                <ul className="list-disc list-inside space-y-1 text-gray-600">
                  <li>Keep between 30-60 characters</li>
                  <li>Include your focus keyword</li>
                  <li>Make it compelling and clickable</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold">Description Best Practices</h4>
                <ul className="list-disc list-inside space-y-1 text-gray-600">
                  <li>Keep between 70-160 characters</li>
                  <li>Include focus keyword and 1-2 secondary keywords</li>
                  <li>Write for humans, not just search engines</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold">Keywords</h4>
                <ul className="list-disc list-inside space-y-1 text-gray-600">
                  <li>Choose one clear focus keyword per page</li>
                  <li>Use 2-4 related secondary keywords</li>
                  <li>Avoid keyword stuffing</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}