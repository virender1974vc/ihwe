const assert = require('node:assert/strict');
const http = require('node:http');
const path = require('node:path');
const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const User = require('../models/User');
const Conversation = require('../models/CommunicationConversation');
const Message = require('../models/CommunicationMessage');
const Audit = require('../models/CommunicationAudit');
const Presence = require('../models/CommunicationPresence');
const Task = require('../models/CommunicationTask');
const Call = require('../models/CommunicationCall');
const Asset = require('../models/CommunicationAsset');
const communicationRoutes = require('../routes/communicationRoutes');

const runId = `commtest_${Date.now()}_${Math.random().toString(16).slice(2)}`;
const createdUserIds = [];
const createdConversationIds = [];
let server;

function token(user, claims = {}) {
  return jwt.sign(
    {
      id: String(user._id),
      username: user.username,
      role: user.role,
      ...claims,
    },
    process.env.JWT_SECRET || 'ihwe_secret_2026',
    { expiresIn: '10m' },
  );
}

async function request(baseUrl, user, method, endpoint, body, claims) {
  const response = await fetch(`${baseUrl}/api/communications${endpoint}`, {
    method,
    headers: {
      Authorization: `Bearer ${token(user, claims)}`,
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await response.json();
  return { status: response.status, json };
}

async function cleanup() {
  if (createdConversationIds.length) {
    await Promise.all([
      Message.deleteMany({ conversationId: { $in: createdConversationIds } }),
      Audit.deleteMany({ conversationId: { $in: createdConversationIds } }),
      Task.deleteMany({ conversationId: { $in: createdConversationIds } }),
      Call.deleteMany({ conversationId: { $in: createdConversationIds } }),
      Conversation.deleteMany({ _id: { $in: createdConversationIds } }),
    ]);
  }
  if (createdUserIds.length) {
    await Promise.all([
      Presence.deleteMany({ userId: { $in: createdUserIds } }),
      Asset.deleteMany({ uploadedBy: { $in: createdUserIds } }),
      User.deleteMany({ _id: { $in: createdUserIds } }),
    ]);
  }
  // Also catches a partially inserted fixture when a bulk create fails early.
  await User.deleteMany({ username: { $regex: '^commtest_' } });
}

async function main() {
  assert.ok(process.env.MONGO_URI_MAIN, 'MONGO_URI_MAIN is required for integration tests.');
  await mongoose.connect(process.env.MONGO_URI_MAIN, { serverSelectionTimeoutMS: 15000 });

  const [admin, employee, outsider] = await User.create([
    {
      username: `${runId}_admin`,
      password: 'TestOnly!234',
      fullName: 'Communication Test Administrator',
      email: `${runId}_admin@example.invalid`,
      role: 'IHWE–Super Administrator',
      status: 'Active',
    },
    {
      username: `${runId}_employee`,
      password: 'TestOnly!234',
      fullName: 'Communication Test Employee',
      email: `${runId}_employee@example.invalid`,
      role: 'employee',
      status: 'Active',
    },
    {
      username: `${runId}_outsider`,
      password: 'TestOnly!234',
      fullName: 'Communication Test Outsider',
      email: `${runId}_outsider@example.invalid`,
      role: 'employee',
      status: 'Active',
    },
  ]);
  createdUserIds.push(admin._id, employee._id, outsider._id);

  const app = express();
  app.set('communicationIo', null);
  app.use(express.json({ limit: '1mb' }));
  app.use('/api/communications', communicationRoutes);
  server = http.createServer(app);
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const baseUrl = `http://127.0.0.1:${server.address().port}`;

  let result = await request(baseUrl, employee, 'GET', '/employees');
  assert.equal(result.status, 403, 'Employee must not enumerate employees.');

  result = await request(
    baseUrl,
    employee,
    'GET',
    '/employees',
    undefined,
    { role: 'IHWE–Super Administrator' },
  );
  assert.equal(
    result.status,
    403,
    'Database role must override a stale or elevated token role claim.',
  );

  result = await request(baseUrl, admin, 'POST', `/conversations/${employee._id}`);
  assert.equal(result.status, 200, 'Super Administrator should create a conversation.');
  const conversationId = result.json.data._id;
  createdConversationIds.push(new mongoose.Types.ObjectId(conversationId));

  result = await request(baseUrl, outsider, 'GET', `/conversations/${conversationId}/messages`);
  assert.equal(result.status, 404, 'Another employee must not access the conversation.');

  result = await request(baseUrl, employee, 'POST', `/conversations/${conversationId}/messages`, {
    text: 'Integration test message',
  });
  assert.equal(result.status, 201, 'Employee message should be accepted.');
  const messageId = result.json.data._id;

  result = await request(baseUrl, employee, 'POST', `/conversations/${conversationId}/messages`, {
    attachments: [{ _id: new mongoose.Types.ObjectId(), url: 'https://forged.invalid/file.pdf' }],
  });
  assert.equal(result.status, 403, 'Forged attachment metadata must be rejected.');

  result = await request(baseUrl, admin, 'PATCH', `/conversations/${conversationId}/read`, {});
  assert.equal(result.status, 200, 'Administrator should mark received messages read.');

  result = await request(baseUrl, employee, 'PATCH', `/messages/${messageId}`, {
    text: 'Integration test message edited',
  });
  assert.equal(result.status, 200, 'Sender should edit their own message.');

  result = await request(baseUrl, outsider, 'PATCH', `/messages/${messageId}`, {
    text: 'Unauthorized edit',
  });
  assert.equal(result.status, 404, 'Another employee must not edit the message.');

  result = await request(baseUrl, employee, 'PATCH', '/availability', {
    availability: 'busy',
    aiAssistantEnabled: true,
  });
  assert.equal(result.status, 403, 'Employee must not change Super Administrator availability.');

  result = await request(baseUrl, admin, 'PATCH', '/availability', {
    availability: 'busy',
    aiAssistantEnabled: true,
    statusMessage: 'Testing controlled fallback',
  });
  assert.equal(result.status, 200, 'Super Administrator should enable controlled AI fallback.');

  result = await request(baseUrl, employee, 'POST', `/conversations/${conversationId}/messages`, {
    text: 'Please mark my attendance for day 2',
  });
  assert.equal(result.status, 201, 'Restricted employee request should remain in the conversation.');
  let escalatedMessage;
  for (let attempt = 0; attempt < 20 && !escalatedMessage; attempt += 1) {
    await new Promise(resolve => setTimeout(resolve, 50));
    escalatedMessage = await Message.findOne({
      conversationId,
      aiGenerated: true,
      'metadata.escalated': true,
    }).lean();
  }
  assert.ok(escalatedMessage, 'Restricted request should receive a deterministic AI escalation.');
  assert.match(
    escalatedMessage.text,
    /Super Administrator approval/i,
    'Escalation must not claim that the restricted action was performed.',
  );

  result = await request(baseUrl, admin, 'POST', '/tasks', {
    employeeId: String(employee._id),
    title: 'Verify entry desk',
    priority: 'high',
  });
  assert.equal(result.status, 201, 'Super Administrator should assign a task.');
  const taskId = result.json.data._id;

  result = await request(baseUrl, outsider, 'PATCH', `/tasks/${taskId}/status`, { status: 'accepted' });
  assert.equal(result.status, 403, 'Unassigned employee must not update the task.');

  result = await request(baseUrl, employee, 'PATCH', `/tasks/${taskId}/status`, { status: 'accepted' });
  assert.equal(result.status, 200, 'Assigned employee should accept the task.');

  result = await request(baseUrl, employee, 'POST', '/calls', {
    conversationId,
    type: 'video',
  });
  assert.equal(result.status, 201, 'Conversation participant should start a call.');
  const callId = result.json.data._id;

  result = await request(baseUrl, admin, 'POST', '/calls', {
    conversationId,
    type: 'audio',
  });
  assert.equal(result.status, 409, 'A participant already ringing must be reported busy.');
  assert.equal(result.json.code, 'PARTICIPANT_BUSY', 'Busy calls should expose a stable client code.');

  result = await request(baseUrl, employee, 'PATCH', `/calls/${callId}`, { action: 'accept' });
  assert.equal(result.status, 409, 'Caller must not accept their own call.');

  result = await request(baseUrl, admin, 'PATCH', `/calls/${callId}`, { action: 'accept' });
  assert.equal(result.status, 200, 'Callee should accept a ringing call.');

  result = await request(baseUrl, outsider, 'PATCH', `/calls/${callId}`, { action: 'end' });
  assert.equal(result.status, 404, 'Non-participant must not end the call.');

  result = await request(baseUrl, employee, 'PATCH', `/calls/${callId}`, { action: 'end' });
  assert.equal(result.status, 200, 'Participant should end the accepted call.');

  const staleCall = await Call.create({
    conversationId,
    callerId: employee._id,
    calleeId: admin._id,
    type: 'audio',
    status: 'ringing',
    startedAt: new Date(Date.now() - 60_000),
  });
  result = await request(baseUrl, employee, 'GET', '/calls');
  assert.equal(result.status, 200, 'Participant should load call history.');
  const expiredCall = result.json.data.find(call => call._id === String(staleCall._id));
  assert.equal(expiredCall?.status, 'missed', 'Unanswered stale calls should become missed.');
  assert.equal(expiredCall?.endReason, 'no-answer', 'Missed calls should retain a stable reason.');

  result = await request(baseUrl, employee, 'GET', `/conversations/${conversationId}/audit`);
  assert.equal(result.status, 403, 'Employee must not access the audit history.');

  result = await request(baseUrl, admin, 'GET', `/conversations/${conversationId}/audit`);
  assert.equal(result.status, 200, 'Super Administrator should access the audit history.');
  assert.ok(result.json.data.length >= 5, 'Audit history should retain communication actions.');
  assert.ok(
    result.json.data.some(row => row.action === 'call-missed'),
    'Missed call expiration should be retained in the audit history.',
  );

  await User.updateOne({ _id: outsider._id }, { $set: { status: 'Inactive' } });
  result = await request(baseUrl, outsider, 'GET', '/conversations');
  assert.equal(
    result.status,
    401,
    'Inactive users must lose communication access immediately.',
  );
  await User.updateOne(
    { _id: outsider._id },
    { $set: { status: 'Active', role: 'exhibitor' } },
  );
  result = await request(baseUrl, outsider, 'GET', '/conversations');
  assert.equal(
    result.status,
    403,
    'Exhibitor accounts must not enter employee communication routes.',
  );

  console.log('Communication integration tests passed.');
}

main()
  .catch(error => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (server) await new Promise(resolve => server.close(resolve));
    try {
      await cleanup();
    } finally {
      await mongoose.disconnect();
    }
  });
