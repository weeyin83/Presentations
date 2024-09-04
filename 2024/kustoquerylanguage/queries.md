# KQL Queries

# Table of contents
- [Get Schema](#get-schema)
- [Select Columns using Project](#select-columns-using-project)
- [Create Columns using Project](#create-columns-using-project)
- [Perform calculations using Extend](#perform-calculations-using-extend)
- [Count a field](#count-a-field)
- [Parse JSON results into single columns](#parse-json-results-into-single-columns)

### Get Schema
Retrieves the schema of the specified table, showing the columns and their data types to help understand the structure of the data.

```bash
TableName
| getschema
```

### Select Columns using Project

Filters the VMComputer table for Windows operating systems and then selects only the HostName, Cpus, and AzureLocation columns to simplify the dataset.

```bash
VMComputer
| where OperatingSystemFamily == "windows"
| project HostName, Cpus, AzureLocation
```

### Create Columns using Project
Selects the EventType and State columns from the StormEvents table and creates a new Duration column by calculating the difference between EndTime and StartTime.

```bash
StormEvents
| take 10
| project EventType, State, Duration = EndTime - StartTime
```

### Perform calculations using Extend
Calculates the duration of events in hours and categorizes them into "Short," "Medium," or "Long" based on their duration, then orders the results by intensity level and event type.

```bash
| project EndTime, StartTime, EventType
| extend DurationHours = (EndTime - StartTime) / 1h // Calculate duration directly in hours
| extend IntensityLevel = case(
    DurationHours < 1, "Short",
    DurationHours >= 1 and DurationHours < 3, "Medium",
    DurationHours >= 3, "Long",
    "Unknown"
)  // Categorize the event based on its duration
| order by IntensityLevel, EventType
```

### Count a field
Counts the number of sign-ins grouped by location, allowing you to see how many sign-ins occurred in each geographical area.

```bash
SigninLogs
| project TimeGenerated, Location, AppDisplayName, RiskDetail, UserType
| summarize count() by Location
```

### Parse JSON results into single columns
Parses the tags JSON field into a usable format, extracts specific tags like City and Environment, and counts the occurrences of each environment type.

```bash
resources
| where type =~ 'microsoft.hybridcompute/machines' or type =~ 'Microsoft.Compute/virtualMachines'
| extend TagsObject = parse_json(tags)  // Parse the JSON string into a dynamic object
| project name, City = tostring(TagsObject.City), Environment = tostring(TagsObject.Environment)  // Extract the City tag as a string
| summarize EnvironmentCount = count() by Environment  // Group by City and count occurrences
```
