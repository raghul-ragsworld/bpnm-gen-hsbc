# Normalized Workflow RACI

- Normalized target workflow; proposed assignments require process-owner confirmation.
- Source owner/R labels Integration Layer/Integration and Data Platform/Platform denote Integration Team and Data Platform Team in people/RACI views.
- SNOW and ServiceNow RACI references denote Service Management Team; the application remains ServiceNow.
- Missing source applications use proposed Power Automate orchestration, except technical incident handling (ServiceNow), distribution (existing integration stack), and publication audit (existing master data store). Hosting does not imply automatic execution.
- Downstream Systems and DQ Dashboard C/I recipients are proposed Downstream Consumer Team and Reporting Team respectively; generic Ops remains unresolved.
- Maker and Checker are distinct duties assigned to different individuals, even when grouped under teams.
- Source AOB-006/AOB-023 RACI variants remain separate; no new approver or branch outcome is invented.
- Supplemental Ops Lead timeout review retains its approved responsibility; full A/C/I assignments remain unspecified.

Original assignments: source_raci.md. Source and normalized values: normalized_model.json.

| Step | R team | Source duty | A | C | I | Application | Basis |
|---|---|---|---|---|---|---|---|
| AOB-001 | Requestor | Requestor | Approver | Onboarding Ops | Process Ops | Azure DevOps Boards | source |
| AOB-002 | Onboarding Ops | Maker | Ops Lead | Process Ops | Requestor | Azure DevOps Boards | source |
| AOB-003 | Process Ops | Process Ops | Ops Lead | Maker | Requestor | Power Automate (proposed orchestration) | proposed; confirmation required |
| AOB-004 | Onboarding Ops | Maker | Ops Lead | Process Ops | Requestor | Power Automate (proposed orchestration) | proposed; confirmation required |
| AOB-005 | Approver | Approver | Approver Lead | Requestor | Operations Team (unresolved) | Power Automate (proposed orchestration) | proposed; confirmation required |
| AOB-006 | Approver | Approver | Approver Lead | Ops Lead | Service Management Team | Power Automate (proposed orchestration) | proposed; confirmation required |
| AOB-006 | Approver | Approver | Approver Lead | Service Management Team | Requestor | Power Automate (proposed orchestration) | proposed; confirmation required |
| AOB-007 | Onboarding Ops | Maker | Ops Lead | Steward | Process Ops | Power Automate + SharePoint(BRD: Template Builder) | source |
| AOB-008 | Integration Team | Integration | Integration Lead | Maker | Data Platform Team | Azure Storage SFTP / Azure API Management + Azure Functions | source |
| AOB-009 | Data Platform Team | Platform | Platform Lead | Integration Team | Process Ops | Azure Data Lake Storage (Landing) | source |
| AOB-010 | Service Management Team | SNOW | Platform Lead | Integration Team | Ops Lead | ServiceNow | proposed; confirmation required |
| AOB-011 | Data Platform Team | Platform | Platform Lead | Process Ops | Steward | Power Automate (proposed orchestration) | proposed; confirmation required |
| AOB-012 | Process Ops | Process Ops | DQ Lead | Maker | Steward | Microsoft Purview – Data Quality(BRD: DQ Engine) | source |
| AOB-013 | Steward | Steward | Data Owner | Process Ops | Maker | Azure Data Lake Storage (Landing) | source |
| AOB-014 | Process Ops | Process Ops | DQ Lead | Steward | Operations Team (unresolved) | Power Automate (proposed orchestration) | proposed; confirmation required |
| AOB-015 | Data Platform Team | Platform | Platform Lead | Process Ops | Steward | Power Automate (proposed orchestration) | proposed; confirmation required |
| AOB-016 | Process Ops | Process Ops | Ops Lead | Process SPECIALIST | Requestor | Power Automate (proposed orchestration) | proposed; confirmation required |
| AOB-017 | Process SPECIALIST | Process SPECIALIST | Tax Lead | Maker | Process Ops | Power Automate (proposed orchestration) | proposed; confirmation required |
| AOB-018 | Process Ops | Process Ops | DQ Lead | Maker | Ops Lead | Power Automate (proposed orchestration) | proposed; confirmation required |
| AOB-019 | Onboarding Ops | Maker | Ops Lead | Process Ops | Requestor | Power Automate (proposed orchestration) | proposed; confirmation required |
| AOB-020 | Process Ops | Checker | Ops Lead | Data Owner | Requestor | Power Automate (proposed orchestration) | proposed; confirmation required |
| AOB-021 | Data Platform Team | Platform | Data Product Owner | Process Ops | Downstream Consumer Team (proposed) | Azure Data Lake Storage (Onboarding Master) | source |
| AOB-022 | Data Platform Team | Platform | Data Product Owner | Process Ops | Reporting Team (proposed) | Azure Data Lake Storage (Onboarding Master) | source |
| AOB-023 | Integration Team | Integration | Integration Lead | Data Platform Team | Downstream Consumer Team (proposed) | Azure Storage SFTP / Azure API Management + Azure Functions | proposed; confirmation required |
| AOB-023 | Integration Team | Integration | Integration Lead | Data Platform Team | Process Ops | Azure Storage SFTP / Azure API Management + Azure Functions | proposed; confirmation required |
| AOB-024 | Integration Team | Integration | Integration Lead | Data Platform Team | Downstream Consumer Team (proposed) | Bloomberg / Market Data Feed(BRD: DDT / External Consumer A) | source |
| AOB-025 | Integration Team | Integration | Integration Lead | Data Platform Team | Downstream Consumer Team (proposed) | Azure API Management + Azure Functions → Azure Synapse/Databricks | source |
| AOB-026 | Integration Team | Integration | Integration Lead | Data Platform Team | Downstream Consumer Team (proposed) | Azure Service Bus | source |
| AOB-027 | Data Platform Team | Platform | Product Owner | Integration Team | Process Ops | Azure Data Lake Storage (Onboarding Master) | proposed; confirmation required |
| AOB-028 | Data Platform Team | Platform | Data Product Owner | Process Ops | Ops Lead | Power BI | source |
| AOB-029 | Onboarding Ops | Ops | Ops Lead | Integration Team | Requestor | Azure DevOps Boards + Power Automate (notifications) | source |
