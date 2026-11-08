import { describe, expect, it } from 'vitest';
import { answerApproved, approveAnswer, approvePack, buildLetter, buildResume, confirmByUser, displayStatus, emptyWorkspace, matchSkills, openHandoff, packApproved, packBlockers, resumeText, safeJobUrl, sampleWorkspace, suggestAnswer, type Workspace } from './domain';
function personal(): Workspace { const w=sampleWorkspace(); return {...w,mode:'personal',jobs:w.jobs.map(j=>({...j,source:'manual' as const,url:'https://careers.example.com/roles/support'}))}; }
function ready(): Workspace {const w=personal();w.questions=[];return approvePack(w,w.jobs[0]);}
describe('untrusted URLs',()=>{
 it.each(['javascript:alert(1)','data:text/html,x','http://example.com','https://user:password@example.com','https://127.0.0.1/a','https://localhost/a','https://private.internal/a','https://2130706433/a','https://[::1]/a','https://example.com:8443/a','https://example.com\\evil',' https://example.com'])('rejects %s',(url)=>expect(safeJobUrl(url)).toBeNull());
 it('accepts only normalised public HTTPS references',()=>expect(safeJobUrl('https://careers.example.com/role?id=1')).toBe('https://careers.example.com/role?id=1'));
});
describe('truthful deterministic preparation',()=>{
 it('exports only verified qualifications',()=>{const w=sampleWorkspace();const r=buildResume(w.profile,w.jobs[1]);expect(r.skills.map(s=>s.name)).not.toContain('SQL');expect(resumeText(r)).not.toContain('Zendesk');expect(r.experience[0].company).toBe('Sample Market');});
 it('does not invent gap skills or employer accomplishments',()=>{const w=sampleWorkspace();const before=JSON.stringify(w.profile);const m=matchSkills(w.profile,w.jobs[0]);expect(m.gaps).toContain('Zendesk');expect(buildLetter(w.profile,w.jobs[0])).not.toContain('Zendesk');expect(JSON.stringify(w.profile)).toBe(before);});
 it('filters unverified experience and education',()=>{const w=sampleWorkspace();w.profile.experience[0].verified=false;w.profile.educationVerified=false;expect(buildResume(w.profile).experience).toHaveLength(1);expect(buildResume(w.profile).education).toBe('');});
 it('does not phrase-match part of a word',()=>{const w=sampleWorkspace();w.jobs[0].description='We excelled at scheduling.';expect(matchSkills(w.profile,w.jobs[0]).matched.map(s=>s.name)).not.toContain('Excel');});
 it('never expands an empty profile into sample facts',()=>{const w=emptyWorkspace();expect(resumeText(buildResume(w.profile))).toBe('');expect(packBlockers(w,sampleWorkspace().jobs[0])).toContain('Add your name.');});
 it('unknown questions produce no fabricated answer',()=>{const p=sampleWorkspace().profile;expect(suggestAnswer('Why do you love our company?',p)).toMatchObject({text:'',missing:true,facts:[]});});
 it.each(['Are you authorised to work in the US?','What is your desired salary?','What is your gender?','Do you consent to data retention?','When are you available to start?','What is your age?'])('never infers sensitive or personal choices: %s',q=>expect(suggestAnswer(q,sampleWorkspace().profile)).toMatchObject({text:'',missing:true}));
 it('answers supported work questions with verified facts only',()=>{const p=sampleWorkspace().profile;const result=suggestAnswer('Describe your experience.',p);expect(result.missing).toBe(false);expect(result.text).toContain(p.experience[0].bullets[0]);expect(result.text).not.toContain('SQL');});
});
describe('exact answer review and audit',()=>{
 it('stores the exact approved text and context',()=>{const w=personal();const q={...w.questions[0],response:'I answered customer questions at the service desk.'};const approved=approveAnswer(q,w.profile,w.jobs[0],'2026-11-08T22:00:00.000Z');expect(answerApproved(approved,w.profile,w.jobs[0])).toBe(true);expect(approved.audit[0].text).toBe(q.response);expect(approved.approval?.at).toBe('2026-11-08T22:00:00.000Z');});
 it('editing text invalidates approval',()=>{const w=personal();const q=approveAnswer({...w.questions[0],response:'My exact answer.'},w.profile,w.jobs[0]);expect(answerApproved({...q,response:'Changed answer.'},w.profile,w.jobs[0])).toBe(false);});
 it('changing profile or vacancy invalidates answer approval',()=>{const w=personal();const q=approveAnswer({...w.questions[0],response:'My answer.'},w.profile,w.jobs[0]);expect(answerApproved(q,{...w.profile,name:'Different'},w.jobs[0])).toBe(false);expect(answerApproved(q,w.profile,{...w.jobs[0],company:'Another employer'})).toBe(false);});
 it('rejects empty approval',()=>{const w=personal();expect(()=>approveAnswer(w.questions[0],w.profile,w.jobs[0])).toThrow();});
 it('retains bounded exact history without claiming external send',()=>{const w=personal();let q={...w.questions[0],response:'One'};q=approveAnswer(q,w.profile,w.jobs[0]);q=approveAnswer({...q,response:'Two'},w.profile,w.jobs[0]);expect(q.audit.map(a=>a.text)).toEqual(['One','Two']);});
});
describe('manual handoff status machine',()=>{
 it('required unanswered question blocks pack',()=>{const w=personal();expect(()=>approvePack(w,w.jobs[0])).toThrow();});
 it('optional unanswered question can be skipped, but a drafted one needs approval',()=>{const w=personal();w.questions[0].required=false;expect(packBlockers(w,w.jobs[0])).toEqual([]);w.questions[0].response='Draft';expect(packBlockers(w,w.jobs[0]).length).toBeGreaterThan(0);});
 it('approval means ready not submitted',()=>{const w=ready();expect(displayStatus(w,w.jobs[0])).toBe('ready');expect(JSON.stringify(w.applications)).not.toContain('submitted');});
 it('letter, template and verified resume edits invalidate pack approval',()=>{const w=ready();const j=w.jobs[0];expect(packApproved({...w,letters:{[j.id]:'Edited letter'}},j)).toBe(false);expect(packApproved({...w,template:'compact'},j)).toBe(false);expect(packApproved({...w,profile:{...w.profile,name:'Edited name'}},j)).toBe(false);});
 it('no handoff without current exact pack approval',()=>{const w=personal();expect(()=>openHandoff(w,w.jobs[0])).toThrow();});
 it('sample mode cannot open applications even after approval',()=>{let w=sampleWorkspace();w.questions=[];w=approvePack(w,w.jobs[0]);expect(()=>openHandoff(w,w.jobs[0])).toThrow(/Sample/);});
 it('handoff is not submission confirmation',()=>{const w=ready();const next=openHandoff(w,w.jobs[0]);expect(displayStatus(next,w.jobs[0])).toBe('handoff-opened');expect(next.applications[0].confirmation).toBeUndefined();});
 it('confirmation requires previous handoff and user-provided evidence',()=>{const w=ready();const j=w.jobs[0];expect(()=>confirmByUser(w,j,'I saw confirmation')).toThrow();const next=openHandoff(w,j);expect(()=>confirmByUser(next,j,' ')).toThrow();const confirmed=confirmByUser(next,j,'I saw confirmation #123');expect(displayStatus(confirmed,j)).toBe('confirmed-by-user');expect(confirmed.applications[0].confirmation).toBe('I saw confirmation #123');});
});
