import test from 'node:test';
import assert from 'node:assert/strict';
import {createJiti} from 'jiti';
const {assertCurrentProof,proofBytes,proofHash,scanProof}=await createJiti(import.meta.url).import('../src/lib/finance/proof.server.ts');
const pdf=Buffer.from('%PDF-1.4\nSynthetic test evidence');
test('download reauthorization refuses a clean-to-rejected transition during storage I/O',()=>{
 const expected={object_path:'tenant/document',sha256:proofHash(pdf),size_bytes:String(pdf.length)};
 assert.doesNotThrow(()=>assertCurrentProof(expected,{...expected,status:'clean'}));
 for(const current of [{status:'rejected'},{...expected,status:'rejected'},{...expected,status:'pending'},{...expected,status:'clean',sha256:'changed'}])assert.throws(()=>assertCurrentProof(expected,current),e=>e.status===403);
});
test('proof accepts bounded type-matched bytes and rejects ambiguous encoding',()=>{
 assert.deepEqual(proofBytes(pdf.toString('base64'),'application/pdf'),pdf);
 for(const [value,type] of [['abcd','application/pdf'],[pdf.toString('base64')+'\n','application/pdf'],[pdf.toString('base64'),'text/html'],['','image/png'],['A'.repeat(7000000),'image/jpeg']])assert.throws(()=>proofBytes(value,type));
});
test('scanner fails closed on missing configuration, redirect, outage, wrong hash or unknown verdict',async()=>{
 const saved={url:process.env.ENCLAVIX_SCANNER_URL,token:process.env.ENCLAVIX_SCANNER_TOKEN};
 try{
  delete process.env.ENCLAVIX_SCANNER_URL;delete process.env.ENCLAVIX_SCANNER_TOKEN;
  await assert.rejects(scanProof(pdf,'application/pdf'),e=>e.status===503);
  process.env.ENCLAVIX_SCANNER_TOKEN='disposable-scanner-token';process.env.ENCLAVIX_SCANNER_URL='https://scanner.example.test/scan';
  const stub=(body,status=200)=>async()=>new Response(JSON.stringify(body),{status});
  await assert.rejects(scanProof(pdf,'application/pdf',stub({},503)),e=>e.status===503);
  await assert.rejects(scanProof(pdf,'application/pdf',stub({sha256:'wrong',verdict:'clean'})),e=>e.status===503);
  await assert.rejects(scanProof(pdf,'application/pdf',stub({sha256:proofHash(pdf),verdict:'unknown'})),e=>e.status===503);
  assert.equal(await scanProof(pdf,'application/pdf',stub({sha256:proofHash(pdf),verdict:'infected'})),false);
  assert.equal(await scanProof(pdf,'application/pdf',async(url,init)=>{
   assert.equal(String(url),'https://scanner.example.test/scan');assert.equal(init.redirect,'error');assert.equal(init.cache,'no-store');assert.equal(init.headers['X-Content-SHA256'],proofHash(pdf));return new Response(JSON.stringify({sha256:proofHash(pdf),verdict:'clean'}));
  }),true);
  process.env.ENCLAVIX_SCANNER_URL='http://scanner.example.test/scan';await assert.rejects(scanProof(pdf,'application/pdf'),e=>e.status===503);
 }finally{
  for(const [key,value] of [['ENCLAVIX_SCANNER_URL',saved.url],['ENCLAVIX_SCANNER_TOKEN',saved.token]]){if(value===undefined)delete process.env[key];else process.env[key]=value;}
 }
});
