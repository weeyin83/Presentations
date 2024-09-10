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
| getschema  // Retrieve the schema of the specified table, displaying column names and their data types.
```

### Select Columns using Project

Filters the VMComputer table for Windows operating systems and then selects only the HostName, Cpus, and AzureLocation columns to simplify the dataset.

```bash
VMComputer
| where OperatingSystemFamily == "windows"  // Filter the table for rows where the operating system is Windows.
| project HostName, Cpus, AzureLocation  // Select specific columns to include in the results: HostName, Cpus, and AzureLocation.
```

### Create Columns using Project
Selects the EventType and State columns from the StormEvents table and creates a new Duration column by calculating the difference between EndTime and StartTime.

```bash
StormEvents
| take 10  // Limit the results to the first 10 records.
| project EventType, State, Duration = EndTime - StartTime  // Create a new column 'Duration' by subtracting StartTime from EndTime, and select EventType and State columns.
```

### Perform calculations using Extend
Calculates the duration of events in hours and categorizes them into "Short," "Medium," or "Long" based on their duration, then orders the results by intensity level and event type.

```bash
StormEvents
| project EndTime, StartTime, EventType  // Select the EndTime, StartTime, and EventType columns.
| extend DurationHours = (EndTime - StartTime) / 1h  // Calculate the duration directly in hours and store it in the 'DurationHours' column.
| extend IntensityLevel = case(  // Create a new column 'IntensityLevel' to categorize the event based on its duration.
    DurationHours < 1, "Short",  // If duration is less than 1 hour, label it as "Short".
    DurationHours >= 1 and DurationHours < 3, "Medium",  // If duration is between 1 and 3 hours, label it as "Medium".
    DurationHours >= 3, "Long",  // If duration is 3 hours or more, label it as "Long".
    "Unknown"  // Default label if none of the conditions match.
)
| order by IntensityLevel, EventType  // Order the results by 'IntensityLevel' and then by 'EventType'.
```

### Count a field
Counts the number of sign-ins grouped by location, allowing you to see how many sign-ins occurred in each geographical area.

```bash
SigninLogs
| project TimeGenerated, Location, AppDisplayName, RiskDetail, UserType  // Select the relevant columns for analysis.
| summarize count() by Location  // Group the data by 'Location' and count the number of occurrences for each group.
```

### Parse JSON results into single columns
Parses the tags JSON field into a usable format, extracts specific tags like City and Environment, and counts the occurrences of each environment type.

```bash
resources
| where type =~ 'microsoft.hybridcompute/machines' or type =~ 'Microsoft.Compute/virtualMachines'  // Filter the table for specific resource types.
| extend TagsObject = parse_json(tags)  // Parse the 'tags' JSON string into a dynamic object for easier access to its properties.
| project name, City = tostring(TagsObject.City), Environment = tostring(TagsObject.Environment)  // Extract 'City' and 'Environment' tags and convert them to strings.
| summarize EnvironmentCount = count() by Environment  // Group the results by 'Environment' and count the occurrences of each type.

```
