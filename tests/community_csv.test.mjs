import test from 'node:test';
import assert from 'node:assert/strict';
import {createJiti} from 'jiti';
const {parseRegistryCsv}=await createJiti(import.meta.url).import('../src/lib/community/csv.ts');
test('CSV handles BOM, CRLF, escaped quotes, embedded newlines and optional blank fields',()=>{
 assert.deepEqual(parseRegistryCsv('\uFEFFexternal_key,name,email\r\nP-1,"Sample, ""Family""\nName",\r\n'),[{external_key:'P-1',name:'Sample, "Family"\nName'}]);
});
test('CSV rejects malformed quotes, ambiguous headers, incorrect columns and excessive source/rows',()=>{
 for(const csv of ['a,a\nx,y','a,\nx,y','a,b\nx','a\n"unclosed','a\n"quoted"tail','a\nabc"def','a\n'])assert.throws(()=>parseRegistryCsv(csv));
 assert.throws(()=>parseRegistryCsv('a\n'+Array(1001).fill('x').join('\n')),/1,000/);
 assert.throws(()=>parseRegistryCsv('a\n'+'x'.repeat(1048576)),/1 MiB/);
});
test('late file reads cannot overwrite a newer file or cleared import context',async()=>{
 const {createRegistryFileReader}=await createJiti(import.meta.url).import('../src/lib/community/csv.ts');
 const reader=createRegistryFileReader(),accepted=[],errors=[];
 let finishOld,finishNew;
 const old=reader.read({size:10,text:()=>new Promise(r=>{finishOld=r;})},s=>accepted.push(s),s=>errors.push(s));
 const newer=reader.read({size:10,text:()=>new Promise(r=>{finishNew=r;})},s=>accepted.push(s),s=>errors.push(s));
 finishNew('new file');await newer;finishOld('old file');await old;assert.deepEqual(accepted,['new file']);
 let finishCleared;
 const cleared=reader.read({size:10,text:()=>new Promise(r=>{finishCleared=r;})},s=>accepted.push(s),s=>errors.push(s));
 reader.clear();finishCleared('previous context');await cleared;assert.deepEqual(accepted,['new file']);assert.deepEqual(errors,[]);
});
