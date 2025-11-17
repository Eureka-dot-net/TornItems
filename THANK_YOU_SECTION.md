# Thank You Section - Donation Management

## Overview

The gym comparison page now includes a "Thank You" section that displays supporters who have donated items in-game. This section is positioned between the "Support This Tool" card and the "Report a Problem" card.

## Adding Donations

There are two ways to add donations to the database:

### Option 1: Using the Seed Script (Development/Testing)

Run the seed script to populate sample data:

```bash
cd API
npm run ts-node scripts/seedDonations.ts
```

Edit `API/scripts/seedDonations.ts` to add your own donations before running.

### Option 2: Direct Database Insert (Production)

You can add donations directly to MongoDB using the MongoDB shell or a GUI tool like MongoDB Compass:

```javascript
// Connect to your database and run:
db.donations.insertOne({
  playerName: "PlayerName",
  donationItem: "Xanax",
  createdAt: new Date()
});
```

Or insert multiple donations at once:

```javascript
db.donations.insertMany([
  { playerName: "KlarkKent", donationItem: "Xanax", createdAt: new Date() },
  { playerName: "Player2", donationItem: "Energy Drink", createdAt: new Date() }
]);
```

## API Endpoint

The donations are fetched from the API endpoint:

**GET** `/api/gym/donations`

Response format:
```json
[
  {
    "_id": "...",
    "playerName": "KlarkKent",
    "donationItem": "Xanax",
    "createdAt": "2025-11-17T14:00:00.000Z"
  }
]
```

## Database Schema

The Donation model has the following structure:

```typescript
{
  playerName: string;     // Required - The name of the player who donated
  donationItem: string;   // Required - What they donated (e.g., "Xanax", "Energy Drink")
  createdAt: Date;        // Auto-generated - When the donation was recorded
}
```

## Frontend Display

Donations are displayed as small chips with the format: `PlayerName - DonationItem`

- Donations are sorted by most recent first
- If no donations exist, it shows "Be the first to support this page!"
- Loading and error states are handled gracefully
- The section uses a green theme to match the "thank you" sentiment

## Examples

Common donation items you might want to display:
- Xanax
- Energy Drink
- Energy Refill
- Happy Pills
- SEs (Special Edition items)
- Any other in-game items

Format examples:
- "KlarkKent - Xanax"
- "Superman - 10x Energy Drinks"
- "TornPlayer - Happy Pills"
