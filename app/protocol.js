// Flood protocol: what each person does at each risk level.
// Built around Maya (site operations lead, Evergreen Brick Works). Her needs from the team's research:
// one source of truth for closing, reopening and telling the public; a rehearsed playbook instead of scrambling;
// safety first; and a quick recovery. Everyone else's tasks hang off her decisions.

export const ROLES = {
  maya: { name: "Maya", role: "Site operations", short: "Staff",
    needs: ["One source of truth for closing, reopening and telling the public", "A playbook, not a scramble", "Nobody in the valley when the river rises", "Back open fast"] },
  aisha: { name: "Aisha", role: "Garden Market vendor", short: "Vendor",
    needs: ["Early warning to move stock", "Keep selling from a dry pop-up"] },
  marcus: { name: "Marcus", role: "Event organizer", short: "Events",
    needs: ["Hours of notice to switch venues", "A dependable reopening date"] },
  daniel: { name: "Daniel", role: "Visitor with kids", short: "Visitor",
    needs: ["Know before leaving home", "Get the order without a wasted trip"] },
};

export const LEVELS = {
  normal: { label: "Normal", summary: "No high water expected. Routine checks only." },
  watch: { label: "Watch", summary: "Heavy rain is possible. Get ready, nothing moves yet." },
  warning: { label: "Warning", summary: "High water is likely. Pack down and move the market." },
  flood: { label: "Flood", summary: "The Don is high now. Valley closed, pickup runs off site." },
  recovery: { label: "Recovery", summary: "Water is down. Inspect, clean, reopen." },
};

// Each task: [time, text]. Time is a clock target so a day reads as a schedule.
export const TASKS = {
  normal: {
    maya: [["9:00", "Open this app and confirm today is Normal. This screen is the record."],
      ["9:15", "Confirm the on-call pair for the next 72 hours (two people who can reach site within 1 hour)."],
      ["Mon", "Send the weekly test message to vendors and event clients. Note anyone who did not get it."],
      ["Fri", "Check the 48-hour kit seal, cabinet wheels and brakes. Log it."]],
    aisha: [["Close", "Update the stock count in Pickup so it is right if a closure comes overnight."],
      ["Daily", "Keep ground-floor stock to one cabinet load. Overflow goes on the upper shelves."]],
    marcus: [["Daily", "For events in the next 7 days, note the Plan B room on the booking."]],
    daniel: [["Before a trip", "Glance at the status. Green means go."]],
  },
  watch: {
    maya: [["9:00", "Set the site status to Watch on the website and the Welcome Centre screen. One message, from here."],
      ["10:00", "Confirm Copp Hall is free for the next 48 hours. Text the two backup hosts (Yorkminster Park, Church of the Redeemer) as a heads-up."],
      ["11:00", "Brief the on-call pair: who comes in, when, and the pack-down trigger."],
      ["Every 3 h", "Check the Don River gauge card. Rising fast? Move to Warning early."],
      ["15:00", "Decide: hold at Watch, or order pack-down for tonight. Write the decision and the reason in the log."]],
    aisha: [["By noon", "Pre-pack slow-moving stock into the cabinet bins so a pack-down takes under 30 minutes."],
      ["Today", "Charge the card reader and phone. Confirm you can get to Copp Hall tomorrow."]],
    marcus: [["Today", "Tell clients with events in the next 48 hours that Plan B may be used. Hold the backup room."]],
    daniel: [["Before a trip", "Check again before leaving. Skip the Lower Don trail tonight."]],
  },
  warning: {
    maya: [["Now", "Declare Warning. Send the single alert (text, site banner, website). Everyone hears the same thing once."],
      ["+1 h", "Set the pack-down time at least 5 hours before the heaviest rain in the chart. Tell Aisha and the on-call pair."],
      ["+2 h", "Close the lower parking lot and Lower Don trail access with signs and barriers."],
      ["Pack-down", "Walk the market. Nobody stays on the valley floor once pack-down is done. Log who left and when."],
      ["Evening", "Confirm Copp Hall opening hours and publish them, then approve the pickup site in this app."]],
    aisha: [["By pack-down", "Fold down the stall and roll the cabinet to the van or upper level. Photograph stock for insurance."],
      ["Then", "Open pickup at Copp Hall in the app once stock is counted there."]],
    marcus: [["Now", "Move tonight's and tomorrow's events to Plan B. Send guests the new address and a map."]],
    daniel: [["Today", "Do not visit the valley. Reserve online and collect at Copp Hall instead."]],
  },
  flood: {
    maya: [["All day", "Site closed. Nobody enters the flood zone, staff included, until the gauge has been below the line for 24 hours."],
      ["Every 2 h", "Update the status message, even if nothing changed. Silence reads as unknown."],
      ["Daily", "Keep pickup open at the host. Pause it for everyone if the host loses power or signal."]],
    aisha: [["Open hours", "Run pickup at Copp Hall. Reconcile stock against open holds before closing."]],
    marcus: [["Event day", "Run the event at Plan B. Tell clients the earliest likely reopening date."]],
    daniel: [["Today", "Collect at Copp Hall only. The valley roads and trail are closed."]],
  },
  recovery: {
    maya: [["Day 1", "Walk-through with facilities. Photograph and log damage before anything is moved."],
      ["Day 1", "Clean and sanitize the market floor. Check power before plugging anything in."],
      ["Day 2", "Set the reopening date and announce it once, from here."],
      ["Day 3", "Debrief: what took longest, what to change. Update this protocol."]],
    aisha: [["Day 2", "Roll the cabinet back, recount and resume on-site sales. Close pickup at the host."],
      ["Day 2", "Note any losses for the claim."]],
    marcus: [["Day 2", "Confirm the reopening date with clients and rebook moved events."]],
    daniel: [["Before a trip", "Check the reopening date before heading out."]],
  },
};

// The level for a day, from the model's chance of high water and the live river.
export function levelFor(p, tiers, { riverHigh = false, recovering = false } = {}) {
  if (riverHigh) return "flood";
  if (recovering) return "recovery";
  if (p >= tiers.warning) return "warning";
  if (p >= tiers.watch) return "watch";
  return "normal";
}
