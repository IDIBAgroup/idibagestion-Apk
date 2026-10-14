import { getDb } from '../api/queries/connection';
import { partnerLevels } from './schema';

async function seedPartnerLevels() {
  const db = getDb();
  const existing = await db.select().from(partnerLevels);
  if (existing.length > 0) {
    console.log('Partner levels already seeded');
    return;
  }
  await db.insert(partnerLevels).values([
    { slug: 'apporteur', name: 'Apporteur', commissionRate: '7.50', minRevenueXAF: 0, maxRevenueXAF: 500000, description: '5-7.5% du CA encaisse' },
    { slug: 'partner', name: 'Partner', commissionRate: '10.00', minRevenueXAF: 500000, maxRevenueXAF: 1000000, description: '10% du CA encaisse' },
    { slug: 'business', name: 'Business Partner', commissionRate: '12.50', minRevenueXAF: 1000000, maxRevenueXAF: 3000000, description: '12.5% du CA encaisse' },
    { slug: 'premium', name: 'Premium Partner', commissionRate: '15.00', minRevenueXAF: 3000000, maxRevenueXAF: 999999999, description: '15% du CA encaisse' },
  ]);
  console.log('Partner levels seeded successfully');
}

seedPartnerLevels().catch(console.error);
