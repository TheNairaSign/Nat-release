import { rewardShareText, rewardShareUrl } from '@/core/rewards';

describe('reward share', () => {
  it('builds share text and platform urls', () => {
    expect(rewardShareText('Eco Mug')).toContain('Just redeemed "Eco Mug"');
    expect(rewardShareUrl('twitter', 'Eco Mug')).toContain('twitter.com');
    expect(rewardShareUrl('whatsapp', 'Eco Mug')).toContain('wa.me');
    expect(rewardShareUrl('facebook', 'Eco Mug')).toContain('facebook.com');
    expect(rewardShareUrl('linkedin', 'Eco Mug')).toContain('linkedin.com');
  });
});
