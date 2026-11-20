import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import App, { NOTICE_TIMEOUT_MS } from './App';
import { saveWorkspace } from './storage';
import { sampleWorkspace } from './domain';
beforeEach(()=>{localStorage.clear();vi.spyOn(window,'confirm').mockReturnValue(true);});
describe('accessible applicant-controlled prototype',()=>{
 it('shows the public prototype banner',()=>{render(<App/>);expect(screen.getByRole('note')).toHaveTextContent('Prototype — sample data only, nothing is submitted, data stays in your browser');});
 it('labels sample jobs and never offers a sample apply action',()=>{render(<App/>);expect(screen.getByText(/All people, companies and vacancies shown are fictional/)).toBeInTheDocument();fireEvent.click(screen.getByRole('button',{name:/^Vacancies$/}));expect(screen.getAllByText('FICTIONAL EXAMPLE')).toHaveLength(2);fireEvent.click(screen.getAllByRole('button',{name:/Prepare this application/})[0]);expect(screen.getByRole('button',{name:/Sample vacancy · handoff disabled/})).toBeDisabled();});
 it('starts a genuinely empty personal workspace',()=>{render(<App/>);fireEvent.click(screen.getByRole('button',{name:/Start my workspace/}));expect(screen.getByLabelText('Full name')).toHaveValue('');expect(screen.queryByDisplayValue('Jordan Taylor')).not.toBeInTheDocument();expect(screen.getByLabelText('Save on this device')).not.toBeChecked();});
 it('lets the user approve and copy only an exact question answer',()=>{render(<App/>);fireEvent.click(screen.getByRole('button',{name:/Questions to review/}));expect(screen.getByRole('button',{name:'Copy approved answer'})).toBeDisabled();fireEvent.click(screen.getByRole('button',{name:'Use suggestion as editable draft'}));fireEvent.click(screen.getByRole('button',{name:'Approve exact answer'}));expect(screen.getByRole('button',{name:'Copy approved answer'})).toBeEnabled();fireEvent.change(screen.getByLabelText('Your exact response · Example Studio'),{target:{value:'Changed after approval'}});expect(screen.getByRole('button',{name:'Copy approved answer'})).toBeDisabled();expect(screen.queryByRole('button',{name:/^send/i})).not.toBeInTheDocument();});
 it('renders untrusted text as text, not active HTML',()=>{const w=sampleWorkspace();w.profile.name='<img src=x onerror=alert(1)>';saveWorkspace(localStorage,w,true);const {container}=render(<App/>);expect(within(screen.getByRole('article',{name:'Exact CV preview'})).getByText('<img src=x onerror=alert(1)>')).toBeInTheDocument();expect(container.querySelector('img')).toBeNull();});
 it('print button invokes only browser print; no submission',()=>{const print=vi.spyOn(window,'print').mockImplementation(()=>{});render(<App/>);fireEvent.click(screen.getByRole('button',{name:/^Application pack$/}));fireEvent.click(screen.getByRole('button',{name:'Print / Save PDF'}));expect(print).toHaveBeenCalledOnce();expect(screen.getByRole('article',{name:'Exact CV preview'})).toHaveAttribute('id','cv-document');});
 it('clears saved data and current profile without touching unrelated storage',()=>{saveWorkspace(localStorage,sampleWorkspace(),true);localStorage.setItem('unrelated','keep');render(<App/>);fireEvent.click(screen.getByRole('button',{name:'Clear all'}));expect(screen.getByLabelText('Full name')).toHaveValue('');expect(screen.getByLabelText('Save on this device')).not.toBeChecked();expect(localStorage.getItem('careerkit.local-workspace.v1')).toBeNull();expect(localStorage.getItem('unrelated')).toBe('keep');});
 describe('notice toast and navigation regressions',()=>{
  async function copyApprovedAnswer(){
   const writeText=vi.fn().mockResolvedValue(undefined);
   Object.defineProperty(navigator,'clipboard',{value:{writeText},configurable:true});
   render(<App/>);
   fireEvent.click(screen.getByRole('button',{name:/Questions to review/}));
   fireEvent.click(screen.getByRole('button',{name:'Use suggestion as editable draft'}));
   fireEvent.click(screen.getByRole('button',{name:'Approve exact answer'}));
   await act(async()=>{fireEvent.click(screen.getByRole('button',{name:'Copy approved answer'}));});
   expect(writeText).toHaveBeenCalledOnce();
   expect(screen.getByRole('status')).toHaveTextContent(/Copied locally\. Nothing was sent\./);
  }
  it('keeps the polite live region and auto-dismisses the toast after the timeout',async()=>{
   vi.useFakeTimers();
   try{
    await copyApprovedAnswer();
    const region=screen.getByRole('status');
    expect(region).toHaveAttribute('aria-live','polite');
    act(()=>{vi.advanceTimersByTime(NOTICE_TIMEOUT_MS-100);});
    expect(region).toHaveTextContent(/Copied locally/);
    act(()=>{vi.advanceTimersByTime(200);});
    expect(screen.getByRole('status')).not.toHaveTextContent(/Copied locally/);
    expect(screen.getByRole('status')).toBeInTheDocument();
   }finally{vi.useRealTimers();}
  });
  it('clears the toast when the user switches views',async()=>{
   await copyApprovedAnswer();
   fireEvent.click(screen.getByRole('button',{name:/^Tracker$/}));
   expect(screen.getByRole('status')).not.toHaveTextContent(/Copied locally/);
   fireEvent.click(screen.getByRole('button',{name:/^My profile$/}));
   expect(screen.queryByText(/Copied locally/)).not.toBeInTheDocument();
  });
  it('shows no stray step numbers in navigation and marks only the active tab',()=>{
   render(<App/>);
   const nav=screen.getByRole('navigation',{name:'Workspace'});
   expect(nav.textContent).not.toMatch(/0[1-5]/);
   expect(within(nav).getByRole('button',{name:/^My profile$/})).toHaveAttribute('aria-current','page');
   expect(nav.querySelectorAll('[aria-current="page"]')).toHaveLength(1);
   fireEvent.click(within(nav).getByRole('button',{name:/^Tracker$/}));
   expect(within(nav).getByRole('button',{name:/^Tracker$/})).toHaveAttribute('aria-current','page');
   expect(within(nav).getByRole('button',{name:/^My profile$/})).not.toHaveAttribute('aria-current');
  });
 });
});
