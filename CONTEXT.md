# Start Context

This document defines the domain language for the Start workspace. Use these terms in code,
reviews, issues, and architecture discussions so modules stay named after product concepts rather
than implementation details.

## Language

### Identity and Access

**User**:
A person with an authenticated account in the application.
_Avoid_: Customer, member, account owner

**Account**:
The personal settings area and profile owned by exactly one **User**.
_Avoid_: User profile, personal workspace

**Auth Session**:
The currently authenticated **User** state carried by PocketBase auth cookies.
_Avoid_: Login state, token state

**Auth Flow**:
A route-driven identity flow that may read URL tokens, redirect, and commit auth cookies.
_Avoid_: Auth page, auth screen

**Email Link**:
A PocketBase-generated link that starts an **Auth Flow** for verification, password reset, or email
change.
_Avoid_: Magic link

### Application Space

**Application Shell**:
The authenticated application chrome that composes navigation, account state, organization state,
and page content.
_Avoid_: Dashboard layout, app wrapper

**Application Scope**:
The active navigation context: personal, organization, or other.
_Avoid_: Workspace mode, tenant mode

**Personal Scope**:
The application area for the current **User** outside any **Organization**.
_Avoid_: Default workspace, user workspace

**Organization Scope**:
The application area for a selected **Organization**.
_Avoid_: Team workspace, tenant workspace

**Application Entry**:
The best post-auth destination for a **User**, preferring an active or accessible **Organization**
when appropriate.
_Avoid_: Dashboard URL, home redirect

### Organizations

**Organization**:
A collaborative space with its own slug, members, settings, and application routes.
_Avoid_: Team, workspace, tenant

**Organization Slug**:
The stable, user-facing URL identifier for an **Organization**.
_Avoid_: Workspace key, organization handle

**Membership**:
The relationship between one **User** and one **Organization**, including that user's role.
_Avoid_: Seat, permission record

**Organization Member**:
A **User** that has an active **Membership** in an **Organization**.
_Avoid_: Teammate, collaborator

**Organization Role**:
The access level assigned by a **Membership**.
_Avoid_: Permission level, plan role

**Owner**:
An **Organization Role** that cannot be removed when it is the last owner in the **Organization**.
_Avoid_: Super admin

**Admin**:
An **Organization Role** with elevated organization management access.
_Avoid_: Manager

**Member**:
The baseline **Organization Role** for regular organization participation.
_Avoid_: User

**Organization Invite**:
A pending invitation for an email address to join an **Organization** with a proposed role.
_Avoid_: Invitation, invite email

**Invite Token**:
A secret token used to inspect or accept an **Organization Invite**.
_Avoid_: Invite code

**Pending Invite**:
An **Invite Token** temporarily stored while an unauthenticated person completes an **Auth Flow**.
_Avoid_: Saved invite, queued invite

**Organization Navigation**:
The client-visible list of organizations and active organization selection used by the
**Application Shell**.
_Avoid_: Workspace switcher state

### Consent and Communication

**Cookie Consent**:
The user's recorded preference for optional cookie categories.
_Avoid_: Cookie banner state

**Contact Request**:
A public marketing-site message submitted through the contact form.
_Avoid_: Lead, ticket

**Support Request**:
A public support message submitted with support-specific fields and optional attachments.
_Avoid_: Ticket, issue

### Content and Legal

**Marketing Site**:
The public localized website outside the authenticated **Application Shell**.
_Avoid_: Landing app, public app

**Blog Post**:
A public content record loaded for the marketing blog.
_Avoid_: Article, update

**Legal Document**:
A localized public document such as terms, cookie policy, GDPR information, or privacy policy.
_Avoid_: Legal page

## Relationships

- A **User** owns exactly one **Account**.
- A **User** may have zero or more **Memberships**.
- A **Membership** belongs to exactly one **User** and exactly one **Organization**.
- An **Organization** may have many **Organization Members**.
- An **Organization Member** is a **User** viewed through a **Membership**.
- An **Organization Invite** belongs to exactly one **Organization** and targets one email address.
- An **Organization Invite** may become a **Membership** when its **Invite Token** is accepted by the
  matching **User**.
- A **Pending Invite** may survive an unauthenticated **Auth Flow** and then influence the
  **Application Entry**.
- The **Application Shell** may render either **Personal Scope** or **Organization Scope**.
- **Organization Navigation** is derived from the current **User**'s accessible **Organizations**.
- **Cookie Consent** may affect analytics and marketing scripts on the **Marketing Site** and the
  authenticated application.

## Example Dialogue

> **Dev:** "When a person opens an **Organization Invite** while signed out, should we create a
> **Membership** immediately?"
>
> **Domain expert:** "No. Store a **Pending Invite**, send them through the relevant **Auth Flow**,
> then accept the **Invite Token** for the authenticated **User** if the email matches."

> **Dev:** "Should the switcher say workspace or team?"
>
> **Domain expert:** "No. The product term is **Organization**. The selected context in the
> **Application Shell** is **Organization Scope**."

## Flagged Ambiguities

- "Account" can mean a **User** in many products, but in this repo **Account** means the personal
  settings/profile area owned by a **User**.
- "Member" can mean any authenticated person, but in this repo **Member** is an
  **Organization Role** or an **Organization Member** depending on context; use **User** for a person.
- "Workspace" and "team" are common synonyms for **Organization**, but the codebase should prefer
  **Organization** unless product language intentionally changes.
- "Invite" can mean the email, token, route, or record; use **Organization Invite** for the record
  and **Invite Token** for the secret.
