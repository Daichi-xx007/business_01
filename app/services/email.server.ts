import nodemailer from "nodemailer";
import type { Order } from "~/db/models/orders.server";

// We create a reusable transporter object using the default SMTP transport
const createTransporter = () => {
  const email = process.env.SMTP_EMAIL;
  const pass = process.env.SMTP_PASSWORD;

  if (!email || !pass) {
    console.warn("SMTP_EMAIL or SMTP_PASSWORD not set. Emails will not be sent.");
    return null;
  }

  return nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true, // true for 465, false for other ports
    auth: {
      user: email,
      pass: pass,
    },
  });
};

export async function sendOrderConfirmationEmail(order: Order) {
  const transporter = createTransporter();
  if (!transporter) return;

  const siteName = process.env.SITE_NAME || "Our Store";
  const adminEmail = "asia.ahtasham@yahoo.com";
  const customerEmail = order.guest_email;

  // Build the items list HTML
  const itemsHtml = order.items
    ?.map(
      (item) =>
        `<tr>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.product_name}</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">Rs. ${item.price_at_purchase.toLocaleString()}</td>
        </tr>`
    )
    .join("");

  // Base email template
  const generateEmailHtml = (title: string, subtitle: string) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
      <h1 style="color: #E8A87C; text-align: center; margin-bottom: 5px;">${siteName}</h1>
      <h2 style="text-align: center; color: #1A1A1A; margin-top: 0;">${title}</h2>
      <p style="text-align: center; color: #666; font-size: 16px;">${subtitle}</p>
      
      <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin-top: 30px;">
        <h3 style="margin-top: 0; border-bottom: 2px solid #E8A87C; padding-bottom: 10px;">Order Details (#${order.order_number})</h3>
        
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <tbody>
            ${itemsHtml}
            <tr>
              <td style="padding: 15px 10px 10px 10px; font-weight: bold; font-size: 18px;">Total</td>
              <td style="padding: 15px 10px 10px 10px; font-weight: bold; font-size: 18px; text-align: right; color: #E8A87C;">Rs. ${order.total_amount.toLocaleString()}</td>
            </tr>
          </tbody>
        </table>

        <h4 style="margin-bottom: 5px;">Shipping Information:</h4>
        <p style="margin: 0; color: #555; line-height: 1.5;">
          <strong>Name:</strong> ${order.guest_name}<br>
          <strong>Phone:</strong> ${order.guest_phone}<br>
          <strong>Address:</strong> ${order.shipping_address}<br>
          <strong>City:</strong> ${order.shipping_city}
        </p>
      </div>
      
      <p style="text-align: center; font-size: 12px; color: #999; margin-top: 30px;">
        Thank you for choosing ${siteName}!
      </p>
    </div>
  `;

  try {
    // 1. Send email to the Customer
    if (customerEmail) {
      await transporter.sendMail({
        from: `"${siteName}" <${process.env.SMTP_EMAIL}>`,
        to: customerEmail,
        subject: `Order Confirmation - #${order.order_number}`,
        html: generateEmailHtml("Payment Successful!", "We have received your order and it's being processed."),
      });
      console.log(`Sent confirmation email to customer: ${customerEmail}`);
    }

    // 2. Send email to the Admin
    await transporter.sendMail({
      from: `"${siteName} System" <${process.env.SMTP_EMAIL}>`,
      to: adminEmail,
      subject: `🎉 NEW SALE! Order #${order.order_number}`,
      html: generateEmailHtml("You Got a New Sale!", "A customer just successfully paid for an order!"),
    });
    console.log(`Sent alert email to admin: ${adminEmail}`);

  } catch (error) {
    console.error("Failed to send order confirmation emails:", error);
  }
}
