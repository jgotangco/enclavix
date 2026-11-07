import test from 'node:test';
import assert from 'node:assert/strict';
import {createJiti} from 'jiti';
const {calculateAssessment:calc,totalAssessments:sum}=await createJiti(import.meta.url).import('../src/lib/finance/assessment.ts');

test('assessment bases preserve exact decimal products and half-up ties',()=>{
 assert.equal(calc({basis:'fixed',rate:'3000'}),'3000.00');
 assert.equal(calc({basis:'lot_area',rate:'12.345',quantity:'100.25'}),'1237.59');
 assert.equal(calc({basis:'floor_area',rate:'0.1',quantity:'0.05'}),'0.01');
 assert.equal(calc({basis:'ownership_share',rate:'100000',quantity:'0.00000005'}),'0.01');
 assert.equal(calc({basis:'asset_quantity',rate:'125.005',quantity:'2'}),'250.01');
 assert.equal(calc({basis:'fixed',rate:'1.00499999'}),'1.00');
 assert.equal(calc({basis:'fixed',rate:'1.005'}),'1.01');
 assert.equal(calc({basis:'fixed',rate:'0'}),'0.00');
});
test('batch total sums rounded lines rather than rounding their combined raw input',()=>{
 const line=calc({basis:'fixed',rate:'0.005'});
 assert.equal(sum([line,line,line]),'0.03');
 assert.equal(sum([]),'0.00');
 assert.equal(sum(['999999999999.98','0.01']),'999999999999.99');
 assert.throws(()=>sum(['999999999999.99','0.01']),/range/);
});
test('large exact product survives binary floating-point limits',()=>{
 assert.equal(calc({basis:'lot_area',rate:'99999999.99999999',quantity:'9999'}),'999900000000.00');
 assert.throws(()=>calc({basis:'fixed',rate:'999999999999.995'}),/range/);
});
test('malformed amounts and unsafe coercion are rejected',()=>{
 for(const rate of ['-1','+1',' 1','1 ','01','1e3','NaN','Infinity','1.000000001','1000000000000','',1,null]) {
  assert.throws(()=>calc({basis:'fixed',rate}));
 }
 for(const amount of ['1','1.001','-0.01','01.00',NaN]) assert.throws(()=>sum([amount]));
 assert.throws(()=>sum(Array(10001).fill('0.00')),/Too many/);
});
test('missing dimensions and invalid shares or asset counts never silently default',()=>{
 assert.throws(()=>calc({basis:'fixed',rate:'1',quantity:'1'}));
 assert.throws(()=>calc({basis:'floor_area',rate:'1'}));
 for(const quantity of ['0','1.00000001']) assert.throws(()=>calc({basis:'ownership_share',rate:'1',quantity}));
 assert.throws(()=>calc({basis:'asset_quantity',rate:'1',quantity:'1.5'}));
 assert.throws(()=>calc({basis:'unknown',rate:'1'}));
});
