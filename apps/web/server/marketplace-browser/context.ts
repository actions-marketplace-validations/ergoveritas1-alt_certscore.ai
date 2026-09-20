import "server-only";
import { cookies } from "next/headers";
import type { BootstrapResult } from "../bootstrap-user";
import { BROWSER_WORKSPACE_COOKIE } from "./config";
import { ownedBrowserWorkspace } from "./repository";

export async function selectBrowserContext(base: BootstrapResult): Promise<BootstrapResult> {
  const id=(await cookies()).get(BROWSER_WORKSPACE_COOKIE)?.value;
  if(!id || !/^[0-9a-f-]{36}$/i.test(id)) return base;
  const org=await ownedBrowserWorkspace(id,base.user.id);
  if(!org) return base;
  return {...base,marketplaceBrowser:true,
    organization:{id:org.id,name:org.name,slug:org.slug,plan:"individual",planStatus:"active",created_at:org.created_at,updated_at:org.updated_at},
    membership:{id:org.id,organization_id:org.id,user_id:base.user.id,role:"user",created_at:org.created_at}};
}
