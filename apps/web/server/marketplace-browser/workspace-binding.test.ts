import assert from "node:assert/strict";
import test from "node:test";
import { browserWorkspaceMatches } from "./workspace-binding";
const first="00000000-0000-4000-8000-000000000001", second="00000000-0000-4000-8000-000000000002";
test("a form cannot follow another tab into a different funding workspace",()=>{
  const context={marketplaceBrowser:true,organization:{id:first}};
  assert.equal(browserWorkspaceMatches(context,first),true);
  assert.equal(browserWorkspaceMatches({...context,organization:{id:second}},first),false);
  assert.equal(browserWorkspaceMatches({...context,marketplaceBrowser:false},first),false);
  assert.equal(browserWorkspaceMatches(context,undefined),false,"ordinary forms cannot implicitly consume Marketplace credits");
  assert.equal(browserWorkspaceMatches(context,""),false);
  assert.equal(browserWorkspaceMatches(context,second),false);
});
