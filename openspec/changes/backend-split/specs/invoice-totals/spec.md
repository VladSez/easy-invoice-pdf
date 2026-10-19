# Spec Delta

## Purpose

Defines how an invoice's computed amounts follow from its line items, so every editor and every API path produces the same totals and no caller can store totals that disagree with the items.

## ADDED Requirements

### Requirement: Item amounts are derived from quantity, price and VAT

Each item's net amount SHALL equal quantity times net price; its VAT amount SHALL equal the net amount times the VAT rate divided by 100; its pre-tax amount SHALL equal net plus VAT. Each value SHALL be rounded to two decimal places, and VAT is computed from the rounded net amount.

#### Scenario: Numeric VAT rate

- **WHEN** an item has quantity 3, net price 10.005 and VAT "23"
- **THEN** its net amount is 30.02, its VAT amount is 6.9 and its pre-tax amount is 36.92

#### Scenario: Non-numeric VAT code

- **WHEN** an item has a VAT value that is not a number, such as "NP" or "OO"
- **THEN** its VAT amount is 0 and its pre-tax amount equals its net amount

#### Scenario: Missing or invalid quantity or price

- **WHEN** an item's quantity or net price is empty or not a number
- **THEN** that value counts as 0 and the item's amounts are 0

### Requirement: Invoice total is the sum of item pre-tax amounts

The invoice total SHALL equal the sum of every item's pre-tax amount, rounded to two decimal places. A non-finite item amount SHALL count as 0.

#### Scenario: Several items

- **WHEN** an invoice has items with pre-tax amounts 36.92 and 12.3
- **THEN** its total is 49.22

#### Scenario: Non-finite amount

- **WHEN** one item's pre-tax amount is `Infinity` or overflows to it
- **THEN** that item contributes 0 and the total stays a finite number

### Requirement: Stored and rendered totals ignore caller-supplied values

Any server path that creates, updates or renders an invoice SHALL recompute item amounts and the invoice total from the items, and SHALL ignore net, VAT, pre-tax and total values in the request.

#### Scenario: API request with a wrong total

- **WHEN** a client creates or renders an invoice whose items sum to 49.22 but sends `total: 1`
- **THEN** the stored invoice and the PDF both show a total of 49.22

#### Scenario: Item amounts omitted

- **WHEN** a client sends items with quantity, net price and VAT but no computed amounts
- **THEN** the request succeeds and the computed amounts are filled in

### Requirement: Every editor uses the same calculation

The free app's editor and the dashboard editor SHALL produce the same item amounts and total as the server for the same items.

#### Scenario: Editor and server agree

- **WHEN** the same items are entered in the free app's editor and sent to the API
- **THEN** the totals shown in the editor equal the totals the API stores
