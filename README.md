
# evt-mgmt-demo

A sports event management app built with Next.js and Supabase. Supports creating and managing sports events with  scheduling, filtering, and full auth flow.

## Getting Started

### Prerequisites

- Node.js 18+
- Docker Desktop
- Supabase CLI

### 1. Install dependencies

```bash
npm install
```

### 2. Start local Supabase

```bash
supabase start
```

This pulls and starts all Supabase services (Postgres, Auth, Studio, etc.).

## Architectural Decisions

### 1. App Router + server-side auth

Using the App Router with React Server Components allows us to fetch data and enforce auth on the server before anything is sent to the client.

### 2. API route handlers

Keeps the service role server-side and gives us a clean place to add validation, error formatting, and conflict handling (duplicates etc...).

### 3. formatted_event_details view

Instead of expensive joins I created a view that does the compilation. The view returns each event with its venues as a JSON array, which maps directly to the shape the UI needs. This also leaves flexibility to make changes as the UI only needs to know the shape.

### 4. UUIDv7 over UUIDv4

UUIDv7 is time sorted which allows for faster index based search. This makes pagination and ordering more efficient as it is stored chronologically.

### 5. Sport Type as ENUM

Sport type is an ENUM at the database level rather than a TEXT field or a separate lookup table. This allows validation on the DB layer and automatic sync. However, if this was going full production I would have created a lookup table instead to scale appropriately and leave room for more customization.

### 6. React Hook Form

Not just because it was required... but it avoids chaotic state management library which can leave room for unintentional re-renders. It also handles validation, provides `useFieldArray` for the dynamic venue assignment list, and uses a single `reset()` rather than resetting each state variable individually.

## Login

- Sign up from the login page ... sorry ran out of time to seed the user credentials 😭
- Once created login using the credentials specified and voila!
