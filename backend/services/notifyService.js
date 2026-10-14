const { Expo } = require('expo-server-sdk');
const User = require('../Models/user');

const expo = new Expo();

async function sendPush(tokens, title, body, data = {}) {
  const messages = tokens
    .filter((t) => Expo.isExpoPushToken(t))
    .map((to) => ({
      to,
      sound: 'default',
      title,
      body,
      data,
      channelId: 'orders',
      priority: 'high',
    }));

  for (const chunk of expo.chunkPushNotifications(messages)) {
    try {
      const tickets = await expo.sendPushNotificationsAsync(chunk);
      tickets.forEach((ticket, i) => {
        // Clean up tokens of uninstalled apps
        if (ticket.status === 'error' && ticket.details?.error === 'DeviceNotRegistered') {
          User.updateOne(
            { pushTokens: chunk[i].to },
            { $pull: { pushTokens: chunk[i].to } }
          ).catch(() => {});
        }
      });
    } catch (err) {
      console.error('Push send failed:', err.message);
    }
  }
}

async function sendTelegram(text) {
  const { TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID } = process.env;
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) return;
  try {
    await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text }),
    });
  } catch (err) {
    console.error('Telegram failed:', err.message);
  }
}

// New order -> owner (push + Telegram backup)
async function notifyOwnerNewOrder(order) {
  const owners = await User.find({ role: 'owner' }).select('pushTokens');
  const tokens = owners.flatMap((o) => o.pushTokens);

  const title = 'New order received';
  const body = `Order #${String(order._id).slice(-6)} · ₹${order.totalAmount}`;

  await Promise.all([
    sendPush(tokens, title, body, { orderId: String(order._id), type: 'new_order' }),
    sendTelegram(`🔔 ${title}\n${body}`),
  ]);
}

// Status change -> customer
const STATUS_TEXT = {
  accepted: 'Your order has been accepted ✅',
  preparing: 'Your food is being prepared 👨‍🍳',
  out_for_delivery: 'Your order is out for delivery 🛵',
  delivered: 'Delivered. Enjoy your meal! 🍽️',
  cancelled: 'Your order was cancelled ❌',
};

async function notifyCustomerStatus(order) {
  const message = STATUS_TEXT[order.status];
  if (!message) return;

  const customer = await User.findById(order.user).select('pushTokens');
  if (!customer) return;

  await sendPush(
    customer.pushTokens,
    `Order #${String(order._id).slice(-6)}`,
    message,
    { orderId: String(order._id), type: 'status_update' }
  );
  // WhatsApp goes here later (same function, one more call)
}

module.exports = { notifyOwnerNewOrder, notifyCustomerStatus };