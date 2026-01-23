import { mapDbUserDetailsToLightdashUser } from './UserModel';

describe('UserModel mapDbUserDetailsToLightdashUser', () => {
    it('should map preferred_language to preferredLanguage', () => {
        const user = mapDbUserDetailsToLightdashUser(
            {
                user_id: 1,
                user_uuid: 'user-uuid',
                first_name: 'Ada',
                last_name: 'Lovelace',
                created_at: new Date('2024-01-01T00:00:00.000Z'),
                is_tracking_anonymized: false,
                is_marketing_opted_in: false,
                email: 'ada@example.com',
                organization_uuid: undefined,
                organization_name: undefined,
                organization_created_at: undefined,
                organization_id: 1,
                is_setup_complete: true,
                role: undefined,
                role_uuid: undefined,
                is_active: true,
                updated_at: new Date('2024-01-01T00:00:00.000Z'),
                preferred_language: 'en',
            } as any,
            true,
        );

        expect((user as any).preferredLanguage).toBe('en');
    });
});
