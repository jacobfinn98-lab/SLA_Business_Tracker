# Product Requirements Document (PRD)
## SLA Business Tracker

| Field | Value |
|---|---|
| Document Version | 1.0 |
| Date | 2026-04-17 |
| Status | Draft |
| Product | SLA Business Tracker (Glide PWA) |
| Organization | Stoosh Leadership Advancement (SLA) |
| Reference app | https://sla-business-tracker.glide.page (Glide prototype — desktop rebuild in progress) |

---

## 1. Executive Summary

The SLA Business Tracker is a desktop-first, mobile-responsive performance management and CRM app for insurance and financial services agents at Stoosh Leadership Advancement. It replaces fragmented spreadsheet-based tracking with a unified, gamified daily activity hub — enabling agents to log contacts, track appointments, record business production, manage BPM (Business Presentation Meeting) guests, and earn Reward Points (RP) for completing daily behavioral challenges. The app drives consistent, high-quality daily activity aligned with SLA's field training methodology.

---

## 2. Problem Statement

SLA agents must execute a high volume of daily activities — prospecting calls, appointment bookings, BPM invitations, policy submissions, and team building — to hit their income and career goals. Without a centralized tool:

- Activity is tracked inconsistently across personal notes, spreadsheets, and memory
- Leaders have no real-time visibility into agent behavior
- Agents lack daily accountability and motivation structure
- Contact qualification data is lost or inconsistently captured
- BPM attendance records require manual tracking
- No gamification exists to drive adoption of the daily activity system

The Business Tracker solves these problems by putting the SLA behavioral system in every agent's pocket.

---

## 3. Goals & Success Metrics

### Goals
1. **Increase daily activity consistency** — agents complete all 3 daily challenges more often
2. **Improve contact data quality** — all new contacts captured with full qualifier data
3. **Give leaders visibility** — mentors can see pending RP approvals and team activity
4. **Simplify onboarding** — new agents understand daily activity requirements within 24 hours of getting the app
5. **Drive BPM attendance tracking** — 100% of BPM attendees logged before next follow-up

### Success Metrics

| Metric | Target |
|---|---|
| Daily challenge completion rate | ≥ 70% of agents complete all 3 challenges/day |
| Contact capture rate | ≥ 90% of new contacts added same-day |
| App daily active usage | ≥ 80% of active agents open the app daily |
| BPM guest log accuracy | 100% of BPM attendees logged within 24 hours |
| RP approval turnaround | Mentor approves/rejects within 48 hours of submission |
| PWA install rate | ≥ 60% of users install the app on their home screen |

---

## 4. User Personas

### Persona 1 — The New Agent (Alex)
- **Role:** Recently licensed, in first 90 days
- **Goals:** Learn the activity system, build a warm market list, book first appointments
- **Pain points:** Overwhelmed by activity requirements, forgets to log contacts, unsure what "daily success" looks like
- **App use:** Checks Dashboard daily for challenges, uses quick-add to capture new people immediately after meeting them
- **Key features:** Daily Challenges, Quick-Add Contact, KPI at-a-glance

### Persona 2 — The Building Agent (Jordan)
- **Role:** 6–24 months, consistently producing, building a team
- **Goals:** Hit Crush 13 each month, recruit 2 new agents, advance to Marketing Director
- **Pain points:** Loses track of who attended which BPM, hard to see which contacts haven't been followed up
- **App use:** Logs BPM guests immediately after meetings, uses Activity calendar to stay on top of follow-ups, tracks Points Submitted in Business tab
- **Key features:** BPM Guests, Activity Calendar, Business tab (Points Submitted), Career Progress bar

### Persona 3 — The Team Leader / Mentor (Sam)
- **Role:** Marketing Director or above, manages 3–10 agents
- **Goals:** Keep team activity high, approve challenge submissions promptly, monitor team metrics
- **Pain points:** Hard to know if agents are doing the work, manual process to acknowledge challenge completions
- **App use:** Reviews pending RP challenge submissions, checks Teams tab for licensed agent counts
- **Key features:** RP Approval workflow, Teams tab, challenge submission feed

---

## 5. Feature Inventory

### Priority Definitions
- **P0** — Core; app is non-functional without it
- **P1** — High value; significant user impact if missing
- **P2** — Nice to have; improves experience but not blocking

| # | Feature | Priority | Screen(s) | Status |
|---|---|---|---|---|
| F-01 | Dashboard — personalized greeting + date | P0 | Dashboard | Live |
| F-02 | Dashboard — 6 KPI big-number cards | P0 | Dashboard | Live |
| F-03 | Dashboard — career progress bar (→ Marketing Director) | P1 | Dashboard | Live |
| F-04 | Dashboard — Daily Challenges list (3 challenges, RP values) | P0 | Dashboard | Live |
| F-05 | Challenge detail + RP submission flow | P0 | Dashboard (detail) | Live |
| F-06 | Mentor RP approval workflow | P0 | (Mentor view) | Live (implied) |
| F-07 | Dashboard — Monthly Momentum section | P1 | Dashboard | Live |
| F-08 | Dashboard — Crush 13 tracker | P1 | Dashboard | Live |
| F-09 | Dashboard — Activities section (booked presentations) | P1 | Dashboard | Live |
| F-10 | Dashboard — Business section (submitted biz) | P1 | Dashboard | Live |
| F-11 | Dashboard — New Contacts section | P1 | Dashboard | Live |
| F-12 | Dashboard — Phone Zone section | P1 | Dashboard | Live |
| F-13 | Quick-Add: Contact — distinct form (Full Name, Company, Occupation, social links, Archetype, Contact Type, Qualifiers, Comments, Referred By) | P0 | Dashboard | Live |
| F-14 | Quick-Add: Guest — distinct form (BPM attendance context) | P0 | Dashboard | Live |
| F-15 | Quick-Add: Appt — distinct form (Contact, Date/Time, Location, Notes) | P0 | Dashboard | Live |
| F-16 | Quick-Add: Recruit — distinct form (Agent Code) | P0 | Dashboard | Live |
| F-17 | Quick-Add: Biz — distinct form (Contract Number, Details, Servicing Agent Points, Licensed Split Agent Code/Points, Non-Licensed Agent Code) | P0 | Dashboard | Live |
| F-18 | Activity — 4-segment agenda (Prospect/Client/Agent/Network) | P0 | Activity | Live |
| F-19 | Activity — full month calendar (Schedule view) | P1 | Activity | Live |
| F-20 | Activity — Today / Agenda toggle + date filter | P1 | Activity | Live |
| F-21 | Business — Product Mix view | P1 | Business | Live |
| F-22 | Business — Points Submitted view | P0 | Business | Live |
| F-23 | Rolodex — searchable contact list | P0 | Rolodex | Live |
| F-24 | Rolodex — 5 segment filter tabs: Pre-Contact, Post-Contact, Agents, Clientele, Network | P1 | Rolodex | Live |
| F-25 | Rolodex — Add new contact form (Full Name, Company, Occupation, Phone, Email, socials, Archetype, Contact Type, Qualifiers, Comments, Referred By) | P0 | Rolodex | Live |
| F-26 | Contact qualification scoring (Archetype + 8 Qualifier checkboxes) | P1 | Rolodex / Contact form | Live |
| F-27 | Contact social profiles (LinkedIn, FB, IG, X) | P2 | Contact form | Live |
| F-28 | BPM Guests — monthly table log | P0 | BPM Guests | Live |
| F-29 | BPM Guests — Year-to-Date table view | P1 | BPM Guests | Live |
| F-30 | BPM Guests — columns: Name, Attended, In-Person/Online, Date, Next Step | P0 | BPM Guests | Live |
| F-31 | Teams — team list with licensed agent counts | P1 | Teams | Live |
| F-32 | Providers — searchable insurance carrier directory | P1 | Providers | Live |
| F-33 | Providers — carrier detail view | P2 | Providers (detail) | Unknown |
| F-34 | Responsive layout (desktop-first, mobile-friendly) | P1 | Global | To build |
| F-35 | Year filter on Dashboard KPIs (⏳ 2026 ⏳) | P1 | Dashboard | Live |

---

## 6. User Stories

### F-01 – F-12: Dashboard

**US-001** — As an agent, I want to see my name and today's date when I open the app so I feel the app is personalized to me and I know what day it is.

**US-002** — As an agent, I want to see my Cash Flow, Points, New Appointments, Agents, Licenses, and Studying counts at a glance so I can quickly assess where I stand for the year.

**US-003** — As an agent, I want to see how far I am from my next career title (Marketing Director) so I stay motivated and know what I need to do.

**US-004** — As an agent, I want to see my 3 daily challenges with their RP values each morning so I know exactly what I should focus on today.

**US-005** — As an agent, I want to see how many of today's challenges I've completed (e.g., "2 of 3") so I know if I'm on track.

**US-006** — As an agent, I want to see my monthly momentum stats in one section so I can see if I'm ahead or behind for the month.

**US-007** — As an agent, I want to see my "Crush 13" progress so I know how many production points I've hit this month vs. my target.

**US-008** — As an agent, I want to see my upcoming presentations in the Activities section so I don't miss any booked appointments.

### F-04 – F-06: Daily Challenges & RP System

**US-009** — As an agent, I want to tap a challenge to see its full description and RP value so I know exactly what I need to do to earn the points.

**US-010** — As an agent, I want to submit proof of a completed challenge (optional image + good faith acknowledgment) so my mentor can verify it and award me my RP.

**US-011** — As an agent, I want to know my submission is pending mentor review so I don't wonder if it was received.

**US-012** — As a mentor, I want to be notified when an agent submits a challenge so I can review and approve it promptly.

**US-013** — As a mentor, I want to approve or reject a challenge submission with one tap so approvals don't pile up.

### F-13 – F-17: Quick-Add Forms

**US-014** — As an agent, I want to tap "Contact" and immediately start filling in a new person's details so I capture their information before I forget it.

**US-015** — As an agent, I want the contact form to include social media fields (LinkedIn, IG, FB, X) so I can connect digitally right away.

**US-016** — As an agent, I want to check qualifier boxes (Married, Age 25+, Children, etc.) on a contact so I can quickly document why they're a good prospect.

**US-017** — As an agent, I want to assign an Archetype and Contact Type to each contact so I can segment my list for targeted outreach.

**US-018** — As an agent, I want to upload a profile photo when adding a contact so I can remember who they are when I follow up.

**US-019** — As an agent, I want to note where I met someone and their "hot buttons" in the Comments field so I can personalize my follow-up approach.

**US-020** — As an agent, I want to note who referred a contact to me (Referred By) so I can keep track of my referral network.

### F-18 – F-20: Activity Calendar

**US-021** — As an agent, I want to see my Prospect Agenda, Client Agenda, Agent Agenda, and Network Agenda separately so I can prepare for each type of appointment appropriately.

**US-022** — As an agent, I want to tap "Today" to see what I have scheduled for today so I can start my day organized.

**US-023** — As an agent, I want a monthly calendar view so I can see how well I have my month booked out.

### F-21 – F-22: Business Tab

**US-024** — As an agent, I want to see my product mix breakdown so I know if I'm diversified across product lines.

**US-025** — As an agent, I want to see my total points submitted for the period so I can track my production against my Crush 13 target.

### F-23 – F-27: Rolodex

**US-026** — As an agent, I want to search my contacts by name so I can quickly find anyone in my list.

**US-027** — As an agent, I want to filter my contacts by "Pre-Contact" status so I know who I haven't reached out to yet.

**US-028** — As an agent, I want to add a new contact directly from the Rolodex tab so I don't have to go back to the Dashboard.

### F-28 – F-30: BPM Guests

**US-029** — As an agent, I want to log every person who attended a BPM with their attendance status, format (in-person/online), and date so I have a clean follow-up list.

**US-030** — As an agent, I want to see my monthly BPM guest count so I know how many people I'm exposing to the company each month.

**US-031** — As an agent, I want a Year-to-Date BPM view so I can see my total exposure count for the year.

**US-032** — As an agent, I want to note the "Book Next Step" for each BPM guest so I always know what the follow-up action is.

### F-31: Teams

**US-033** — As an agent, I want to see my team (Stoosh Leadership Advancement) and how many licensed agents are on it so I understand my team's growth stage.

**US-034** — As a team leader, I want to see each sub-team's licensed agent count so I know which legs are growing.

### F-32 – F-33: Providers

**US-035** — As an agent, I want to quickly look up insurance carrier information (Equitable, iA Financial, Ivari, Manulife) so I can reference it during client conversations without leaving the app.

**US-036** — As an agent, I want to search the provider list so I can find a specific carrier quickly.

---

## 7. User Flows

### Flow 1: Daily Activity Start
1. Agent opens app → Dashboard loads
2. Agent reviews KPI cards (Cash Flow, Points, Appts, etc.)
3. Agent reads Daily Challenges section → sees 3 challenges
4. Agent taps a challenge → detail view opens
5. Agent completes challenge in real life
6. Agent returns to app → taps challenge → submits with optional image + acknowledgment
7. Challenge status → Pending Approval
8. Mentor approves → RP credited to agent's account

### Flow 2: New Contact Entry
1. Agent meets someone (event, referral, cold approach)
2. Agent taps Dashboard → "Contact" quick-add
3. Form opens: fills Full Name, phone, email, social links
4. Checks Qualifiers (Married, Age 25+, etc.)
5. Selects Archetype and Contact Type
6. Adds Comments (where met, attributes noted)
7. Taps Submit → Contact saved to Rolodex

### Flow 3: BPM Follow-Up
1. BPM event occurs (in-person or online)
2. Agent taps Dashboard → "Guest" quick-add (or navigates to BPM Guests tab)
3. Logs each attendee: name, attended (yes), in-person/online, date
4. Notes next step for each guest
5. Monthly BPM table updates; agent can see year-to-date totals

### Flow 4: Activity Planning
1. Agent navigates to Activity tab
2. Reviews Prospect Agenda (any booked prospects today)
3. Reviews Client Agenda (any client reviews today)
4. Switches to SCHEDULE view → checks full month
5. Identifies open slots → uses contact list to book future appointments

---

## 8. Contact Data Model — Field Purpose Reference

| Field | Purpose |
|---|---|
| Full Name | Primary identifier; used in lists, greetings, follow-ups |
| Profile Pic | Visual memory aid for agent's follow-up |
| Occupation | Qualify income potential and career dissatisfaction |
| Phone / Email | Primary outreach channels |
| Website / LinkedIn / Facebook / Instagram / X | Digital relationship-building and research |
| Archetype | Behavioral/personality classification for sales approach customization |
| Contact Type | Segment pipeline: Prospect / Client / Recruit / Network |
| Qualifiers | SLA qualification criteria — higher qualifier score = stronger candidate |
| Comments | Relationship context, attributes, "hot buttons" for personalized follow-up |
| Referred By | Track referral sources; identify top referral partners |

### Contact Qualifier Scoring Logic
The 8 qualifier checkboxes serve as a prospect scoring system aligned with SLA's training:

| Qualifier | Relevance |
|---|---|
| Married | Higher household financial responsibility = stronger life insurance need |
| Age 25+ | Target demographic for financial planning conversations |
| Children | Increased protection need and planning urgency |
| Home Owner | Asset protection need; financial responsibility indicator |
| Occupation (stable job) | Suggests ability to afford premiums |
| Ambitious | Open to income opportunity / recruitment |
| Dissatisfied | Motivated to change their financial situation |
| Entrepreneurial | Strong recruitment prospect; open to business ownership |

---

## 9. Out of Scope (v1.0)

The following were not found in the live app and are not part of the current v1.0 scope:

- Commission statements or earned income tracking
- Policy management (issue, in-force, lapsed)
- Two-way calendar sync (Google / Outlook / Apple Calendar)
- Bulk contact import (CSV, phone contacts)
- Push notifications for challenge reminders or approval alerts
- Agent onboarding workflow / training content
- Multi-agency admin portal
- In-app messaging between agent and mentor
- Dark/light theme toggle
- Offline mode / local caching
- Export / reporting (PDF, CSV)

---

## 10. Open Questions

| # | Question | Owner | Priority |
|---|---|---|---|
| OQ-01 | What are the valid values for "Archetype" dropdown? (behavioral categories) | App Owner | High |
| OQ-02 | What are the valid values for "Contact Type" dropdown? (Confirmed Rolodex segment tabs: Pre-Contact, Post-Contact, Agents, Clientele, Network — do these map 1:1 to Contact Type values?) | App Owner | High |
| OQ-03 | What does "Crush 13" specifically count — 13 what? (points, lives, premium units?) | App Owner | High |
| OQ-04 | How is "Cash Flow" calculated? Is it manually entered or computed from submissions? | App Owner | High |
| OQ-05 | Does the RP approval workflow send any in-app or email notification to the mentor? | App Owner | Medium |
| OQ-06 | Are agent contacts fully private (row-owner) or can team leaders view their agents' Rolodex? | App Owner | High |
| OQ-07 | Is the "Studying" KPI card connected to a licensing exam tracker? If so, what data feeds it? | App Owner | Medium |
| OQ-08 | ~~Does each quick-add button open the same form or distinct forms?~~ **RESOLVED — Desktop scrape confirms 5 distinct forms at unique URLs with different fields.** | — | Closed |
| OQ-09 | What additional columns or detail view does tapping a Provider entry show? | App Owner | Low |
| OQ-10 | Is the "Monthly Momentum" section a computed view or does it require manual data entry? | App Owner | Medium |
| OQ-11 | Are there additional user roles beyond Agent and Mentor (e.g., Regional Director)? | App Owner | Medium |
| OQ-12 | What is the retention policy for challenge submissions and BPM guest records? | App Owner | Low |

---

## 11. Feature Roadmap Recommendations (v2.0+)

Based on observed gaps and industry best practices for field sales tools:

| Priority | Feature | Rationale |
|---|---|---|
| P0 | ~~Distinct Add forms per quick-add type~~ | **RESOLVED** — Desktop scrape confirms all 5 forms are already distinct with correct field sets. |
| P0 | Push notifications for challenge reminders | Daily 8 AM reminder to complete challenges would significantly increase completion rate. |
| P1 | RP leaderboard (team ranking) | Gamification research shows public leaderboards increase activity 20–40% vs. private tracking alone. |
| P1 | Contact follow-up status / pipeline stages | Pre-Contact → Contacted → Appointed → Presented → Submitted → Client pipeline tracking. |
| P1 | Bulk contact import (CSV / phone contacts) | New agents have 100+ warm market contacts; manual entry is a major friction point. |
| P1 | Manager dashboard (team aggregate KPIs) | Leaders need to see team-wide activity without checking each agent individually. |
| P2 | Offline mode | Agents often capture contacts in areas with no signal (events, rural areas). |
| P2 | Two-way calendar sync | Agents managing multiple tools; calendar fragmentation hurts appointment show rates. |
| P2 | In-app messaging (agent ↔ mentor) | Removes need to switch to WhatsApp/SMS for challenge approval context. |
| P2 | Export to PDF / CSV | Leaders need to submit weekly activity reports; manual re-entry from app is wasteful. |

---

## 12. Acceptance Criteria Summary

| Feature | Acceptance Criteria |
|---|---|
| Dashboard KPIs | All 6 KPI cards show correct values for the current year within 3 seconds of page load on desktop |
| Sidebar nav | All 7 nav items visible and active-highlighted; collapses to drawer on < 1024px |
| Daily Challenges | Exactly 3 challenges visible; RP values correct; submission creates pending record for mentor |
| RP Submission | Agent can submit with or without image; acknowledgment checkbox required; points credited only after mentor approval |
| Contact Form | Full Name, Contact Type, and at least 1 Qualifier required; Company field present; submitted record appears in Rolodex under correct segment tab |
| Rolodex filter tabs | All 5 tabs functional: Pre-Contact, Post-Contact, Agents, Clientele, Network; search filters across all |
| Appt form | Location and Notes fields present; Contact relation field; Date/Time picker |
| Recruit form | Agent Code field (Required) present; links recruit to recruiting agent |
| Biz form | Contract Number and Details Required; Servicing Agent Points Required; split fields optional; submitted record updates Points Submitted in Business tab |
| BPM Guests | Monthly table + YTD view toggle functional; all 5 columns: Contact Name, Attended, In Person/Online, Date Attended, Book Next Step |
| Activity Calendar | 4 agendas (Prospect/Client/Agent/Network) + Schedule view; Today filter; empty-state messages when no events |
| Providers | All 4 carriers visible; real-time name search |
| Teams | "Stoosh Leadership Advancement" with correct licensed agent count |

---

## 13. Revision History

| Version | Date | Author | Changes |
|---|---|---|---|
| 1.0 | 2026-04-17 | Auto-generated via Puppeteer scrape + analysis | Initial draft (mobile viewport — some data incomplete) |
| 1.1 | 2026-04-17 | Desktop re-scrape (1440×900) | Platform corrected to desktop-first; sidebar nav confirmed; Rolodex 5 filter tabs corrected; all 5 quick-add forms confirmed distinct (OQ-08 closed); Biz form production-split fields discovered; Appt form (Location/Notes) and Recruit form (Agent Code) fields corrected; Roadmap item for distinct forms removed (already exists); Acceptance Criteria expanded |
