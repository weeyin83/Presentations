param location string = resourceGroup().location
param startFWIpAddress string
param endFWIpAddress string

// Generic DB Settings
param databaseName string
var databaseCollation = 'SQL_Latin1_General_CP1_CI_AS'
param sqlServerName string

// -----------------------------------------
// Security Settings
// -----------------------------------------
var minTlsVersion = '1.2' // Should always be latest supported TLS version
var transparentDataEncryption = 'Enabled' // Why would you ever disable this?
param sqlAdministratorLogin string
param sqlAdministratorLoginPassword string


resource sqlServer 'Microsoft.Sql/servers@2021-05-01-preview' = {
  name: sqlServerName
  location: location
  properties: {
    administratorLogin: sqlAdministratorLogin
    administratorLoginPassword: sqlAdministratorLoginPassword
    version: '12.0'
    minimalTlsVersion: minTlsVersion
  }
}

resource db 'Microsoft.Sql/servers/databases@2021-05-01-preview' = {
  name: '${sqlServer.name}/${databaseName}' 
  location: location
  sku: {
    name: 'Standard'
    tier: 'Standard'
  }
  properties: {
    collation: databaseCollation
  }
}

resource tde 'Microsoft.Sql/servers/databases/transparentDataEncryption@2021-05-01-preview' = {
  name: '${db.name}/current' 
  properties: {
    state: transparentDataEncryption
  }
}

resource fwRule 'Microsoft.Sql/servers/firewallRules@2021-05-01-preview' = {
    name: '${sqlServer.name}/fwRule1'
    properties: {
        startIpAddress: startFWIpAddress
        endIpAddress: endFWIpAddress
    }
}
