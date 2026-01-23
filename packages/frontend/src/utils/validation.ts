import { validateEmail } from '@lightdash/common';
import { type TFunction } from 'i18next';
import { z } from 'zod';

export const requiredString = (t: TFunction) =>
    z.string().min(1, t('required', 'Required'));

export const emailSchema = (t: TFunction) =>
    z
        .string()
        .min(1, t('required', 'Required'))
        .refine((email) => validateEmail(email), {
            message: t('emailInvalid', 'Email address is not valid'),
        })
        .refine((email) => !/\\s/.test(email), {
            message: t(
                'emailWhitespace',
                'Email address must not contain whitespaces',
            ),
        });
