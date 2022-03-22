param planName string
param planLocation string = resourceGroup().location
param planSku string

resource asp 'Microsoft.Web/serverfarms@2020-12-01' = {
  name:planName
  location:planLocation
  properties: {
    reserved: true
  }
  sku: {
    name: planSku
  }
  kind: 'Windows'
}

output planId string = asp.id
