
# Transform Bicep template to ARM Template
az bicep build --file .\1storage.bicep


# Deploy Bicep template to Azure
New-AzResourceGroupDeployment -Name StorageDeployment -resourceGroupName SarahBicepDemos -TemplateFile 1storage.bicep -storageAccountName "sarahstoragedemo"

# Build out the second Bicep template
New-AzResourceGroupDeployment -Name StorageDeploymentv2 -resourceGroupName SarahBicepDemos -TemplateFile 2storage.bicep

# Build out the second template failure
New-AzResourceGroupDeployment -Name StorageDeploymentv2 -resourceGroupName SarahBicepDemos -TemplateFile 2storage.bicep -storageAccountType "Standrd_Local"

# Pack the templates into ZIP file
octo pack --id="StorageTemplate" --format="zip" --version="0.0.1" --basePath="Templates" --overwrite

# We take the zip file we created and push them to the Octopus Deploy server instance
octo push --package="StorageTemplate.0.0.1.zip" --server="https://webinar.octopus.app" --apiKey="$OCTOPUSSERVERAPIKEY" --space="Bicep-Demo"


## Octopus Code
##

## Create Octopus Variable
## 
Azure_StorageAccount_Name


## Create Resource Group Step Source Code

az group create -l $OctopusParameters["Azure_Location_Abbr"] -n $OctopusParameters["Azure_Environment_ResourceGroup_Name"]

## Deploy Bicep template Step Source Code

# Reference the package with the Bicep files
$filePath = $OctopusParameters["Octopus.Action.Package[StorageTemplate].ExtractedPath"]

# Change Directory to extracted package
cd $filePath

# Set the deployment name
$today=Get-Date -Format "dd-MM-yyyy"
$deploymentName="StorageTemplate"+"$today"

# Deploy the Bicep template files
New-AzResourceGroupDeployment -Name $deploymentName -ResourceGroupName $OctopusParameters["Azure_Environment_ResourceGroup_Name"] -TemplateFile "2storage.bicep" -storageAccountName $OctopusParameters["Azure_StorageAccount_Name"]




###
### Nested - OctoPetShop
###
cd "Nested-OctoPetShop"

New-AzResourceGroupDeployment -Name OctoPetShop -ResourceGroupName SarahBicepDemos -TemplateFile octopetshop.bicep -planName octoPetASP -planSku S1 -productwebSiteName octopetproduct -shoppingwebSiteName octopetshopping -frontwebSiteName octopetfront -startFWIpAddress 0.0.0.0 -endFWIpAddress 0.0.0.0 -databaseName octopetdb -sqlServerName octopetsql -sqlAdministratorLogin octopetadmin -sqlAdministratorLoginPassword $sqlpassword

# Pack the templates into ZIP file
octo pack --id="OctoBicepFiles" --format="zip" --version="0.0.1" --basePath="Nested-OctoPetShop" --overwrite

# We take the zip file we created and push them to the Octopus Deploy server instance
octo push --package="OctoBicepFiles.0.0.1.zip" --server="https://webinar.octopus.app" --apiKey="$OCTOPUSSERVERAPIKEY" --space="Bicep-Demo"


## Octopus Code - Nested OctoPetShop
##


## Create Resource Group Step Source Code

az group create -l $OctopusParameters["Azure_Location_Abbr"] -n $OctopusParameters["Azure_Environment_ResourceGroup_Name"]

## Deploy Bicep template Step Source Code
# Reference the package with the Bicep files
$filePath = $OctopusParameters["Octopus.Action.Package[OctoBicepFiles].ExtractedPath"]

# Change Directory to extracted package
cd $filePath

# Set the deployment name
$today=Get-Date -Format "dd-MM-yyyy"
$deploymentName="OctoPetShopInfra"+"$today"

# Deploy the Bicep template files
New-AzResourceGroupDeployment -Name $deploymentName -ResourceGroupName $OctopusParameters["Azure_Environment_ResourceGroup_Name"] -TemplateFile octopetshop.bicep -planName $planName -planSku $planSku -productwebSiteName $OctopusParameters["ProductService.Name"] -shoppingwebSiteName $OctopusParameters["ShoppingCartService.Name"] -frontwebSiteName $OctopusParameters["WebApp.Name"] -startFWIpAddress $startFWIpAddress -endFWIpAddress $endFWIpAddress -databaseName $OctopusParameters["Database.Name"] -sqlServerName $OctopusParameters["Database.Server"] -sqlAdministratorLogin $OctopusParameters["Database.Admin.Username"] -sqlAdministratorLoginPassword $OctopusParameters["Database.Admin.Password"]