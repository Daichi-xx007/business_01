import type { ActionFunctionArgs } from "react-router";

export async function action({ request }: ActionFunctionArgs) {
  const { destroySession } = await import("~/services/auth.server");
  const cookie = destroySession();
  return new Response(null, {
    status: 302,
    headers: { Location: "/", "Set-Cookie": cookie },
  });
}

export async function loader() {
  return new Response(null, { status: 302, headers: { Location: "/" } });
}
