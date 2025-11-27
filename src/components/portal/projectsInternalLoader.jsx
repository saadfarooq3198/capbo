import { Project } from '@/api/entities';

/**
 * Internal project loader that uses the same Entity SDK the Projects page uses.
 * This serves as a fallback when the direct Entities API is unavailable.
 */
export async function fetchProjectsInternal() {
  try {
    const projects = await Project.list('-updated_date', 100);
    
    return projects
      .filter(p => p.status !== 'archived')
      .map((item, i) => ({
        id: item.id || item._id || item.project_id || String(i),
        name: item.name || item.project_name || item.title || 'Untitled Project',
        slug: (item.slug || item.name || item.id || 'proj')
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, ''),
        status: (item.status || '').toLowerCase(),
        domain: item.domain || null,
        description: item.description || null,
        objective_weights: item.objective_weights || {},
        oscillator_label: item.oscillator_label || 'Lorenz (demo)',
        show_research_terminology: item.show_research_terminology !== false,
        created_date: item.created_date,
        updated_date: item.updated_date
      }));
  } catch (error) {
    console.warn("CABPOE/projectsInternalLoader: Internal fetch failed.", error);
    return [];
  }
}