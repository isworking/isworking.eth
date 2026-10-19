import { handle, json } from "@/lib/server/http";
import { checkLabel } from "@/lib/server/registrar";

export const GET = handle(async (req: Request) => {
  return json(await checkLabel(new URL(req.url).searchParams.get("name") ?? ""));
});
