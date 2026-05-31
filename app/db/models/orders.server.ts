import { db } from "~/db/database.server";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface OrderItem {
  id: number;
  order_id: number;
  product_id: number;
  price_at_purchase: number;
  product_name?: string;
  product_slug?: string;
  product_image_url?: string;
}

export interface Order {
  id: number;
  order_number: string;
  user_id: number | null;
  guest_email: string;
  guest_name: string;
  guest_phone: string;
  shipping_address: string;
  shipping_city: string;
  total_amount: number;
  payment_status: "pending" | "paid" | "failed";
  payment_method: string;
  txn_ref_no: string;
  created_at: string;
  items?: OrderItem[];
}

export interface OrderStats {
  total_orders: number;
  total_revenue: number;
  pending_payments: number;
  orders_today: number;
}

function generateOrderNumber(): string {
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).substring(2, 7);
  return `ORD-${ts}-${rand}`.toUpperCase();
}

export async function createOrder(data: {
  userId?: number;
  guestEmail?: string;
  guestName?: string;
  guestPhone?: string;
  shippingAddress?: string;
  shippingCity?: string;
  items: { productId: number; price: number }[];
  totalAmount: number;
}): Promise<Order> {
  const orderNumber = generateOrderNumber();

  await db.query("BEGIN");
  try {
    const result = await db.query(
      `INSERT INTO orders
       (order_number, user_id, guest_email, guest_name, guest_phone,
        shipping_address, shipping_city, total_amount)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
      [
        orderNumber,
        data.userId || null,
        data.guestEmail || "",
        data.guestName || "",
        data.guestPhone || "",
        data.shippingAddress || "",
        data.shippingCity || "",
        data.totalAmount
      ]
    );

    const orderId = result.rows[0].id;

    for (const item of data.items) {
      await db.query(
        `INSERT INTO order_items (order_id, product_id, price_at_purchase)
         VALUES ($1, $2, $3)`,
        [orderId, item.productId, item.price]
      );
    }

    await db.query("COMMIT");
    return (await getOrderById(orderId)) as Order;
  } catch (err) {
    await db.query("ROLLBACK");
    throw err;
  }
}

export async function getOrderByNumber(orderNumber: string): Promise<Order | undefined> {
  const result = await db.query("SELECT * FROM orders WHERE order_number = $1", [orderNumber]);
  const order = result.rows[0];

  if (!order) return undefined;

  const itemsResult = await db.query(
    `SELECT oi.*, p.name AS product_name, p.slug AS product_slug, p.image_url AS product_image_url
     FROM order_items oi
     JOIN products p ON oi.product_id = p.id
     WHERE oi.order_id = $1`,
    [order.id]
  );
  order.items = itemsResult.rows;

  return order;
}

export async function getOrderById(id: number): Promise<Order | undefined> {
  const result = await db.query("SELECT * FROM orders WHERE id = $1", [id]);
  const order = result.rows[0];

  if (!order) return undefined;

  const itemsResult = await db.query(
    `SELECT oi.*, p.name AS product_name, p.slug AS product_slug, p.image_url AS product_image_url
     FROM order_items oi
     JOIN products p ON oi.product_id = p.id
     WHERE oi.order_id = $1`,
    [order.id]
  );
  order.items = itemsResult.rows;

  return order;
}

export async function updatePaymentStatus(
  orderNumber: string,
  status: "pending" | "paid" | "failed",
  txnRefNo?: string
): Promise<Order | undefined> {
  await db.query("BEGIN");
  try {
    const sets = ["payment_status = $1"];
    const values: any[] = [status];
    let paramCount = 2;

    if (txnRefNo) {
      sets.push(`txn_ref_no = $${paramCount++}`);
      values.push(txnRefNo);
    }

    values.push(orderNumber);
    await db.query(
      `UPDATE orders SET ${sets.join(", ")} WHERE order_number = $${paramCount}`,
      values
    );

    if (status === "paid") {
      const orderRes = await db.query("SELECT id FROM orders WHERE order_number = $1", [orderNumber]);
      const order = orderRes.rows[0];

      if (order) {
        const itemsRes = await db.query("SELECT product_id FROM order_items WHERE order_id = $1", [order.id]);
        const items = itemsRes.rows;

        for (const item of items) {
          await db.query("UPDATE products SET status = 'sold' WHERE id = $1", [item.product_id]);
          await db.query("DELETE FROM cart_items WHERE product_id = $1", [item.product_id]);
        }
      }
    }
    await db.query("COMMIT");
    
    const finalOrder = await getOrderByNumber(orderNumber);
    if (status === "paid" && finalOrder) {
      // Fire off the email asynchronously (don't await it so we don't slow down the response)
      import("~/services/email.server").then(({ sendOrderConfirmationEmail }) => {
        sendOrderConfirmationEmail(finalOrder).catch(console.error);
      }).catch(console.error);
    }
    
    return finalOrder;
  } catch (err) {
    await db.query("ROLLBACK");
    throw err;
  }
}

export async function getAllOrders(opts: {
  status?: string;
  page?: number;
  limit?: number;
} = {}): Promise<{ orders: Order[]; total: number; page: number; totalPages: number }> {
  const page = Math.max(opts.page ?? 1, 1);
  const limit = Math.max(opts.limit ?? 20, 1);
  const offset = (page - 1) * limit;

  const conditions: string[] = [];
  const params: any[] = [];
  let paramCount = 1;

  if (opts.status) {
    conditions.push(`payment_status = $${paramCount++}`);
    params.push(opts.status);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const totalRes = await db.query(`SELECT COUNT(*) AS count FROM orders ${where}`, params);
  const total = parseInt(totalRes.rows[0].count, 10);

  const ordersRes = await db.query(
    `SELECT * FROM orders ${where}
     ORDER BY created_at DESC
     LIMIT $${paramCount} OFFSET $${paramCount + 1}`,
    [...params, limit, offset]
  );

  return {
    orders: ordersRes.rows,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getOrdersByUser(userId: number): Promise<Order[]> {
  const ordersRes = await db.query("SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC", [userId]);
  const orders = ordersRes.rows;

  for (const order of orders) {
    const itemsRes = await db.query(
      `SELECT oi.*, p.name AS product_name, p.slug AS product_slug, p.image_url AS product_image_url
       FROM order_items oi
       JOIN products p ON oi.product_id = p.id
       WHERE oi.order_id = $1`,
      [order.id]
    );
    order.items = itemsRes.rows;
  }

  return orders;
}

export async function getOrderStats(): Promise<OrderStats> {
  const todayStr = new Date().toISOString().slice(0, 10);

  const totalOrdersRes = await db.query("SELECT COUNT(*) AS count FROM orders");
  const totalRevenueRes = await db.query("SELECT COALESCE(SUM(total_amount), 0) AS total FROM orders WHERE payment_status = 'paid'");
  const pendingPaymentsRes = await db.query("SELECT COUNT(*) AS count FROM orders WHERE payment_status = 'pending'");
  const ordersTodayRes = await db.query("SELECT COUNT(*) AS count FROM orders WHERE DATE(created_at) = $1", [todayStr]);

  return {
    total_orders: parseInt(totalOrdersRes.rows[0].count, 10),
    total_revenue: parseFloat(totalRevenueRes.rows[0].total),
    pending_payments: parseInt(pendingPaymentsRes.rows[0].count, 10),
    orders_today: parseInt(ordersTodayRes.rows[0].count, 10),
  };
}
