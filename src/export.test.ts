import { describe, expect, it } from 'vitest';
import { Document, Packer, Paragraph } from 'docx';
import { buildResume, resumeText, sampleWorkspace } from './domain';
describe('document output smoke checks',()=>{
 it('can generate a nonempty DOCX OOXML archive without a network call',async()=>{const text=resumeText(buildResume(sampleWorkspace().profile));const doc=new Document({sections:[{children:text.split('\n').map(s=>new Paragraph(s))}]});const bytes=await Packer.toBuffer(doc);expect(bytes.length).toBeGreaterThan(100);expect(bytes.subarray(0,2).toString()).toBe('PK');});
 it('plain text preserves verified facts and excludes unverified qualifications',()=>{const w=sampleWorkspace();const text=resumeText(buildResume(w.profile,w.jobs[1]));expect(text).toContain('Maintained a weekly shift schedule in Excel.');expect(text).not.toContain('SQL');});
});
