type LegalConfig = {
  name: string;
  legalName: string;
  address: string;
  id: string;
  vatId?: string;
  domain: string;
  registration?: {
    court: string;
    fileNumber: string;
  };
  contact: {
    email: string;
    phone?: string;
  };
};

export const legal: LegalConfig = {
  name: "FBLS Tech s.r.o.",
  legalName: "FBLS Tech s.r.o.",
  address: "Moravská 854/2, 312 00 Plzeň",
  id: "19433166",
  domain: "www.gtdn.online",
  contact: {
    email: "hello@gtdn.online",
    phone: "+420 123 456 789",
  },
};
