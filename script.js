document.addEventListener('DOMContentLoaded', function() {
    // Form elements
    const pcnForm = document.getElementById('pcnForm');
    const formProgress = document.getElementById('formProgress');
    
    // Form steps
    const step1 = document.getElementById('step1');
    const step2 = document.getElementById('step2');
    const step3 = document.getElementById('step3');
    
    // Add event listeners for form fields to provide real-time validation
    pcnType.addEventListener('change', function() {
        if (pcnType.value !== '') {
            pcnTypeError.textContent = '';
        }
    });
    
    for (let i = 0; i < pcnReasonRadios.length; i++) {
        pcnReasonRadios[i].addEventListener('change', function() {
            pcnReasonError.textContent = '';
        });
    }
    
    pcnIssueDate.addEventListener('change', function() {
        pcnIssueDateError.textContent = '';
        
        // Check if incident date is after issue date
        if (incidentDate.value !== '' && incidentDate.value > pcnIssueDate.value) {
            incidentDateError.textContent = 'Incident date cannot be after PCN issue date';
        } else {
            incidentDateError.textContent = '';
        }
    });
    
    incidentDate.addEventListener('change', function() {
        incidentDateError.textContent = '';
        
        // Check if incident date is after issue date
        if (pcnIssueDate.value !== '' && incidentDate.value > pcnIssueDate.value) {
            incidentDateError.textContent = 'Incident date cannot be after PCN issue date';
        }
    });
    
    explanation.addEventListener('input', function() {
        if (explanation.value.trim().length >= 30) {
            explanationError.textContent = '';
        }
    });
    
    // Add keypress event listeners for better keyboard accessibility
    pcnForm.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            
            // Determine which step we're on and proceed accordingly
            if (step1.classList.contains('active')) {
                toStep2Btn.click();
            } else if (step2.classList.contains('active')) {
                toStep3Btn.click();
            } else if (step3.classList.contains('active')) {
                submitBtn.click();
            }
        }
    });
    
    // Navigation buttons
    const toStep2Btn = document.getElementById('toStep2');
    const toStep1Btn = document.getElementById('toStep1');
    const toStep3Btn = document.getElementById('toStep3');
    const submitBtn = document.getElementById('submitBtn');
    
    // Results section
    const appealFormSection = document.getElementById('appeal-form-section');
    const resultsSection = document.getElementById('results-section');
    const loadingIndicator = document.getElementById('loading');
    const resultsContainer = document.getElementById('results');
    const adviceContainer = document.getElementById('advice-container');
    const apiError = document.getElementById('api-error');
    
    // Action buttons
    const copyBtn = document.getElementById('copyBtn');
    const startOverBtn = document.getElementById('startOverBtn');
    const retryBtn = document.getElementById('retryBtn');
    
    // Accessibility controls
    const increaseFontBtn = document.getElementById('increaseFontBtn');
    const decreaseFontBtn = document.getElementById('decreaseFontBtn');
    const toggleContrastBtn = document.getElementById('toggleContrastBtn');
    
    // Action button event listeners
    copyBtn.addEventListener('click', function() {
        const textToCopy = adviceContainer.innerText;
        navigator.clipboard.writeText(textToCopy)
            .then(() => {
                const originalText = copyBtn.innerHTML;
                copyBtn.innerHTML = '<i class="fas fa-check"></i> Copied!';
                setTimeout(() => {
                    copyBtn.innerHTML = originalText;
                }, 2000);
            })
            .catch(err => {
                console.error('Failed to copy text: ', err);
                alert('Could not copy text. Please try selecting and copying manually.');
            });
    });
    
    startOverBtn.addEventListener('click', function() {
        // Reset form
        pcnForm.reset();
        
        // Show form and hide results
        appealFormSection.classList.remove('hidden');
        resultsSection.classList.add('hidden');
        
        // Reset to first step
        showStep(1);
    });
    
    retryBtn.addEventListener('click', async function() {
        // Hide error, show loading
        apiError.classList.add('hidden');
        loadingIndicator.classList.remove('hidden');
        
        // Collect form data again
        const formData = {
            pcnType: pcnType.value,
            pcnReason: getSelectedRadioValue(pcnReasonRadios),
            pcnIssueDate: pcnIssueDate.value,
            incidentDate: incidentDate.value,
            stepsTaken: stepsTaken.value,
            explanation: explanation.value
        };
        
        try {
            // Retry API call
            const response = await callAnthropicAPI(formData);
            showResults(response);
        } catch (error) {
            console.error('API retry error:', error);
            showApiError();
        }
    });
    
    // Accessibility control handlers
    let currentFontSize = parseInt(getComputedStyle(document.documentElement).fontSize);
    
    increaseFontBtn.addEventListener('click', function() {
        if (currentFontSize < 22) { // Maximum font size
            currentFontSize += 2;
            document.documentElement.style.fontSize = currentFontSize + 'px';
            localStorage.setItem('pcnAppFontSize', currentFontSize);
        }
    });
    
    decreaseFontBtn.addEventListener('click', function() {
        if (currentFontSize > 14) { // Minimum font size
            currentFontSize -= 2;
            document.documentElement.style.fontSize = currentFontSize + 'px';
            localStorage.setItem('pcnAppFontSize', currentFontSize);
        }
    });
    
    toggleContrastBtn.addEventListener('click', function() {
        document.body.classList.toggle('high-contrast');
        const isHighContrast = document.body.classList.contains('high-contrast');
        localStorage.setItem('pcnAppHighContrast', isHighContrast);
    });
    
    // Load saved accessibility preferences
    function loadAccessibilityPreferences() {
        const savedFontSize = localStorage.getItem('pcnAppFontSize');
        if (savedFontSize) {
            currentFontSize = parseInt(savedFontSize);
            document.documentElement.style.fontSize = currentFontSize + 'px';
        }
        
        const savedHighContrast = localStorage.getItem('pcnAppHighContrast');
        if (savedHighContrast === 'true') {
            document.body.classList.add('high-contrast');
        }
    }
    
    loadAccessibilityPreferences();
    
    // Form validation elements
    const pcnType = document.getElementById('pcnType');
    const pcnReasonRadios = document.getElementsByName('pcnReason');
    const pcnIssueDate = document.getElementById('pcnIssueDate');
    const incidentDate = document.getElementById('incidentDate');
    const stepsTaken = document.getElementById('stepsTaken');
    const explanation = document.getElementById('explanation');
    
    // Error message elements
    const pcnTypeError = document.getElementById('pcnTypeError');
    const pcnReasonError = document.getElementById('pcnReasonError');
    const pcnIssueDateError = document.getElementById('pcnIssueDateError');
    const incidentDateError = document.getElementById('incidentDateError');
    const stepsTakenError = document.getElementById('stepsTakenError');
    const explanationError = document.getElementById('explanationError');
    
    // Form navigation handlers
    toStep2Btn.addEventListener('click', function() {
        if (validateStep1()) {
            showStep(2);
        }
    });
    
    toStep1Btn.addEventListener('click', function() {
        showStep(1);
    });
    
    toStep3Btn.addEventListener('click', function() {
        if (validateStep2()) {
            showStep(3);
        }
    });
    
    // Show the specified step
    function showStep(stepNum) {
        // Hide all steps
        step1.classList.remove('active');
        step2.classList.remove('active');
        step3.classList.remove('active');
        
        // Show the requested step
        if (stepNum === 1) {
            step1.classList.add('active');
            formProgress.style.width = '33.33%';
        } else if (stepNum === 2) {
            step2.classList.add('active');
            formProgress.style.width = '66.66%';
        } else if (stepNum === 3) {
            step3.classList.add('active');
            formProgress.style.width = '100%';
        }
        
        // Scroll to form top
        appealFormSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    
    // Validate first step
    function validateStep1() {
        let isValid = true;
        
        // Clear previous errors
        pcnTypeError.textContent = '';
        pcnReasonError.textContent = '';
        
        // Validate PCN type
        if (pcnType.value === '') {
            pcnTypeError.textContent = 'Please select your PCN type';
            isValid = false;
            pcnType.focus();
        }
        
        // Validate PCN reason
        let reasonSelected = false;
        for (let i = 0; i < pcnReasonRadios.length; i++) {
            if (pcnReasonRadios[i].checked) {
                reasonSelected = true;
                break;
            }
        }
        
        if (!reasonSelected) {
            pcnReasonError.textContent = 'Please select the reason PCN was issued';
            isValid = false;
        }
        
        return isValid;
    }
    
    // Validate second step
    function validateStep2() {
        let isValid = true;
        
        // Clear previous errors
        pcnIssueDateError.textContent = '';
        incidentDateError.textContent = '';
        stepsTakenError.textContent = '';
        
        // Validate PCN issue date
        if (pcnIssueDate.value === '') {
            pcnIssueDateError.textContent = 'Please enter the date the PCN was issued';
            isValid = false;
            pcnIssueDate.focus();
        }
        
        // Validate incident date
        if (incidentDate.value === '') {
            incidentDateError.textContent = 'Please enter the date of the incident';
            isValid = false;
            incidentDate.focus();
        } else if (incidentDate.value > pcnIssueDate.value && pcnIssueDate.value !== '') {
            incidentDateError.textContent = 'Incident date cannot be after PCN issue date';
            isValid = false;
            incidentDate.focus();
        }
        
        return isValid;
    }
    
    // Validate third step
    function validateStep3() {
        let isValid = true;
        
        // Clear previous errors
        explanationError.textContent = '';
        
        // Validate explanation
        if (explanation.value.trim() === '') {
            explanationError.textContent = 'Please provide an explanation for your appeal';
            isValid = false;
            explanation.focus();
        } else if (explanation.value.trim().length < 30) {
            explanationError.textContent = 'Please provide a more detailed explanation (at least 30 characters)';
            isValid = false;
            explanation.focus();
        }
        
        return isValid;
    }
    
    // Form submission
    pcnForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        if (!validateStep3()) {
            return;
        }
        
        // Collect form data
        const formData = {
            pcnType: pcnType.value,
            pcnReason: getSelectedRadioValue(pcnReasonRadios),
            pcnIssueDate: pcnIssueDate.value,
            incidentDate: incidentDate.value,
            stepsTaken: stepsTaken.value,
            explanation: explanation.value
        };
        
        // Show loading and hide form
        appealFormSection.classList.add('hidden');
        resultsSection.classList.remove('hidden');
        loadingIndicator.classList.remove('hidden');
        resultsContainer.classList.add('hidden');
        apiError.classList.add('hidden');
        
        try {
            // Call the Anthropic API
            const response = await callAnthropicAPI(formData);
            showResults(response);
        } catch (error) {
            console.error('API error:', error);
            showApiError();
        }
    });
    
    // Helper to get selected radio value
    function getSelectedRadioValue(radioButtons) {
        for (let i = 0; i < radioButtons.length; i++) {
            if (radioButtons[i].checked) {
                return radioButtons[i].value;
            }
        }
        return '';
    }
    
    // Call Anthropic API
    async function callAnthropicAPI(formData) {
        // In a production environment, this would call the Anthropic API via a server-side endpoint
        // to protect API keys and handle rate limiting
        
        // For demonstration purposes, here's how the API would be called:
        // const apiUrl = 'https://api.anthropic.com/v1/messages';
        // const apiKey = 'YOUR_API_KEY'; // This should be kept secure on server-side
        
        // const requestBody = {
        //     model: "claude-3-opus-20240229",
        //     max_tokens: 1024,
        //     messages: [
        //         {
        //             role: "user",
        //             content: prompt
        //         }
        //     ]
        // };
        
        // const response = await fetch(apiUrl, {
        //     method: 'POST',
        //     headers: {
        //         'Content-Type': 'application/json',
        //         'x-api-key': apiKey,
        //         'anthropic-version': '2023-06-01'
        //     },
        //     body: JSON.stringify(requestBody)
        // });
        
        // const data = await response.json();
        // return data.content[0].text;
        
        // For this demo, we're simulating a response after a delay
        
        // Structure the prompt using form data
        const prompt = `
Please review the following Penalty Charge Notice (PCN) appeal information:

PCN Type: ${formData.pcnType}
Reason for PCN: ${formData.pcnReason}
Date PCN Issued: ${formData.pcnIssueDate}
Date of Incident: ${formData.incidentDate}
Steps Already Taken: ${formData.stepsTaken || 'None specified'}

Explanation:
${formData.explanation}

Based on this information, please provide:
1. An assessment of the appeal's potential strength and success rate on a scale of 1 to 100, with 1 indicating low and 100 indicating high
2. Specific points that should be emphasized in the appeal
3. Additional evidence that might help the case
4. Recommended next steps
5. A draft appeal letter that could be used as a template
`;

        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // For demo purposes: Simulate API response with different responses based on PCN reason
        let responseText;
        
        if (formData.pcnReason === 'Parking in a restricted area') {
            responseText = `
## Assessment of Appeal Strength

Your appeal has **moderate potential** for success. Appeals against restricted area PCNs often require strong evidence of mitigating circumstances or signage issues.

## Key Points to Emphasize

* The lack of clear signage you mentioned is a strong point - authorities must ensure restrictions are clearly marked
* Your immediate action to move the vehicle shows good faith
* The fact that it was your first offense in the area may work in your favor

## Recommended Evidence

* Photos of the parking location showing unclear or obscured signage
* Any receipts showing how long you were actually parked
* Statements from any witnesses who can confirm the signage was unclear
* Copy of your clean driving/parking record if available

## Next Steps

1. Submit your formal appeal within 28 days of receiving the PCN
2. Include all supporting evidence as attachments
3. Keep copies of all correspondence
4. If rejected, consider appealing to the Traffic Penalty Tribunal

## Draft Appeal Letter

[YOUR ADDRESS]
[YOUR EMAIL]
[YOUR PHONE]
[DATE]

[COUNCIL/AUTHORITY NAME]
[THEIR ADDRESS]

Re: PCN Reference Number: [INSERT PCN NUMBER]

Dear Sir/Madam,

I am writing to appeal the Penalty Charge Notice issued on ${formData.pcnIssueDate} for parking in a restricted area.

I believe this penalty should be cancelled for the following reasons:

The signage in the area was inadequate and unclear. Specifically, [DESCRIBE EXACTLY WHAT WAS WRONG WITH THE SIGNAGE - e.g., "the signs were obscured by overgrown foliage" or "the parking restriction times were not clearly visible"].

${formData.explanation}

I have already taken the following steps regarding this matter: ${formData.stepsTaken || "I am making this formal appeal as my first action."}

I have included the following evidence to support my appeal [LIST EVIDENCE HERE].

I trust you will consider my appeal favorably and cancel this PCN. If you require any further information, please do not hesitate to contact me.

Yours faithfully,
[YOUR NAME]
`;
        } else if (formData.pcnReason === 'Overstaying the time limit') {
            responseText = `
## Assessment of Appeal Strength

Your appeal has **fair potential** for success. Time limit appeals can succeed when there are valid mitigating circumstances or when evidence shows you were within the allowed timeframe.

## Key Points to Emphasize

* Any proof of actual time spent in the parking location
* Technical issues with payment methods if relevant
* Any emergencies or unforeseen circumstances that caused the delay
* Any confusion with signage related to time limits

## Recommended Evidence

* Parking payment receipts/apps showing entry and exit times
* Any medical documentation if there was a health emergency
* Photos of parking meters if they were malfunctioning
* Witness statements if applicable

## Next Steps

1. Submit your formal appeal within 28 days of receiving the PCN
2. Include all timestamped evidence
3. Be specific about exact times of arrival and departure
4. If initially rejected, consider escalating to the relevant tribunal

## Draft Appeal Letter

[YOUR ADDRESS]
[YOUR EMAIL]
[YOUR PHONE]
[DATE]

[COUNCIL/AUTHORITY NAME]
[THEIR ADDRESS]

Re: PCN Reference Number: [INSERT PCN NUMBER]

Dear Sir/Madam,

I am writing to appeal the Penalty Charge Notice issued on ${formData.pcnIssueDate} for allegedly overstaying the time limit.

I believe this penalty should be cancelled for the following reasons:

[DETAILS OF WHY YOU BELIEVE YOU DID NOT EXCEED THE TIME LIMIT OR EXPLANATION OF MITIGATING CIRCUMSTANCES]

${formData.explanation}

I have already taken the following steps regarding this matter: ${formData.stepsTaken || "I am making this formal appeal as my first action."}

I have included the following evidence to support my appeal [LIST EVIDENCE HERE].

I trust you will consider my appeal favorably and cancel this PCN. If you require any further information, please do not hesitate to contact me.

Yours faithfully,
[YOUR NAME]
`;
        } else if (formData.pcnReason === 'Not displaying the valid permit') {
            responseText = `
## Assessment of Appeal Strength

Your appeal has **good potential** for success. Permit display cases are often successful when you can prove you actually had a valid permit at the time.

## Key Points to Emphasize

* You held a valid permit at the time of the incident
* Reasons why the permit wasn't visible (fell off dashboard, displayed incorrectly, etc.)
* Your history of compliance with parking regulations
* Any technical issues with digital permits if applicable

## Recommended Evidence

* Copy of your valid permit covering the date of the PCN
* Receipt/proof of payment for the permit
* Any precedent cases where appeals were granted in similar circumstances
* Photos showing how/where permit was displayed if relevant

## Next Steps

1. Submit your appeal with a copy of your valid permit as primary evidence
2. Explain clearly why the permit wasn't properly displayed
3. Request leniency based on the fact you actually had authorization to park
4. Follow up within 2 weeks if you don't receive a response

## Draft Appeal Letter

[YOUR ADDRESS]
[YOUR EMAIL]
[YOUR PHONE]
[DATE]

[COUNCIL/AUTHORITY NAME]
[THEIR ADDRESS]

Re: PCN Reference Number: [INSERT PCN NUMBER]

Dear Sir/Madam,

I am writing to appeal the Penalty Charge Notice issued on ${formData.pcnIssueDate} for not displaying a valid permit.

I believe this penalty should be cancelled because I did have a valid permit at the time of the alleged offense. [EXPLAIN WHAT HAPPENED TO THE PERMIT - e.g., "The permit had fallen from my dashboard onto the floor of the vehicle" or "I had paid for the permit electronically and there was a system error"].

${formData.explanation}

I have already taken the following steps regarding this matter: ${formData.stepsTaken || "I am making this formal appeal as my first action."}

I have included the following evidence to support my appeal [LIST EVIDENCE HERE, ESPECIALLY PROOF OF VALID PERMIT].

I trust you will consider my appeal favorably and cancel this PCN. If you require any further information, please do not hesitate to contact me.

Yours faithfully,
[YOUR NAME]
`;
        } else {
            responseText = `
## Assessment of Appeal Strength

Based on the information provided, your appeal has **moderate potential** for success. The strength of PCN appeals varies depending on specific circumstances and evidence.

## Key Points to Emphasize

* Any mitigating circumstances that led to the situation
* Any errors in the PCN itself (incorrect details, times, etc.)
* Whether proper procedures were followed by the issuing authority
* Your history of compliance with parking/traffic regulations

## Recommended Evidence

* Photos of the location, signage, and any relevant details
* Any documentation supporting your explanation
* Witness statements if applicable
* Records of previous communication about this issue

## Next Steps

1. Submit your formal appeal within the timeframe specified on your PCN (typically 28 days)
2. Include all supporting evidence with your appeal
3. Keep copies of all correspondence
4. Consider escalating to the appropriate tribunal if your initial appeal is rejected

## Draft Appeal Letter

[YOUR ADDRESS]
[YOUR EMAIL]
[YOUR PHONE]
[DATE]

[COUNCIL/AUTHORITY NAME]
[THEIR ADDRESS]

Re: PCN Reference Number: [INSERT PCN NUMBER]

Dear Sir/Madam,

I am writing to appeal the Penalty Charge Notice issued on ${formData.pcnIssueDate}.

I believe this penalty should be cancelled for the following reasons:

${formData.explanation}

I have already taken the following steps regarding this matter: ${formData.stepsTaken || "I am making this formal appeal as my first action."}

I have included the following evidence to support my appeal [LIST EVIDENCE HERE].

I trust you will consider my appeal favorably and cancel this PCN. If you require any further information, please do not hesitate to contact me.

Yours faithfully,
[YOUR NAME]
`;
        }