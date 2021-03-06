export const environment = {
  production: true
};

export const elasticEnvironment = {
  serverURI: '/api'
};

export const analyticsEnvironment =
  window.location.host === 'cai-artbrowserstaging.fbi.h-da.de'
    ? {
        // staging
        enabled: true,
        url: 'https://openartbrowser.org/api/analytics/',
        propertyId: '3'
      }
    : {
        // production
        enabled: true,
        url: '/api/analytics/',
        propertyId: '1'
      };
