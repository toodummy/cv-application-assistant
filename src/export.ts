import type { Resume } from './domain';
export function downloadFile(content: BlobPart, name: string, type: string) {
  const blob = new Blob([content], {type}); const url = URL.createObjectURL(blob);
  const anchor=document.createElement('a'); anchor.href=url; anchor.download=name; anchor.click();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
}
export async function exportDocx(resume:Resume, compact=false) {
  const {Document,Packer,Paragraph,TextRun,HeadingLevel} = await import('docx');
  const line=(text:string,heading?:typeof HeadingLevel[keyof typeof HeadingLevel])=>new Paragraph({text,heading,spacing:{after:compact?80:140}});
  const doc=new Document({creator:'CareerKit local prototype',title:'Resume',description:'Applicant-reviewed resume',sections:[{properties:{page:{size:{width:12240,height:15840},margin:{top:900,bottom:900,left:1000,right:1000}}},children:[
    line(resume.name,HeadingLevel.TITLE),line([resume.email,resume.location].filter(Boolean).join(' | ')),line(resume.headline),
    ...(resume.experience.length?[line('Experience',HeadingLevel.HEADING_1),...resume.experience.flatMap(e=>[new Paragraph({children:[new TextRun({text:e.title+' — '+e.company,bold:true})]}),line(e.dates),...e.bullets.filter(Boolean).map(b=>new Paragraph({text:b,bullet:{level:0}}))])]:[]),
    ...(resume.skills.length?[line('Skills',HeadingLevel.HEADING_1),line(resume.skills.map(s=>s.name).join(' · '))]:[]),
    ...(resume.education?[line('Education',HeadingLevel.HEADING_1),line(resume.education)]:[])
  ]}]});
  const blob=await Packer.toBlob(doc); downloadFile(blob,'resume.docx','application/vnd.openxmlformats-officedocument.wordprocessingml.document');
}
