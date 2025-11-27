const KEY = 'cabpoe.projectsSource';
const DEFAULT = {
  appId: '68b2e3b40b04f514a6720113',
  entity: 'Project',
  idField: 'id',
  nameField: 'name',
  slugField: 'slug',
  statusField: 'status',
  excludeStatus: ['archived']
};

export function getProjectsSource(){ 
  try{
    return { ...DEFAULT, ...(JSON.parse(localStorage.getItem(KEY)||'{}')) };
  } catch(_) { 
    return DEFAULT; 
  } 
}

export function setProjectsSource(cfg){
  localStorage.setItem(KEY, JSON.stringify({ ...DEFAULT, ...(cfg||{}) }));
}