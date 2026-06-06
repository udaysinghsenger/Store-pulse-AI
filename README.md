# StorePulse AI

StorePulse AI is a standalone AI-led in-store experience engine that collects customer feedback from physical stores, verifies the customer’s claim against simulated operational store data, and converts verified issues into actionable tasks for store teams.

The goal of the product is to close the loop between customer sentiment and staff action. It is not a POS system. Instead, it sits above store operations and helps managers, supervisors, floor staff, and head office understand what is actually happening on the ground.

---

## Option chosen

I chose **Option 2: In-store experience engine** because it allowed me to demonstrate product thinking, AI-led verification, and full-stack implementation. StorePulse AI is built as a standalone product that collects customer feedback, uses AI to understand the operational claim, verifies that claim against store data such as inventory, staff schedules, queue logs, and maintenance logs, and then creates role-based tasks for the right store team member. This directly addresses the brief’s core challenge: turning customer feedback into verified operational action.

---

## What it does

StorePulse AI supports the complete feedback-to-action loop:

* Collects customer feedback about a physical store visit.
* Uses Gemini AI to classify the feedback and extract operational context such as product, color, size, issue type, sentiment, and claim summary.
* Verifies the claim using simulated store data in Supabase.
* Avoids creating tasks for positive feedback or general non-operational feedback.
* Creates operational tasks only when action is required.
* Dynamically assigns tasks using staff roster data, store section, shift timing, and availability.
* Allows supervisors and managers to manually reassign eligible tasks.
* Prevents reassignment for sensitive staff behaviour complaints.
* Allows floor staff to update inventory before marking inventory tasks as done.
* Requires notes when tasks are resolved or reviewed, so higher-level users can see action context.
* Shows task notes across floor staff, supervisor, manager, and head office views.
* Allows managers to escalate important tasks to head office.
* Sends notifications for new assignments, high-priority tasks, reassignments, and escalations.
* Provides role-based dashboards for floor staff, supervisors, managers, and head office.
* Gives head office a verified view of issue patterns, high-priority tasks, and escalations.

---

## Core flow

```txt
Customer feedback
→ AI classification and claim extraction
→ Store data verification
→ Dynamic task allocation
→ Role-based task dashboard
→ Staff action and notes
→ Manager review or escalation
→ Head office insight
```

---

## Tech stack

* Next.js
* TypeScript
* Tailwind CSS
* Supabase
* Gemini API
* Vercel

---

## Data sources

The demo uses Supabase tables to simulate store systems and operational data:

* `stores` - store information
* `inventory` - product stock, shelf count, color, size, and category data
* `staff_roster` - staff members, roles, sections, shifts, and availability
* `queue_logs` - billing counter wait-time records
* `maintenance_logs` - store area/facility status
* `feedback` - customer feedback submissions
* `verification_results` - AI classification and verification result
* `tasks` - operational tasks created from verified feedback
* `task_notes` - notes added by staff, supervisors, managers, and head office
* `notifications` - role-based and user-based notifications
* `app_users` - demo login users

---

## How verification works

StorePulse AI uses AI to classify the customer feedback, then checks the relevant store data depending on the issue type.

### Inventory issue

Example: customer says a product, size, or color was unavailable.

The system checks the `inventory` table for the product, color, and size. If stock count or shelf count is zero, the claim is verified and a restocking task is created.

### Staff issue

Example: customer says staff was rude or unhelpful.

The system does not falsely mark this as fully verified, because staff behaviour cannot be proven only from operational data. Instead, it checks staff roster coverage and routes the complaint to the store supervisor for review.

### Queue issue

Example: customer says billing took too long.

The system checks queue logs, average wait time, and billing counters open. If wait time is high, it creates a task for store supervision.

### Maintenance issue

Example: customer says the trial room, store area, washroom, AC, light, or facility was dirty or not working.

The system checks maintenance logs and creates a task for inspection or resolution.

### Positive feedback

Positive feedback is stored for insight but does not create an operational task.

---

## Dynamic task allocation

Task allocation is not based on the currently logged-in user. It is based on backend staff schedule data stored in Supabase.

The `staff_roster` table stores:

* staff name
* role
* store
* store section
* shift start time
* shift end time
* availability

When a task is created, StorePulse AI checks:

1. The issue type.
2. The relevant store section.
3. The feedback visit time.
4. Staff available in that section during that time.
5. Staff role required for the task.

For example:

* If a customer complains that black jeans size 32 were unavailable in the men's section, the task is assigned to a floor staff member scheduled in the men's section at that time.
* If the issue is a trial room maintenance issue, the task is routed to staff assigned to trial rooms or store floor operations.
* If the issue is staff behaviour, it is assigned to the store supervisor and is not manually reassignable.
* If the issue is high priority, manager and head office notifications are also created.

Supervisors and managers can manually reassign eligible operational tasks, but staff behaviour review tasks remain locked to the supervisor flow.

---

## Notifications

The app includes a notification system for staff and leadership.

Notifications are created when:

* a task is assigned to a staff member
* a task is manually reassigned
* a high-priority task is created
* a manager escalates a task to head office

Each logged-in staff user can open the notifications page from the bell icon in the header.

---

## Role-based dashboards

### Floor staff

Floor staff can:

* see tasks assigned to them
* filter tasks by status
* open task details
* update inventory for inventory-related tasks
* add notes
* mark tasks in progress or resolved

Inventory tasks cannot be marked done until inventory has been updated.

### Supervisor

Supervisors can:

* see store operational tasks
* view open, high-priority, and total tasks
* review staff behaviour complaints
* update task status
* view and add notes
* reassign eligible operational tasks

Staff behaviour tasks are routed to supervisors and are not manually reassignable.

### Manager

Managers can:

* see store feedback and task trends
* view feedback received
* view open tasks
* view high-priority tasks
* reassign eligible tasks
* view task notes
* escalate important issues to head office

### Head office

Head office can:

* see total feedback
* see average recommendation score
* see verified issue categories
* see high-priority open tasks
* see escalated tasks from managers
* view task notes and escalation context

---

## Pages

* `/` - Product overview
* `/feedback` - Customer feedback form
* `/thank-you` - Customer thank-you page after feedback submission
* `/verification/[id]` - Internal AI verification result page
* `/staff-login` - Staff login page
* `/floor-staff` - Floor staff task board
* `/supervisor` - Supervisor dashboard
* `/manager` - Store manager dashboard
* `/head-office` - Head office insights dashboard
* `/data-sources` - Simulated operational store data
* `/notifications` - Staff notification list

---

## Setup

### 1. Clone the repository

```bash
git clone <your-github-repo-url>
cd storepulse-ai
```

### 2. Install dependencies

```bash
npm install
```

### 3. Create a Supabase project

Create a new Supabase project and set up the required tables.

The project uses Supabase for:

* storing feedback
* storing operational data
* storing verification results
* storing tasks
* storing task notes
* storing notifications
* storing demo staff users

### 4. Run the database schema

Run the SQL schema used for the project in the Supabase SQL editor.

Required tables include:

* `stores`
* `inventory`
* `staff_roster`
* `queue_logs`
* `maintenance_logs`
* `feedback`
* `verification_results`
* `tasks`
* `task_notes`
* `notifications`
* `app_users`

### 5. Seed demo data

Seed the database with demo data for:

* stores
* inventory
* staff roster
* queue logs
* maintenance logs
* app users

The staff roster should include multiple staff members across store sections such as:

* Mens Section
* Womens Section
* Kids Section
* Grocery Section
* Trial Rooms
* Billing Counter
* Store Office

### 6. Create a Gemini API key

Create a Gemini API key from Google AI Studio.

### 7. Create `.env.local`

Create a `.env.local` file in the root of the project.

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
GEMINI_API_KEY=
USE_MOCK_AI=false
```

### 8. Run the development server

```bash
npm run dev
```

Open:

```txt
http://localhost:3000
```

---

## Environment variables

See `.env.example`.

Required variables:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
GEMINI_API_KEY=
USE_MOCK_AI=false
```

`USE_MOCK_AI=true` can be used to test the app with fallback rule-based classification if a Gemini key is not available.

---

## Build

```bash
npm run build
```

---

## Demo staff credentials

| Role        | User ID               | Password       |
| ----------- | --------------------- | -------------- |
| Manager     | manager.storepulse    | Manager@123    |
| Supervisor  | supervisor.storepulse | Supervisor@123 |
| Floor Staff | floor.storepulse      | Floor@123      |
| Head Office | headoffice.storepulse | HeadOffice@123 |

---


## Assumptions

* Supabase simulates real store systems for inventory, staff roster, queue logs, and maintenance logs.
* No Fynd integration is required because this is Option 2.
* The app is a prototype, so authentication is simplified for demo use.
* Staff login credentials are stored in Supabase, not hardcoded in the codebase.
* Environment variables are used for Supabase and Gemini credentials.
* `.env.local` is gitignored and `.env.example` is included.
* Row Level Security is simplified for prototype speed.
* Store data shown in `/data-sources` is operational data, not customer complaint data.
* Product, color, size, and section are extracted from feedback text where possible.
* Positive feedback is stored but does not create operational tasks.
* Staff behaviour complaints are routed for supervisor review rather than being falsely marked as fully verified.
* Sensitive staff behaviour review tasks are not manually reassignable.
* Inventory tasks require inventory update before they can be marked resolved.
* The system is not a POS and does not handle billing, checkout, payments, invoices, returns, exchanges, or cart flows.

---

## Approach and architecture

The app is designed as an operational layer above store systems.

The customer-facing part is intentionally simple: customers only submit feedback. The internal system then performs the heavier work of understanding the feedback, verifying the claim, assigning ownership, and creating visibility for leadership.

The architecture follows this flow:

```txt
Feedback collection
→ Gemini classification
→ Supabase operational verification
→ Task generation
→ Dynamic staff allocation
→ Role-based dashboards
→ Notes, reassignment, escalation, and notifications
→ Head office insight
```

This keeps the product focused on the assignment brief: not replacing the POS, but helping the store close the loop from customer sentiment to operational action.

---

## AI tools used

* Gemini API: used for complaint classification, sentiment detection, issue type classification, and claim extraction.
* ChatGPT: used as a reference tool for discussing technical approaches, resolving development blockers, and reviewing documentation during the implementation process.
---

## Blockers

No unresolved blockers at the time of submission.

During implementation, some issues were encountered and resolved:

* Next.js server/client component separation for auth and navbar.
* Preventing positive feedback from incorrectly creating tasks.
* Making inventory tasks require an inventory update before resolution.
* Creating role-based notifications.
* Cleaning evidence display so internal staff see useful structured evidence instead of raw JSON.
* Supporting task notes, reassignment, and manager escalation.
