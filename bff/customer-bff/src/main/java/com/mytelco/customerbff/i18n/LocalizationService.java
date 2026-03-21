package com.mytelco.customerbff.i18n;

import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.text.NumberFormat;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
public class LocalizationService {

    private final Map<String, Map<String, String>> translations = Map.of(
        "en-GB", Map.ofEntries(
            Map.entry("dashboard", "Dashboard"),
            Map.entry("usage", "Usage"),
            Map.entry("billing", "Billing"),
            Map.entry("devices", "Devices"),
            Map.entry("family", "Family"),
            Map.entry("roaming", "Roaming"),
            Map.entry("support", "Support"),
            Map.entry("data_remaining", "Data Remaining"),
            Map.entry("voice_remaining", "Voice Remaining"),
            Map.entry("valid_until", "Valid Until"),
            Map.entry("view_all", "View All"),
            Map.entry("manage", "Manage"),
            Map.entry("settings", "Settings"),
            Map.entry("logout", "Log Out"),
            Map.entry("total_due", "Total Due"),
            Map.entry("next_payment", "Next Payment"),
            Map.entry("data_used", "Data Used"),
            Map.entry("voice_used", "Voice Used")
        ),
        "pt-PT", Map.ofEntries(
            Map.entry("dashboard", "Painel"),
            Map.entry("usage", "Utilização"),
            Map.entry("billing", "Faturação"),
            Map.entry("devices", "Dispositivos"),
            Map.entry("family", "Família"),
            Map.entry("roaming", "Roaming"),
            Map.entry("support", "Apoio"),
            Map.entry("data_remaining", "Dados Restantes"),
            Map.entry("voice_remaining", "Voz Restante"),
            Map.entry("valid_until", "Válido Até"),
            Map.entry("view_all", "Ver Tudo"),
            Map.entry("manage", "Gerir"),
            Map.entry("settings", "Definições"),
            Map.entry("logout", "Sair"),
            Map.entry("total_due", "Total a Pagar"),
            Map.entry("next_payment", "Próximo Pagamento"),
            Map.entry("data_used", "Dados Utilizados"),
            Map.entry("voice_used", "Voz Utilizada")
        ),
        "es-ES", Map.ofEntries(
            Map.entry("dashboard", "Panel"),
            Map.entry("usage", "Uso"),
            Map.entry("billing", "Facturación"),
            Map.entry("devices", "Dispositivos"),
            Map.entry("family", "Familia"),
            Map.entry("roaming", "Roaming"),
            Map.entry("support", "Soporte"),
            Map.entry("data_remaining", "Datos Restantes"),
            Map.entry("voice_remaining", "Voz Restante"),
            Map.entry("valid_until", "Válido Hasta"),
            Map.entry("view_all", "Ver Todo"),
            Map.entry("manage", "Gestionar"),
            Map.entry("settings", "Ajustes"),
            Map.entry("logout", "Cerrar Sesión"),
            Map.entry("total_due", "Total a Pagar"),
            Map.entry("next_payment", "Próximo Pago"),
            Map.entry("data_used", "Datos Usados"),
            Map.entry("voice_used", "Voz Usada")
        ),
        "fr-FR", Map.ofEntries(
            Map.entry("dashboard", "Tableau de bord"),
            Map.entry("usage", "Utilisation"),
            Map.entry("billing", "Facturation"),
            Map.entry("devices", "Appareils"),
            Map.entry("family", "Famille"),
            Map.entry("roaming", "Roaming"),
            Map.entry("support", "Support"),
            Map.entry("data_remaining", "Données Restantes"),
            Map.entry("voice_remaining", "Voix Restante"),
            Map.entry("valid_until", "Valide Jusqu'au"),
            Map.entry("view_all", "Voir Tout"),
            Map.entry("manage", "Gérer"),
            Map.entry("settings", "Paramètres"),
            Map.entry("logout", "Déconnexion"),
            Map.entry("total_due", "Total Dû"),
            Map.entry("next_payment", "Prochain Paiement"),
            Map.entry("data_used", "Données Utilisées"),
            Map.entry("voice_used", "Voix Utilisée")
        ),
        "de-DE", Map.ofEntries(
            Map.entry("dashboard", "Dashboard"),
            Map.entry("usage", "Nutzung"),
            Map.entry("billing", "Abrechnung"),
            Map.entry("devices", "Geräte"),
            Map.entry("family", "Familie"),
            Map.entry("roaming", "Roaming"),
            Map.entry("support", "Support"),
            Map.entry("data_remaining", "Verbleibende Daten"),
            Map.entry("voice_remaining", "Verbleibende Sprache"),
            Map.entry("valid_until", "Gültig Bis"),
            Map.entry("view_all", "Alle Anzeigen"),
            Map.entry("manage", "Verwalten"),
            Map.entry("settings", "Einstellungen"),
            Map.entry("logout", "Abmelden"),
            Map.entry("total_due", "Gesamtbetrag"),
            Map.entry("next_payment", "Nächste Zahlung"),
            Map.entry("data_used", "Genutzte Daten"),
            Map.entry("voice_used", "Genutzte Sprache")
        )
    );

    public List<LocaleInfo> getSupportedLocales() {
        return LocaleInfo.SUPPORTED;
    }

    public LocaleInfo getLocaleInfo(String localeCode) {
        return LocaleInfo.SUPPORTED.stream()
            .filter(l -> l.code().equalsIgnoreCase(localeCode))
            .findFirst()
            .orElse(LocaleInfo.SUPPORTED.get(0));
    }

    public String translate(String localeCode, String key) {
        Map<String, String> localeTranslations = translations.getOrDefault(localeCode, translations.get("en-GB"));
        return localeTranslations.getOrDefault(key, key);
    }

    public Map<String, String> getTranslations(String localeCode) {
        return translations.getOrDefault(localeCode, translations.get("en-GB"));
    }

    public String formatCurrency(BigDecimal amount, String currencyCode, String localeCode) {
        try {
            NumberFormat format = NumberFormat.getCurrencyInstance(new Locale(localeCode.split("-")[0], localeCode.split("-")[1]));
            return format.format(amount);
        } catch (Exception e) {
            return currencyCode + " " + amount;
        }
    }

    public String formatDate(LocalDate date, String localeCode) {
        LocaleInfo info = getLocaleInfo(localeCode);
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern(info.dateFormat());
        return date.format(formatter);
    }

    public String formatDateTime(LocalDateTime dateTime, String localeCode) {
        LocaleInfo info = getLocaleInfo(localeCode);
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern(info.dateFormat() + " HH:mm");
        return dateTime.format(formatter);
    }

    public String formatNumber(Number number, String localeCode) {
        try {
            NumberFormat format = NumberFormat.getNumberInstance(new Locale(localeCode.split("-")[0], localeCode.split("-")[1]));
            return format.format(number);
        } catch (Exception e) {
            return number.toString();
        }
    }
}
