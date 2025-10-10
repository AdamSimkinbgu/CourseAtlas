# Phase 4.2 – Import Pipeline Architecture Design

## Objective
Lay the groundwork for the future automated import pipeline that ingests external course catalogs (CSV, JSON, PDFs) into Course Atlas.

## Tasks

1. **Requirements gathering**
   - Identify target data sources (university APIs, public catalogs, PDF syllabi).  
   - Determine minimal viable input formats (CSV + JSON in Phase 4).  
   - Document normalization needs (course IDs, credits, prerequisites, term info).

2. **Architecture design**
   - Draft high-level architecture diagram.  
   - Components:
     - Ingestion module (file upload, API connectors).  
     - Normalization layer (maps external fields to internal model).  
     - Validation engine (checks for duplicates, missing prerequisites).  
     - Review UI for manual confirmation before import.

3. **Data schema**
   - Define intermediate representation (e.g., `ImportedCourse`, `ImportedPrerequisite`).  
   - Create JSON schema for import payloads and share under `docs/import/schema.json`.

4. **AI PDF pipeline (future)**
   - Outline steps for OCR → NLP extraction (e.g., use AWS Textract, spaCy).  
   - Determine where to apply machine learning vs rule-based parsing.  
   - Plan for human-in-the-loop verification.

5. **Technical decisions**
   - Decide on background processing (Celery, RQ) for long-running imports.  
   - Determine storage for raw imports (S3 bucket + metadata).  
   - Security considerations: scanning uploads for malware, validation limits.

6. **Roadmap & milestones**
   - Break pipeline into phases (manual CSV import → automated API connectors → AI ingestion).  
   - Estimate effort for each milestone.

7. **Documentation**
   - Record architecture in `docs/import/pipeline-architecture.md`.  
   - Include data flow diagrams and future enhancements list.

## Deliverables
- Import pipeline architecture document.  
- JSON schema for import payloads.  
- Roadmap outlining phased implementation.
