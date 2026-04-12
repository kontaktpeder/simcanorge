export type EventCategory = 
  | 'opprinnelse'
  | 'registrering'
  | 'eierskap'
  | 'bruk'
  | 'stillstand'
  | 'restaurering'
  | 'skade'
  | 'gjenoppdagelse';

export type EventType = 
  | 'produksjonsår'
  | 'levert_ny'
  | 'importert'
  | 'forstegangsregistrert'
  | 'registrert'
  | 'avregistrert'
  | 're_registrert'
  | 'skilt_levert_inn'
  | 'eu_godkjenning'
  | 'permanent_avregistrert'
  | 'kjopt'
  | 'solgt'
  | 'arvet'
  | 'langtids_eier'
  | 'kjent_eier'
  | 'daglig_brukt'
  | 'familiebil'
  | 'konkurranse'
  | 'arbeidsbil'
  | 'langtur'
  | 'hobbybil'
  | 'statt_pa_lave'
  | 'lagret_garasje'
  | 'statt_ute'
  | 'forsvunnet_periode'
  | 'ikke_i_bruk'
  | 'restaurering_startet'
  | 'motor_overhalt'
  | 'lakkert'
  | 'interior_restaurert'
  | 'teknisk_gjennomgang'
  | 'delvis_restaurert'
  | 'restaurering_ferdig'
  | 'ny_restaureringsrunde'
  | 'ulykke'
  | 'brann'
  | 'flom'
  | 'totalskade'
  | 'vrak'
  | 'demontering'
  | 'gjenoppdaget'
  | 'dokumentert'
  | 'utstilt'
  | 'pris'
  | 'delt_offentlig'
  | 'ny_eier_ansvar'
  | 'annet';

export type CategoryIconName = 
  | 'Factory'
  | 'ClipboardList'
  | 'Handshake'
  | 'Car'
  | 'Warehouse'
  | 'Wrench'
  | 'AlertTriangle'
  | 'Sparkles';

export const EVENT_CATEGORIES: Record<EventCategory, { label: string; icon: CategoryIconName; events: Partial<Record<EventType, string>> }> = {
  opprinnelse: {
    label: 'Opprinnelse',
    icon: 'Factory',
    events: {
      produksjonsår: 'Produksjonsår',
      levert_ny: 'Levert som ny',
      importert: 'Importert',
      forstegangsregistrert: 'Førstegangsregistrert',
      annet: 'Annet'
    }
  },
  registrering: {
    label: 'Registrering',
    icon: 'ClipboardList',
    events: {
      registrert: 'Registrert',
      avregistrert: 'Avregistrert',
      re_registrert: 'Re-registrert',
      skilt_levert_inn: 'Skilt levert inn',
      eu_godkjenning: 'EU-godkjenning',
      permanent_avregistrert: 'Permanent avregistrert',
      annet: 'Annet'
    }
  },
  eierskap: {
    label: 'Eierskap',
    icon: 'Handshake',
    events: {
      kjopt: 'Kjøpt',
      solgt: 'Solgt',
      arvet: 'Arvet',
      langtids_eier: 'Langtids-eier',
      kjent_eier: 'Kjent eier',
      annet: 'Annet'
    }
  },
  bruk: {
    label: 'Bruk',
    icon: 'Car',
    events: {
      daglig_brukt: 'Daglig brukt',
      familiebil: 'Familiebil',
      konkurranse: 'Konkurranse / racing',
      arbeidsbil: 'Arbeidsbil',
      langtur: 'Langtur / reise',
      hobbybil: 'Hobbybil',
      annet: 'Annet'
    }
  },
  stillstand: {
    label: 'Stillstand / lagring',
    icon: 'Warehouse',
    events: {
      statt_pa_lave: 'Stått på låve',
      lagret_garasje: 'Lagret i garasje',
      statt_ute: 'Stått ute',
      forsvunnet_periode: 'Forsvunnet periode',
      ikke_i_bruk: 'Ikke i bruk',
      annet: 'Annet'
    }
  },
  restaurering: {
    label: 'Restaurering / arbeid',
    icon: 'Wrench',
    events: {
      restaurering_startet: 'Restaurering startet',
      motor_overhalt: 'Motor overhalt',
      lakkert: 'Lakkert',
      interior_restaurert: 'Interiør restaurert',
      teknisk_gjennomgang: 'Teknisk gjennomgang',
      delvis_restaurert: 'Delvis restaurert',
      restaurering_ferdig: 'Restaurering ferdig',
      ny_restaureringsrunde: 'Ny restaureringsrunde',
      annet: 'Annet'
    }
  },
  skade: {
    label: 'Skade / skjebne',
    icon: 'AlertTriangle',
    events: {
      ulykke: 'Ulykke',
      brann: 'Brann',
      flom: 'Flom / værskade',
      totalskade: 'Totalskade',
      vrak: 'Vrak',
      demontering: 'Demontering',
      annet: 'Annet'
    }
  },
  gjenoppdagelse: {
    label: 'Gjenoppdagelse / nåtid',
    icon: 'Sparkles',
    events: {
      gjenoppdaget: 'Gjenoppdaget',
      dokumentert: 'Dokumentert',
      utstilt: 'Utstilt',
      pris: 'Pris / utmerkelse',
      delt_offentlig: 'Delt offentlig (Bilgarasje.no)',
      ny_eier_ansvar: 'Ny eier tar ansvar',
      annet: 'Annet'
    }
  }
};

export const getCategoryLabel = (category: EventCategory): string => {
  return EVENT_CATEGORIES[category]?.label || category;
};

export const getCategoryIcon = (category: EventCategory): CategoryIconName => {
  return EVENT_CATEGORIES[category]?.icon || 'Sparkles';
};

export const getEventsForCategory = (category: EventCategory): EventType[] => {
  return Object.keys(EVENT_CATEGORIES[category]?.events || {}) as EventType[];
};

export const getEventLabel = (category: EventCategory, eventType: EventType): string => {
  return EVENT_CATEGORIES[category]?.events[eventType] || eventType;
};

export const getAllCategories = (): EventCategory[] => {
  return Object.keys(EVENT_CATEGORIES) as EventCategory[];
};
