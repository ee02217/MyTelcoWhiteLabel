package com.mytelco.customerbff.i18n;

import java.util.List;

public record LocaleInfo(
    String code,
    String name,
    String nativeName,
    String currencyCode,
    String dateFormat,
    boolean rtl
) {
    public static final List<LocaleInfo> SUPPORTED = List.of(
        new LocaleInfo("en-GB", "English (UK)", "English", "GBP", "dd/MM/yyyy", false),
        new LocaleInfo("en-US", "English (US)", "English", "USD", "MM/dd/yyyy", false),
        new LocaleInfo("pt-PT", "Portuguese (Portugal)", "Português", "EUR", "dd/MM/yyyy", false),
        new LocaleInfo("pt-BR", "Portuguese (Brazil)", "Português (Brasil)", "BRL", "dd/MM/yyyy", false),
        new LocaleInfo("es-ES", "Spanish (Spain)", "Español", "EUR", "dd/MM/yyyy", false),
        new LocaleInfo("fr-FR", "French", "Français", "EUR", "dd/MM/yyyy", false),
        new LocaleInfo("de-DE", "German", "Deutsch", "EUR", "dd.MM.yyyy", false),
        new LocaleInfo("it-IT", "Italian", "Italiano", "EUR", "dd/MM/yyyy", false),
        new LocaleInfo("nl-NL", "Dutch", "Nederlands", "EUR", "dd-MM-yyyy", false)
    );
}
