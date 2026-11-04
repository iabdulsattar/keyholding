import { Environment } from './environment.interface';

export const environment: Environment = {
//  apiBase:'https://sbs.workalert.uk',
  production: false,
  OPENROUTER_API_URL: 'https://openrouter.ai/api/v1/chat/completions',
  OPENROUTER_API_KEY: '',
  OPENROUTER_MODEL: 'openai/gpt-oss-20b:free',
  //  stripePublishableKey: 'pk_test_51RdXPoIcFjCeeaggwPWJMyzNbjLZS24qSHpJRkgxEJAHCoNAKmsbE4dPYaCJRyKrQtEzWrJhgRt3RBQHzeCAWOAM00Ib97iV3O',
  stripePublishableKey: 'pk_live_51KQXkuLRMwKJaqzDA17CH2MxVr4tDRXfskLsGnOzt1KkozakF2xUSBaZno2l9Mo4dEPKqJDiUfc7HYQUSVe41tt1004vnsqo9d',
  //  trialPlanId: 'c9599dd0-9531-4dc9-9b7d-00dbc7edb398',
  trialPlanId: '1PAZeAHfzZjyQkoNne9UkqnXLpcFbKGW5D',
   apiBase: 'https://sbs.misentinel.co.uk',
 socketUrl : 'wss://sbs.workalert.uk/ws/visitors',
  // socketUrl : 'wss://sbs.misentinel.co.uk/ws/visitors',
  productUrls: {
   edob: 'https://edob.misentinel.co.uk/',
    keyvault: 'https://keyops.misentinel.co.uk/',
      vms: 'https://vms.misentinel.co.uk/'

  //  edob: 'https://sbsedob.workalert.uk/',
  //   keyvault: 'https://sbskeyvault.workalert.uk/',
  //   vms: 'https://sbsvms.workalert.uk/'

     // edob: 'http://localhost:4201/',
    //keyvault: 'http://localhost:4202/'
      // vms: 'https://localhost:4203/'

  }
};