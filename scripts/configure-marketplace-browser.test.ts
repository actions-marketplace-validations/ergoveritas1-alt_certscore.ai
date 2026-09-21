import assert from "node:assert/strict";
import test from "node:test";
import {configureMarketplaceBrowser} from "./configure-marketplace-browser";
test("browser switch touches only public web flag and preserves MCP and capacity",()=>{
 const task={family:"certscore-web-certscore",cpu:"1024",containerDefinitions:[{name:"certscore-web",environment:[{name:"CERTSCORE_MARKETPLACE_LIGHT_ENABLED",value:"1"},{name:"CERTSCORE_MARKETPLACE_PRODUCT_CODE",value:"a3p2vfccdufqnuhyn5r8lsx0q"}]}]};
 assert.equal(configureMarketplaceBrowser(task,"preserve"),task);
 const enabled=configureMarketplaceBrowser(task,"enable");
 assert.equal(enabled.cpu,task.cpu);
 assert.deepEqual(enabled.containerDefinitions[0].environment,[...task.containerDefinitions[0].environment,{name:"CERTSCORE_MARKETPLACE_BROWSER_ENABLED",value:"1"}]);
 assert.equal(configureMarketplaceBrowser(enabled,"disable").containerDefinitions[0].environment?.find(e=>e.name==="CERTSCORE_MARKETPLACE_BROWSER_ENABLED")?.value,"0");
 assert.throws(()=>configureMarketplaceBrowser({...task,family:"certscore-web-mcp"},"enable"));
});
