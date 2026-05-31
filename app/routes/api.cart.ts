import type { ActionFunctionArgs } from "react-router";

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const actionType = String(formData.get("action"));
  const productId = parseInt(String(formData.get("productId")));

  const { getSessionId, getOptionalUser } = await import("~/services/auth.server");
  const { addToCart, removeFromCart } = await import("~/db/models/cart.server");

  const sessionId = await getSessionId(request);
  const user = await getOptionalUser(request);
  const userId = user?.id;

  if (actionType === "add" && productId) {
    try {
      await addToCart(productId, sessionId, userId);
      return { success: true };
    } catch (e: any) {
      return { error: e.message };
    }
  }

  if (actionType === "remove" && productId) {
    await removeFromCart(productId, sessionId);
    return { success: true };
  }

  return { error: "Invalid action" };
}
