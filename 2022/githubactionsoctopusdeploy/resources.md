# Learn it all 
During the GitHub Actions and Octopus Deploy webinar you saw Damian Brady and Sarah Lean take the OctoPetShop .NET sample application, build and deploy that with GitHub Actions and Octopus Deploy. 

Below are a bunch of resources that will help you if you are looking to learn more or try out this demo yourself. 

🐶 You can find the OctoPetShop source code [here](https://www.github.com/octopussamples/octopetshop). 

✨ The GitHub Actions workflow that you saw Damian build can be found [here](https://raw.githubusercontent.com/DamovisaInc/SarahOctoPet/main/.github/workflows/main.yml) or a copy is [below](#github-action-workflow).

🐙 If you want to see the deployment process within Octopus Deploy, you can do so [here](https://webinar.octopus.app/app#/Spaces-282).  You will have read access to this environment to browse around. 

## GitHub Actions ✨
- [GitHub Action Pricing Information](https://github.com/features/actions#pricing-details)


## Octopus Deploy 🐙


## Contact Information 👋

Let's stay in touch! 

- Connect with Sarah on Twitter
    - Sarah Lean - [@Techielass](https://twitter.com/techielass)
- Connect with Sarah on LinkedIn
    - [Sarah Lean](https://in.linkedin.com/in/sazlean)
- Connect with Damian on Twitter
    - Damian Brady - [@Damovisa](https://twitter.com/damovisa)
- Connect with damian on LinkedIn
    - [Damian Brady](https://www.linkedin.com/in/damianbrady/)


### GitHub Action Workflow
```yaml
name: Build-and-create-release

on:
  push:
    branches:    
      - 'main'

env:
  solution: '**/*.sln'
  buildPlatform: Any CPU
  buildConfiguration: Release

jobs:
  OctoPetShopBuild:
    runs-on: windows-latest
    steps:
    
    - uses: actions/checkout@v2

    # install the Octopus CLI
    - name: Install Octopus CLI
      uses: OctopusDeploy/install-octopus-cli-action@v1.1.9
    
    - name: Install dependencies
      run: dotnet restore
    - name: Build
      run: dotnet build --configuration Release --no-restore
    - name: Test
      run: dotnet test --no-restore --verbosity normal

    # dotnet publish
    - name: Publish Web
      run: dotnet publish ${{ github.workspace }}\OctopusSamples.OctoPetShop.Web/OctopusSamples.OctoPetShop.Web.csproj --configuration ${{ env.BuildConfiguration }} --output ${{ github.workspace }}\output\OctoPetShop.Web\
      
    # Pack the files into a zip
    - name: Package OctopusSamples.OctoPetShop.Web
      run: octo pack --id=OctopusSamples.OctoPetShop.Web --format=Zip --version=1.7.${{ github.run_number }} --basePath=${{ github.workspace }}\output\OctoPetShop.Web\ --outFolder=${{ github.workspace }}\output

    # Push the zip to the server
    - name: Push OctoPetShop Web
      run: octo push --package="${{ github.workspace }}\output\OctopusSamples.OctoPetShop.Web.1.7.${{ github.run_number }}.zip" --server="${{ secrets.OCTOPUS_SERVER_URL }}" --apiKey="${{ secrets.OCTOPUS_API_KEY }}" --space="${{ secrets.OCTOPUS_SPACE }}"

    # Create a release
    - name: Create a Release in Octopus
      uses: OctopusDeploy/create-release-action@v1.1.1
      with:
        api_key: ${{ secrets.OCTOPUS_API_KEY }}
        project: "OctoPetShop"
        server: ${{ secrets.OCTOPUS_SERVER_URL }}
        space: ${{ secrets. OCTOPUS_SPACE }}
        version: 1.7.${{ github.run_number }}
        
```

