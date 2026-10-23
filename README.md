# GoodSwing

> **Play Your Game. Make an Impact.**

GoodSwing is a golf membership platform that combines **Stableford scoring, charitable giving, and a monthly prize draw** into one experience.

Members can choose a membership plan, select a charity/cause, record their Stableford scores, become eligible for monthly prize draws, and track their winnings and payouts.

Administrators can manage members, charities, draws, winners, verification, payments, and reporting through a dedicated admin portal.

---

## ✨ Features

### Member Experience

- Secure authentication with Supabase Auth
- Membership plan selection
- Active membership tracking
- Charity/cause selection
- Stableford score submission
- Up to 5 recent Stableford scores per member
- Automatic score ordering
- Monthly draw eligibility
- Draw results and winner visibility
- Winner proof submission
- Winnings and payout tracking
- Responsive member dashboard

### Charity & Impact

- Browse available charities
- Select a preferred cause
- Record charitable contributions
- Track overall charity impact
- Admin-managed charity data
- Admin-managed charity events

### Monthly Draw

- Monthly draw management
- Draw number generation
- Stableford-based eligibility
- 3-number, 4-number and 5-number prize tiers
- Jackpot handling and rollover
- Draw simulation
- Draw publishing
- Winner generation
- Winner verification workflow

### Admin Portal

- Admin-only authentication and authorization
- Member/user management
- Membership visibility
- Charity management
- Event management
- Draw creation and management
- Draw simulation
- Winner management
- Winner proof review
- Winner approval/rejection
- Payment/payout management
- Payment reference tracking
- Reports and draw statistics
- Operational dashboard

---

## 🏗️ Architecture

```text
                         ┌──────────────────────┐
                         │      GoodSwing       │
                         │      Next.js App     │
                         └──────────┬───────────┘
                                    │
                  ┌─────────────────┴─────────────────┐
                  │                                   │
          ┌───────▼────────┐                 ┌────────▼────────┐
          │  Member Portal │                 │   Admin Portal  │
          └───────┬────────┘                 └────────┬────────┘
                  │                                   │
                  └─────────────────┬─────────────────┘
                                    │
                           ┌────────▼────────┐
                           │     Supabase    │
                           └────────┬────────┘
                                    │
              ┌─────────────────────┼─────────────────────┐
              │                     │                     │
       ┌──────▼──────┐       ┌──────▼──────┐      ┌──────▼──────┐
       │ Supabase    │       │ PostgreSQL  │      │  Supabase   │
       │    Auth     │       │  Database   │      │   Storage   │
       └─────────────┘       └─────────────┘      └─────────────┘
```

### Main application domains

```text
Authentication
     │
     ├── Members
     ├── Admins
     └── Roles

Membership
     │
     └── Subscriptions

Golf
     │
     └── Stableford Scores

Impact
     │
     ├── Charities
     └── Charity Contributions

Draw
     │
     ├── Draws
     ├── Draw Entries
     └── Winners

Payments
     │
     └── Payouts

Storage
     │
     └── Winner Proofs
```

---

## 🛠️ Tech Stack

### Frontend

- **Next.js 16**
- **React**
- **TypeScript**
- **Tailwind CSS**
- **Framer Motion**
- **Lucide React**

### Backend & Database

- **Supabase**
- **PostgreSQL**
- **Supabase Auth**
- **Supabase Storage**
- Row Level Security (RLS)

### Deployment

- **Vercel**

### Development

- **Node.js**
- **npm**
- **Git**
- **GitHub**

---

## 📁 Project Structure

```text
GoodSwing/
│
├── src/
│   ├── app/
│   │   ├── admin/
│   │   │   ├── draws/
│   │   │   ├── users/
│   │   │   ├── winners/
│   │   │   ├── reports/
│   │   │   └── ...
│   │   │
│   │   ├── dashboard/
│   │   ├── login/
│   │   ├── signup/
│   │   └── ...
│   │
│   ├── components/
│   │   ├── goodswing/
│   │   └── ui/
│   │
│   └── lib/
│       ├── auth.ts
│       └── supabase/
│
├── supabase/
│   ├── 01_core.sql
│   ├── 02_charity.sql
│   ├── 03_draw.sql
│   └── 04_payment.sql
│
├── public/
│
├── .env.local
├── package.json
├── next.config.ts
├── tsconfig.json
└── README.md
```

---

## 🗄️ Database Design

GoodSwing uses PostgreSQL through Supabase.

The database setup is separated into domain-specific SQL scripts rather than placing the complete schema into application code.

### Core

The core schema contains the foundational application entities such as:

- User profiles
- Roles
- Membership/subscription information
- Stableford scores

### Charity

The charity domain manages:

- Charities
- Charity information
- Member charity selection
- Charity contributions
- Events

### Draw

The draw domain manages:

- Monthly draws
- Draw numbers
- Draw status
- Prize pools
- Draw entries
- Winners
- Verification status
- Jackpot rollover

### Payment

The payment domain manages:

- Winner payouts
- Payment status
- Payment references
- Payment-related information

### Storage

Supabase Storage is used for winner proof documents/images.

---

## 🔐 Authentication & Authorization

GoodSwing uses **Supabase Auth** for authentication.

Application-level authorization separates:

```text
Member
   ↓
Member Dashboard
```

from:

```text
Admin
   ↓
Admin Portal
```

Protected routes validate the authenticated user and appropriate role before allowing access.

Admin functionality is not exposed to regular members.

---

## ⛳ Stableford Scoring

Members can maintain their recent Stableford scores.

The scoring workflow supports:

- Valid Stableford scores
- Score date
- Recent-score ordering
- Maximum of 5 stored scores
- Replacement/removal of the oldest score when a new score exceeds the allowed history

This score history is used as part of the monthly draw eligibility and prize logic.

---

## 🎯 Monthly Prize Draw

GoodSwing uses a monthly draw system based on the application's Stableford scoring and draw rules.

The draw workflow is:

```text
Eligible Members
       ↓
Monthly Draw
       ↓
Generate Draw Numbers
       ↓
Match Member Numbers
       ↓
Determine Prize Tier
       ↓
Generate Winners
       ↓
Publish Results
       ↓
Winner Verification
       ↓
Payout
```

### Prize matching

The application supports different prize tiers based on the number of matching numbers:

```text
3 matches → Prize
4 matches → Higher Prize
5 matches → Jackpot
```

When applicable, the jackpot can roll over into a subsequent draw.

---

## 💚 Charity Contribution

Charity is a core part of the GoodSwing product rather than an additional feature.

Members can:

1. Select a charity/cause.
2. Participate through their membership.
3. Contribute toward the selected charitable cause.
4. Track the impact represented within the platform.

The charity catalogue is **data-driven**, allowing administrators to manage available charities rather than hardcoding charity information into the frontend.

---

## 🏆 Winner Verification & Payout

When a member wins:

```text
Winner generated
      ↓
Winner submits proof
      ↓
Admin reviews proof
      ↓
Approved / Rejected
      ↓
Approved
      ↓
Payment processed
      ↓
Payment reference recorded
```

This creates a clear operational workflow between winning, verification, and payout.

---

## 👨‍💼 Admin Workflow

The admin portal provides operational control over the platform.

### Dashboard

Provides an overview of:

- Users
- Active members
- Revenue
- Charity impact
- Prize pool
- Winner verification actions
- Pending payouts
- Recent draws

### Users

Administrators can review member information and membership-related information.

### Charities

Administrators can manage available causes and charity-related information.

### Draws

Administrators can:

- Create/manage monthly draws
- Simulate draws
- Review draw results
- Publish draws

### Winners

Administrators can:

- Review winners
- Review submitted proof
- Approve winners
- Reject winners
- Manage payment status
- Record payment references

### Reports

The admin portal provides draw statistics and operational reporting.

---

## ⚡ Performance

The application uses several server-side performance practices:

- Server-side data fetching where appropriate
- Parallel fetching of independent Supabase queries
- Limited queries for data that only requires a recent subset
- Reduced unnecessary client-side data fetching
- Parallel generation of independent winner proof URLs
- Loading states for navigation and data-heavy pages
- Protected server-side admin routes

The application is deployed as a production Next.js application through Vercel.

---

## 🚀 Getting Started

### Prerequisites

Make sure you have:

- Node.js installed
- npm installed
- A Supabase project
- A Vercel account for deployment

---

### 1. Clone the repository

```bash
git clone https://github.com/i-shashikant/GoodSwing.git
cd GoodSwing
```

---

### 2. Install dependencies

```bash
npm install
```

---

### 3. Configure environment variables

Create:

```text
.env.local
```

Add the required Supabase environment variables used by the application.

Example:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

If the application uses additional server-side Supabase credentials, configure those according to the project's environment configuration.

> **Never commit `.env.local` or service-role/private Supabase credentials to GitHub.**

---

### 4. Set up Supabase

Run the SQL scripts from the `supabase/` directory in the appropriate order:

```text
01_core.sql
02_charity.sql
03_draw.sql
04_payment.sql
```

These scripts establish the database structure and related functionality required by the application.

---

### 5. Run locally

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

---

## 🧪 Production Build

Before deployment, verify the production build locally:

```bash
npm run build
```

A successful build should complete without TypeScript or compilation errors.

---

## ☁️ Deployment

GoodSwing is deployed using Vercel.

The production deployment uses the `main` branch.

Before deploying, configure the required environment variables in:

```text
Vercel
→ Project
→ Settings
→ Environment Variables
```

Environment variables should be configured for the appropriate production environment.

---

## 🔒 Security Notes

- Authentication is handled through Supabase Auth.
- Admin routes require appropriate authorization.
- Database access is protected using Supabase Row Level Security.
- Private environment variables are not committed to source control.
- Winner proof files are stored using Supabase Storage.
- Sensitive server-side credentials should never be exposed through `NEXT_PUBLIC_*` variables.

---

## 📋 Product Flow

### Member

```text
Sign Up
   ↓
Choose Membership
   ↓
Select Charity
   ↓
Record Stableford Scores
   ↓
Become Draw Eligible
   ↓
Monthly Draw
   ↓
Win
   ↓
Submit Proof
   ↓
Track Verification
   ↓
Track Payout
```

### Administrator

```text
Admin Login
   ↓
Dashboard
   ↓
Manage Members
   ↓
Manage Charities / Events
   ↓
Manage Draw
   ↓
Simulate / Publish
   ↓
Review Winners
   ↓
Verify Proof
   ↓
Manage Payout
   ↓
View Reports
```

---

## 🎨 Product Principles

GoodSwing is designed around three core ideas:

### Play

Make participating through golf simple and engaging.

### Impact

Connect participation with meaningful charitable causes.

### Reward

Give members an opportunity to benefit from consistent participation through the monthly draw.

---

## 📌 Project Status

**Production ready / deployed**

The current implementation includes the primary member, charity, draw, winner, payment, and administrative workflows required for the GoodSwing product.

---

## 👤 Author

**Shashikant**

GitHub:

https://github.com/i-shashikant

---

## 📄 License

This project was created as part of the GoodSwing Digital Heroes internship assignment.