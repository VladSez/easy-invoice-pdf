# Spec Delta

## Purpose

Defines how the free app hands users off to the paid dashboard on its own subdomain, while the free app itself stays account-free and runs as before for users, forks and self-hosters.

## ADDED Requirements

### Requirement: Dashboard path redirects to the dashboard subdomain

When a dashboard URL is configured, requests to `/dashboard` and any path below it on the free app SHALL be permanently redirected to the same path and query on the dashboard origin.

#### Scenario: Bare dashboard path

- **WHEN** a user requests `https://easyinvoicepdf.com/dashboard`
- **THEN** the response is a permanent redirect to `https://app.easyinvoicepdf.com/`

#### Scenario: Nested path with query

- **WHEN** a user requests `https://easyinvoicepdf.com/dashboard/invoices?status=draft`
- **THEN** the response is a permanent redirect to `https://app.easyinvoicepdf.com/invoices?status=draft`

#### Scenario: Not caught by localized routes

- **WHEN** a user requests `/dashboard`
- **THEN** the redirect is returned and no localized page or not-found page is rendered for it

### Requirement: Free app links to the dashboard

When a dashboard URL is configured, the free app SHALL show a link to the dashboard that navigates to the dashboard origin.

#### Scenario: Link is visible

- **WHEN** the free app is built with a dashboard URL configured
- **THEN** a "Dashboard" link pointing at that URL appears in the app

### Requirement: Free app works without a dashboard

When no dashboard URL is configured, the free app SHALL build and run with no dashboard link and no `/dashboard` redirect, and SHALL behave exactly as it does today.

#### Scenario: Fork without configuration

- **WHEN** the free app is built and run with no dashboard URL configured
- **THEN** the build succeeds, no dashboard link is shown, and `/dashboard` is handled like any other unknown path

### Requirement: Free app holds no account state

The free app SHALL NOT load authentication code, call the paid API, or read or set the dashboard's session cookie. Invoice data in the free app SHALL stay in the browser.

#### Scenario: No requests to the API

- **WHEN** a user creates and downloads an invoice in the free app
- **THEN** no request is made to the API origin, and the invoice data is stored only in the browser

#### Scenario: Signed-in user in the free app

- **WHEN** a user signed in to the dashboard opens the free app
- **THEN** the free app behaves the same as for a signed-out user
