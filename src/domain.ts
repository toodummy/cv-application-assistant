export type Mode = 'sample' | 'personal';
export type Template = 'classic' | 'compact';
export interface Skill { id: string; name: string; verified: boolean }
export interface Experience { id: string; title: string; company: string; dates: string; bullets: string[]; verified: boolean }
export interface Profile { name: string; email: string; location: string; headline: string; education: string; educationVerified: boolean; skills: Skill[]; experience: Experience[] }
export interface Job { id: string; title: string; company: string; location: string; description: string; url: string; source: 'sample' | 'manual' }
export interface AnswerAudit { text: string; context: string; at: string }
export interface Question { id: string; jobId: string; kind: 'form' | 'message'; text: string; required: boolean; response: string; approval?: AnswerAudit; audit: AnswerAudit[] }
export type ApplicationStatus = 'needs-user' | 'ready' | 'handoff-opened' | 'confirmed-by-user';
export interface Application { jobId: string; status: ApplicationStatus; updatedAt: string; confirmation?: string }
export interface PackApproval { snapshot: string; at: string }
export interface Workspace { mode: Mode; profile: Profile; jobs: Job[]; selectedJobId: string; template: Template; letters: Record<string, string>; questions: Question[]; approvals: Record<string, PackApproval>; applications: Application[] }
export interface Resume { name: string; email: string; location: string; headline: string; education: string; skills: Skill[]; experience: Experience[] }
export const MAX_TEXT = 15000;
export const MAX_ANSWER = 5000;
export const id = () => crypto.randomUUID();
export const now = () => new Date().toISOString();
export function safeJobUrl(raw: string): string | null {
  if (!raw || raw.length > 2000 || Array.from(raw).some(c => c.charCodeAt(0) <= 32 || c.charCodeAt(0) === 127 || c === '\\')) return null;
  try {
    const url = new URL(raw);
    const host = url.hostname.toLowerCase();
    if (url.protocol !== 'https:' || url.username || url.password || url.port || !host.includes('.') || host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.local') || host.endsWith('.internal') || /^[\d.]+$/.test(host) || host.includes(':')) return null;
    return url.href;
  } catch { return null; }
}
const words = (s: string) => s.toLowerCase().replace(/[^a-z0-9+#]+/g, ' ').trim();
function contains(text: string, term: string) { return (` ${words(text)} `).includes(` ${words(term)} `) && words(term).length > 0; }
export function matchSkills(profile: Profile, job: Job) {
  const verified = profile.skills.filter(s => s.verified && s.name.trim());
  const matched = verified.filter(s => contains(job.description + ' ' + job.title, s.name));
  const other = verified.filter(s => !matched.some(m => m.id === s.id));
  const vocabulary = ['Excel', 'SQL', 'Zendesk', 'Salesforce', 'CRM', 'Customer support', 'Scheduling', 'Data entry', 'Python', 'Project management'];
  const gaps = vocabulary.filter(term => contains(job.description, term) && !verified.some(s => words(s.name) === words(term)));
  return { matched, other, gaps };
}
export function buildResume(profile: Profile, job?: Job): Resume {
  const skills = job ? [...matchSkills(profile, job).matched, ...matchSkills(profile, job).other] : profile.skills.filter(s => s.verified && s.name.trim());
  const experience = profile.experience.filter(e => e.verified && e.title.trim() && e.company.trim());
  const relevance = (e: Experience) => job ? skills.filter(s => contains(job.description, s.name) && contains(e.bullets.join(' '), s.name)).length : 0;
  return { name: profile.name.trim(), email: profile.email.trim(), location: profile.location.trim(), headline: profile.headline.trim(), education: profile.educationVerified ? profile.education.trim() : '', skills, experience: [...experience].sort((a,b) => relevance(b) - relevance(a)) };
}
export function resumeText(resume: Resume) {
  return [resume.name, [resume.email, resume.location].filter(Boolean).join(' | '), resume.headline,
    resume.experience.length ? 'EXPERIENCE' : '', ...resume.experience.flatMap(e => [e.title + ' — ' + e.company, e.dates, ...e.bullets.filter(Boolean).map(b => '• ' + b)]),
    resume.skills.length ? 'SKILLS' : '', resume.skills.map(s => s.name).join(' · '), resume.education ? 'EDUCATION' : '', resume.education].filter(Boolean).join('\n');
}
export function buildLetter(profile: Profile, job: Job) {
  const resume = buildResume(profile, job);
  const facts = resume.experience.flatMap(e => e.bullets.filter(Boolean)).slice(0,2);
  return [`Dear hiring team at ${job.company},`, `Please consider my application for ${job.title}.`, facts.length ? 'My experience includes:\n' + facts.map(f => '• ' + f).join('\n') : '',
    matchSkills(profile, job).matched.length ? 'Relevant skills I have verified: ' + matchSkills(profile, job).matched.map(s=>s.name).join(', ') + '.' : '',
    'Thank you for considering my application.', resume.name].filter(Boolean).join('\n\n');
}
export function suggestAnswer(question: string, profile: Profile): { text: string; facts: string[]; missing: boolean; reason: string } {
  if (/authori[sz]|sponsor|visa|citizen|salary|compensation|pay expectation|disabil|race|ethnic|gender|pronoun|veteran|health|birth|religio|criminal|convict|consent|agree|signature|ssn|social security|relocat|start date|available|age\b/i.test(question)) {
    return { text: '', facts: [], missing: true, reason: 'This needs your own explicit answer or consent. Sensitive, eligibility, salary and personal-choice answers are never inferred.' };
  }
  const resume = buildResume(profile);
  if (/\b(skill|skills|tools|technologies)\b/i.test(question) && resume.skills.length) {
    const facts = resume.skills.map(s=>s.name); return { text: 'My verified skills include ' + facts.join(', ') + '.', facts, missing:false, reason: 'Based only on skills you marked verified. Review against the exact question.' };
  }
  if (/\b(experience|background|previous role|previous work)\b/i.test(question) && resume.experience.length) {
    const facts = resume.experience.flatMap(e => [e.title + ' at ' + e.company + (e.dates ? ' (' + e.dates + ')' : ''), ...e.bullets.filter(Boolean)]);
    return { text: facts.join('\n'), facts, missing:false, reason: 'Verified work facts only. Select and edit the parts that answer this question.' };
  }
  if (/\b(education|degree|studied)\b/i.test(question) && resume.education) return { text:resume.education, facts:[resume.education], missing:false, reason:'From your verified education field.' };
  return { text:'', facts:[], missing:true, reason:'No sufficiently specific verified fact is available. Enter your own answer; do not invent a qualification or reason.' };
}
export function answerContext(q: Question, profile: Profile, job: Job) { return JSON.stringify({question:q.text, kind:q.kind, required:q.required, employer:job.company, vacancy:job.title, jobId:job.id, response:q.response, profile}); }
export function answerApproved(q: Question, profile: Profile, job: Job) { return !!q.response.trim() && q.approval?.context === answerContext(q, profile, job) && q.approval.text === q.response; }
export function approveAnswer(q: Question, profile: Profile, job: Job, at=now()): Question {
  if (!q.response.trim()) throw new Error('Write and review an answer before approving.');
  const approval = { text:q.response, context:answerContext(q,profile,job), at };
  return {...q,approval,audit:[...q.audit, approval].slice(-30)};
}
export function currentLetter(w: Workspace, job: Job) { return w.letters[job.id] ?? buildLetter(w.profile,job); }
export function packSnapshot(w: Workspace, job: Job) {
  return JSON.stringify({job,template:w.template,resume:buildResume(w.profile,job),letter:currentLetter(w,job),questions:w.questions.filter(q=>q.jobId===job.id).map(q=>({text:q.text,kind:q.kind,required:q.required,response:q.response,approved:answerApproved(q,w.profile,job)}))});
}
export function packBlockers(w: Workspace, job: Job): string[] {
  const r = buildResume(w.profile,job); const blockers: string[] = [];
  if (!r.name) blockers.push('Add your name.');
  if (!r.experience.length && !r.skills.length && !r.education) blockers.push('Verify at least one experience, skill or education fact.');
  if (!currentLetter(w,job).trim()) blockers.push('Review a cover-letter draft.');
  if (w.questions.some(q => q.jobId===job.id && (q.required || q.response.trim()) && !answerApproved(q,w.profile,job))) blockers.push('Approve all required or drafted question responses, or clear an optional draft to skip it.');
  return blockers;
}
export function packApproved(w: Workspace, job: Job) { return !packBlockers(w,job).length && w.approvals[job.id]?.snapshot === packSnapshot(w,job); }
export function approvePack(w: Workspace, job: Job): Workspace {
  if (packBlockers(w,job).length) throw new Error('Resolve the review checklist first.');
  return {...w, approvals:{...w.approvals,[job.id]:{snapshot:packSnapshot(w,job),at:now()}}, applications:upsertApplication(w.applications,{jobId:job.id,status:'ready',updatedAt:now()})};
}
function upsertApplication(apps: Application[], app: Application) { return [...apps.filter(a=>a.jobId!==app.jobId),app]; }
export function openHandoff(w: Workspace, job: Job): Workspace {
  if (job.source === 'sample' || w.mode === 'sample') throw new Error('Sample vacancies cannot be opened or applied to.');
  if (!safeJobUrl(job.url)) throw new Error('Add a valid public HTTPS employer URL.');
  if (!packApproved(w,job)) throw new Error('Review and approve the current exact pack first.');
  return {...w,applications:upsertApplication(w.applications,{jobId:job.id,status:'handoff-opened',updatedAt:now()})};
}
export function confirmByUser(w: Workspace, job: Job, note: string): Workspace {
  const app = w.applications.find(a=>a.jobId===job.id);
  if (job.source==='sample' || !app || app.status!=='handoff-opened') throw new Error('Open an approved manual handoff first.');
  if (!note.trim()) throw new Error('Describe the confirmation you personally saw.');
  return {...w,applications:upsertApplication(w.applications,{jobId:job.id,status:'confirmed-by-user',updatedAt:now(),confirmation:note.trim().slice(0,1000)})};
}
export function displayStatus(w: Workspace, job: Job): ApplicationStatus {
  const app = w.applications.find(a=>a.jobId===job.id);
  if (app?.status==='confirmed-by-user' || app?.status==='handoff-opened') return app.status;
  return packApproved(w,job) ? 'ready' : 'needs-user';
}
export const statusLabel: Record<ApplicationStatus,string> = {'needs-user':'Needs your review','ready':'Ready · not sent','handoff-opened':'Handoff opened · not confirmed','confirmed-by-user':'Confirmed · self-reported'};
export function emptyWorkspace(): Workspace { return {mode:'personal',profile:{name:'',email:'',location:'',headline:'',education:'',educationVerified:false,skills:[],experience:[]},jobs:[],selectedJobId:'',template:'classic',letters:{},questions:[],approvals:{},applications:[]}; }
export function sampleWorkspace(): Workspace {
  const w = emptyWorkspace();
  return {...w,mode:'sample', profile:{name:'Jordan Taylor',email:'jordan@example.com',location:'Austin, TX',headline:'Customer support & operations',education:'Associate degree in Business Administration · Example Community College · 2025',educationVerified:true,
    skills:[{id:'skill-1',name:'Customer support',verified:true},{id:'skill-2',name:'Excel',verified:true},{id:'skill-3',name:'Scheduling',verified:true},{id:'skill-4',name:'SQL',verified:false}],
    experience:[{id:'exp-1',title:'Customer service associate',company:'Sample Market',dates:'2024–2025',bullets:['Answered customer questions at the service desk.','Maintained a weekly shift schedule in Excel.'],verified:true},{id:'exp-2',title:'Volunteer coordinator',company:'Example Food Pantry',dates:'2023–2024',bullets:['Coordinated volunteer scheduling and shared weekly updates.'],verified:true}]},
    jobs:[{id:'sample-support',title:'Customer Support Associate',company:'Example Studio',location:'Austin, TX · Hybrid',description:'Fictional vacancy for this prototype only. Customer support, Excel and scheduling. Respond clearly to customer questions and keep accurate records. Zendesk is helpful.',url:'',source:'sample'}, {id:'sample-ops',title:'Operations Assistant',company:'Sample Works',location:'U.S. · On-site',description:'Fictional vacancy for this prototype only. Support scheduling, Excel reporting and data entry. SQL is helpful.',url:'',source:'sample'}],selectedJobId:'sample-support',
    questions:[{id:'sample-question',jobId:'sample-support',kind:'form',text:'What customer service experience would you bring to this role?',required:true,response:'',audit:[]}]};
}
