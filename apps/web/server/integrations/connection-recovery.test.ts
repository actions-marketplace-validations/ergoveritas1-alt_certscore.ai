import assert from 'node:assert/strict';
import test from 'node:test';
import {connectionRecovery} from './connection-recovery';
test('diagnostics distinguish read-only, removed membership, exhausted and unknown quota',()=>{
 const read=connectionRecovery(true,false,null);assert.equal(read.canRequestScanNow,false);assert.match(read.nextAction,/Reconnect/);
 const removed=connectionRecovery(false,true,true);assert.equal(removed.canRequestScanNow,false);assert.match(removed.nextAction,/membership/);
 const exhausted=connectionRecovery(true,true,false);assert.equal(exhausted.canRequestScanNow,false);assert.match(exhausted.nextAction,/Wait/);
 const unknown=connectionRecovery(true,true,null);assert.equal(unknown.canRequestScanNow,false);assert.match(unknown.nextAction,/could not be checked/);
 assert.equal(connectionRecovery(true,true,true).canRequestScanNow,true);
});
