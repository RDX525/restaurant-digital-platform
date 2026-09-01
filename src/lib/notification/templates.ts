import type { NotificationTemplate } from "./types";
import type { NotificationType } from "./constants";

const TEMPLATES: Record<NotificationType, NotificationTemplate> = {
  ORDER_RECEIVED: {
    subject: "Order received — {{restaurantName}}",
    emailBody:
      "Hi {{customerName}},\n\nWe received your order {{orderNumber}}. We will confirm it shortly.\n\nTotal: {{orderTotal}}\n\n— {{restaurantName}}",
    smsBody: "{{restaurantName}}: Order {{orderNumber}} received. Total {{orderTotal}}.",
  },
  ORDER_ACCEPTED: {
    subject: "Order accepted — {{restaurantName}}",
    emailBody:
      "Hi {{customerName}},\n\nYour order {{orderNumber}} has been accepted and is being prepared.\n\n— {{restaurantName}}",
    smsBody: "{{restaurantName}}: Order {{orderNumber}} accepted.",
  },
  ORDER_READY: {
    subject: "Order ready — {{restaurantName}}",
    emailBody:
      "Hi {{customerName}},\n\nYour order {{orderNumber}} is ready for {{orderType}}.\n\n— {{restaurantName}}",
    smsBody: "{{restaurantName}}: Order {{orderNumber}} is ready.",
  },
  ORDER_COMPLETED: {
    subject: "Order completed — {{restaurantName}}",
    emailBody:
      "Hi {{customerName}},\n\nThanks for dining with us. Order {{orderNumber}} is complete.\n\n— {{restaurantName}}",
    smsBody: "{{restaurantName}}: Order {{orderNumber}} completed. Thank you!",
  },
  ORDER_CANCELLED: {
    subject: "Order cancelled — {{restaurantName}}",
    emailBody:
      "Hi {{customerName}},\n\nYour order {{orderNumber}} was cancelled.\n\nReason: {{reason}}\n\n— {{restaurantName}}",
    smsBody: "{{restaurantName}}: Order {{orderNumber}} cancelled.",
  },
  RESERVATION_RECEIVED: {
    subject: "Reservation request received — {{restaurantName}}",
    emailBody:
      "Hi {{guestName}},\n\nWe received your reservation request for {{guestCount}} guests on {{reservationDate}} at {{reservationTime}}.\n\n— {{restaurantName}}",
    smsBody: "{{restaurantName}}: Reservation request for {{reservationDate}} {{reservationTime}}.",
  },
  RESERVATION_CONFIRMED: {
    subject: "Reservation confirmed — {{restaurantName}}",
    emailBody:
      "Hi {{guestName}},\n\nYour table for {{guestCount}} on {{reservationDate}} at {{reservationTime}} is confirmed.\n\n— {{restaurantName}}",
    smsBody: "{{restaurantName}}: Reservation confirmed {{reservationDate}} {{reservationTime}}.",
  },
  RESERVATION_REMINDER: {
    subject: "Reservation reminder — {{restaurantName}}",
    emailBody:
      "Hi {{guestName}},\n\nReminder: you have a reservation tomorrow at {{reservationTime}} for {{guestCount}} guests.\n\n— {{restaurantName}}",
    smsBody: "{{restaurantName}}: Reminder — reservation {{reservationDate}} {{reservationTime}}.",
  },
  RESERVATION_CANCELLED: {
    subject: "Reservation cancelled — {{restaurantName}}",
    emailBody:
      "Hi {{guestName}},\n\nYour reservation on {{reservationDate}} at {{reservationTime}} has been cancelled.\n\nReason: {{reason}}\n\n— {{restaurantName}}",
    smsBody: "{{restaurantName}}: Reservation cancelled for {{reservationDate}}.",
  },
  RESERVATION_CHANGED: {
    subject: "Reservation updated — {{restaurantName}}",
    emailBody:
      "Hi {{guestName}},\n\nYour reservation has been moved to {{reservationDate}} at {{reservationTime}} for {{guestCount}} guests.\n\n— {{restaurantName}}",
    smsBody: "{{restaurantName}}: Reservation moved to {{reservationDate}} {{reservationTime}}.",
  },
  TEAM_INVITE: {
    subject: "You're invited to join {{restaurantName}}",
    emailBody:
      "Hi,\n\n{{inviterName}} invited you to join {{restaurantName}} as {{role}}.\n\nAccept the invite by signing in with this email address:\n{{acceptUrl}}\n\nThis link expires in 7 days.\n\n— {{restaurantName}}",
    smsBody: "{{restaurantName}}: You've been invited as {{role}}. Open {{acceptUrl}}",
  },
};

function renderTemplate(template: string, variables: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => variables[key] ?? "");
}

export function getNotificationTemplate(type: NotificationType): NotificationTemplate {
  return TEMPLATES[type];
}

export function renderNotificationTemplate(
  type: NotificationType,
  variables: Record<string, string>,
): NotificationTemplate {
  const template = getNotificationTemplate(type);
  return {
    subject: renderTemplate(template.subject, variables),
    emailBody: renderTemplate(template.emailBody, variables),
    smsBody: renderTemplate(template.smsBody, variables),
  };
}
