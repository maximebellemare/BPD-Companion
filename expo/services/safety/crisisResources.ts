import { Platform } from 'react-native';

export type CrisisResource = {
  id: string;
  label: string;
  actionLabel: string;
  description: string;
  phone?: string;
  phoneDisplay?: string;
  sms?: string;
  smsDisplay?: string;
  smsBody?: string;
};

export type CrisisResourceRegion = 'CA' | 'US' | 'AU' | 'FR' | 'GB' | 'UNKNOWN';

const REGION_ALIASES: Record<string, CrisisResourceRegion> = {
  CA: 'CA',
  US: 'US',
  AU: 'AU',
  FR: 'FR',
  GB: 'GB',
  UK: 'GB',
};

function getRegionFromLocale(locale?: string): CrisisResourceRegion {
  if (!locale) return 'UNKNOWN';
  const region = locale.split(/[-_]/).pop()?.toUpperCase() ?? '';
  return REGION_ALIASES[region] ?? 'UNKNOWN';
}

export function getDetectedRegion(): CrisisResourceRegion {
  try {
    const locale = Intl.DateTimeFormat().resolvedOptions().locale;
    return getRegionFromLocale(locale);
  } catch {
    return 'UNKNOWN';
  }
}

export function getCrisisResources(region: CrisisResourceRegion = getDetectedRegion()): CrisisResource[] {
  switch (region) {
    case 'CA':
      return [
        {
          id: 'ca-988',
          label: 'Canada 988',
          actionLabel: 'Call or text 988',
          description: '24/7 suicide crisis support in Canada',
          phone: '988',
          phoneDisplay: '988',
          sms: '988',
          smsDisplay: '988',
        },
        {
          id: 'ca-emergency',
          label: 'Emergency',
          actionLabel: 'Call 911',
          description: 'For immediate danger in Canada',
          phone: '911',
          phoneDisplay: '911',
        },
      ];
    case 'AU':
      return [
        {
          id: 'au-lifeline',
          label: 'Lifeline Australia',
          actionLabel: 'Call 13 11 14',
          description: '24/7 crisis support in Australia',
          phone: '131114',
          phoneDisplay: '13 11 14',
        },
        {
          id: 'au-emergency',
          label: 'Emergency',
          actionLabel: 'Call 000',
          description: 'For immediate danger in Australia',
          phone: '000',
          phoneDisplay: '000',
        },
      ];
    case 'FR':
      return [
        {
          id: 'fr-suicide-ecoute',
          label: 'Suicide Écoute',
          actionLabel: 'Call 01 45 39 40 00',
          description: 'Suicide support line in France',
          phone: '0145394000',
          phoneDisplay: '01 45 39 40 00',
        },
        {
          id: 'fr-emergency',
          label: 'Emergency',
          actionLabel: 'Call 112',
          description: 'For immediate danger in France or the EU',
          phone: '112',
          phoneDisplay: '112',
        },
      ];
    case 'GB':
      return [
        {
          id: 'uk-samaritans',
          label: 'Samaritans',
          actionLabel: 'Call 116 123',
          description: 'Free emotional support, 24/7 in the UK and ROI',
          phone: '116123',
          phoneDisplay: '116 123',
        },
        {
          id: 'uk-emergency',
          label: 'Emergency',
          actionLabel: 'Call 999 or 112',
          description: 'For immediate danger in the UK',
          phone: '999',
          phoneDisplay: '999 or 112',
        },
      ];
    case 'US':
      return [
        {
          id: 'us-988',
          label: '988 Suicide & Crisis Lifeline',
          actionLabel: 'Call or text 988',
          description: 'Free, confidential support 24/7 in the US',
          phone: '988',
          phoneDisplay: '988',
          sms: '988',
          smsDisplay: '988',
        },
        {
          id: 'us-emergency',
          label: 'Emergency',
          actionLabel: 'Call 911',
          description: 'For immediate danger in the US',
          phone: '911',
          phoneDisplay: '911',
        },
      ];
    default:
      return [
        {
          id: 'local-emergency',
          label: 'Local emergency services',
          actionLabel: 'Call your local emergency number',
          description: 'Use this if you or someone else may be in immediate danger',
        },
      ];
  }
}

export function getPrimaryCrisisResourceText(region: CrisisResourceRegion = getDetectedRegion()): string {
  const resource = getCrisisResources(region)[0];
  if (resource.phone || resource.sms) {
    return `${resource.label}: ${getResourceContactText(resource)}. ${resource.description}. If you are in immediate danger, call your local emergency number now.`;
  }
  return `${resource.label}: ${resource.actionLabel}. ${resource.description}. If you are in immediate danger, call your local emergency number now.`;
}

export function getResourceContactText(resource: CrisisResource): string {
  if (resource.phone && resource.sms) {
    const phone = resource.phoneDisplay ?? resource.phone;
    const sms = resource.smsDisplay ?? resource.sms;
    return phone === sms ? `Call or text ${phone}` : `Call ${phone} or text ${sms}`;
  }
  if (resource.phone) return `Call ${resource.phoneDisplay ?? resource.phone}`;
  if (resource.sms) {
    const body = resource.smsBody ? ` ${resource.smsBody}` : '';
    return `Text${body} to ${resource.smsDisplay ?? resource.sms}`;
  }
  return resource.actionLabel;
}

export function getResourceUrl(resource: CrisisResource): string | null {
  if (resource.phone) return `tel:${resource.phone}`;
  if (resource.sms) {
    return resource.smsBody ? `sms:${resource.sms}${Platform.OS === 'ios' ? '&' : '?'}body=${encodeURIComponent(resource.smsBody)}` : `sms:${resource.sms}`;
  }
  return null;
}
