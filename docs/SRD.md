# Software Requirements Document (SRD)
## SLA Business Tracker — Desktop-First Web Application

| Field | Value |
|---|---|
| Document Version | 1.0 |
| Date | 2026-04-17 |
| Status | Draft |
| Platform | Next.js SaaS (desktop-first, mobile-responsive) |
| App URL | https://sla-business-tracker.glide.page |
| Organization | Stoosh Leadership Advancement (SLA) |

---

## 1. Overview

### 1.1 Purpose
The SLA Business Tracker is a desktop-first, mobile-responsive CRM and performance management application for insurance and financial services sales agents at Stoosh Leadership Advancement (SLA). It centralizes contact prospecting, appointment scheduling, business production tracking, team management, and a gamified daily activity system (Reward Points) in a single web experience optimized for desktop use with full usability on tablet and mobile.

### 1.2 Background
SLA agents operate in a structured sales and recruitment environment requiring consistent daily activity across phone prospecting, appointment booking, company overview presentations (BPMs), client policy submissions, and team building. Prior to this app, activity tracking was fragmented across spreadsheets and manual processes. The Business Tracker consolidates these workflows into a single mobile tool aligned with SLA's sales methodology.

### 1.3 App Architecture
- **Platform:** Next.js 15 SaaS, PostgreSQL backend, Docker-containerised
- **Deployment:** Web app (desktop browser primary); responsive layout scales to tablet and mobile
- **Navigation model:** Collapsible sidebar (desktop) that becomes a slide-over drawer on mobile — no bottom tab bar
- **Authentication:** Email/password + OAuth with JWT sessions and RBAC (Agent / Mentor / Admin)

---

## 2. Scope

### 2.1 In Scope
- Dashboard with real-time KPI summary and gamified daily challenges
- Activity calendar segmented by contact type (Prospect, Client, Agent, Network)
- Business production tracking (product mix, points submitted)
- Rolodex contact management with qualification scoring
- BPM (Business Presentation Meeting) guest log
- Team hierarchy view with licensed agent counts
- Insurance provider reference directory
- Quick-add forms for contacts, guests, appointments, recruits, and business entries
- RP (Reward Points) challenge submission with mentor approval workflow

### 2.2 Out of Scope
- Commission calculation or financial reporting
- Policy management or underwriting workflows
- Document storage beyond proof-of-challenge images
- Two-way calendar sync (Google Calendar, Outlook)
- Push notifications
- Multi-tenant / multi-agency admin panel
- API integrations with insurance carrier systems

---

## 3. Stakeholders

| Stakeholder | Role | Needs |
|---|---|---|
| Field Agent | Primary User | Track daily activity, log contacts, submit challenges, view KPIs |
| Team Leader / Mentor | Approver | Review and approve RP challenge submissions |
| Agency Manager | Admin | View team performance, manage agent data |
| SLA Organization | Owner | Enforce activity standards, drive recruitment and production |

---

## 4. Functional Requirements

### 4.1 Dashboard (FR-DASH)

| ID | Requirement |
|---|---|
| FR-DASH-001 | The system SHALL display a personalized greeting with the current user's name and today's date. |
| FR-DASH-002 | The system SHALL display six real-time KPI cards: Cash Flow, Points, New Appointments, Agents, Licenses, Studying. |
| FR-DASH-003 | The system SHALL display a career progression bar showing the user's progress toward their next rank (e.g., Marketing Director). |
| FR-DASH-004 | The system SHALL display daily challenges in a scrollable list with RP value, title, and description for each challenge. |
| FR-DASH-005 | The system SHALL display a challenge completion counter (e.g., "Completed 0 of 3"). |
| FR-DASH-006 | The system SHALL display a "Monthly Momentum" section summarizing monthly production metrics. |
| FR-DASH-007 | The system SHALL display a "Crush 13" section showing progress toward the agent's 13-point target. |
| FR-DASH-008 | The system SHALL display an "Activities" section listing booked presentations for the current period. |
| FR-DASH-009 | The system SHALL display a "Business" section summarizing submitted business for the current period. |
| FR-DASH-010 | The system SHALL display a "New Contacts" section listing recently added contacts. |
| FR-DASH-011 | The system SHALL display a "Phone Zone" section tracking phone calling activity. |
| FR-DASH-012 | The system SHALL filter all dashboard KPIs and sections by the current year (default: current year). |
| FR-DASH-013 | The system SHALL provide five quick-add action buttons: Contact, Guest, Appt, Recruit, Biz. |

### 4.2 Daily Challenges & RP System (FR-RP)

| ID | Requirement |
|---|---|
| FR-RP-001 | The system SHALL display a list of up to 3 daily challenges, each showing: title, RP value, and description. |
| FR-RP-002 | Each challenge detail view SHALL display the challenge name, RP value, full description, and submission instructions. |
| FR-RP-003 | The system SHALL allow the user to upload an image as proof of challenge completion (optional). |
| FR-RP-004 | The system SHALL require the user to check an acknowledgment checkbox before submitting: "I am submitting this in good faith. False completion will result in no reward points earned." (Required) |
| FR-RP-005 | Upon submission, the system SHALL route the challenge for mentor review and approval before awarding RP. |
| FR-RP-006 | The system SHALL display accumulated RP points on the Dashboard KPI card. |
| FR-RP-007 | RP points SHALL only be credited to the user's account upon mentor approval of the submission. |

### 4.3 Activity Calendar (FR-ACT)

| ID | Requirement |
|---|---|
| FR-ACT-001 | The system SHALL display four segmented agenda views: Prospect Agenda, Client Agenda, Agent Agenda, Network Agenda. |
| FR-ACT-002 | Each agenda view SHALL list all scheduled appointments/events for that contact segment. |
| FR-ACT-003 | The system SHALL display a full month calendar view (Schedule) with Today and Agenda toggle buttons. |
| FR-ACT-004 | The system SHALL support a date filter scoped to the current day ("Today" button). |
| FR-ACT-005 | When no events are scheduled, each agenda SHALL display an appropriate empty-state message. |
| FR-ACT-006 | The system SHALL support a Filter control for narrowing calendar results (Filter0 / active filter count). |

### 4.4 Business Production (FR-BIZ)

| ID | Requirement |
|---|---|
| FR-BIZ-001 | The Business tab SHALL display a "Product Mix" section summarizing production by product type. |
| FR-BIZ-002 | The Business tab SHALL display a "Points Submitted" section tracking submitted production points. |
| FR-BIZ-003 | Business production data SHALL be filterable or summarized by current period. |

### 4.5 Rolodex / Contact Management (FR-ROL)

| ID | Requirement |
|---|---|
| FR-ROL-001 | The system SHALL display a searchable, scrollable contact list. |
| FR-ROL-002 | The contact list SHALL support filtering by five segment tabs: Pre-Contact, Post-Contact, Agents, Clientele, Network. |
| FR-ROL-003 | The system SHALL provide an "Add" button to create new contacts. |
| FR-ROL-004 | The Add New Contact form SHALL capture the following fields: |
| | - Full Name (text, Required) |
| | - Profile Pic (image upload, optional) |
| | - Occupation (textarea, placeholder: "What is their current occupation") |
| | - Company (text) |
| | - Phone Number (text) |
| | - Email (email) |
| | - Website (textarea) |
| | - LinkedIn (textarea) |
| | - Facebook (textarea) |
| | - Instagram (textarea) |
| | - X / Twitter (textarea) |
| | - Archetype (dropdown) |
| | - Contact Type (dropdown, Required) |
| | - Qualifiers (multi-select checkboxes, Required): Married, Age 25+, Children, Home Owner, Occupation, Ambitious, Dissatisfied, Entrepreneurial |
| | - Comments (textarea, placeholder: "Include details like where and how you met, attributes you noticed, hot buttons etc.") |
| | - Referred By (textarea, placeholder: "Correct Spelling/Grammar") |
| FR-ROL-005 | The form SHALL validate that Full Name, Contact Type, and at least one Qualifier are present before submission. |
| FR-ROL-006 | Contact records SHALL be visible in the Rolodex list after submission. |

### 4.6 BPM Guests (FR-BPM)

| ID | Requirement |
|---|---|
| FR-BPM-001 | The BPM Guests tab SHALL display a table-style log of all contacts who attended Business Presentation Meetings. |
| FR-BPM-002 | The table SHALL include the following columns: Contact Name, Attended (boolean), In Person or Online, Date Attended, Book Next Step. |
| FR-BPM-003 | The BPM table SHALL provide two views: Monthly (current month) and Year to Date. |
| FR-BPM-004 | The current month view SHALL be labeled with the month and year (e.g., "April 2026"). |
| FR-BPM-005 | The system SHALL allow adding new BPM guest records via the "Guest" quick-add button on the Dashboard. |

### 4.7 Teams (FR-TEAM)

| ID | Requirement |
|---|---|
| FR-TEAM-001 | The Teams tab SHALL display a list of teams/divisions within the user's organization. |
| FR-TEAM-002 | Each team entry SHALL display the team name and licensed agent count. |
| FR-TEAM-003 | Clicking a team SHALL navigate to a team detail view showing team members and associated metrics. |

### 4.8 Providers (FR-PROV)

| ID | Requirement |
|---|---|
| FR-PROV-001 | The Providers tab SHALL display a searchable list of insurance carrier partners. |
| FR-PROV-002 | The initial provider list SHALL include: Equitable, iA Financial Group, Ivari, Manulife. |
| FR-PROV-003 | The search bar SHALL filter providers by name in real-time. |
| FR-PROV-004 | Tapping a provider SHALL navigate to a provider detail view with carrier-specific information. |

### 4.9 Quick-Add Forms (FR-FORM)

Each of the five quick-add buttons opens a **distinct form** with its own field set. Confirmed via desktop scrape (each button navigates to a unique URL).

| ID | Requirement |
|---|---|
| FR-FORM-001 | The Dashboard SHALL expose five quick-add trigger buttons: Contact, Guest, Appt, Recruit, Biz. |
| FR-FORM-002 | Each button SHALL open a separate, distinct form for that entry type (not a shared form). |
| FR-FORM-003 | All quick-add forms SHALL include Cancel and Submit actions. |
| FR-FORM-004 | On Submit, form data SHALL be validated and saved to the appropriate data table. |
| FR-FORM-005 | On Cancel, no data SHALL be saved and the user returns to the Dashboard. |
| FR-FORM-006 | The **Contact** form SHALL capture: Full Name (Required), Profile Pic, Occupation, Company, Phone Number, Email, Website, LinkedIn, Facebook, Instagram, X, Archetype, Contact Type (Required), Qualifiers (Required), Comments, Referred By. |
| FR-FORM-007 | The **Guest** form SHALL capture: guest contact details for BPM attendance logging (fields mirror Contact form with BPM-specific context). |
| FR-FORM-008 | The **Appt** form SHALL capture: Contact (relation, Required), Date/Time (Required), Location (text), Notes (text). |
| FR-FORM-009 | The **Recruit** form SHALL capture: Agent Code (Required) linking the new recruit to the recruiting agent's hierarchy. |
| FR-FORM-010 | The **Biz** form SHALL capture: Contract Number (Required), Details (Required), Comments, Servicing Agent Points (Required), Licensed Split Agent Code, Licensed Split Agent Points, Non-Licensed Agent Code. |

### 4.10 Navigation & Global (FR-NAV)

| ID | Requirement |
|---|---|
| FR-NAV-001 | The app SHALL use a persistent left sidebar (desktop) showing all 7 nav items: Dashboard, Activity, Business, Rolodex, BPM Guests, Teams, Providers. |
| FR-NAV-002 | The sidebar SHALL be collapsible (icon-only mode) to maximize main content area on smaller desktop screens. |
| FR-NAV-003 | On tablet/mobile (< 1024px) the sidebar SHALL collapse into a slide-over drawer toggled by a hamburger icon in the top bar. |
| FR-NAV-004 | The app header SHALL display the current user's name and today's date/day. |
| FR-NAV-005 | The active sidebar item SHALL be visually highlighted to indicate the current page. |

---

## 5. Non-Functional Requirements

| ID | Category | Requirement |
|---|---|---|
| NFR-001 | Performance | The Dashboard SHALL load and render all KPI cards within 3 seconds on a 4G mobile connection. |
| NFR-002 | Availability | The app SHALL maintain 99.5% uptime, excluding planned maintenance windows. |
| NFR-003 | Usability | All primary actions SHALL be reachable within 2 taps from the Dashboard. |
| NFR-004 | Accessibility | Form fields SHALL use visible labels and appropriate input types (email, text, checkbox). |
| NFR-005 | Security | User data SHALL be scoped to the authenticated user; agents SHALL NOT view other agents' personal contacts. |
| NFR-006 | Data Integrity | Required form fields (Full Name, Contact Type, Qualifiers) SHALL be validated before submission. |
| NFR-007 | Responsiveness | The app SHALL be fully usable on tablet and mobile browsers; desktop is the primary design target. |
| NFR-008 | Scalability | The data model SHALL support a minimum of 500 contacts per agent without degradation in list performance. |
| NFR-009 | Maintainability | Data schema changes (adding contact types, providers, challenge templates) SHALL be performable by an admin without code deployment. |

---

## 6. Data Model

### 6.1 Entities

#### Contact
| Field | Type | Required | Notes |
|---|---|---|---|
| Full Name | Text | Yes | |
| Profile Pic | Image | No | |
| Occupation | Text | No | Placeholder: "What is their current occupation" |
| Company | Text | No | |
| Phone Number | Phone | No | |
| Email | Email | No | |
| Website | URL | No | |
| LinkedIn | URL | No | |
| Facebook | URL | No | |
| Instagram | URL | No | |
| X (Twitter) | URL | No | |
| Archetype | Choice | No | Dropdown options TBD by admin |
| Contact Type | Choice | Yes | Pre-Contact / Post-Contact / Agent / Client / Network |
| Qualifiers | Multi-checkbox | Yes | Married, Age 25+, Children, Home Owner, Occupation, Ambitious, Dissatisfied, Entrepreneurial |
| Comments | Text | No | "Include details like where and how you met, attributes, hot buttons" |
| Referred By | Text | No | |
| Owner (Agent) | User Ref | Auto | Set to logged-in user on creation |

#### BPM Guest Record
| Field | Type | Required | Notes |
|---|---|---|---|
| Contact Name | Text / Relation | Yes | Linked to Contact |
| Attended | Boolean | Yes | |
| In Person or Online | Choice | Yes | "In Person" / "Online" |
| Date Attended | Date | Yes | |
| Book Next Step | Text / Boolean | No | |
| Month | Computed | Auto | Derived from Date Attended |

#### Daily Challenge
| Field | Type | Notes |
|---|---|---|
| Title | Text | e.g., "Phone Zone", "Another One", "Accountable" |
| Description | Text | e.g., "Complete a 1 hour phone zone" |
| RP Value | Number | e.g., 100 |
| Active Date | Date | Challenge is shown on this date |

#### Challenge Submission
| Field | Type | Required | Notes |
|---|---|---|---|
| Challenge | Relation | Yes | Linked to Daily Challenge |
| Agent | User Ref | Yes | Submitting agent |
| Proof Image | Image | No | |
| Good Faith Acknowledgment | Boolean | Yes | Must be true |
| Status | Choice | Auto | Pending / Approved / Rejected |
| Submitted At | DateTime | Auto | |
| Reviewed By | User Ref | No | Mentor who approved |

#### Team
| Field | Type | Notes |
|---|---|---|
| Team Name | Text | e.g., "Stoosh Leadership Advancement" |
| Licensed Agent Count | Number | Computed or manual |
| Members | User Relation | |

#### Provider (Insurance Carrier)
| Field | Type | Notes |
|---|---|---|
| Carrier Name | Text | Equitable, iA Financial Group, Ivari, Manulife |
| Logo | Image | |
| Details / Notes | Text | Product info, contact, etc. |

#### Activity / Appointment
| Field | Type | Required | Notes |
|---|---|---|---|
| Contact | Relation | Yes | Linked to Contact |
| Contact Segment | Choice | Yes | Prospect / Client / Agent / Network |
| Date & Time | DateTime | Yes | |
| Location | Text | No | |
| Notes | Text | No | |
| Agent | User Ref | Auto | |

#### Business Submission (Biz)
| Field | Type | Required | Notes |
|---|---|---|---|
| Contract Number | Text | Yes | Policy/contract identifier |
| Details | Text | Yes | Product/submission description |
| Comments | Text | No | |
| Servicing Agent Points | Number | Yes | Points credited to the primary (servicing) agent |
| Licensed Split Agent Code | Text | No | Code of a licensed co-agent sharing points |
| Licensed Split Agent Points | Number | No | Points allocated to the licensed split agent |
| Non-Licensed Agent Code | Text | No | Code of a non-licensed team member (for recognition) |
| Agent | User Ref | Auto | Submitting agent |
| Submitted At | DateTime | Auto | |

#### Recruit
| Field | Type | Required | Notes |
|---|---|---|---|
| Agent Code | Text | Yes | The new recruit's assigned agent code |
| Recruiting Agent | User Ref | Auto | The agent who submitted the recruit |
| Submitted At | DateTime | Auto | |

---

## 7. User Roles & Permissions

| Role | Capabilities |
|---|---|
| **Agent** | Add/view own contacts, submit challenges, view own KPIs, add BPM guests, view providers and teams |
| **Mentor / Team Leader** | All Agent capabilities + approve/reject RP challenge submissions |
| **Admin** | All Mentor capabilities + manage provider list, manage team assignments, view all agents' data |

---

## 8. Constraints & Assumptions

1. The Next.js rebuild uses the Vercel shadcn/ui admin dashboard template as its structural foundation.
2. Desktop (≥1280px) is the primary design target; layout must also function at 768px (tablet) and 390px (mobile).
3. All users are authenticated with email/password or OAuth; roles (Agent / Mentor / Admin) are RBAC-enforced.
4. The Rolodex contacts are private to the owning agent by default (row-owner data scoping).
5. The "Crush 13" metric refers to 13 production points — a standard monthly target in structured financial services sales orgs.
6. Provider list (Equitable, iA Financial Group, Ivari, Manulife) reflects current carrier lineup; admin-editable.
7. The Biz quick-add form supports production split recording between a servicing agent and up to two additional agents (one licensed, one non-licensed).
8. The five quick-add forms (Contact, Guest, Appt, Recruit, Biz) are each distinct forms with different fields, confirmed by desktop scrape.
9. Date/time is scoped to the user's local timezone.
10. The Glide app at https://sla-business-tracker.glide.page serves as the living reference/prototype for the Next.js rebuild.

---

## 9. Revision History

| Version | Date | Author | Changes |
|---|---|---|---|
| 1.0 | 2026-04-17 | Auto-generated via Puppeteer scrape + analysis | Initial draft (mobile viewport) |
| 1.1 | 2026-04-17 | Desktop scrape (1440×900) | Platform corrected to desktop-first; sidebar nav confirmed; Rolodex filter tabs corrected (5 tabs); all 5 quick-add forms confirmed distinct with correct field sets; Company field added to Contact; Biz, Appt, Recruit entities added to data model; Constraints updated for Next.js rebuild |
