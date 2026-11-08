import type { Workspace } from './domain';
import { emptyWorkspace, sampleWorkspace } from './domain';
export const STORAGE_KEY = 'careerkit.local-workspace.v1';
const MAX_BYTES = 1_000_000;
interface Store { getItem(key:string): string|null; setItem(key:string,value:string):void; removeItem(key:string):void }
const obj = (x: unknown): x is Record<string, unknown> => !!x && typeof x==='object' && !Array.isArray(x);
const text = (x:unknown, max=15000): x is string => typeof x==='string' && x.length <= max;
const list = (x:unknown, cap=100): x is unknown[] => Array.isArray(x) && x.length<=cap;
function validWorkspace(x:unknown): x is Workspace {
  if (!obj(x) || !['sample','personal'].includes(String(x.mode)) || !['classic','compact'].includes(String(x.template)) || !text(x.selectedJobId,100) || !obj(x.profile)) return false;
  const p=x.profile;
  if (!['name','email','location','headline','education'].every(k=>text(p[k])) || typeof p.educationVerified!=='boolean' || !list(p.skills,50) || !list(p.experience,20)) return false;
  if (!p.skills.every(s=>obj(s)&&text(s.id,100)&&text(s.name,100)&&typeof s.verified==='boolean')) return false;
  if (!p.experience.every(e=>obj(e)&&['id','title','company','dates'].every(k=>text(e[k],300))&&list(e.bullets,30)&&e.bullets.every(b=>text(b,1000))&&typeof e.verified==='boolean')) return false;
  if (!list(x.jobs,100)||!x.jobs.every(j=>obj(j)&&['id','title','company','location','description','url'].every(k=>text(j[k]))&&['sample','manual'].includes(String(j.source)))) return false;
  if (!obj(x.letters)||!Object.values(x.letters).every(v=>text(v))) return false;
  if (!obj(x.approvals)||!Object.values(x.approvals).every(a=>obj(a)&&text(a.snapshot,200000)&&text(a.at,100))) return false;
  if (!list(x.questions,100)||!x.questions.every(q=>obj(q)&&['id','jobId','text','response'].every(k=>text(q[k]))&&typeof q.required==='boolean'&&['form','message'].includes(String(q.kind))&&list(q.audit,30)&&q.audit.every(a=>obj(a)&&text(a.text)&&text(a.context,100000)&&text(a.at,100))&&(!q.approval||(obj(q.approval)&&text(q.approval.text)&&text(q.approval.context,100000)&&text(q.approval.at,100))))) return false;
  if (!list(x.applications,100)||!x.applications.every(a=>obj(a)&&text(a.jobId,100)&&text(a.updatedAt,100)&&['needs-user','ready','handoff-opened','confirmed-by-user'].includes(String(a.status))&&(a.confirmation===undefined||text(a.confirmation,1000)))) return false;
  return true;
}
export function loadWorkspace(store:Store): {workspace:Workspace; persist:boolean; warning:string} {
  try {
    const raw=store.getItem(STORAGE_KEY);
    if (!raw) return {workspace:sampleWorkspace(),persist:false,warning:''};
    if (raw.length>MAX_BYTES) throw new Error('Oversized save');
    const parsed:unknown=JSON.parse(raw);
    if (!obj(parsed)||parsed.version!==1||!validWorkspace(parsed.workspace)) throw new Error('Invalid save');
    return {workspace:parsed.workspace,persist:true,warning:''};
  } catch {
    try { store.removeItem(STORAGE_KEY); } catch { /* storage may be disabled */ }
    return {workspace:emptyWorkspace(),persist:false,warning:'Saved data could not be read. An empty private workspace was opened; no data was uploaded.'};
  }
}
export function saveWorkspace(store:Store, workspace:Workspace, enabled:boolean): boolean {
  try {
    if (!enabled) store.removeItem(STORAGE_KEY);
    else { const raw=JSON.stringify({version:1,workspace}); if(raw.length>MAX_BYTES) return false; store.setItem(STORAGE_KEY,raw); }
    return true;
  } catch { return false; }
}
export function clearWorkspace(store:Store): Workspace { store.removeItem(STORAGE_KEY); return emptyWorkspace(); }
