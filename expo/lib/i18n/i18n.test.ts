import assert from 'node:assert/strict';
import { getAiLanguageInstruction, i18n } from './index';
import {
  isLanguageSelectable,
  normalizeLanguageTag,
  resolveLanguage,
  SPANISH_LANGUAGE_SELECTION_ENABLED,
} from './languageStorage';

async function run() {
  assert.equal(normalizeLanguageTag('es'), 'es');
  assert.equal(normalizeLanguageTag('es-US'), 'es');
  assert.equal(normalizeLanguageTag('es-MX'), 'es');
  assert.equal(normalizeLanguageTag('es-CO'), 'es');
  assert.equal(normalizeLanguageTag('es-ES'), 'es');
  assert.equal(normalizeLanguageTag('en-US'), 'en');
  assert.equal(normalizeLanguageTag('fr-CA'), null);

  assert.equal(SPANISH_LANGUAGE_SELECTION_ENABLED, false);
  assert.equal(isLanguageSelectable('en'), true);
  assert.equal(isLanguageSelectable('es'), false);
  assert.deepEqual(resolveLanguage({ manualOverride: 'es-MX' }), { language: 'en', source: 'fallback' });
  assert.deepEqual(resolveLanguage({ deviceLocales: [{ languageTag: 'es-AR' }] }), { language: 'en', source: 'fallback' });
  assert.deepEqual(resolveLanguage({ deviceLocales: [{ languageTag: 'fr-CA' }] }), { language: 'en', source: 'fallback' });

  await i18n.changeLanguage('es');
  assert.equal(i18n.t('navigation:today'), 'Hoy');
  assert.equal(i18n.t('auth:signIn.submit'), 'Iniciar sesión');
  assert.equal(i18n.t('subscription:plans.monthly'), 'Mensual');
  assert.equal(i18n.t('profile:membership.restoreTitle'), 'Restaurar compras');
  assert.equal(i18n.t('tools:calm.start'), 'Empezar');
  assert.equal(i18n.t('tools:dontSend.analyze'), 'Analizar antes de enviar');
  assert.equal(i18n.t('tools:trigger.title'), 'Descubre la cadena emocional');
  assert.equal(i18n.t('tools:reflect.title'), 'Extrae la lección');
  assert.equal(i18n.t('tools:secondary.medications.title'), 'Medicamentos');
  assert.equal(i18n.t('tools:secondary.library.relationshipSimulator.title'), 'Simulador de relaciones');
  assert.equal(i18n.t('tools:secondary.skillLibrary'), 'Biblioteca de habilidades');
  assert.equal(i18n.t('legal:privacy.title'), 'Política de privacidad');
  assert.equal(i18n.t('legal:terms.title'), 'Términos de servicio');
  assert.equal(i18n.t('legal:privacy.sections.3.title'), 'Eliminación de datos');
  assert.equal(i18n.t('legal:privacy.sections.4.title'), 'Contáctanos');
  assert.equal(i18n.t('safety:crisisMode.title'), 'Modo de crisis');
  assert.equal(i18n.t('safety:crisisMode.groundingTitle'), 'Anclaje 5-4-3-2-1');
  assert.equal(i18n.t('safety:regulation.title'), 'Regulación de crisis');
  assert.equal(i18n.t('safety:regulation.entryChoices.ec3'), 'Ayúdame a no escribir todavía');
  assert.equal(i18n.t('today:home.checkInTitle'), '¿Cómo te sientes ahora mismo?');
  assert.equal(i18n.t('today:home.emotions.anxious'), 'Ansiedad');
  assert.equal(i18n.t('today:home.actions.saveCheckIn'), 'Guardar registro');
  assert.equal(i18n.t('companion:promptMessages.calm'), 'Ayúdame a calmarme primero y luego a nombrar qué pasó justo antes de que esto se pusiera intenso.');
  assert.equal(i18n.t('companion:chat.contextSuggestions.rewriteLabel'), 'Ayúdame a reescribirlo');
  assert.equal(i18n.t('missing.namespace.key', { defaultValue: 'Fallback copy' }), 'Fallback copy');
  assert(!i18n.t('navigation:today').includes('navigation:'), 'raw keys should not render for known translations');
  assert(getAiLanguageInstruction('es')?.includes('español latinoamericano neutro'));
  assert.equal(getAiLanguageInstruction('en'), null);

  await i18n.changeLanguage('en');
  assert.equal(i18n.t('legal:privacy.title'), 'Privacy Policy');
  assert.equal(i18n.t('safety:crisisMode.title'), 'Crisis Mode');
}

void run();
