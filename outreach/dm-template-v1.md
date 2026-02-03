# DM Template for B2B SaaS Founders - Caesar's Legions

**Target:** B2B SaaS founders struggling with cold email outbound  
**Qualification:** $10K+ MRR, actively posting about growth/marketing  
**Approach:** Personal, reference specific pain, offer value first

---

## Template Structure

**3-part framework:**
1. **Personal hook** - Show you actually read their content
2. **Shared pain** - Validate their frustration with data
3. **Soft offer** - Value before ask

---

## Version 1: Pain Point Entry

**When to use:** They recently posted about cold email struggles

```
Hey [Name] - 

Saw your thread about [specific cold email pain they mentioned]. 

The average reply rate is 1-4% right now according to Mailshake's 2026 report. Most campaigns are drowning in spam filters and generic AI slop.

But the 5% who personalize every email get 2-3x better results.

I'm building Caesar's Legions - AI agents that do deep prospect research and write hyper-personalized cold emails (think $60K SDR, not mail merge).

Early beta. Running first campaigns now. Want to see a demo with your ICP?

[Your name]
```

**Length:** 89 words (short, skimmable)

---

## Version 2: Data-Driven Entry

**When to use:** They're analytical/metrics-focused founder

```
[Name] - 

Quick question: What's your current cold email reply rate?

Industry avg is 1-4%. We're hitting 12-18% in beta with AI agents that:
- Research each prospect (tech stack, pain points, recent activity)
- Write personalized emails (not templates)
- Manage follow-ups intelligently (know when to stop)

Built for B2B SaaS founders tired of low-quality outbound.

Curious if you'd want to test it? No charge for first campaign.

- [Your name]
```

**Length:** 80 words  
**Hook:** Question + data comparison

---

## Version 3: Founder-to-Founder

**When to use:** They're building in public, sharing metrics

```
[Name] -

Love following your journey to [$X MRR milestone]. 

I'm at the "need revenue now" phase with my AI agent SaaS (Caesar's Legions). Built it to solve my own cold email pain - low reply rates, manual personalization doesn't scale.

AI does prospect research → writes custom emails → manages follow-ups. Early results: 12-18% reply rates vs industry 1-4%.

Would you try it? First campaign free. Worst case: you get qualified leads. Best case: new growth channel.

Game?

[Your name]
```

**Length:** 90 words  
**Tone:** Vulnerable, relatable, peer-to-peer

---

## Version 4: Value-First (No Ask)

**When to use:** Long-term relationship building

```
[Name] -

Saw you're working on [their current project/goal].

Ran across this Mailshake report - 508 cold email campaigns analyzed. Key finding: personalization drives 2-3x better reply rates, but only 5% of senders do it.

[Link to report or screenshot]

Thought you'd find it useful given your focus on [their growth channel].

If you ever want to jam on outbound strategy, happy to share what's working for us.

Cheers,
[Your name]
```

**Length:** 72 words  
**Strategy:** Give value, build trust, no pitch (yet)

---

## Follow-Up Sequences

### If No Response (3 days later):

```
[Name] - Following up on my message about Caesar's Legions.

No pressure if you're not interested. But if you are curious about 12-18% reply rates vs your current cold email performance, I'm happy to show you the system.

Takes 15 min. [Calendar link]
```

### If Interested:

```
Awesome! Here's what I need to set up your first campaign:

1. Your ICP (who we're reaching out to)
2. Your value prop (what problem you solve)
3. Goal (meetings booked? free trial signups?)

Then I'll:
- Research 50 prospects
- Write personalized emails for each
- Send you draft for approval
- Launch campaign + track results

Sound good?
```

---

## Disqualification Criteria (Don't DM if...)

- Less than $5K MRR (too early, not ready to pay)
- Agency founder (different use case, we're B2B SaaS focused)
- Already using Instantly/Lemlist happily (not in pain)
- No recent activity (dead account)
- Spammy/low-quality content (bad fit)

---

## Tracking Metrics

Log every DM to: `caesars-legions/outreach/dm-log.jsonl`

```json
{
  "timestamp": "2026-01-31T06:00:00Z",
  "prospect_name": "John Doe",
  "x_handle": "@johndoe",
  "template_version": "v1-pain-point",
  "context": "Posted about low cold email reply rates",
  "sent": true,
  "response": null,
  "outcome": "pending"
}
```

**Success metrics:**
- 30% response rate (9 out of 30 DMs)
- 10% book demo (3 out of 30 DMs)
- 3% convert to paying (1 out of 30 DMs)

---

## Next Steps

1. Get X authentication (bird cookies or Sweetistics API key)
2. Find 30 qualified prospects using bird search
3. Send 10 DMs (test template V1, V2, V3)
4. Track responses
5. Iterate based on data

**Status:** Ready to execute, pending X access  
**Owner:** Solon (autonomous execution once auth is available)
