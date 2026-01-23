import {
    CompactConfigMap,
    CustomFormatType,
    NumberSeparator,
    applyCustomFormat,
    convertCustomFormatToFormatExpression,
    currencies,
    findCompactConfig,
    getCompactOptionsForFormatType,
    type CustomFormat,
} from '@lightdash/common';
import {
    Anchor,
    Flex,
    NumberInput,
    Select,
    Stack,
    Text,
    TextInput,
} from '@mantine/core';
import { type GetInputProps } from '@mantine/form/lib/types';
import { useMemo, type FC } from 'react';
import { useTranslation } from 'react-i18next';
import { type ValueOf } from 'type-fest';

type Props = {
    formatInputProps: (
        path: keyof CustomFormat,
    ) => ReturnType<GetInputProps<CustomFormat>>;
    format: CustomFormat;
    setFormatFieldValue: (
        path: keyof CustomFormat,
        value: ValueOf<CustomFormat>,
    ) => void;
};

const formatTypeOptions = [
    CustomFormatType.DEFAULT,
    CustomFormatType.PERCENT,
    CustomFormatType.CURRENCY,
    CustomFormatType.NUMBER,
    CustomFormatType.BYTES_SI,
    CustomFormatType.BYTES_IEC,
    CustomFormatType.CUSTOM,
];

const formatCurrencyOptions = currencies.map((c) => {
    const currencyFormat = Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: c,
    });

    return {
        value: c,
        label: `${c} (${currencyFormat
            .format(1234.56)
            .replace(/\u00A0/, ' ')})`,
    };
});

export const FormatForm: FC<Props> = ({
    formatInputProps,
    setFormatFieldValue,
    format,
}) => {
    const { t, i18n } = useTranslation('explore');
    const formatType = format.type;
    const formatSeparatorOptions = useMemo(
        () => [
            {
                value: NumberSeparator.DEFAULT,
                label: t(
                    'format.separator.default',
                    'Default separator',
                ),
            },
            {
                value: NumberSeparator.COMMA_PERIOD,
                label: '100,000.00',
            },
            {
                value: NumberSeparator.SPACE_PERIOD,
                label: '100 000.00',
            },
            {
                value: NumberSeparator.PERIOD_COMMA,
                label: '100.000,00',
            },
            {
                value: NumberSeparator.NO_SEPARATOR_PERIOD,
                label: '100000.00',
            },
        ],
        [i18n.language, t],
    );

    const validCompactValue = useMemo(() => {
        const currentCompact = format.compact;
        if (!currentCompact) return null;

        const validCompacts = getCompactOptionsForFormatType(formatType);
        const compactConfig = findCompactConfig(currentCompact);

        return compactConfig && validCompacts.includes(compactConfig.compact)
            ? currentCompact
            : null;
    }, [format.compact, formatType]);

    return (
        <Stack>
            <Flex>
                <Select
                    withinPortal
                    w={200}
                    label={t('format.type.label', 'Type')}
                    data={formatTypeOptions.map((type) => ({
                        value: type,
                        label:
                            type === CustomFormatType.BYTES_SI
                                ? t('format.type.bytesSi', 'bytes (SI)')
                                : type === CustomFormatType.BYTES_IEC
                                ? t('format.type.bytesIec', 'bytes (IEC)')
                                : type === CustomFormatType.DEFAULT
                                ? t('format.type.default', 'Default')
                                : type === CustomFormatType.PERCENT
                                ? t('format.type.percent', 'Percent')
                                : type === CustomFormatType.CURRENCY
                                ? t('format.type.currency', 'Currency')
                                : type === CustomFormatType.NUMBER
                                ? t('format.type.number', 'Number')
                                : type === CustomFormatType.CUSTOM
                                ? t('format.type.custom', 'Custom')
                                : type,
                    }))}
                    {...{
                        ...formatInputProps('type'),
                        onChange: (value) => {
                            if (value) {
                                setFormatFieldValue('type', value);
                                setFormatFieldValue('compact', undefined);
                            }
                        },
                    }}
                />

                {formatType !== CustomFormatType.DEFAULT && (
                    <Text ml="md" mt={30} w={200} color="ldGray.6">
                        {t('format.previewLabel', 'Looks like: ')}
                        {applyCustomFormat(
                            CustomFormatType.PERCENT === formatType
                                ? '0.754321'
                                : '1234.56789',
                            format,
                        )}
                    </Text>
                )}
                {[
                    CustomFormatType.CURRENCY,
                    CustomFormatType.NUMBER,
                    CustomFormatType.PERCENT,
                    CustomFormatType.BYTES_SI,
                    CustomFormatType.BYTES_IEC,
                ].includes(formatType) && (
                    <Text ml="md" mt={30} w={200} color="ldGray.6">
                        {t('format.formatLabel', 'Format: ')}
                        {convertCustomFormatToFormatExpression(format)}
                    </Text>
                )}
            </Flex>
            {formatType === CustomFormatType.CUSTOM && (
                <TextInput
                    label={t(
                        'format.custom.expressionLabel',
                        'Format expression',
                    )}
                    placeholder={t(
                        'format.custom.expressionPlaceholder',
                        'E.g. #.#0',
                    )}
                    description={
                        <p>
                            {t(
                                'format.custom.descriptionPrefix',
                                'To help you build your format expression, we recommend using',
                            )}{' '}
                            <Anchor
                                href="https://customformats.com"
                                target="_blank"
                            >
                                https://customformats.com
                            </Anchor>
                            .
                        </p>
                    }
                    {...formatInputProps('custom')}
                />
            )}
            {[
                CustomFormatType.CURRENCY,
                CustomFormatType.NUMBER,
                CustomFormatType.PERCENT,
                CustomFormatType.BYTES_SI,
                CustomFormatType.BYTES_IEC,
                ].includes(formatType) && (
                <Flex>
                    {formatType === CustomFormatType.CURRENCY && (
                        <Select
                            withinPortal
                            mr="md"
                            w={200}
                            searchable
                            label={t('format.currency.label', 'Currency')}
                            data={formatCurrencyOptions}
                            {...formatInputProps('currency')}
                        />
                    )}
                    <NumberInput
                        // NOTE: Mantine's NumberInput component is not working properly when initial value in useForm is undefined
                        type="number"
                        min={0}
                        w={200}
                        label={t('format.round.label', 'Round')}
                        placeholder={t(
                            'format.round.placeholder',
                            'Number of decimal places',
                        )}
                        {...{
                            ...formatInputProps('round'),
                            // Explicitly set value to undefined so the API doesn't received invalid values
                            onChange: (value) => {
                                setFormatFieldValue(
                                    'round',
                                    value === '' ? undefined : value,
                                );
                            },
                        }}
                    />
                    <Select
                        withinPortal
                        w={200}
                        ml="md"
                        label={t(
                            'format.separator.label',
                            'Separator style',
                        )}
                        data={formatSeparatorOptions}
                        {...formatInputProps('separator')}
                    />
                </Flex>
            )}
            {[
                CustomFormatType.CURRENCY,
                CustomFormatType.NUMBER,
                CustomFormatType.BYTES_SI,
                CustomFormatType.BYTES_IEC,
            ].includes(formatType) && (
                <Flex>
                    <Select
                        withinPortal
                        mr="md"
                        w={200}
                        clearable
                        label={t('format.compact.label', 'Compact')}
                        placeholder={
                            formatType === CustomFormatType.BYTES_SI
                                ? t(
                                      'format.compact.bytesSiPlaceholder',
                                      'E.g. kilobytes (KB)',
                                  )
                                : formatType === CustomFormatType.BYTES_IEC
                                ? t(
                                      'format.compact.bytesIecPlaceholder',
                                      'E.g. kibibytes (KiB)',
                                  )
                                : t(
                                      'format.compact.defaultPlaceholder',
                                      'E.g. thousands (K)',
                                  )
                        }
                        data={getCompactOptionsForFormatType(formatType).map(
                            (c) => ({
                                value: c,
                                label: CompactConfigMap[c].label,
                            }),
                        )}
                        {...{
                            ...formatInputProps('compact'),
                            // Override value to ensure invalid compact values are cleared
                            value: validCompactValue,
                            onChange: (value) => {
                                // Explicitly set value to undefined so the API doesn't received invalid values
                                setFormatFieldValue(
                                    'compact',
                                    !value || !(value in CompactConfigMap)
                                        ? undefined
                                        : value,
                                );
                            },
                        }}
                    />

                    {formatType === CustomFormatType.NUMBER && (
                        <>
                            <TextInput
                                w={200}
                                mr="md"
                                label={t('format.prefix.label', 'Prefix')}
                                placeholder={t(
                                    'format.prefix.placeholder',
                                    'E.g. GBP revenue:',
                                )}
                                {...formatInputProps('prefix')}
                            />
                            <TextInput
                                w={200}
                                label={t('format.suffix.label', 'Suffix')}
                                placeholder={t(
                                    'format.suffix.placeholder',
                                    'E.g. km/h',
                                )}
                                {...formatInputProps('suffix')}
                            />
                        </>
                    )}
                </Flex>
            )}
        </Stack>
    );
};
