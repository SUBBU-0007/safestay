# Indian Telecom & TRAI DLT Requirements for SafeStay Emergency SMS

This document outlines the legal, architectural, and telecommunications compliance requirements for dispatching real emergency SMS alerts to Indian mobile subscribers (`+91`) under TRAI (Telecom Regulatory Authority of India) regulations.

---

## 1. Regulatory Context: TRAI TCCCPR 2018
Under the **Telecom Commercial Communications Customer Preference Regulations (TCCCPR), 2018**, all Application-to-Peer (A2P) and bulk SMS messages transmitted across Indian telecom networks (Jio, Bharti Airtel, Vodafone Idea, BSNL) must be routed through a blockchain-based **Distributed Ledger Technology (DLT)** portal.

Unregistered SMS traffic sent to Indian numbers will either be silently dropped by telco firewalls or trigger severe telecom carrier penalties.

---

## 2. Mandatory Registration Steps

### Step 1: Principal Entity (PE) Registration
The organization operating SafeStay (e.g. State Disaster Management Authority, District Administration, or Registered Tourism Corporation) must register as a **Principal Entity (PE)** on any licensed Indian DLT portal:
- **Vilpower (Vodafone Idea DLT)**: `https://www.vilpower.in/`
- **Jio DLT**: `https://trueconnect.jio.com/`
- **Airtel DLT**: `https://www.airtel.in/business/commercial-communication/`
- **BSNL DLT**: `https://www.ucc-bsnl.co.in/`

*Required Documentation:*
- Government authorization letter or Organization Certificate of Incorporation (PAN/GST/TAN).
- Authorized signatory identification (Aadhaar / Passport).
- Assigned Principal Entity ID (PE ID: a 19-digit identifier).

### Step 2: Sender ID / Header Registration
Headers (Sender IDs) identify the sender in the recipient's SMS inbox.
- **Header Category**: `Service - Implicit` or `Government / Emergency Service`.
- **Length**: Exactly 6 alphabetical characters (e.g., `SFSTAY`, `DISMGT`, `KLNDRF`).
- **Format**: `VM-SFSTAY` or `AX-SFSTAY` (prefix depends on operator and circle).

### Step 3: Content Template Registration
Every emergency message structure must be registered and approved on the DLT portal before dispatch. Templates use dynamic variables denoted by `{#var#}`.

#### Approved Emergency Warning Template (English)
```
SAFESTAY EMERGENCY ALERT: A {#var#} threat has been reported near your last-known location. Follow official evacuation instructions. Nearest verified shelter: {#var#} ({#var#} km). View latest alert & safe route: {#var#}
```
- **Category**: Service Implicit (High Priority)
- **DLT Template Type**: Transactional / Critical Public Safety
- **Consent Scrubbing**: Exempted (Critical emergency communications bypass promotional DND filters)

#### Multilingual Unicode Templates (Hindi, Tamil, Malayalam)
DLT supports Unicode templates for regional languages. Note that Unicode SMS messages use 70 characters per SMS segment (compared to 160 characters in GSM-7).

---

## 3. Twilio Configuration for Indian DLT Traffic

When configuring Twilio for Indian destination numbers (`+91`):
1. **Twilio Console > Messaging > Services > India DLT Settings**:
   - Provide your **Entity ID** (`PE ID`).
   - Associate approved **Template IDs** (`Content Template ID`).
2. Include the registered Template ID and Header in your API requests or configure Twilio Messaging Service with the registered Alpha Sender ID.

---

## 4. Emergency Fallback Considerations

Because DLT approval can take 24–72 hours for template variations:
- SafeStay provides **strict template conformity**: all emergency alert messages conform to the approved core template schema.
- SafeStay maintains **offline mesh and native device SMS fallback** (`sms:` protocol URL scheme), enabling tourists to send distress reports directly from native device SMS radios to local SDRF hotlines without third-party aggregator dependencies.
