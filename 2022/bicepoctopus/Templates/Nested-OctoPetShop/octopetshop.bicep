param location string = resourceGroup().location
param planName string
param planSku string
param productwebSiteName string
param frontwebSiteName string
param shoppingwebSiteName string
param databaseName string
param sqlServerName string
param sqlAdministratorLogin string
param sqlAdministratorLoginPassword string
param startFWIpAddress string
param endFWIpAddress string

// App service plan
module aspModule 'AppServicePlan/template.bicep' = {
  name:'appServicePlan'
  params:{
    planName:planName
    planLocation:location
    planSku:planSku
  }
}

// App service deployment
module productserviceweb 'WebApp/template.bicep' = {
  name:'productservicewebapp'
  params:{
    webSiteName:productwebSiteName
    location:location
    planName:planName
  }
  dependsOn:[
    aspModule
  ] 
}

// App service deployment
module frontwebapp 'WebApp/template.bicep' = {
  name:'frontwebapp'
  params:{
    webSiteName:frontwebSiteName
    location:location
    planName:planName
  }
  dependsOn:[
    aspModule
  ] 
}

// App service deployment
module shoppingcartweb 'WebApp/template.bicep' = {
  name:'shoppingcartwebapp'
  params:{
    webSiteName:shoppingwebSiteName
    location:location
    planName:planName
  }
  dependsOn:[
    aspModule
  ] 
}

// SQL Server and database deployment
module database 'SQLServer/template.bicep' = {
  name:'sqlserver'
  params:{
    startFWIpAddress:startFWIpAddress
    endFWIpAddress:endFWIpAddress    
    databaseName:databaseName
    sqlServerName:sqlServerName
    sqlAdministratorLogin:sqlAdministratorLogin
    sqlAdministratorLoginPassword:sqlAdministratorLoginPassword
    location:location
  }
}
