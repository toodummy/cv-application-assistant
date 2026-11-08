import { beforeEach, describe, expect, it } from 'vitest';
import { clearWorkspace, loadWorkspace, saveWorkspace, STORAGE_KEY } from './storage';
import { sampleWorkspace } from './domain';
beforeEach(()=>localStorage.clear());
describe('explicit device saving',()=>{
 it('starts unsaved with explicitly labelled synthetic sample data',()=>{const state=loadWorkspace(localStorage);expect(state.persist).toBe(false);expect(state.workspace.mode).toBe('sample');expect(localStorage.length).toBe(0);});
 it('does not store without opt-in',()=>{expect(saveWorkspace(localStorage,sampleWorkspace(),false)).toBe(true);expect(localStorage.getItem(STORAGE_KEY)).toBeNull();});
 it('round trips opt-in data',()=>{saveWorkspace(localStorage,sampleWorkspace(),true);const result=loadWorkspace(localStorage);expect(result.persist).toBe(true);expect(result.workspace).toEqual(sampleWorkspace());});
 it('turning saving off removes saved data',()=>{saveWorkspace(localStorage,sampleWorkspace(),true);saveWorkspace(localStorage,sampleWorkspace(),false);expect(localStorage.getItem(STORAGE_KEY)).toBeNull();});
 it('clear removes app data, clears audit, and preserves unrelated storage',()=>{localStorage.setItem('other-app','keep');saveWorkspace(localStorage,sampleWorkspace(),true);const cleared=clearWorkspace(localStorage);expect(cleared.mode).toBe('personal');expect(cleared.profile.name).toBe('');expect(cleared.questions).toEqual([]);expect(cleared.approvals).toEqual({});expect(localStorage.getItem(STORAGE_KEY)).toBeNull();expect(localStorage.getItem('other-app')).toBe('keep');});
 it.each(['not JSON','{"version":1,"workspace":{}}','{"version":2}'])('invalid saved state fails safe without throwing',raw=>{localStorage.setItem(STORAGE_KEY,raw);expect(loadWorkspace(localStorage).workspace.mode).toBe('personal');expect(localStorage.getItem(STORAGE_KEY)).toBeNull();});
 it('reports unavailable storage rather than claiming saved',()=>{const store={getItem:()=>null,setItem:()=>{throw new Error('disabled');},removeItem:()=>{throw new Error('disabled');}};expect(saveWorkspace(store,sampleWorkspace(),true)).toBe(false);});
});
