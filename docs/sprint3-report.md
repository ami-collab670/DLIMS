## **Sprint 3 Report: Workflow Alignment, Payment Gate & Department Isolation** 

**Date Completed:** 2026-04-27 **Last Updated:** 2026-04-27 **Status: COMPLETE** – Sprint 3 implementation and staging verification passed. 

## **1 Objective** 

Sprint 3 focused on aligning the backend workflow with the updated client requirements received after Sprint 2. 

The most important correction was the payment gate: permanent sample identifiers must not be generated at initial intake. They should only be generated after payment is confirmed. Sprint 3 also added department-level isolation and OTP-based password recovery. 

## **2 Sprint 3 Scope Delivered** 

|**Area**|**Delivered in Sprint 3**|
|---|---|
|Payment-gated|Jobs now begin in `payment_pending`, and samples remain uncoded|
|workfow|until payment is confrmed.|
|Financial records|Added payment tracking for each job order.|
|Permanent sample|When payment becomes`paid`, the backend generates sample codes|
|coding trigger|and blind aliases automatically.|
|Department setup|Added department records and linked internal users to departments.|
|Department-level|Analysts and QC Managers are restricted to department-relevant|
|isolation|records.|
|Test catalog|Tests can now belong to departments, enabling department-based|
|department ownership|fltering.|
|OTP password|Added request/confrm password reset fow using email OTPs.|
|recovery||
|User profle updates|Added controlled country and organization type values.|



## **3 Workflow Changes Implemented** 

1 

## **3.1 Payment-Gated Intake** 

Sprint 2 created sample codes immediately at sample registration. Sprint 3 changed that behavior. 

|**Workfow Step**|**Sprint 3 Behavior**|
|---|---|
|Receptionist creates job|Job starts as`payment_pending`.|
|Receptionist registers sample|Sample is saved without permanent `sample_code` or|
||`blind_alias`.|
|Finance records payment|FinancialRecord tracks expected amount, paid amount,|
||and status.|
|Payment is confrmed as`paid`|System generates permanent sample code and blind|
||alias.|
|Job moves forward|Job status advances to`received`.|



This means sample intake can begin before payment, but official permanent identifiers are not issued until the finance requirement is satisfied. 

## **3.2 Important Behavior Change** 

Before payment, frontend and API consumers should expect: 

```
{
"sample_code ":null ,
"blind_alias ":null ,
" blind_alias_code ":null
}
```

After payment confirmation, those fields are populated automatically. 

## **4 Models Added or Changed** 

## **4.1 New Models** 

|**Model**|**Purpose**|
|---|---|
|`Department`|Represents a laboratory department/section used for staff and test visibility.|
|`OTPToken`|Stores secure, time-limited password reset OTP records.|
|`FinancialRecord`|Stores invoice/payment information for a job order.|



## **4.2 Updated Models** 

|**Model**|**Sprint**|**3 Change**|
|---|---|---|
|`User`|Added|`country`, controlled`organization_type`, and nullable`department`.|
|`JobOrder`|Added|`payment_pending`status.|
|`Sample`|Allows|payment-gated`sample_code`and`blind_alias`generation.|
|`TestCatalog`|Added|nullable`department`link.|



2 

## **5 New API Endpoints** 

## **5.1 Departments** 

|**Method**|**Endpoint**|**Purpose**|
|---|---|---|
|GET|`/api/accounts/departments/`|List departments.|
|POST|`/api/accounts/departments/`|Create a department.|
|GET|`/api/accounts/departments/{id}/`|Retrieve department details.|
|PUT/PATCH|`/api/accounts/departments/{id}/`|Update a department.|
|DELETE|`/api/accounts/departments/{id}/`|Delete a department.|



## **5.2 Password Reset** 

|**Method**|**Endpoint**|**Purpose**|
|---|---|---|
|POST|`/api/auth/password-reset-request/`|Request a password reset OTP.|
|POST|`/api/auth/password-reset-confirm/`|Confrm OTP and set a new password.|



## **5.3 Financial Records** 

|**Method**|**Endpoint**|**Purpose**||
|---|---|---|---|
|GET|`/api/laboratory/financial-records/`|List fnancial records.||
|POST|`/api/laboratory/financial-records/`|Create a|fnancial record.|
|GET|`/api/laboratory/financial.../{invoice_no}/`|Retrieve|fnancial<br>record|
|||details.||
|PUT/PATCH|`/api/laboratory/financial.../{invoice_no}/`|Update|payment|
|||information.||
|DELETE|`/api/laboratory/financial.../{invoice_no}/`|Delete a|fnancial record.|



## **6 Access and Visibility Rules** 

|**Role / User Type**|**Sprint 3 Access Behavior**|
|---|---|
|Admin|Full visibility and management access.|
|Receptionist|Operational intake visibility across jobs and samples.|
|Finance|Can manage fnancial records and confrm payment.|
|Analyst|Can only see assigned samples and tests relevant to their department.|
|QC Manager|Can only see samples/test assignments relevant to their department.|
|External Client|Can only view their own jobs and samples.|



_Note: Analyst views remain blind. Client identity and unnecessary intake details are not exposed to analysts._ 

3 

## **7 Frontend Integration Notes** 

These are the main Sprint 3 behaviors the frontend team should account for: 

|**Backend Behavior**|**Frontend Handling**||||
|---|---|---|---|---|
|New jobs start as|Show the job as awaiting payment, not fully received.||||
|`payment_pending`.|||||
|New samples may not have|Display a "pending" / "permanent ID||not issued" state.||
|permanent IDs yet.|||||
|Payment confrmation creates|Refresh job/sample data after Finance marks payment||||
|sample identity.|as paid.||||
|FinancialRecord controls payment|Finance UI should create/update this record for billing||||
|state.|status.||||
|Analysts and QC Managers are|Empty lists or 404s can|mean the record is outside the|||
|department-fltered.|user’s department.||||
|Analyst sample response is blind.|Do<br>not<br>expect<br>client|identity<br>or|sample<br>name|in|
||analyst-facing views.||||
|Password reset request is|Show a neutral success message even if the email does||||
|intentionally generic.|not exist.||||



## **8 Key Implementation Decisions** 

1. **Permanent IDs are payment-gated.** This aligns the backend with the updated requirement that permanent sample IDs and barcodes should not be created before payment confirmation. 

2. **Payment confirmation is idempotent.** Saving a paid financial record more than once will not duplicate or overwrite existing sample codes. 

3. **Samples can exist before permanent coding.** This supports intake work before Finance completes the payment step. 

4. **Department isolation is enforced by backend querysets.** Restricted users do not receive out-of-department records from list or detail endpoints. 

5. **OTP reset avoids email enumeration.** Password reset request responses are generic for both existing and non-existing emails. 

6. **Formula calculations remain out of scope.** The client confirmed this is high complexity and does not need to be included in the immediate workflow demo unless later confirmed. 

4 

## **9 Verification Results** 

|**Verifcation Area**|**Result**|
|---|---|
|Accounts tests|Passed|
|Laboratory tests|Passed|
|Full backend test suite|162 tests passed|
|OpenAPI/Swagger schema validation|Passed|
|Migration check|Passed|
|Staging smoke test|Passed|



## **9.1 Staging Smoke Test Coverage** 

|**Scenario**|**Result**|
|---|---|
|Swagger UI loads|Passed|
|Authentication works|Passed|
|Sprint 3 endpoints are visible|Passed|
|Password reset request returns expected generic response|Passed|
|Job starts in`payment_pending`|Passed|
|Sample has no permanent identity before payment|Passed|
|Paid fnancial record generates permanent sample code and blind alias|Passed|
|Job advances after payment confrmation|Passed|
|Client access remains restricted to owned records|Passed|



## **10 Staging Deployment** 

Sprint 3 was deployed to the staging environment and verified through Swagger UI. 

|**Item**|**Status**|
|---|---|
|Staging API|Available|
|Swagger UI|Available|
|Database migrations|Applied successfully|
|Sprint 3 endpoints|Visible in Swagger|
|Payment-gated workfow|Verifed on staging|
|Password reset request|Verifed on staging|
|Client-scoped access|Verifed on staging|



## **Staging URL:** 

```
https://lsims-api-staging.onrender.com
```

## **Swagger UI:** 

```
https://lsims-api-staging.onrender.com/api/docs/
```

5 

## **11 Known Limitations / Future Work** 

|**Item**|**Status**||||
|---|---|---|---|---|
|Formal workfow transition endpoint|Not implemented yet.||||
|Ministry approval gate|Pending fnal confrmation of workfow rules.||||
|Barcode/QR rendering|Permanent IDs are generated; visual barcode rendering||||
||remains future work.||||
|Analysis result capture|Deferred to analysis/QC sprint work.||||
|QC decision workfow|Deferred to analysis/QC sprint work.||||
|Result certifcates/reports|Deferred to reporting/result delivery phase.||||
|Audit trail|Planned for compliance hardening.||||
|Formula-based calculations|Deferred<br>unless<br>exact<br>formulas|and|scope|are|
||confrmed.||||



## **12 What Comes Next** 

|**Priority**|**Focus**|
|---|---|
|High|Formal role-based workfow transitions.|
|High|Approval-aware workfow if confrmed by the client.|
|High|Analysis result and QC decision models.|
|Medium|Audit history for status, payment, coding, and assignment changes.|
|Medium|Barcode/QR rendering after fnal format approval.|
|Low|Formula calculation engine only if confrmed as required.|



6 

