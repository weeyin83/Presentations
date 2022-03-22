
## Transform Bicep template to ARM Template
az bicep build --file .\1storage.bicep


## Deploy Bicep template to Azure
New-AzResourceGroupDeployment -Name StorageDeployment -resourceGroupName SarahBicepDemos -TemplateFile 1storage.bicep -storageAccountName "sarahstoragedemo"

## Build out the second Bicep template
New-AzResourceGroupDeployment -Name StorageDeploymentv2 -resourceGroupName SarahBicepDemos -TemplateFile 2storage.bicep

## Build out the second template but have it fail
New-AzResourceGroupDeployment -Name StorageDeploymentv2 -resourceGroupName SarahBicepDemos -TemplateFile 2storage.bicep -storageAccountType "Standrd_Local"

## Pack the templates into ZIP file ready for use with Octopus Deploy
octo pack --id="StorageTemplate" --format="zip" --version="0.0.1" --basePath="Templates" --overwrite

## Upload the Zip file to Octopus Deploy
octo push --package="StorageTemplate.0.0.1.zip" --server="https://webinar.octopus.app" --apiKey="$OCTOPUSSERVERAPIKEY" --space="Bicep-Demo"


## Below is the code used within the Octopus Deploy runbook


### Create Octopus Variables
## 
Azure_StorageAccount_Name
Azure_Location_Abbr
Azure_Environment_ResourceGroup_Name


## Create Resource Group Step Source Code
```powershell
az group create -l $OctopusParameters["Azure_Location_Abbr"] -n $OctopusParameters["Azure_Environment_ResourceGroup_Name"]
```
## Deploy Bicep template Step Source Code

```powershell
#### Reference the package with the Bicep files
$filePath = $OctopusParameters["Octopus.Action.Package[StorageTemplate].ExtractedPath"]

#### Change Directory to extracted package
cd $filePath

#### Set the deployment name
$today=Get-Date -Format "dd-MM-yyyy"
$deploymentName="StorageTemplate"+"$today"

### Deploy the Bicep template files
New-AzResourceGroupDeployment -Name $deploymentName -ResourceGroupName $OctopusParameters["Azure_Environment_ResourceGroup_Name"] -TemplateFile "2storage.bicep" -storageAccountName $OctopusParameters["Azure_StorageAccount_Name"]
```



##
## Nested - OctoPetShop
##

### Deploy the Nested OctoPetShop Bicep templates from your local machine

cd "Nested-OctoPetShop"

New-AzResourceGroupDeployment -Name OctoPetShop -ResourceGroupName SarahBicepDemos -TemplateFile octopetshop.bicep -planName octoPetASP -planSku S1 -productwebSiteName octopetproduct -shoppingwebSiteName octopetshopping -frontwebSiteName octopetfront -startFWIpAddress 0.0.0.0 -endFWIpAddress 0.0.0.0 -databaseName octopetdb -sqlServerName octopetsql -sqlAdministratorLogin octopetadmin -sqlAdministratorLoginPassword $sqlpassword

## Pack the templates into ZIP file ready for use with Octopus Deploy
octo pack --id="OctoBicepFiles" --format="zip" --version="0.0.1" --basePath="Nested-OctoPetShop" --overwrite

## Upload the Zip file to Octopus Deploy
octo push --package="OctoBicepFiles.0.0.1.zip" --server="https://webinar.octopus.app" --apiKey="$OCTOPUSSERVERAPIKEY" --space="Bicep-Demo"


## Octopus Code - Nested OctoPetShop
##


## Create Resource Group Step Source Code

az group create -l $OctopusParameters["Azure_Location_Abbr"] -n $OctopusParameters["Azure_Environment_ResourceGroup_Name"]

## Deploy Bicep template Step Source Code


```powershell
# Reference the package with the Bicep files
$filePath = $OctopusParameters["Octopus.Action.Package[OctoBicepFiles].ExtractedPath"]

# Change Directory to extracted package
cd $filePath

# Set the deployment name
$today=Get-Date -Format "dd-MM-yyyy"
$deploymentName="OctoPetShopInfra"+"$today"

# Deploy the Bicep template files

New-AzResourceGroupDeployment -Name $deploymentName -ResourceGroupName $OctopusParameters["Azure_Environment_ResourceGroup_Name"] -TemplateFile octopetshop.bicep -planName $planName -planSku $planSku -productwebSiteName $OctopusParameters["ProductService.Name"] -shoppingwebSiteName $OctopusParameters["ShoppingCartService.Name"] -frontwebSiteName $OctopusParameters["WebApp.Name"] -startFWIpAddress $startFWIpAddress -endFWIpAddress $endFWIpAddress -databaseName $OctopusParameters["Database.Name"] -sqlServerName $OctopusParameters["Database.Server"] -sqlAdministratorLogin $OctopusParameters["Database.Admin.Username"] -sqlAdministratorLoginPassword $OctopusParameters["Database.Admin.Password"]
```