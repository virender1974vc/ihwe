const { ImapFlow } = require("imapflow");
const { secondaryDB } = require("../config/secondaryDb");

let isPolling = false;

const getCrmReviewModel = () => {
  try {
    return secondaryDB.model("CrmExhibatorReview2023");
  } catch (e) {
    return null;
  }
};

// Extract plain text from email source
const extractTextFromSource = (source) => {
  const str = source.toString();

  // Try to find plain text part
  const plainTextMatch = str.match(/Content-Type: text\/plain[\s\S]*?\r?\n\r?\n([\s\S]*?)(?:\r?\n--|\r?\n\r?\nContent-Type:|$)/i);
  if (plainTextMatch) {
    let text = plainTextMatch[1];
    // Decode quoted-printable
    text = text.replace(/=\r?\n/g, "").replace(/=([0-9A-F]{2})/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
    // Remove quoted lines (lines starting with >)
    text = text.split(/\r?\n/).filter(l => !l.trim().startsWith(">") && !l.trim().startsWith("On ")).join("\n").trim();
    return text.substring(0, 1000) || null;
  }

  // Fallback: try to get any readable text
  const lines = str.split(/\r?\n/).filter(l =>
    l.trim() &&
    !l.startsWith(">") &&
    !l.startsWith("--") &&
    !l.match(/^Content-/i) &&
    !l.match(/^MIME-/i) &&
    !l.match(/^From:/i) &&
    !l.match(/^To:/i) &&
    !l.match(/^Subject:/i) &&
    !l.match(/^Date:/i) &&
    l.length < 200
  );
  return lines.slice(0, 10).join("\n").trim().substring(0, 500) || null;
};

const pollInbox = async () => {
  if (isPolling) return;
  isPolling = true;

  const client = new ImapFlow({
    host: "imap.gmail.com",
    port: 993,
    secure: true,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    logger: false,
  });

  try {
    await client.connect();
    await client.mailboxOpen("INBOX");

    const CrmReview = getCrmReviewModel();
    if (!CrmReview) { await client.logout(); isPolling = false; return; }

    // Fetch all sent email messageIds we're tracking
    const sentEmails = await CrmReview.find({
      type: "email",
      message_id: { $exists: true, $ne: null },
    }).select("cmpny_id message_id email_subject").lean();

    if (sentEmails.length === 0) {
      await client.logout();
      isPolling = false;
      return;
    }

    // Get already processed reply messageIds to avoid duplicates
    const existingReplies = await CrmReview.find({ type: "email_reply" }).select("message_id").lean();
    const processedIds = new Set(existingReplies.map((r) => r.message_id).filter(Boolean));

    // Fetch recent messages with envelope + source
    const messages = [];
    for await (const msg of client.fetch("1:*", { envelope: true, source: true })) {
      messages.push(msg);
    }

    for (const msg of messages) {
      const inReplyTo = msg.envelope?.inReplyTo;
      const msgId = msg.envelope?.messageId;

      if (!inReplyTo || !msgId) continue;
      if (processedIds.has(msgId)) continue;

      // Find matching sent email
      const cleanInReplyTo = inReplyTo.replace(/[<>]/g, "").trim();
      const matched = sentEmails.find((s) => {
        if (!s.message_id) return false;
        const cleanSentId = s.message_id.replace(/[<>]/g, "").trim();
        return cleanInReplyTo.includes(cleanSentId) || cleanSentId.includes(cleanInReplyTo);
      });

      if (!matched) continue;

      // Extract body from source
      const bodyText = extractTextFromSource(msg.source) || "(Could not read email body)";

      const fromAddress = msg.envelope?.from?.[0]?.address || "Unknown";
      const fromName = msg.envelope?.from?.[0]?.name || fromAddress;
      const subject = msg.envelope?.subject || "(No Subject)";

      // Save reply to DB
      await CrmReview.create({
        cmpny_id: matched.cmpny_id,
        type: "email_reply",
        re_msg: bodyText,
        email_subject: subject.startsWith("Re:") ? subject : `Re: ${subject}`,
        message_id: msgId,
        email_content: bodyText,
        updated_by: fromName,
      });

      console.log(`[IMAP] ✅ Reply saved for company ${matched.cmpny_id} from ${fromAddress}`);
    }

    await client.logout();
  } catch (err) {
    console.error("[IMAP Poller]", err.message);
    try { await client.logout(); } catch (_) {}
  } finally {
    isPolling = false;
  }
};

// Start polling every 2 minutes
const startImapPoller = () => {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log("[IMAP Poller] No SMTP credentials — skipping");
    return;
  }
  console.log("[IMAP Poller] Started — polling every 2 minutes");
  pollInbox();
  setInterval(pollInbox, 2 * 60 * 1000);
};

module.exports = { startImapPoller };
