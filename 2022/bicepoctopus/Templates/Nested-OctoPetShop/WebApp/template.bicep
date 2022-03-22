@description('Name of the web app to be created')
param webSiteName string

param location string = resourceGroup().location

@description('App Service Plan ID')
param planName string

resource appService 'Microsoft.Web/sites@2020-06-01' = {
  name: webSiteName
  location: location
  properties: {
    serverFarmId: planName
    siteConfig: {
      linuxFxVersion: 'node|14-lts'
    }
  }
}
