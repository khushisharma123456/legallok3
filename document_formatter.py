import json
from datetime import datetime

def format_employment_agreement(form_data):
    """Format employment agreement data into a professional document."""
    # Extract data from form_data
    data = form_data.get('form_data', {})
    if isinstance(data, str):
        data = json.loads(data)
    
    # Get current date if not provided
    date = data.get('document_date', datetime.now().strftime("%B %d, %Y"))
    
    # Format the document
    document = f"""
EMPLOYMENT AGREEMENT

This Employment Agreement is made on {date}, between:

{data.get('parties', {}).get('party1_name', '[Company Name]')}, having its registered office at {data.get('parties', {}).get('party1_description', '[Company Address]')}, hereinafter referred to as "{data.get('parties', {}).get('party1_reference', 'Employer')}"

AND

{data.get('parties', {}).get('party2_name', '[Employee Name]')}, residing at {data.get('parties', {}).get('party2_description', '[Employee Address]')}, hereinafter referred to as "{data.get('parties', {}).get('party2_reference', 'Employee')}".

1. Job Title: {data.get('terms', {}).get('job_title', '[Job Title]')}
2. Monthly Salary: {data.get('terms', {}).get('monthly_salary', '[Monthly Salary]')}
3. Probation: {data.get('terms', {}).get('probation', '[Probation Period]')}
4. Termination: {data.get('terms', {}).get('termination', '[Termination Clause]')}
5. Confidentiality: {data.get('terms', {}).get('confidentiality', '[Confidentiality Clause]')}

IN WITNESS WHEREOF, both parties agree to the terms.

Signed:  
{data.get('signatures', {}).get('party1_name', '[Employer Signature]')}            {data.get('signatures', {}).get('party2_name', '[Employee Signature]')}  
Date: {data.get('signatures', {}).get('party1_date', '[Employer Signature Date]')}      Date: {data.get('signatures', {}).get('party2_date', '[Employee Signature Date]')}
"""
    return document

def format_nda_agreement(form_data):
    """Format NDA agreement data into a professional document."""
    # Extract data from form_data
    data = form_data.get('form_data', {})
    if isinstance(data, str):
        data = json.loads(data)
    
    # Get current date if not provided
    effective_date = data.get('document_date', datetime.now().strftime("%B %d, %Y"))
    
    # Format the document
    document = f"""
NON-DISCLOSURE AGREEMENT (NDA)

This Agreement is made on {effective_date} between:

{data.get('parties', {}).get('party1_name', '[Disclosing Party]')} ("Disclosing Party") and {data.get('parties', {}).get('party2_name', '[Receiving Party]')} ("Receiving Party").

Purpose: {data.get('terms', {}).get('purpose', '[Purpose of Disclosure]')}

1. Definition of Confidential Information: {data.get('terms', {}).get('confidential_information', '[Confidential Information Definition]')}
2. Obligations of Receiving Party: {data.get('terms', {}).get('obligations', '[Obligations of Receiving Party]')}
3. Term of Agreement: {data.get('terms', {}).get('term', '[Term of Agreement]')}
4. Governing Law: {data.get('terms', {}).get('governing_law', '[Governing Law]')}

IN WITNESS WHEREOF, the parties have signed this Agreement.

Signed:  
{data.get('signatures', {}).get('party1_name', '[Disclosing Party Signature]')}           {data.get('signatures', {}).get('party2_name', '[Receiving Party Signature]')}  
Date: {data.get('signatures', {}).get('party1_date', '[Disclosing Party Date]')}         Date: {data.get('signatures', {}).get('party2_date', '[Receiving Party Date]')}
"""
    return document

def format_lease_agreement(form_data):
    """Format lease agreement data into a professional document."""
    # Extract data from form_data
    data = form_data.get('form_data', {})
    if isinstance(data, str):
        data = json.loads(data)
    
    # Get current date if not provided
    date = data.get('document_date', datetime.now().strftime("%B %d, %Y"))
    
    # Format the document
    document = f"""
LEASE AGREEMENT

This Lease Agreement is made on {date}, between:

{data.get('parties', {}).get('party1_name', '[Landlord Name]')}, residing at {data.get('parties', {}).get('party1_description', '[Landlord Address]')}, hereinafter referred to as "{data.get('parties', {}).get('party1_reference', 'Landlord')}"

AND

{data.get('parties', {}).get('party2_name', '[Tenant Name]')}, residing at {data.get('parties', {}).get('party2_description', '[Tenant Address]')}, hereinafter referred to as "{data.get('parties', {}).get('party2_reference', 'Tenant')}".

1. Property Address: {data.get('terms', {}).get('property_address', '[Property Address]')}
2. Lease Term: {data.get('terms', {}).get('lease_term', '[Lease Term]')}
3. Monthly Rent: {data.get('terms', {}).get('monthly_rent', '[Monthly Rent]')}
4. Security Deposit: {data.get('terms', {}).get('security_deposit', '[Security Deposit]')}
5. Maintenance: {data.get('terms', {}).get('maintenance', '[Maintenance Terms]')}
6. Utilities: {data.get('terms', {}).get('utilities', '[Utilities Terms]')}
7. Pets: {data.get('terms', {}).get('pets', '[Pet Policy]')}
8. Termination: {data.get('terms', {}).get('termination', '[Termination Terms]')}

IN WITNESS WHEREOF, both parties agree to the terms.

Signed:  
{data.get('signatures', {}).get('party1_name', '[Landlord Signature]')}            {data.get('signatures', {}).get('party2_name', '[Tenant Signature]')}  
Date: {data.get('signatures', {}).get('party1_date', '[Landlord Signature Date]')}      Date: {data.get('signatures', {}).get('party2_date', '[Tenant Signature Date]')}
"""
    return document

def format_patient_intake(form_data):
    """Format patient intake form data into a professional document."""
    # Extract data from form_data
    data = form_data.get('form_data', {})
    if isinstance(data, str):
        data = json.loads(data)
    
    # Get current date if not provided
    date = data.get('document_date', datetime.now().strftime("%B %d, %Y"))
    
    # Format the document
    document = f"""
PATIENT INTAKE FORM

Date: {date}

PERSONAL INFORMATION
-------------------
Name: {data.get('parties', {}).get('party2_name', '[Patient Name]')}
Date of Birth: {data.get('terms', {}).get('date_of_birth', '[Date of Birth]')}
Gender: {data.get('terms', {}).get('gender', '[Gender]')}
Address: {data.get('parties', {}).get('party2_description', '[Patient Address]')}
Phone: {data.get('terms', {}).get('phone', '[Phone Number]')}
Email: {data.get('terms', {}).get('email', '[Email Address]')}
Emergency Contact: {data.get('terms', {}).get('emergency_contact', '[Emergency Contact]')}
Emergency Phone: {data.get('terms', {}).get('emergency_phone', '[Emergency Phone]')}

MEDICAL HISTORY
--------------
Primary Care Physician: {data.get('terms', {}).get('primary_care_physician', '[Primary Care Physician]')}
Insurance Provider: {data.get('terms', {}).get('insurance_provider', '[Insurance Provider]')}
Insurance ID: {data.get('terms', {}).get('insurance_id', '[Insurance ID]')}
Allergies: {data.get('terms', {}).get('allergies', '[Allergies]')}
Current Medications: {data.get('terms', {}).get('current_medications', '[Current Medications]')}
Past Surgeries: {data.get('terms', {}).get('past_surgeries', '[Past Surgeries]')}
Family History: {data.get('terms', {}).get('family_history', '[Family History]')}

REASON FOR VISIT
---------------
{data.get('terms', {}).get('reason_for_visit', '[Reason for Visit]')}

Patient Signature: {data.get('signatures', {}).get('party2_name', '[Patient Signature]')}
Date: {data.get('signatures', {}).get('party2_date', '[Signature Date]')}
"""
    return document

def format_medical_release(form_data):
    """Format medical release form data into a professional document."""
    # Extract data from form_data
    data = form_data.get('form_data', {})
    if isinstance(data, str):
        data = json.loads(data)
    
    # Get current date if not provided
    date = data.get('document_date', datetime.now().strftime("%B %d, %Y"))
    
    # Format the document
    document = f"""
MEDICAL RELEASE FORM

I, {data.get('parties', {}).get('party2_name', '[Patient Name]')}, residing at {data.get('parties', {}).get('party2_description', '[Patient Address]')}, hereby authorize {data.get('parties', {}).get('party1_name', '[Medical Provider]')} to release my medical records to the following:

RECIPIENT INFORMATION
-------------------
Name: {data.get('terms', {}).get('recipient_name', '[Recipient Name]')}
Organization: {data.get('terms', {}).get('recipient_organization', '[Recipient Organization]')}
Address: {data.get('terms', {}).get('recipient_address', '[Recipient Address]')}
Phone: {data.get('terms', {}).get('recipient_phone', '[Recipient Phone]')}

RECORDS TO BE RELEASED
--------------------
{data.get('terms', {}).get('records_to_be_released', '[Records to be Released]')}

PURPOSE OF RELEASE
-----------------
{data.get('terms', {}).get('purpose_of_release', '[Purpose of Release]')}

DURATION OF AUTHORIZATION
------------------------
This authorization is valid from {date} until {data.get('terms', {}).get('duration', '[Duration]')}.

I understand that I have the right to revoke this authorization at any time by providing written notice to the medical provider.

Signed: {data.get('signatures', {}).get('party2_name', '[Patient Signature]')}
Date: {data.get('signatures', {}).get('party2_date', '[Signature Date]')}

Witness: {data.get('signatures', {}).get('witness_name', '[Witness Name]')}
Date: {data.get('signatures', {}).get('witness_date', '[Witness Date]')}
"""
    return document

def format_vehicle_sale_agreement(form_data):
    """Format vehicle sale agreement data into a professional document."""
    # Extract data from form_data
    data = form_data.get('form_data', {})
    if isinstance(data, str):
        data = json.loads(data)
    
    # Get current date if not provided
    date = data.get('document_date', datetime.now().strftime("%B %d, %Y"))
    
    # Format the document
    document = f"""
VEHICLE SALE AGREEMENT

This Vehicle Sale Agreement is made on {date}, between:

{data.get('parties', {}).get('party1_name', '[Seller Name]')}, residing at {data.get('parties', {}).get('party1_description', '[Seller Address]')}, hereinafter referred to as "{data.get('parties', {}).get('party1_reference', 'Seller')}"

AND

{data.get('parties', {}).get('party2_name', '[Buyer Name]')}, residing at {data.get('parties', {}).get('party2_description', '[Buyer Address]')}, hereinafter referred to as "{data.get('parties', {}).get('party2_reference', 'Buyer')}".

VEHICLE INFORMATION
------------------
Make: {data.get('terms', {}).get('vehicle_make', '[Vehicle Make]')}
Model: {data.get('terms', {}).get('vehicle_model', '[Vehicle Model]')}
Year: {data.get('terms', {}).get('vehicle_year', '[Vehicle Year]')}
Color: {data.get('terms', {}).get('vehicle_color', '[Vehicle Color]')}
VIN: {data.get('terms', {}).get('vehicle_vin', '[Vehicle VIN]')}
Odometer Reading: {data.get('terms', {}).get('odometer_reading', '[Odometer Reading]')}
License Plate: {data.get('terms', {}).get('license_plate', '[License Plate]')}

SALE TERMS
----------
Purchase Price: {data.get('terms', {}).get('purchase_price', '[Purchase Price]')}
Payment Method: {data.get('terms', {}).get('payment_method', '[Payment Method]')}
Payment Schedule: {data.get('terms', {}).get('payment_schedule', '[Payment Schedule]')}
Delivery Date: {data.get('terms', {}).get('delivery_date', '[Delivery Date]')}
Warranty: {data.get('terms', {}).get('warranty', '[Warranty Terms]')}
As-Is Clause: {data.get('terms', {}).get('as_is_clause', '[As-Is Clause]')}

IN WITNESS WHEREOF, both parties agree to the terms.

Signed:  
{data.get('signatures', {}).get('party1_name', '[Seller Signature]')}            {data.get('signatures', {}).get('party2_name', '[Buyer Signature]')}  
Date: {data.get('signatures', {}).get('party1_date', '[Seller Signature Date]')}      Date: {data.get('signatures', {}).get('party2_date', '[Buyer Signature Date]')}
"""
    return document

def format_document(form_data, template_type):
    """Format form data into a professional document based on template type."""
    # Ensure form_data is properly structured
    if isinstance(form_data, str):
        try:
            form_data = json.loads(form_data)
        except json.JSONDecodeError:
            # If JSON parsing fails, create a basic structure
            form_data = {"form_data": form_data}
    
    # If form_data is not a dictionary, create a basic structure
    if not isinstance(form_data, dict):
        form_data = {"form_data": str(form_data)}
    
    # Call the appropriate formatter based on template type
    if template_type == 'employment':
        return format_employment_agreement(form_data)
    elif template_type == 'nda':
        return format_nda_agreement(form_data)
    elif template_type == 'lease':
        return format_lease_agreement(form_data)
    elif template_type == 'patient_intake':
        return format_patient_intake(form_data)
    elif template_type == 'medical_release':
        return format_medical_release(form_data)
    elif template_type == 'vehicle_sale':
        return format_vehicle_sale_agreement(form_data)
    else:
        # Default formatting for unknown templates
        return format_generic_document(form_data)

def format_generic_document(form_data):
    """Format form data into a generic professional document."""
    # Extract data from form_data
    data = form_data
    if isinstance(data, dict) and 'form_data' in data:
        data = data.get('form_data', {})
    
    # If data is a string, try to parse it as JSON
    if isinstance(data, str):
        try:
            data = json.loads(data)
        except json.JSONDecodeError:
            # If JSON parsing fails, use the string as raw data
            data = {"raw_data": data}
    
    # If data is not a dictionary, convert it to a dictionary
    if not isinstance(data, dict):
        data = {"raw_data": str(data)}
    
    # Get current date if not provided
    date = data.get('document_date', datetime.now().strftime("%B %d, %Y"))
    
    # Format the document
    document = f"""
{data.get('document_title', 'LEGAL DOCUMENT')}

This document is made on {date}, between:

{data.get('parties', {}).get('party1_name', '[Party 1 Name]')}, {data.get('parties', {}).get('party1_description', '[Party 1 Description]')}, hereinafter referred to as "{data.get('parties', {}).get('party1_reference', 'Party 1')}"

AND

{data.get('parties', {}).get('party2_name', '[Party 2 Name]')}, {data.get('parties', {}).get('party2_description', '[Party 2 Description]')}, hereinafter referred to as "{data.get('parties', {}).get('party2_reference', 'Party 2')}".

TERMS AND CONDITIONS
-------------------
"""
    
    # Add terms
    terms = data.get('terms', {})
    for key, value in terms.items():
        document += f"{key}: {value}\n"
    
    # Add clauses
    clauses = data.get('clauses', {})
    if clauses:
        document += "\nCLAUSES\n-------\n"
        for key, value in clauses.items():
            document += f"{key}: {value}\n"
    
    # Add signatures
    document += f"""
IN WITNESS WHEREOF, both parties agree to the terms.

Signed:  
{data.get('signatures', {}).get('party1_name', '[Party 1 Signature]')}            {data.get('signatures', {}).get('party2_name', '[Party 2 Signature]')}  
Date: {data.get('signatures', {}).get('party1_date', '[Party 1 Signature Date]')}      Date: {data.get('signatures', {}).get('party2_date', '[Party 2 Signature Date]')}
"""
    
    return document 