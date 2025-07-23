# NDE Validation Automation

A simple Excel automation system to streamline Notadinas NDE validation using data from **naker** and **operation** databases.

## How to Use

1. **Download the Template**  
   Get the `prepare.xlsx` file from the `src/templates` directory.

2. **Fill in the Data**  
   Open the Excel file and input the required NDE information or user request.

3. **Submit the File**  
   Send a `POST` request to the `/upload` endpoint with the filled Excel file using the field name `sheet`.
