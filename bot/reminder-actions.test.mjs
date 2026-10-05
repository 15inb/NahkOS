import test from "node:test";
import assert from "node:assert/strict";
import { parseDue, formatDiscordDate, reminderActionId, parseReminderAction, reminderActionPatch } from "./reminder-actions.mjs";

test("unqualified winter and summer dates use fixed EST", () => {
  assert.equal(parseDue("January 15 2027 at 7pm"), "2027-01-16T00:00:00.000Z");
  assert.equal(parseDue("July 15 2027 at 7pm"), "2027-07-16T00:00:00.000Z");
  assert.match(formatDiscordDate("2027-07-16T00:00:00Z"), /7:00 PM EST$/);
});

test("relative dates and invalid input", () => {
  assert.equal(parseDue("in 10 minutes", new Date("2027-07-15T23:00:00Z")), "2027-07-15T23:10:00.000Z");
  assert.throws(() => parseDue("not a date"), /could not understand/);
});

const reminder = { id: "test-id", dueAt: "2027-07-16T00:00:00Z", completed: 0, dismissed: 0 };
test("buttons encode reminder occurrence and complete it", () => {
  const action = parseReminderAction(reminderActionId(reminder, "complete"));
  assert.equal(action.id, reminder.id);
  assert.deepEqual(reminderActionPatch(reminder, action), { completed: 1, discordNotificationStatus: "completed" });
});

test("snoozing resets delivery and schedules from click time", () => {
  for (const [name, minutes] of [["snooze10", 10], ["snooze60", 60]]) {
    const action = parseReminderAction(reminderActionId(reminder, name));
    const reference = new Date("2027-07-16T00:00:00Z");
    const patch = reminderActionPatch(reminder, action, reference);
    assert.equal(new Date(patch.dueAt).getTime() - reference.getTime(), minutes * 60_000);
    assert.equal(patch.discordNotificationStatus, "pending");
    assert.equal(patch.discordNotificationSentAt, null);
    assert.equal(patch.notified, 0);
    assert.throws(() => reminderActionPatch({ ...reminder, ...patch }, action), /out of date/);
  }
});

test("stale or inactive reminders reject actions", () => {
  const action = parseReminderAction(reminderActionId(reminder, "complete"));
  for (const fields of [{ completed: 1 }, { dismissed: 1 }, { deletedAt: "now" }]) {
    assert.throws(() => reminderActionPatch({ ...reminder, ...fields }, action));
  }
  assert.equal(parseReminderAction("unrelated"), null);
});
