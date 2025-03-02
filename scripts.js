// Configuration
const CONFIG = {
    EXAMPLE_URL: 'https://docs.google.com/forms/d/e/1FAIpQLSdls8ZHN0eT2UIKdC2FM730McPOxVPbY3WVJzsxtMQr5vKD1A/viewform',
    CORS_PROXIES: [
        'https://api.allorigins.win/get?url=',
        'https://api.codetabs.com/v1/proxy?quest=',
        'https://corsproxy.io/?'
    ]
};

// Templates for form generation
const TEMPLATES = {
    form: `
        <form method="POST" class="generated-form" target="hidden_iframe" onsubmit="submitted=true;" accept-charset="utf-8" autocomplete="off">
            {{#each fields}}
                <div class="form-group mb-3">
                    <label for="{{id}}" class="form-label">{{title}}{{#if required}}<span class="text-danger">*</span>{{/if}}</label>
                    {{#if description}}<div class="help-text text-muted mb-2">{{description}}</div>{{/if}}
                    {{#if_eq type "text"}}
                        <input type="text" class="form-control" name="entry.{{entryId}}" id="{{id}}" {{#if required}}required{{/if}}>
                    {{/if_eq}}
                    {{#if_eq type "email"}}
                        <input type="email" class="form-control" name="entry.{{entryId}}" id="{{id}}" {{#if required}}required{{/if}}>
                    {{/if_eq}}
                    {{#if_eq type "number"}}
                        <input type="number" class="form-control" name="entry.{{entryId}}" id="{{id}}" {{#if required}}required{{/if}}>
                    {{/if_eq}}
                    {{#if_eq type "textarea"}}
                        <textarea class="form-control" name="entry.{{entryId}}" id="{{id}}" rows="3" {{#if required}}required{{/if}}></textarea>
                    {{/if_eq}}
                    {{#if_eq type "radio"}}
                        {{#each options}}
                            <div class="form-check">
                                <input class="form-check-input" type="radio" name="entry.{{../entryId}}" id="{{../id}}_{{@index}}" value="{{this}}" {{#if @first}}{{#if ../required}}required{{/if}}{{/if}}>
                                <label class="form-check-label" for="{{../id}}_{{@index}}">{{this}}</label>
                            </div>
                        {{/each}}
                    {{/if_eq}}
                    {{#if_eq type "checkbox"}}
                        <div class="checkbox-group" {{#if required}}data-required="true"{{/if}} data-label="{{title}}">
                            {{#each options}}
                                <div class="form-check">
                                    <input class="form-check-input" type="checkbox" name="entry.{{../entryId}}" id="{{../id}}_{{@index}}" value="{{this}}">
                                    <label class="form-check-label" for="{{../id}}_{{@index}}">{{this}}</label>
                                </div>
                            {{/each}}
                        </div>
                    {{/if_eq}}
                    {{#if_eq type "select"}}
                        <select class="form-control" name="entry.{{entryId}}" id="{{id}}" {{#if required}}required{{/if}}>
                            <option value="">Choose...</option>
                            {{#each options}}
                                <option value="{{this}}">{{this}}</option>
                            {{/each}}
                        </select>
                    {{/if_eq}}
                </div>
            {{/each}}
            <input type="hidden" name="fvv" value="1">
            <input type="hidden" name="fbzx" value="">
            <input type="hidden" name="pageHistory" value="0">
            <button type="submit" class="btn btn-primary">Submit</button>
        </form>
        <iframe name="hidden_iframe" id="hidden_iframe" style="display:none;"></iframe>
    `
};

// Register Handlebars helpers
Handlebars.registerHelper('if_eq', function(a, b, opts) {
    return a === b ? opts.fn(this) : opts.inverse(this);
});

// Main application logic
document.addEventListener('DOMContentLoaded', () => {
    // Cache DOM elements
    const elements = {
        inputUrl: document.getElementById('input-url'),
        buttonFetch: document.getElementById('button-fetch'),
        spinner: null, // Will be set if buttonFetch exists
        mainArea: document.getElementById('main-area'),
        targetDemo: document.getElementById('target-demo'),
        targetHtml: document.getElementById('target-bootstrap-html'),
        targetJs: document.getElementById('target-bootstrap-js'),
        exampleAction: document.getElementById('example-action'),
        progressContainer: document.getElementById('progress-container'),
        progressBar: document.getElementById('progress-bar')
    };

    // Initialize spinner if button exists
    if (elements.buttonFetch) {
        elements.spinner = elements.buttonFetch.querySelector('.spinner-border');
    }

    // Compile template
    const formTemplate = Handlebars.compile(TEMPLATES.form);

    // Parse Google Form URL to get form ID
    function getFormId(url) {
        const match = url.match(/forms\/d\/e\/([^\/]+)/);
        return match ? match[1] : null;
    }

    // Try fetching with different CORS proxies
    async function fetchWithCorsProxy(url) {
        let lastError;
        
        // First try direct fetch with no-cors mode
        try {
            const response = await fetch(url, {
                mode: 'no-cors',
                headers: {
                    'Accept': 'text/html'
                }
            });
            if (response.ok) {
                return await response.text();
            }
        } catch (error) {
            console.warn('Direct fetch failed, trying proxies:', error);
        }

        // Try each proxy in sequence
        for (const proxy of CONFIG.CORS_PROXIES) {
            try {
                const proxyUrl = proxy + encodeURIComponent(url);
                console.log('Trying proxy:', proxy);
                
                const response = await fetch(proxyUrl);
                if (response.ok) {
                    let text;
                    if (proxy.includes('allorigins')) {
                        // allorigins returns JSON with contents in .contents
                        const data = await response.json();
                        text = data.contents;
                    } else {
                        text = await response.text();
                    }
                    
                    if (text && (text.includes('freebird') || text.includes('form-group'))) {
                        return text;
                    }
                    console.warn('Proxy returned invalid content:', proxy);
                } else {
                    console.warn(`Proxy returned status ${response.status}:`, proxy);
                }
            } catch (error) {
                lastError = error;
                console.warn(`Failed to fetch with proxy ${proxy}:`, error);
            }
        }
        
        throw lastError || new Error('All CORS proxies failed. Please try again later or use a different proxy service.');
    }

    // Copy to clipboard functionality
    document.querySelectorAll('.copy-btn').forEach(button => {
        button.addEventListener('click', async () => {
            const targetId = button.getAttribute('data-target');
            const codeElement = document.getElementById(targetId);
            
            try {
                await navigator.clipboard.writeText(codeElement.textContent);
                
                // Show success feedback
                const originalText = button.innerHTML;
                button.innerHTML = '<i class="fas fa-check"></i> Copied!';
                button.classList.add('btn-success');
                button.classList.remove('btn-outline-secondary');
                
                // Reset button after 2 seconds
                setTimeout(() => {
                    button.innerHTML = originalText;
                    button.classList.remove('btn-success');
                    button.classList.add('btn-outline-secondary');
                }, 2000);
            } catch (err) {
                console.error('Failed to copy text:', err);
                
                // Show error feedback
                const originalText = button.innerHTML;
                button.innerHTML = '<i class="fas fa-times"></i> Failed to copy';
                button.classList.add('btn-danger');
                button.classList.remove('btn-outline-secondary');
                
                // Reset button after 2 seconds
                setTimeout(() => {
                    button.innerHTML = originalText;
                    button.classList.remove('btn-danger');
                    button.classList.add('btn-outline-secondary');
                }, 2000);
            }
        });
    });

    // Update progress bar
    function updateProgress(percent) {
        if (elements.progressContainer && elements.progressBar) {
            elements.progressContainer.classList.remove('d-none');
            elements.progressBar.style.width = `${percent}%`;
            elements.progressBar.setAttribute('aria-valuenow', percent);
            elements.progressBar.textContent = `${percent}%`;
        }
    }

    // Reset progress bar
    function resetProgress() {
        if (elements.progressContainer && elements.progressBar) {
            elements.progressContainer.classList.add('d-none');
            elements.progressBar.style.width = '0%';
            elements.progressBar.setAttribute('aria-valuenow', 0);
            elements.progressBar.textContent = '';
        }
    }

    // Extract form data from Google Form page
    async function extractFormData(url) {
        try {
            updateProgress(10); // Started fetching
            const html = await fetchWithCorsProxy(url);
            updateProgress(30); // HTML fetched
            
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            updateProgress(40); // HTML parsed
            
            const fields = [];
            
            // Try different possible selectors for form elements
            const formElements = doc.querySelectorAll([
                'div[role="listitem"]',
                '.freebirdFormviewerViewNumberedItemContainer',
                '.freebirdFormviewerViewItemsItemItem',
                '.freebirdFormviewerComponentsQuestionBaseRoot'
            ].join(','));
            
            console.log('Found form elements:', formElements.length);
            
            if (formElements.length === 0) {
                throw new Error('No form elements found. Make sure the form is public and the URL is correct.');
            }
            
            // Update progress at various stages
            updateProgress(60); // Form elements processed
            
            // Process form fields
            formElements.forEach((element, index) => {
                // Extract entry ID more thoroughly
                let entryId = '';
                let type = 'text'; // Default type
                let options = [];
                
                // Try to find entry ID from data-params first (most reliable)
                const dataParams = element.querySelector('[data-params]');
                if (dataParams) {
                    try {
                        let paramsStr = dataParams.getAttribute('data-params');
                        
                        // Clean up the URI before decoding
                        paramsStr = decodeURIComponent(paramsStr.replace(/\+/g, ' '));
                        
                        // Extract entry ID using multiple methods
                        let entryId = '';
                        
                        // Method 1: Try direct regex extraction first (most reliable)
                        const directMatch = paramsStr.match(/entry[._]?(\d+)/i);
                        if (directMatch && directMatch[1]) {
                            entryId = directMatch[1];
                        } else {
                            // Method 2: Try to parse as JSON if it looks like JSON
                            if (paramsStr.trim().startsWith('{')) {
                                try {
                                    // Clean up common JSON issues
                                    let cleanJson = paramsStr
                                        .replace(/[\u0000-\u001F]/g, '') // Remove control characters
                                        .replace(/,\s*}/g, '}')  // Remove trailing commas
                                        .replace(/([{,]\s*)([a-zA-Z0-9_]+)\s*:/g, '$1"$2":') // Quote unquoted keys
                                        .replace(/:\s*'([^']*)'/g, ':"$1"'); // Replace single quotes with double quotes
                                    
                                    // Try to extract just the JSON object
                                    const jsonStart = cleanJson.indexOf('{');
                                    const jsonEnd = cleanJson.lastIndexOf('}') + 1;
                                    if (jsonStart >= 0 && jsonEnd > jsonStart) {
                                        cleanJson = cleanJson.substring(jsonStart, jsonEnd);
                                        const params = JSON.parse(cleanJson);
                                        if (params.entry) {
                                            entryId = params.entry.toString();
                                        }
                                    }
                                } catch (jsonError) {
                                    // JSON parsing failed, try additional regex patterns
                                    const patterns = [
                                        /"entry":\s*"?(\d+)"?/,
                                        /\[(\d{6,})\]/,
                                        /entry.?(\d{6,})/,
                                        /\bentry[\s:]+"?(\d+)"?/
                                    ];
                                    
                                    for (const pattern of patterns) {
                                        const match = paramsStr.match(pattern);
                                        if (match && match[1]) {
                                            entryId = match[1];
                                            break;
                                        }
                                    }
                                }
                            }
                        }
                        
                        if (entryId) {
                            return entryId;
                        }
                    } catch (e) {
                        console.debug('Failed to process data-params:', e);
                    }
                }
                
                // If no entry ID found, try finding it in the element's HTML
                if (!entryId) {
                    const matches = element.innerHTML.match(/entry\.(\d+)/);
                    if (matches) {
                        entryId = matches[1];
                    }
                }
                
                // Try to find entry ID from various possible sources
                if (!entryId) {
                    const possibleInputs = element.querySelectorAll('input, textarea, select');
                    for (const input of possibleInputs) {
                        const nameMatch = input.name?.match(/entry[._](\d+)/);
                        if (nameMatch) {
                            entryId = nameMatch[1];
                            break;
                        }
                    }
                }
                
                // If still no entry ID found, try data attributes
                if (!entryId) {
                    const dataEntry = element.querySelector('[data-params*="entry"]');
                    if (dataEntry) {
                        const paramsMatch = dataEntry.getAttribute('data-params')?.match(/entry[._](\d+)/);
                        if (paramsMatch) {
                            entryId = paramsMatch[1];
                        }
                    }
                }

                // If no entry ID found, try finding it in script tags
                if (!entryId) {
                    const scripts = doc.querySelectorAll('script');
                    for (const script of scripts) {
                        const content = script.textContent;
                        if (content && content.includes('FB_PUBLIC_LOAD_DATA_')) {
                            try {
                                const match = content.match(/FB_PUBLIC_LOAD_DATA_\s*=\s*(.+?);/);
                                if (match) {
                                    const data = JSON.parse(match[1]);
                                    // Extract entry IDs from the form data structure
                                    if (data && data[1] && data[1][1]) {
                                        const formFields = data[1][1];
                                        if (formFields[index] && formFields[index][4] && formFields[index][4][0] && formFields[index][4][0][0]) {
                                            entryId = formFields[index][4][0][0].toString();
                                        }
                                    }
                                }
                            } catch (e) {
                                console.warn('Failed to parse form data script:', e);
                            }
                        }
                    }
                }
                
                // If still no entry ID found, use index as fallback
                if (!entryId) {
                    console.warn(`No entry ID found for element ${index}, using index as fallback`);
                    entryId = `${index + 1}`;
                }

                // Try different possible selectors for title
                const titleElement = element.querySelector([
                    '.freebirdFormviewerComponentsQuestionBaseTitle',
                    '.freebirdFormviewerViewItemsItemItemTitle',
                    '.freebirdFormviewerViewItemsItemItemHeader',
                    '[role="heading"]'
                ].join(','));
                
                // Clean up title text - remove any existing asterisks and trim
                const title = titleElement ? titleElement.textContent.replace(/\*/g, '').trim() : '';
                if (!title) {
                    console.log('Skipping element due to no title:', element);
                    return;
                }
                
                // Try different possible selectors for required status
                const required = element.querySelector([
                    '[aria-label*="Required"]',
                    '.freebirdFormviewerViewItemsItemRequiredAsterisk',
                    '.freebirdFormviewerComponentsQuestionBaseRequiredAsterisk'
                ].join(',')) !== null;
                
                // Try different possible selectors for description
                const descriptionElement = element.querySelector([
                    '.freebirdFormviewerComponentsQuestionBaseDescription',
                    '.freebirdFormviewerViewItemsItemItemHelpText',
                    '.freebirdFormviewerViewItemsItemItemHelperText'
                ].join(','));
                
                const description = descriptionElement?.textContent.trim() || '';

                // Detect input type with multiple possible selectors
                const radioInputs = element.querySelectorAll('input[type="radio"], .freebirdFormviewerComponentsQuestionRadioChoice');
                const checkboxInputs = element.querySelectorAll('input[type="checkbox"], .freebirdFormviewerComponentsQuestionCheckboxChoice');
                const textArea = element.querySelector('textarea, .freebirdFormviewerComponentsQuestionTextLong');
                const emailInput = element.querySelector('input[type="email"], [aria-label*="email" i]');
                const numberInput = element.querySelector('input[type="number"], [aria-label*="number" i]');
                const selectInput = element.querySelector('select, .freebirdFormviewerComponentsQuestionSelectRoot');

                // Additional selectors for radio and checkbox options
                const optionSelectors = [
                    '.freebirdFormviewerComponentsQuestionRadioChoice',
                    '.freebirdFormviewerComponentsQuestionCheckboxChoice',
                    '.docssharedWizToggleLabeledContainer',
                    '.freebirdFormviewerViewItemsRadioChoice',
                    '.freebirdFormviewerViewItemsCheckboxChoice',
                    '[role="radio"]',
                    '[role="checkbox"]'
                ];

                // Determine field type and options
                if (title.toLowerCase().includes('github username')) {
                    type = 'text';
                } else if (title.toLowerCase().includes('email')) {
                    type = 'email';
                } else if (textArea || title.toLowerCase().includes('full name')) {
                    type = 'text';
                } else if (radioInputs.length > 0 || element.querySelector(optionSelectors.join(','))) {
                    type = 'radio';
                    // Get options from radio elements
                    options = Array.from(element.querySelectorAll(optionSelectors.join(','))).map(opt => {
                        const label = opt.textContent.trim();
                        const value = opt.querySelector('input')?.value || label;
                        return label || value;
                    }).filter(Boolean);
                } else if (checkboxInputs.length > 0) {
                    type = 'checkbox';
                    options = Array.from(element.querySelectorAll(optionSelectors.join(','))).map(opt => {
                        const label = opt.textContent.trim();
                        const value = opt.querySelector('input')?.value || label;
                        return label || value;
                    }).filter(Boolean);
                } else if (selectInput) {
                    type = 'select';
                    options = Array.from(element.querySelectorAll('option')).map(opt => opt.textContent.trim()).filter(Boolean);
                }

                console.log('Processing field:', { title, type, required, entryId, options });

                // Only add fields with valid titles
                if (title) {
                    fields.push({
                        id: `field_${index}`,
                        name: `field_${index}`,
                        entryId,
                        title,
                        type,
                        required,
                        description,
                        options
                    });
                }
                updateProgress(60 + Math.floor((index / formElements.length) * 30)); // Progress during field processing
            });

            console.log('Extracted fields:', fields);

            if (fields.length === 0) {
                console.error('Form HTML:', html);
                throw new Error('No valid form fields found in the form. The form structure might have changed or the URL might be incorrect.');
            }

            // Get form ID from URL
            const formId = getFormId(url);

            // Update progress at various stages
            updateProgress(90); // Fields processed
            
            // Generate form
            const formData = {
                fields: fields,
                action: url.replace('/viewform', '/formResponse')
            };
            
            updateProgress(100); // Form generation complete
            setTimeout(resetProgress, 1000); // Reset progress bar after 1 second
            
            return formData;
        } catch (error) {
            resetProgress();
            console.error('Form parsing error:', error);
            if (error.message.includes('Failed to fetch')) {
                throw new Error('Failed to access the form. This might be due to CORS restrictions or the form might be private.');
            }
            throw new Error(error.message || 'Failed to parse form data. Please make sure the form is public and try again.');
        }
    }

    // Handle form submission
    async function handleFormSubmit(url) {
        const submitButton = elements.buttonFetch;
        const originalButtonText = submitButton?.textContent || 'Submit';
        const spinner = elements.spinner;
        
        try {
            // Show loading state
            if (submitButton) {
                submitButton.disabled = true;
                if (spinner) spinner.classList.remove('d-none');
            }

            // Extract form ID from URL
            const formId = url.match(/forms\/d\/e\/([a-zA-Z0-9_-]+)/)?.[1] || 
                          url.match(/forms\/([a-zA-Z0-9_-]+)/)?.[1];
            
            if (!formId) {
                throw new Error('Invalid Google Form URL');
            }

            // Get form data and generate HTML
            const { formId: extractedFormId, fields, formHtml: rawHtml } = await extractFormData(`https://docs.google.com/forms/d/e/${formId}/viewform`);
            
            // Generate form HTML
            const formHtml = formTemplate({ formId: extractedFormId, fields });
            
            // Update demo area
            if (elements.targetDemo) {
                elements.targetDemo.innerHTML = formHtml;
                
                // Add submit handler to the generated form
                const generatedForm = elements.targetDemo.querySelector('.generated-form');
                if (generatedForm) {
                    // Set the form's action URL with the correct formId
                    const formAction = `https://docs.google.com/forms/d/e/${formId}/formResponse`;
                    generatedForm.action = formAction;
                    
                    // Extract form metadata from the page
                    let fbzx = '';
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(rawHtml, 'text/html');
                    const scripts = doc.querySelectorAll('script');
                    for (const script of scripts) {
                        const content = script.textContent;
                        if (content && content.includes('FB_PUBLIC_LOAD_DATA_')) {
                            try {
                                const match = content.match(/FB_PUBLIC_LOAD_DATA_\s*=\s*(.+?);/);
                                if (match) {
                                    const data = JSON.parse(match[1]);
                                    // Extract fbzx from the form data structure
                                    if (data && data[14]) {
                                        fbzx = data[14].toString();
                                    }
                                }
                            } catch (e) {
                                console.warn('Failed to parse form data script:', e);
                            }
                        }
                    }
                    
                    // Add required hidden fields for Google Forms
                    const hiddenFields = document.createElement('div');
                    hiddenFields.style.display = 'none';
                    hiddenFields.innerHTML = `
                        <input type="hidden" name="fvv" value="1">
                        <input type="hidden" name="fbzx" value="${fbzx}">
                        <input type="hidden" name="pageHistory" value="0,1">
                        <input type="hidden" name="draftResponse" value="[]">
                        <input type="hidden" name="submit" value="Submit">
                    `;
                    generatedForm.appendChild(hiddenFields);
                    
                    // Create a variable to track submission state
                    let submitted = false;
                    
                    // Add iframe load handler
                    const iframe = document.getElementById('hidden_iframe');
                    if (iframe) {
                        iframe.addEventListener('load', () => {
                            if (submitted) {
                                // Show success message
                                const successMessage = document.createElement('div');
                                successMessage.className = 'alert alert-success';
                                successMessage.textContent = 'Form submitted successfully!';
                                generatedForm.insertAdjacentElement('beforebegin', successMessage);

                                // Reset form and submission state
                                generatedForm.reset();
                                submitted = false;

                                // Remove success message after 5 seconds
                                setTimeout(() => successMessage.remove(), 5000);
                            }
                        });
                    }

                    // Add form submit handler with proper entry validation
                    generatedForm.addEventListener('submit', (e) => {
                        const submitBtn = e.target.querySelector('button[type="submit"]');
                        const originalBtnText = submitBtn?.textContent || 'Submit';
                        
                        try {
                            // Validate required checkbox groups
                            const checkboxGroups = e.target.querySelectorAll('.checkbox-group[data-required="true"]');
                            for (const group of checkboxGroups) {
                                const checkedBoxes = group.querySelectorAll('input[type="checkbox"]:checked');
                                if (checkedBoxes.length === 0) {
                                    e.preventDefault();
                                    const groupLabel = group.closest('.form-group')?.querySelector('.form-label')?.textContent || 'checkbox group';
                                    throw new Error(`Please select at least one option in "${groupLabel}"`);
                                }
                            }

                            // Set submission state
                            submitted = true;
                            
                            // Update button state
                            if (submitBtn) {
                                submitBtn.disabled = true;
                                submitBtn.textContent = 'Submitting...';
                            }

                        } catch (error) {
                            e.preventDefault();
                            // Show error message
                            const errorMessage = document.createElement('div');
                            errorMessage.className = 'alert alert-danger';
                            errorMessage.textContent = error.message || 'An error occurred while submitting the form';
                            e.target.insertAdjacentElement('beforebegin', errorMessage);

                            // Remove error message after 5 seconds
                            setTimeout(() => errorMessage.remove(), 5000);
                            
                            // Reset button state
                            if (submitBtn) {
                                submitBtn.disabled = false;
                                submitBtn.textContent = originalBtnText;
                            }
                            
                            console.error('Form validation error:', error);
                            
                            // Reset submission state
                            submitted = false;
                        }
                    });
                }
            }

            // Update source code displays
            if (elements.targetHtml) {
                // Generate properly indented HTML with comments
                const formCode = `<!-- Google Form HTML Template -->
<!-- 
  This form was automatically generated from a Google Form.
  Action URL format: https://docs.google.com/forms/d/e/[formId]/formResponse
  
  Features:
  - Bootstrap 5 styling
  - Client-side validation
  - Async submission handling
  - Success/error feedback
-->
<form method="POST" class="generated-form" target="hidden_iframe" onsubmit="submitted=true;" action="https://docs.google.com/forms/d/e/${formId}/formResponse">
    ${fields.map(field => {
        let fieldHtml = `    <!-- ${field.title} field ${field.required ? '(Required)' : '(Optional)'} -->
    <div class="form-group mb-3">
        <label for="${field.id}" class="form-label">${field.title}${field.required ? '<span class="text-danger">*</span>' : ''}</label>
        ${field.description ? `\n        <!-- Field description/help text -->
        <div class="help-text text-muted mb-2">${field.description}</div>` : ''}`;

        switch (field.type) {
            case 'text':
            case 'email':
            case 'number':
                fieldHtml += `\n        <input type="${field.type}" class="form-control" name="entry.${field.entryId}" id="${field.id}"${field.required ? ' required' : ''}>`;
                break;
            case 'textarea':
                fieldHtml += `\n        <textarea class="form-control" name="entry.${field.entryId}" id="${field.id}" rows="3"${field.required ? ' required' : ''}></textarea>`;
                break;
            case 'radio':
                fieldHtml += '\n' + field.options.map((opt, i) => 
                    `        <div class="form-check">
            <input class="form-check-input" type="radio" name="entry.${field.entryId}" id="${field.id}_${i}" value="${opt}"${i === 0 && field.required ? ' required' : ''}>
            <label class="form-check-label" for="${field.id}_${i}">${opt}</label>
        </div>`).join('\n');
                break;
            case 'checkbox':
                fieldHtml += `\n        <div class="checkbox-group"${field.required ? ' data-required="true"' : ''}>` + 
                    field.options.map((opt, i) => 
                    `\n            <div class="form-check">
                <input class="form-check-input" type="checkbox" name="entry.${field.entryId}" id="${field.id}_${i}" value="${opt}">
                <label class="form-check-label" for="${field.id}_${i}">${opt}</label>
            </div>`).join('') + '\n        </div>';
                break;
            case 'select':
                fieldHtml += `\n        <select class="form-control" name="entry.${field.entryId}" id="${field.id}"${field.required ? ' required' : ''}>
            <option value="">Choose...</option>${field.options.map(opt => `\n            <option value="${opt}">${opt}</option>`).join('')}
        </select>`;
                break;
        }
        fieldHtml += '\n    </div>';
        return fieldHtml;
    }).join('\n\n')}

    <button type="submit" class="btn btn-primary">Submit</button>
</form>

<!-- Hidden iframe for form submission -->
<iframe name="hidden_iframe" id="hidden_iframe" style="display:none;"></iframe>`.trim();

                elements.targetHtml.textContent = formCode;
            }
            
            if (elements.targetJs) {
                // Generate properly commented JavaScript code
                const jsCode = `// Google Form Submission Handler
/**
 * This code handles the submission of the generated Google Form, including:
 * - Form validation (required fields, checkbox groups)
 * - Submission state management
 * - Success/error message display
 * - Form reset after successful submission
 */
document.addEventListener('DOMContentLoaded', () => {
    // Initialize form elements
    const form = document.querySelector('.generated-form');
    const submitButton = form.querySelector('button[type="submit"]');
    let submitted = false;  // Track submission state

    // Handle form submission confirmation via hidden iframe
    const iframe = document.getElementById('hidden_iframe');
    if (iframe) {
        iframe.addEventListener('load', () => {
            if (submitted) {
                // Display success message and reset form
                const successMessage = document.createElement('div');
                successMessage.className = 'alert alert-success';
                successMessage.textContent = 'Form submitted successfully!';
                form.insertAdjacentElement('beforebegin', successMessage);

                form.reset();
                submitted = false;

                // Auto-remove success message
                setTimeout(() => successMessage.remove(), 5000);
            }
        });
    }

    // Form submission handler
    form.addEventListener('submit', (e) => {
        const submitBtn = form.querySelector('button[type="submit"]');
        
        try {
            // Validate required checkbox groups
            const checkboxGroups = form.querySelectorAll('.checkbox-group[data-required="true"]');
            for (const group of checkboxGroups) {
                const checkedBoxes = group.querySelectorAll('input[type="checkbox"]:checked');
                if (checkedBoxes.length === 0) {
                    e.preventDefault();
                    throw new Error('Please select at least one option in required checkbox groups');
                }
            }

            // Update submission state
            submitted = true;
            
            // Show loading state
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.textContent = 'Submitting...';
                
                // Reset button after delay
                setTimeout(() => {
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'Submit';
                }, 2000);
            }
        } catch (error) {
            // Handle validation errors
            e.preventDefault();
            const errorMessage = document.createElement('div');
            errorMessage.className = 'alert alert-danger';
            errorMessage.textContent = error.message;
            form.insertAdjacentElement('beforebegin', errorMessage);

            setTimeout(() => errorMessage.remove(), 5000);
            submitted = false;
        }
    });
});`.trim();

                elements.targetJs.textContent = jsCode;
            }

            // Show main area and highlight code
            if (elements.mainArea) {
                elements.mainArea.classList.remove('d-none');
                if (typeof hljs !== 'undefined') {
                    // Clear previous highlighting
                    document.querySelectorAll('code[data-highlighted]').forEach(el => {
                        delete el.dataset.highlighted;
                    });
                    hljs.highlightAll();
                }
                elements.mainArea.scrollIntoView({ behavior: 'smooth' });
            }

        } catch (error) {
            console.error('Error:', error);
            alert(error.message || 'Failed to parse form. Please check the URL and try again.');
        } finally {
            // Restore button state
            if (submitButton) {
                submitButton.disabled = false;
                if (spinner) spinner.classList.add('d-none');
            }
        }
    }

    // Add event listeners only if elements exist
    if (elements.buttonFetch && elements.inputUrl) {
        elements.buttonFetch.addEventListener('click', () => {
            const url = elements.inputUrl.value.trim();
            if (url) handleFormSubmit(url);
        });

        elements.inputUrl.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const url = elements.inputUrl.value.trim();
                if (url) handleFormSubmit(url);
            }
        });
    }

    if (elements.exampleAction && elements.inputUrl) {
        elements.exampleAction.addEventListener('click', (e) => {
            e.preventDefault();
            elements.inputUrl.value = CONFIG.EXAMPLE_URL;
            handleFormSubmit(CONFIG.EXAMPLE_URL);
        });
    }
});